import { Router } from 'express';
import { prisma } from '../prisma';
import { withFallback, mockData } from '../utils/dbFallback';

const router = Router();

router.get('/', async (req, res) => {
  const tenantId = req.tenantId;

  const [productsCount, quotesCount, printersCount, filamentsCount] = await Promise.all([
    withFallback(
      () => prisma.product.count({ where: { tenantId } }),
      () => mockData.tenant1.products.length,
    ),
    withFallback(
      () => prisma.quote.count({ where: { tenantId } }),
      () => mockData.tenant1.quotes.length,
    ),
    withFallback(
      () => prisma.printer.count({ where: { tenantId } }),
      () => mockData.tenant1.printers.length,
    ),
    withFallback(
      () => prisma.filament.count({ where: { tenantId } }),
      () => mockData.tenant1.filaments.length,
    ),
  ]);

  res.json({ productsCount, quotesCount, printersCount, filamentsCount });
});

export default router;
