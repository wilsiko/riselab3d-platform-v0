import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { prisma } from '../prisma';
import { withFallback, mockData } from '../utils/dbFallback';
import { applyMargin, buildQuotePricingOptions, calculateQuoteItemUnitPrice } from '../services/cost';
import { parseDecimalValue } from '../utils/number';

const router = Router();

const SALE_TYPE_LABELS: Record<string, string> = {
  venda_direta: 'Venda Direta',
  ecommerce: 'E-commerce',
  consumidor_final: 'Usuario Final',
};

function resolveSaleTypeMargin(saleType: string, settings: ReturnType<typeof normalizeQuoteSettings>) {
  if (saleType === 'venda_direta') {
    return settings.margem_venda_direta;
  }

  if (saleType === 'ecommerce') {
    return settings.margem_venda_ecommerce;
  }

  if (saleType === 'consumidor_final') {
    return settings.margem_venda_consumidor_final;
  }

  throw new Error('Selecione uma modalidade de venda válida para o orçamento.');
}

function normalizeQuoteSettings(settings: any) {
  return {
    custo_kwh: settings?.custo_kwh ?? 0,
    margem_venda_direta: settings?.margem_venda_direta ?? 20,
    margem_venda_ecommerce: settings?.margem_venda_ecommerce ?? 35,
    margem_venda_consumidor_final: settings?.margem_venda_consumidor_final ?? 50,
    logo_data_url: settings?.logo_data_url ?? null,
  };
}

function parseLogoDataUrl(logoDataUrl: string | null | undefined) {
  if (!logoDataUrl) {
    return null;
  }

  const match = logoDataUrl.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/);

  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], 'base64'),
  };
}

function buildQuoteResponse(quote: any, settings: any) {
  const normalizedSettings = normalizeQuoteSettings(settings);
  const marginPercent = Number.isFinite(quote.margem_percentual)
    ? quote.margem_percentual
    : resolveSaleTypeMargin(quote.tipo_venda, normalizedSettings);
  const totalCost = Number.isFinite(quote.valor_custo) ? quote.valor_custo : quote.valor_total;
  const summaryItems = quote.items.map((item: any) => ({
    productId: item.productId,
    productName: item.product.nome,
    productSku: item.product.sku,
    quantity: item.quantidade,
    printerId: item.printerId ?? null,
    printerName: item.printer?.nome ?? null,
    unitCost: item.preco_unitario,
    subtotalCost: item.preco_unitario * item.quantidade,
  }));

  return {
    ...quote,
    summary: {
      items: summaryItems,
      totalCost,
      selectedSaleType: quote.tipo_venda,
      selectedSaleTypeLabel: SALE_TYPE_LABELS[quote.tipo_venda] ?? quote.tipo_venda,
      selectedMarginPercent: marginPercent,
      pricingOptions: buildQuotePricingOptions(totalCost, normalizedSettings),
    },
  };
}

async function buildQuoteItems(items: any[], tenantId: string, custoKwh: number) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('Adicione pelo menos um item ao orçamento.');
  }

  return Promise.all(
    items.map(async (item: any) => {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, tenantId, data_desativacao: null },
      });

      if (!product) {
        throw new Error('Produto não encontrado ou desativado: ' + item.productId);
      }

      if (!item.printerId) {
        throw new Error('Impressora é obrigatória para cada item do orçamento.');
      }

      const printer = await prisma.printer.findFirst({
        where: { id: item.printerId, tenantId, data_desativacao: null },
      });

      if (!printer) {
        throw new Error('Impressora não encontrada: ' + item.printerId);
      }

      const quantidade = Number(item.quantidade);

      if (!Number.isFinite(quantidade) || quantidade <= 0) {
        throw new Error('A quantidade de cada item deve ser maior que zero.');
      }

      const precoUnitario = calculateQuoteItemUnitPrice(product, printer, custoKwh);

      return {
        productId: item.productId,
        printerId: item.printerId,
        quantidade,
        preco_unitario: precoUnitario,
      };
    }),
  );
}

router.get('/', async (req, res) => {
  const settings = await prisma.globalSettings.findUnique({ where: { tenantId: req.tenantId } });
  const quotes = await withFallback(
    () =>
      prisma.quote.findMany({
        where: { tenantId: req.tenantId },
        include: { items: { include: { product: true, printer: true } } },
        orderBy: { data: 'desc' },
      }),
    () => mockData.tenant1.quotes,
  );
  res.json(quotes.map((quote: any) => buildQuoteResponse(quote, settings || mockData.tenant1.settings)));
});

router.post('/', async (req, res) => {
  try {
    const { nome_cliente, data, items, tipo_venda } = req.body;
    const settings = await prisma.globalSettings.findUnique({ where: { tenantId: req.tenantId } });
    const normalizedSettings = normalizeQuoteSettings(settings || mockData.tenant1.settings);

    if (!String(nome_cliente || '').trim()) {
      throw new Error('Nome do cliente é obrigatório.');
    }

    if (!data) {
      throw new Error('Data do orçamento é obrigatória.');
    }

    const margemPercentual = resolveSaleTypeMargin(String(tipo_venda || ''), normalizedSettings);

    const quoteItems = await buildQuoteItems(items, req.tenantId, settings?.custo_kwh ?? 0);
    const valor_custo = quoteItems.reduce((sum, item) => sum + item.quantidade * item.preco_unitario, 0);
    const valor_total = applyMargin(valor_custo, margemPercentual);

    const quote = await prisma.quote.create({
      data: {
        tenantId: req.tenantId,
        nome_cliente,
        data: new Date(data),
        tipo_venda,
        valor_custo,
        margem_percentual: margemPercentual,
        valor_total,
        items: {
          create: quoteItems,
        },
      },
      include: { items: { include: { product: true, printer: true } } },
    });

    res.json(buildQuoteResponse(quote, normalizedSettings));
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Erro ao criar orçamento.' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nome_cliente, data, items, tipo_venda } = req.body;
    const settings = await prisma.globalSettings.findUnique({ where: { tenantId: req.tenantId } });
    const normalizedSettings = normalizeQuoteSettings(settings || mockData.tenant1.settings);

    if (!String(nome_cliente || '').trim()) {
      throw new Error('Nome do cliente é obrigatório.');
    }

    if (!data) {
      throw new Error('Data do orçamento é obrigatória.');
    }

    const margemPercentual = resolveSaleTypeMargin(String(tipo_venda || ''), normalizedSettings);

    const existingQuote = await prisma.quote.findFirst({
      where: { id, tenantId: req.tenantId },
    });

    if (!existingQuote) {
      return res.status(404).json({ error: 'Orçamento não encontrado.' });
    }

    const quoteItems = await buildQuoteItems(items, req.tenantId, settings?.custo_kwh ?? 0);
    const valor_custo = quoteItems.reduce((sum, item) => sum + item.quantidade * item.preco_unitario, 0);
    const valor_total = applyMargin(valor_custo, margemPercentual);

    const quote = await prisma.quote.update({
      where: { id },
      data: {
        nome_cliente: String(nome_cliente).trim(),
        data: new Date(data),
        tipo_venda,
        valor_custo,
        margem_percentual: margemPercentual,
        valor_total,
        items: {
          deleteMany: {},
          create: quoteItems,
        },
      },
      include: { items: { include: { product: true, printer: true } } },
    });

    res.json(buildQuoteResponse(quote, normalizedSettings));
  } catch (error: any) {
    res.status(400).json({ error: error?.message || 'Erro ao atualizar orçamento.' });
  }
});

router.get('/:id/pdf', async (req, res) => {
  const { id } = req.params;
  const [quote, settings] = await Promise.all([
    prisma.quote.findFirst({
      where: { id, tenantId: req.tenantId },
      include: { items: { include: { product: true, printer: true } } },
    }),
    prisma.globalSettings.findUnique({ where: { tenantId: req.tenantId } }),
  ]);

  if (!quote) {
      return res.status(404).json({ error: 'Orçamento não encontrado' });
  }

  if (!quote.tipo_venda || !Number.isFinite(quote.margem_percentual)) {
    return res.status(400).json({ error: 'Selecione uma modalidade de venda válida antes de exportar o orçamento em PDF.' });
  }

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="quote-${quote.id}.pdf"`);

  const logoImage = parseLogoDataUrl(settings?.logo_data_url);

  if (logoImage) {
    try {
      doc.image(logoImage.buffer, 40, 36, { fit: [120, 60], valign: 'center' });
      doc.y = 108;
    } catch {
      doc.y = 40;
    }
  }

  doc.fontSize(18).fillColor('#111827').text('RiseLab3D', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor('#374151').text('Orçamento Profissional', { continued: true }).text(` • ${quote.nome_cliente}`, { align: 'right' });
  doc.moveDown();
  doc.fontSize(10).text(`Data: ${quote.data.toISOString().substring(0, 10)}`);

  const saleTypeLabel = SALE_TYPE_LABELS[quote.tipo_venda] ?? quote.tipo_venda;
  const saleTypeTop = doc.y + 6;
  doc.roundedRect(40, saleTypeTop, 220, 32, 10).fill('#E0F2FE');
  doc.fillColor('#0F172A').font('Helvetica-Bold').fontSize(11).text(`Modalidade: ${saleTypeLabel}`, 52, saleTypeTop + 10, { width: 196 });
  doc.font('Helvetica').moveDown();
  doc.y = saleTypeTop + 44;

  doc.text(`Custo base: R$ ${quote.valor_custo.toFixed(2)}`);
  doc.text(`Total: R$ ${quote.valor_total.toFixed(2)}`);
  doc.moveDown(1);

  doc.fontSize(11).text('Itens', { underline: true });
  doc.moveDown(0.5);

  const tableTop = doc.y;
  doc.font('Helvetica-Bold');
  doc.text('SKU', 40, tableTop, { width: 200 });
  doc.text('Qtd', 260, tableTop, { width: 50, align: 'right' });
  doc.text('Unit', 330, tableTop, { width: 80, align: 'right' });
  doc.text('Subtotal', 420, tableTop, { width: 90, align: 'right' });
  doc.font('Helvetica');

  quote.items.forEach((item, index) => {
    const y = tableTop + 20 + index * 20;
    doc.text(item.product.sku, 40, y, { width: 200 });
    doc.text(String(item.quantidade), 260, y, { width: 50, align: 'right' });
    doc.text(`R$ ${item.preco_unitario.toFixed(2)}`, 330, y, { width: 80, align: 'right' });
    doc.text(`R$ ${(item.preco_unitario * item.quantidade).toFixed(2)}`, 420, y, { width: 90, align: 'right' });
  });

  doc.moveDown(quote.items.length + 2);
  doc.font('Helvetica-Bold').text(`Valor Total: R$ ${quote.valor_total.toFixed(2)}`, { align: 'right' });

  doc.pipe(res);
  doc.end();
});

export default router;
