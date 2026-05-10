import { Router } from 'express';
import { prisma } from '../prisma';
import { normalizeSku, calculateProductCosts, validateProductData } from '../services/cost';
import { withFallback, mockData } from '../utils/dbFallback';
import { parseDecimalValue } from '../utils/number';
import { requireAuth } from '../middleware/auth';

const router = Router();

async function ensureManualMaterial(tenantId: string) {
  const existingMaterial = await prisma.filament.findFirst({
    where: {
      tenantId,
      marca: 'Material informado',
      tipo: 'Preco manual',
    },
  });

  if (existingMaterial) {
    return existingMaterial;
  }

  return prisma.filament.create({
    data: {
      tenantId,
      marca: 'Material informado',
      tipo: 'Preco manual',
      custo_por_kg: 0,
    },
  });
}

function parseProductPayload(body: any) {
  const {
    nome,
    cor,
    variacao,
    printerId,
    peso_gramas,
    tempo_impressao_horas,
    filament_cost_per_kg,
    additional_cost = 0,
  } = body;

  return {
    nome,
    cor,
    variacao,
    printerId,
    pesoGramas: parseDecimalValue(peso_gramas),
    tempoImpressaoHoras: parseDecimalValue(tempo_impressao_horas),
    filamentCostPerKg: parseDecimalValue(filament_cost_per_kg),
    additionalCost: parseDecimalValue(additional_cost),
  };
}

router.get('/', async (req, res) => {
  const products = await withFallback(
    () =>
      prisma.product.findMany({
        where: {
          tenantId: req.tenantId,
        },
        include: { printer: true, filament: true },
        orderBy: [{ nome: 'asc' }, { variacao: 'asc' }],
      }),
    () => mockData.tenant1.products,
  );
  res.json(products);
});

router.post('/', async (req, res) => {
  if (!req.authUser) {
    return requireAuth(req, res, () => undefined);
  }

  const {
    nome,
    cor,
    variacao,
    printerId,
    pesoGramas,
    tempoImpressaoHoras,
    filamentCostPerKg,
    additionalCost,
  } = parseProductPayload(req.body);

  if (!nome?.trim() || !cor?.trim() || !variacao?.trim() || !printerId) {
    return res.status(400).json({ error: 'Nome, cor, variacao e impressora sao obrigatorios.' });
  }

  const normalizedName = String(nome).trim();
  const normalizedColor = String(cor).trim();
  const normalizedVariation = String(variacao).trim();

  if (!Number.isFinite(additionalCost) || additionalCost < 0) {
    return res.status(400).json({ error: 'O custo adicional deve ser um valor valido.' });
  }

  const printer = await prisma.printer.findFirst({ where: { id: printerId, tenantId: req.tenantId } });
  const settings = await prisma.globalSettings.findUnique({ where: { tenantId: req.tenantId } });

  if (!printer) {
    return res.status(400).json({ error: 'Impressora deve existir para este tenant.' });
  }

  if (!Number.isFinite(filamentCostPerKg) || filamentCostPerKg <= 0) {
    return res.status(400).json({ error: 'Informe um preco por kg maior que zero para o material.' });
  }

  const manualMaterial = await ensureManualMaterial(req.tenantId);
  const materialForCost = {
    ...manualMaterial,
    custo_por_kg: filamentCostPerKg,
  };

  const validationErrors = validateProductData(
    pesoGramas,
    tempoImpressaoHoras,
    printer,
    materialForCost,
  );
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  const costData = calculateProductCosts(
    pesoGramas,
    tempoImpressaoHoras,
    printer,
    materialForCost,
    settings?.custo_kwh ?? 0,
    additionalCost,
    settings?.error_rate_percent ?? 10,
  );

  const sku = normalizeSku(normalizedName, normalizedColor, normalizedVariation);

  const existingProduct = await prisma.product.findUnique({ where: { sku } });

  if (existingProduct) {
    return res.status(409).json({
      error: `O SKU ${sku} ja existe. Altere o nome do produto, a cor ou a variacao para gerar um SKU diferente.`,
    });
  }

  const product = await prisma.product.create({
    data: {
      tenantId: req.tenantId,
      nome: normalizedName,
      cor: normalizedColor,
      variacao: normalizedVariation,
      sku,
      peso_gramas: pesoGramas,
      tempo_impressao_horas: tempoImpressaoHoras,
      custo_material: costData.custoMaterial,
      custo_energia: costData.custoEnergia,
      custo_amortizacao: costData.custoAmortizacao,
      custo_total: costData.custoTotal,
      printerId,
      filamentId: manualMaterial.id,
    },
    include: { printer: true, filament: true },
  });

  res.json({ product, costBreakdown: costData });
});

router.put('/:id', async (req, res) => {
  if (!req.authUser) {
    return requireAuth(req, res, () => undefined);
  }

  const { id } = req.params;
  const {
    nome,
    cor,
    variacao,
    printerId,
    pesoGramas,
    tempoImpressaoHoras,
    filamentCostPerKg,
    additionalCost,
  } = parseProductPayload(req.body);

  if (!nome?.trim() || !cor?.trim() || !variacao?.trim() || !printerId) {
    return res.status(400).json({ error: 'Nome, cor, variacao e impressora sao obrigatorios.' });
  }

  const normalizedName = String(nome).trim();
  const normalizedColor = String(cor).trim();
  const normalizedVariation = String(variacao).trim();

  const existingProduct = await prisma.product.findFirst({
    where: { id, tenantId: req.tenantId },
  });

  if (!existingProduct) {
    return res.status(404).json({ error: 'Produto nao encontrado.' });
  }

  if (!Number.isFinite(additionalCost) || additionalCost < 0) {
    return res.status(400).json({ error: 'O custo adicional deve ser um valor valido.' });
  }

  const printer = await prisma.printer.findFirst({ where: { id: printerId, tenantId: req.tenantId } });
  const settings = await prisma.globalSettings.findUnique({ where: { tenantId: req.tenantId } });

  if (!printer) {
    return res.status(400).json({ error: 'Impressora deve existir para este tenant.' });
  }

  if (!Number.isFinite(filamentCostPerKg) || filamentCostPerKg <= 0) {
    return res.status(400).json({ error: 'Informe um preco por kg maior que zero para o material.' });
  }

  const manualMaterial = await ensureManualMaterial(req.tenantId);
  const materialForCost = {
    ...manualMaterial,
    custo_por_kg: filamentCostPerKg,
  };

  const validationErrors = validateProductData(
    pesoGramas,
    tempoImpressaoHoras,
    printer,
    materialForCost,
  );
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  const costData = calculateProductCosts(
    pesoGramas,
    tempoImpressaoHoras,
    printer,
    materialForCost,
    settings?.custo_kwh ?? 0,
    additionalCost,
    settings?.error_rate_percent ?? 10,
  );

  const sku = normalizeSku(normalizedName, normalizedColor, normalizedVariation);
  const conflictingProduct = await prisma.product.findFirst({
    where: {
      id: { not: id },
      sku,
    },
  });

  if (conflictingProduct) {
    return res.status(409).json({
      error: `O SKU ${sku} ja existe. Altere o nome do produto, a cor ou a variacao para gerar um SKU diferente.`,
    });
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      nome: normalizedName,
      cor: normalizedColor,
      variacao: normalizedVariation,
      sku,
      peso_gramas: pesoGramas,
      tempo_impressao_horas: tempoImpressaoHoras,
      custo_material: costData.custoMaterial,
      custo_energia: costData.custoEnergia,
      custo_amortizacao: costData.custoAmortizacao,
      custo_total: costData.custoTotal,
      printerId,
      filamentId: manualMaterial.id,
    },
    include: { printer: true, filament: true },
  });

  res.json({ product, costBreakdown: costData });
});

router.delete('/:id', async (req, res) => {
  if (!req.authUser) {
    return requireAuth(req, res, () => undefined);
  }

  const { id } = req.params;
  const linkedQuoteItems = await prisma.quoteItem.count({
    where: { productId: id },
  });

  if (linkedQuoteItems > 0) {
    return res.status(409).json({ error: 'Este produto ja foi usado em cotacoes salvas e nao pode ser removido.' });
  }

  const result = await prisma.product.deleteMany({
    where: { id, tenantId: req.tenantId },
  });

  if (!result.count) {
    return res.status(404).json({ error: 'Produto nao encontrado.' });
  }

  res.json({ removed: true });
});

export default router;
