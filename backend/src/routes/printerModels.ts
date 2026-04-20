import { Router } from 'express';
import { prisma } from '../prisma';
import { withFallback, mockData } from '../utils/dbFallback';

const router = Router();

router.get('/', async (_req, res) => {
  const printerModels = await withFallback(
    () => prisma.printerModel.findMany({ orderBy: { name: 'asc' } }),
    () => mockData.tenant1.printerModels,
  );

  return res.json(printerModels);
});

export default router;