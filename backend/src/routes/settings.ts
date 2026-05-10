import { Router } from 'express';
import { prisma } from '../prisma';
import { withFallback, mockData } from '../utils/dbFallback';
import { requireAuth } from '../middleware/auth';
import { ensureTenantOperationalBaseline } from '../auth/bootstrap';

const router = Router();
const defaultSettings = {
  custo_kwh: 0.8,
  direct_margin_percent: 20,
  ecommerce_margin_percent: 35,
  end_customer_margin_percent: 50,
  error_rate_percent: 10,
};

router.get('/', async (req, res) => {
  const settings = await withFallback(
    async () => {
      let item = await prisma.globalSettings.findUnique({ where: { tenantId: req.tenantId } });

      if (!item) {
        await ensureTenantOperationalBaseline(req.tenantId);
        item = await prisma.globalSettings.findUnique({ where: { tenantId: req.tenantId } });
      }

      return item;
    },
    () => mockData.tenant1.settings,
  );
  res.json(settings ? { ...defaultSettings, ...settings } : defaultSettings);
});

router.put('/', async (req, res) => {
  if (!req.authUser) {
    return requireAuth(req, res, () => undefined);
  }

  const { custo_kwh, direct_margin_percent, ecommerce_margin_percent, end_customer_margin_percent, error_rate_percent } = req.body;
  const parsed = Number(custo_kwh);
  const parsedDirectMargin = Number(direct_margin_percent);
  const parsedEcommerceMargin = Number(ecommerce_margin_percent);
  const parsedEndCustomerMargin = Number(end_customer_margin_percent);
  const parsedErrorRate = Number(error_rate_percent);

  if ([parsed, parsedDirectMargin, parsedEcommerceMargin, parsedEndCustomerMargin, parsedErrorRate].some((value) => !Number.isFinite(value) || value < 0)) {
    return res.status(400).json({ error: 'Informe valores validos para energia, margens e taxa de erro.' });
  }

  const exists = await prisma.globalSettings.findUnique({ where: { tenantId: req.tenantId } });
  const data = {
    custo_kwh: parsed,
    direct_margin_percent: parsedDirectMargin,
    ecommerce_margin_percent: parsedEcommerceMargin,
    end_customer_margin_percent: parsedEndCustomerMargin,
    error_rate_percent: parsedErrorRate,
  };

  const settings = exists
    ? await prisma.globalSettings.update({ where: { tenantId: req.tenantId }, data })
    : await prisma.globalSettings.create({ data: { tenantId: req.tenantId, ...data } });

  res.json(settings);
});

export default router;
