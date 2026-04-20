import { Router } from 'express';
import { prisma } from '../prisma';
import { withFallback, mockData } from '../utils/dbFallback';

const router = Router();

router.get('/', async (req, res) => {
  const printers = await withFallback(
    () => prisma.printer.findMany({ where: { tenantId: req.tenantId } }),
    () => mockData.tenant1.printers,
  );
  res.json(printers);
});

router.post('/', async (req, res) => {
  const { nome, consumo_watts, custo_aquisicao, vida_util_horas } = req.body;
  const printer = await prisma.printer.create({
    data: {
      tenantId: req.tenantId,
      nome,
      consumo_watts: Number(consumo_watts),
      custo_aquisicao: Number(custo_aquisicao),
      vida_util_horas: Number(vida_util_horas),
    },
  });
  res.json(printer);
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { nome, consumo_watts, custo_aquisicao, vida_util_horas } = req.body;
  const printer = await prisma.printer.updateMany({
    where: { id, tenantId: req.tenantId },
    data: {
      nome,
      consumo_watts: Number(consumo_watts),
      custo_aquisicao: Number(custo_aquisicao),
      vida_util_horas: Number(vida_util_horas),
    },
  });
  if (!printer.count) {
    return res.status(404).json({ error: 'Printer not found' });
  }
  const updated = await prisma.printer.findUnique({ where: { id } });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.printer.deleteMany({ where: { id, tenantId: req.tenantId } });
  res.json({ removed: true });
});

export default router;
