import { Router } from 'express';
import { prisma } from '../prisma';
import { withFallback, mockData } from '../utils/dbFallback';

const router = Router();

router.get('/', async (req, res) => {
  const settings = await withFallback(
    () => prisma.globalSettings.findUnique({ where: { tenantId: req.tenantId } }),
    () => mockData.tenant1.settings,
  );
  res.json(settings || { custo_kwh: 0.8 });
});

router.put('/', async (req, res) => {
  const { custo_kwh } = req.body;
  const parsed = Number(custo_kwh);
  const exists = await prisma.globalSettings.findUnique({ where: { tenantId: req.tenantId } });

  const settings = exists
    ? await prisma.globalSettings.update({ where: { tenantId: req.tenantId }, data: { custo_kwh: parsed } })
    : await prisma.globalSettings.create({ data: { tenantId: req.tenantId, custo_kwh: parsed } });

  res.json(settings);
});

export default router;
