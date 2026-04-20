import { Router } from 'express';
import { prisma } from '../prisma';
import { withFallback, mockData } from '../utils/dbFallback';

const router = Router();

router.get('/', async (_req, res) => {
  const productColors = await withFallback(
    () => prisma.productColor.findMany({ orderBy: { name: 'asc' } }),
    () => mockData.tenant1.productColors,
  );

  return res.json(productColors);
});

export default router;