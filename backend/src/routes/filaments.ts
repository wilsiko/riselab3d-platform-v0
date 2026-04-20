import { Router } from 'express';
import { prisma } from '../prisma';
import { withFallback, mockData } from '../utils/dbFallback';

const router = Router();

router.get('/', async (req, res) => {
  const filaments = await withFallback(
    () => prisma.filament.findMany({ where: { tenantId: req.tenantId } }),
    () => mockData.tenant1.filaments,
  );
  res.json(filaments);
});

router.post('/', async (req, res) => {
  const { marca, tipo, custo_por_kg } = req.body;
  const filament = await prisma.filament.create({
    data: {
      tenantId: req.tenantId,
      marca,
      tipo,
      custo_por_kg: Number(custo_por_kg),
    },
  });
  res.json(filament);
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { marca, tipo, custo_por_kg } = req.body;
  const result = await prisma.filament.updateMany({
    where: { id, tenantId: req.tenantId },
    data: {
      marca,
      tipo,
      custo_por_kg: Number(custo_por_kg),
    },
  });
  if (!result.count) {
    return res.status(404).json({ error: 'Filament not found' });
  }
  const updated = await prisma.filament.findUnique({ where: { id } });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  await prisma.filament.deleteMany({ where: { id, tenantId: req.tenantId } });
  res.json({ removed: true });
});

export default router;
