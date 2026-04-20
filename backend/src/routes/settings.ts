import { Router } from 'express';
import { prisma } from '../prisma';
import { withFallback, mockData } from '../utils/dbFallback';
import { parseDecimalValue } from '../utils/number';

const router = Router();

const IMAGE_DATA_URL_PATTERN = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=\s]+$/;
const MAX_LOGO_DATA_URL_LENGTH = 2_800_000;

router.get('/', async (req, res) => {
  const settings = await withFallback(
    () => prisma.globalSettings.findUnique({ where: { tenantId: req.tenantId } }),
    () => mockData.tenant1.settings,
  );
  res.json(
    settings || {
      custo_kwh: 0.8,
      margem_venda_direta: 20,
      margem_venda_ecommerce: 35,
      margem_venda_consumidor_final: 50,
      logo_data_url: null,
    },
  );
});

router.put('/', async (req, res) => {
  const { custo_kwh, margem_venda_direta, margem_venda_ecommerce, margem_venda_consumidor_final, logo_data_url } = req.body;
  const parsed = parseDecimalValue(custo_kwh);
  const directMargin = parseDecimalValue(margem_venda_direta);
  const ecommerceMargin = parseDecimalValue(margem_venda_ecommerce);
  const finalCustomerMargin = parseDecimalValue(margem_venda_consumidor_final);
  const normalizedLogoDataUrl = typeof logo_data_url === 'string' ? logo_data_url.trim() : null;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return res.status(400).json({ error: 'Informe um custo de kWh válido.' });
  }

  if (!Number.isFinite(directMargin) || directMargin < 0) {
    return res.status(400).json({ error: 'Informe uma margem válida para venda direta.' });
  }

  if (!Number.isFinite(ecommerceMargin) || ecommerceMargin < 0) {
    return res.status(400).json({ error: 'Informe uma margem válida para e-commerce.' });
  }

  if (!Number.isFinite(finalCustomerMargin) || finalCustomerMargin < 0) {
    return res.status(400).json({ error: 'Informe uma margem válida para usuário final.' });
  }

  if (normalizedLogoDataUrl && (!IMAGE_DATA_URL_PATTERN.test(normalizedLogoDataUrl) || normalizedLogoDataUrl.length > MAX_LOGO_DATA_URL_LENGTH)) {
    return res.status(400).json({ error: 'Envie um logo válido em PNG, JPG ou WEBP com até 2 MB.' });
  }

  const exists = await prisma.globalSettings.findUnique({ where: { tenantId: req.tenantId } });

  const data = {
    custo_kwh: parsed,
    margem_venda_direta: directMargin,
    margem_venda_ecommerce: ecommerceMargin,
    margem_venda_consumidor_final: finalCustomerMargin,
    logo_data_url: normalizedLogoDataUrl || null,
  };

  const settings = exists
    ? await prisma.globalSettings.update({ where: { tenantId: req.tenantId }, data })
    : await prisma.globalSettings.create({ data: { tenantId: req.tenantId, ...data } });

  res.json(settings);
});

export default router;
