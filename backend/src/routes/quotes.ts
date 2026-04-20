import { Router } from 'express';
import PDFDocument from 'pdfkit';
import { prisma } from '../prisma';
import { withFallback, mockData } from '../utils/dbFallback';

const router = Router();

router.get('/', async (req, res) => {
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
  const { nome_cliente, data, items } = req.body;

  const quoteItems = await Promise.all(
    items.map(async (item: any) => {
      const product = await prisma.product.findFirst({ where: { id: item.productId, tenantId: req.tenantId } });
      if (!product) throw new Error('Product not found: ' + item.productId);
      return {
        productId: item.productId,
        quantidade: Number(item.quantidade),
        preco_unitario: Number(item.preco_unitario ?? product.custo_total),
      };
    }),
  );

  const valor_total = quoteItems.reduce((sum, item) => sum + item.quantidade * item.preco_unitario, 0);

  const quote = await prisma.quote.create({
    data: {
      tenantId: req.tenantId,
      nome_cliente,
      data: new Date(data),
      valor_total,
      items: {
        create: quoteItems,
      },
    },
    include: { items: { include: { product: true } } },
  });

  res.json(quote);
});

router.get('/:id/pdf', async (req, res) => {
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
  doc.moveDown();
  doc.font('Helvetica').fontSize(9).text('RiseLab3D - Plataforma de gestão de impressão 3D', { align: 'center' });

  doc.pipe(res);
  doc.end();
});

export default router;
