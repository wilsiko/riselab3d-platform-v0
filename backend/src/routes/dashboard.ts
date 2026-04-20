import { Router } from 'express';
import { prisma } from '../prisma';
import { withFallback, mockData } from '../utils/dbFallback';

const router = Router();

router.get('/', async (req, res) => {
  const tenantId = req.tenantId;

  const [productsCount, quotesCount, printersCount, filamentsCount] = await Promise.all([
    withFallback(
      () => prisma.product.count({ where: { tenantId, data_desativacao: null } }),
      () => mockData.tenant1.products.filter((product) => !product.data_desativacao).length,
    ),
    withFallback(
      () => prisma.quote.count({ where: { tenantId } }),
      () => mockData.tenant1.quotes.length,
    ),
    withFallback(
      () => prisma.printer.count({ where: { tenantId, data_desativacao: null } }),
      () => mockData.tenant1.printers.filter((printer) => !printer.data_desativacao).length,
    ),
    withFallback(
      () => prisma.filament.count({ where: { tenantId, data_desativacao: null } }),
      () => mockData.tenant1.filaments.filter((filament) => !filament.data_desativacao).length,
    ),
  ]);

  res.json({ productsCount, quotesCount, printersCount, filamentsCount });
});

export default router;
