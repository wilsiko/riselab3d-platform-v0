import { Router } from 'express';
import { prisma } from '../prisma';
import { normalizeSku, calculateProductCosts, validateProductData } from '../services/cost';
import { withFallback, mockData } from '../utils/dbFallback';

const router = Router();

router.get('/', async (req, res) => {
  const products = await withFallback(
    () =>
      prisma.product.findMany({
        where: { tenantId: req.tenantId },
        include: { printer: true, filament: true },
      }),
    () => mockData.tenant1.products,
  );
  res.json(products);
});

router.post('/', async (req, res) => {
  const {
    nome,
    cor,
    variacao,
    peso_gramas,
    tempo_impressao_horas,
    printerId,
    filamentId,
    additional_cost = 0,
  } = req.body;

  // Validação de entrada básica
  if (!nome?.trim() || !cor?.trim() || !variacao?.trim()) {
    return res.status(400).json({ error: 'Nome, cor e variação são obrigatórios' });
  }

  const printer = await prisma.printer.findFirst({ where: { id: printerId, tenantId: req.tenantId } });
  const filament = await prisma.filament.findFirst({ where: { id: filamentId, tenantId: req.tenantId } });
  const settings = await prisma.globalSettings.findUnique({ where: { tenantId: req.tenantId } });

  if (!printer || !filament) {
    return res.status(400).json({ error: 'Impressora e filamento devem existir para este tenant.' });
  }

  // Validação de dados de custo
  const validationErrors = validateProductData(
    Number(peso_gramas),
    Number(tempo_impressao_horas),
    printer,
    filament,
  );
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  const costData = calculateProductCosts(
    Number(peso_gramas),
    Number(tempo_impressao_horas),
    printer,
    filament,
    settings?.custo_kwh ?? 0,
    Number(additional_cost),
  );

  const sku = normalizeSku(nome, cor, variacao);

  const product = await prisma.product.create({
    data: {
      tenantId: req.tenantId,
      nome,
      cor,
      variacao,
      sku,
      peso_gramas: Number(peso_gramas),
      tempo_impressao_horas: Number(tempo_impressao_horas),
      custo_material: costData.custoMaterial,
      custo_energia: costData.custoEnergia,
      custo_amortizacao: costData.custoAmortizacao,
      custo_total: costData.custoTotal,
      printerId,
      filamentId,
    },
    include: { printer: true, filament: true },
  });

  res.json({ product, costBreakdown: costData });
});

export default router;
