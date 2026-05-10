import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { createOpaqueToken, getBaseUrl, getFrontendBaseUrl } from '../auth/utils';
import { prisma } from '../prisma';
import { calculateProductCosts } from '../services/cost';
import { withFallback, mockData } from '../utils/dbFallback';
import { requireAuth } from '../middleware/auth';

const router = Router();

const SALE_CHANNEL_LABELS: Record<string, string> = {
  direct: 'Venda direta',
  ecommerce: 'E-commerce',
  end_customer: 'Usuario final',
};

router.get('/', async (req, res) => {
  if (!req.authUser) {
    return requireAuth(req, res, () => undefined);
  }

  const quotes = await withFallback(
    () =>
      prisma.quote.findMany({
        where: { tenantId: req.tenantId },
        include: { items: { include: { product: true } } },
        orderBy: { data: 'desc' },
      }),
    () => mockData.tenant1.quotes,
  );
  res.json(quotes);
});

router.post('/', async (req, res) => {
  if (!req.authUser) {
    return requireAuth(req, res, () => undefined);
  }

  try {
    const { nome_cliente, data, items, notes, sale_channel, subtotal_custo, margem_percentual } = req.body;
    const normalizedClientName = typeof nome_cliente === 'string' && nome_cliente.trim() ? nome_cliente.trim() : 'Cliente nao informado';

    if (!Array.isArray(items) || !items.length) {
      return res.status(400).json({ error: 'Envie pelo menos um item para salvar a cotacao.' });
    }

    const normalizedSaleChannel = typeof sale_channel === 'string' && sale_channel.trim() ? sale_channel : 'direct';
    const normalizedMargin = Number.isFinite(Number(margem_percentual)) ? Number(margem_percentual) : 0;
    const settings = await prisma.globalSettings.findUnique({ where: { tenantId: req.tenantId } });

    const quoteItems = await Promise.all(
      items.map(async (item: any) => {
        if (!item.productId) {
          const printer = await prisma.printer.findFirst({ where: { id: item.printerId, tenantId: req.tenantId } });

          if (!printer) {
            throw new Error('Impressora nao encontrada para a cotacao informada.');
          }

          const quantidade = Number(item.quantidade);
          const materialWeightGrams = Number(item.materialWeightGrams);
          const filamentCostPerKg = Number(item.filamentCostPerKg);
          const printHours = Number(item.printHours);
          const productName = typeof item.productName === 'string' && item.productName.trim() ? item.productName.trim() : 'Cotacao manual';
          const resolvedFilamentCostPerKg = Number.isFinite(filamentCostPerKg) && filamentCostPerKg > 0 ? filamentCostPerKg : 0;
          const filamentForQuote = {
            id: 'manual-filament',
            tenantId: req.tenantId,
            marca: 'Manual',
            tipo: 'Preco informado',
            custo_por_kg: resolvedFilamentCostPerKg,
          };
          const costData = calculateProductCosts(
            materialWeightGrams,
            printHours,
            printer,
            filamentForQuote,
            settings?.custo_kwh ?? 0,
            0,
            settings?.error_rate_percent ?? 10,
          );
          const precoUnitario = Number(item.preco_unitario ?? costData.custoTotal);
          const subtotalCusto = costData.custoTotal * quantidade;
          const subtotalPreco = precoUnitario * quantidade;

          return {
            productId: null,
            quantidade,
            preco_unitario: precoUnitario,
            snapshot_nome: productName,
            snapshot_sku: `MANUAL-${productName}`,
            snapshot_material: `${materialWeightGrams} g - ${printHours} h - preco manual por kg`,
            custo_base_unitario: costData.custoTotal,
            subtotal_custo: subtotalCusto,
            subtotal_preco: subtotalPreco,
          };
        }

        const product = await prisma.product.findFirst({
          where: { id: item.productId, tenantId: req.tenantId },
          include: { filament: true },
        });
        if (!product) throw new Error('Produto nao encontrado para a cotacao informada.');

        const quantidade = Number(item.quantidade);
        const precoUnitario = Number(item.preco_unitario ?? product.custo_total);
        const subtotalCusto = product.custo_total * quantidade;
        const subtotalPreco = precoUnitario * quantidade;

        return {
          productId: item.productId,
          quantidade,
          preco_unitario: precoUnitario,
          snapshot_nome: product.nome,
          snapshot_sku: product.sku,
          snapshot_material: `${product.filament.marca} ${product.filament.tipo}`,
          custo_base_unitario: product.custo_total,
          subtotal_custo: subtotalCusto,
          subtotal_preco: subtotalPreco,
        };
      }),
    );

    const subtotalCalculado = quoteItems.reduce((sum, item) => sum + (item.subtotal_custo || 0), 0);
    const valor_total = quoteItems.reduce((sum, item) => sum + item.quantidade * item.preco_unitario, 0);

    if (normalizedClientName !== 'Cliente nao informado') {
      const existingClient = await prisma.client.findFirst({
        where: {
          tenantId: req.tenantId,
          name: {
            equals: normalizedClientName,
            mode: 'insensitive',
          },
        },
      });

      if (!existingClient) {
        await prisma.client.create({
          data: {
            tenantId: req.tenantId,
            name: normalizedClientName,
          },
        });
      }
    }

    const quote = await prisma.quote.create({
      data: {
        tenantId: req.tenantId,
        nome_cliente: normalizedClientName,
        data: new Date(data),
        notes: typeof notes === 'string' ? notes : null,
        sale_channel: normalizedSaleChannel,
        subtotal_custo: Number.isFinite(Number(subtotal_custo)) ? Number(subtotal_custo) : subtotalCalculado,
        margem_percentual: normalizedMargin,
        valor_total,
        items: {
          create: quoteItems,
        },
      },
      include: { items: { include: { product: true } } },
    });

    res.json(quote);
  } catch (error: any) {
    console.error('Failed to create quote', error);
    res.status(500).json({ error: error?.message || 'Nao foi possivel salvar a cotacao.' });
  }
});

router.post('/:id/share', async (req, res) => {
  if (!req.authUser) {
    return requireAuth(req, res, () => undefined);
  }

  const { id } = req.params;
  const existingQuote = await prisma.quote.findFirst({
    where: { id, tenantId: req.tenantId },
  });

  if (!existingQuote) {
    return res.status(404).json({ error: 'Cotacao nao encontrada para gerar link publico.' });
  }

  const publicShareToken = existingQuote.publicShareToken || createOpaqueToken();
  const quote = existingQuote.publicShareToken
    ? existingQuote
    : await prisma.quote.update({
        where: { id: existingQuote.id },
        data: {
          publicShareToken,
          publicSharedAt: new Date(),
        },
      });

  res.json({
    quoteId: quote.id,
    shareUrl: `${getFrontendBaseUrl(req)}/shared/quotes/${publicShareToken}`,
  });
});

router.get('/:id', async (req, res) => {
  if (!req.authUser) {
    return requireAuth(req, res, () => undefined);
  }

  const { id } = req.params;
  const quote = await prisma.quote.findFirst({
    where: { id, tenantId: req.tenantId },
    include: { items: { include: { product: true } } },
  });

  if (!quote) {
    return res.status(404).json({ error: 'Cotacao nao encontrada.' });
  }

  res.json(quote);
});

router.get('/public/:token', async (req, res) => {
  const token = typeof req.params.token === 'string' ? req.params.token : '';

  if (!token) {
    return res.status(400).json({ error: 'Token publico da cotacao nao informado.' });
  }

  const quote = await prisma.quote.findFirst({
    where: { publicShareToken: token },
    include: { items: { include: { product: true } } },
  });

  if (!quote) {
    return res.status(404).json({ error: 'Cotacao publica nao encontrada.' });
  }

  res.json(quote);
});

router.get('/:id/pdf', async (req, res) => {
  if (!req.authUser) {
    return requireAuth(req, res, () => undefined);
  }

  const { id } = req.params;
  const quote = await prisma.quote.findFirst({
    where: { id, tenantId: req.tenantId },
    include: { items: { include: { product: true } } },
  });

  if (!quote) {
    return res.status(404).json({ error: 'Quote not found' });
  }

  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="quote-${quote.id}.pdf"`);

  doc.fontSize(18).fillColor('#111827').text('RiseLab3D', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor('#374151').text('Orçamento Profissional', { continued: true }).text(` • ${quote.nome_cliente}`, { align: 'right' });
  doc.moveDown();
  doc.fontSize(10).text(`Data: ${quote.data.toISOString().substring(0, 10)}`);
  doc.text(`Canal: ${SALE_CHANNEL_LABELS[quote.sale_channel] || quote.sale_channel}`);
  doc.text(`Custo base: R$ ${quote.subtotal_custo.toFixed(2)}`);
  doc.text(`Margem aplicada: ${quote.margem_percentual.toFixed(2)}%`);
  doc.text(`Total: R$ ${quote.valor_total.toFixed(2)}`);
  if (quote.notes) {
    doc.moveDown(0.5);
    doc.text(`Observacoes: ${quote.notes}`);
  }
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
    doc.text(item.snapshot_sku || item.product?.sku || 'MANUAL', 40, y, { width: 200 });
    doc.text(String(item.quantidade), 260, y, { width: 50, align: 'right' });
    doc.text(`R$ ${item.preco_unitario.toFixed(2)}`, 330, y, { width: 80, align: 'right' });
    doc.text(`R$ ${(item.subtotal_preco ?? item.preco_unitario * item.quantidade).toFixed(2)}`, 420, y, { width: 90, align: 'right' });
  });

  doc.moveDown(quote.items.length + 2);
  doc.font('Helvetica-Bold').text(`Valor Total: R$ ${quote.valor_total.toFixed(2)}`, { align: 'right' });
  doc.moveDown();
  doc.font('Helvetica').fontSize(9).text('RiseLab3D - Plataforma de gestão de impressão 3D', { align: 'center' });

  doc.pipe(res);
  doc.end();
});

export default router;
