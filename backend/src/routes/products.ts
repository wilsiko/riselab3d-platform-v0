import { Router } from 'express';
import { prisma } from '../prisma';
import { normalizeSku, calculateProductCosts, validateProductData } from '../services/cost';
import { withFallback, mockData } from '../utils/dbFallback';
import { parseDecimalValue } from '../utils/number';

const router = Router();

function parseProductPayload(body: any) {
  const {
    nome,
    cor,
    variacao,
    peso_gramas,
    tempo_impressao_horas,
    filamentId,
    additional_cost = 0,
    falha_percentual = 10,
  } = body;

  return {
    nome,
    cor,
    variacao,
    pesoGramas: parseDecimalValue(peso_gramas),
    tempoImpressaoHoras: parseDecimalValue(tempo_impressao_horas),
    filamentId,
    additionalCost: parseDecimalValue(additional_cost),
    falhaPercentual: Number(falha_percentual),
  };
}

router.get('/', async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const products = await withFallback(
    () =>
      prisma.product.findMany({
        where: {
          tenantId: req.tenantId,
          ...(includeInactive ? {} : { data_desativacao: null }),
        },
        include: { printer: true, filament: true },
        orderBy: [{ data_desativacao: 'asc' }, { nome: 'asc' }],
      }),
    () => mockData.tenant1.products.filter((product) => includeInactive || !product.data_desativacao),
  );
  res.json(products);
});

router.post('/', async (req, res) => {
  const {
    nome,
    cor,
    variacao,
    pesoGramas,
    tempoImpressaoHoras,
    filamentId,
    additionalCost,
    falhaPercentual,
  } = parseProductPayload(req.body);

  // Validação de entrada básica
  if (!nome?.trim() || !cor?.trim() || !variacao?.trim()) {
    return res.status(400).json({ error: 'Nome, cor e variação são obrigatórios' });
  }

  const normalizedName = String(nome).trim();

  if (/\s/.test(normalizedName)) {
    return res.status(400).json({ error: 'O nome do produto deve conter apenas uma palavra.' });
  }

  const normalizedColor = String(cor).trim();
  const normalizedVariation = String(variacao).trim();

  const productColor = await withFallback(
    () =>
      prisma.productColor.findFirst({
        where: {
          name: {
            equals: normalizedColor,
            mode: 'insensitive',
          },
        },
      }),
    () => mockData.tenant1.productColors.find((color) => color.name.toLowerCase() === normalizedColor.toLowerCase()) ?? null,
  );

  if (!productColor) {
    return res.status(400).json({ error: 'Selecione uma cor válida na lista disponível.' });
  }

  if (!Number.isFinite(additionalCost) || additionalCost < 0) {
    return res.status(400).json({ error: 'O custo adicional deve ser um valor válido.' });
  }

  const filament = await prisma.filament.findFirst({ where: { id: filamentId, tenantId: req.tenantId, data_desativacao: null } });
  const settings = await prisma.globalSettings.findUnique({ where: { tenantId: req.tenantId } });

  if (!filament) {
    return res.status(400).json({ error: 'Filamento deve existir para este tenant.' });
  }

  // Validação de dados de custo
  const validationErrors = validateProductData(
    pesoGramas,
    tempoImpressaoHoras,
    null,
    filament,
  );
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  const costData = calculateProductCosts(
    pesoGramas,
    tempoImpressaoHoras,
    null,
    filament,
    settings?.custo_kwh ?? 0,
    additionalCost,
    falhaPercentual,
  );

  const sku = normalizeSku(normalizedName, productColor.name, normalizedVariation);

  const existingProduct = await prisma.product.findUnique({ where: { sku } });

  if (existingProduct) {
    return res.status(409).json({
      error: `O SKU ${sku} já existe. Altere o nome do produto, a cor ou a variação para gerar um SKU diferente.`,
    });
  }

  const product = await prisma.product.create({
    data: {
      tenantId: req.tenantId,
      nome: normalizedName,
      cor: productColor.name,
      variacao: normalizedVariation,
      sku,
      peso_gramas: pesoGramas,
      tempo_impressao_horas: tempoImpressaoHoras,
      custo_material: costData.custoMaterial,
      custo_energia: costData.custoEnergia,
      custo_amortizacao: costData.custoAmortizacao,
      custo_adicional: costData.custoAdicional,
      falha_percentual: costData.falhaPercentual,
      custo_total: costData.custoTotal,
      filamentId,
    },
    include: { printer: true, filament: true },
  });

  res.json({ product, costBreakdown: costData });
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const {
    nome,
    cor,
    variacao,
    pesoGramas,
    tempoImpressaoHoras,
    filamentId,
    additionalCost,
    falhaPercentual,
  } = parseProductPayload(req.body);

  if (!nome?.trim() || !cor?.trim() || !variacao?.trim()) {
    return res.status(400).json({ error: 'Nome, cor e variação são obrigatórios' });
  }

  const normalizedName = String(nome).trim();

  if (/\s/.test(normalizedName)) {
    return res.status(400).json({ error: 'O nome do produto deve conter apenas uma palavra.' });
  }

  const normalizedColor = String(cor).trim();
  const normalizedVariation = String(variacao).trim();

  const existingProduct = await prisma.product.findFirst({
    where: { id, tenantId: req.tenantId },
  });

  if (!existingProduct) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  if (existingProduct.data_desativacao) {
    return res.status(400).json({ error: 'Produtos desativados devem ser reativados antes da edição.' });
  }

  const productColor = await withFallback(
    () =>
      prisma.productColor.findFirst({
        where: {
          name: {
            equals: normalizedColor,
            mode: 'insensitive',
          },
        },
      }),
    () => mockData.tenant1.productColors.find((color) => color.name.toLowerCase() === normalizedColor.toLowerCase()) ?? null,
  );

  if (!productColor) {
    return res.status(400).json({ error: 'Selecione uma cor válida na lista disponível.' });
  }

  if (!Number.isFinite(additionalCost) || additionalCost < 0) {
    return res.status(400).json({ error: 'O custo adicional deve ser um valor válido.' });
  }

  const filament = await prisma.filament.findFirst({ where: { id: filamentId, tenantId: req.tenantId, data_desativacao: null } });
  const settings = await prisma.globalSettings.findUnique({ where: { tenantId: req.tenantId } });

  if (!filament) {
    return res.status(400).json({ error: 'Filamento deve existir para este tenant.' });
  }

  const validationErrors = validateProductData(
    pesoGramas,
    tempoImpressaoHoras,
    null,
    filament,
  );
  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  const costData = calculateProductCosts(
    pesoGramas,
    tempoImpressaoHoras,
    null,
    filament,
    settings?.custo_kwh ?? 0,
    additionalCost,
    falhaPercentual,
  );

  const sku = normalizeSku(normalizedName, productColor.name, normalizedVariation);
  const conflictingProduct = await prisma.product.findFirst({
    where: {
      id: { not: id },
      sku,
    },
  });

  if (conflictingProduct) {
    return res.status(409).json({
      error: `O SKU ${sku} já existe. Altere o nome do produto, a cor ou a variação para gerar um SKU diferente.`,
    });
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      nome: normalizedName,
      cor: productColor.name,
      variacao: normalizedVariation,
      sku,
      peso_gramas: pesoGramas,
      tempo_impressao_horas: tempoImpressaoHoras,
      custo_material: costData.custoMaterial,
      custo_energia: costData.custoEnergia,
      custo_amortizacao: costData.custoAmortizacao,
      custo_adicional: costData.custoAdicional,
      falha_percentual: costData.falhaPercentual,
      custo_total: costData.custoTotal,
      filamentId,
    },
    include: { printer: true, filament: true },
  });

  res.json({ product, costBreakdown: costData });
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const result = await prisma.product.updateMany({
    where: { id, tenantId: req.tenantId, data_desativacao: null },
    data: { data_desativacao: new Date() },
  });

  if (!result.count) {
    return res.status(404).json({ error: 'Produto não encontrado ou já desativado.' });
  }

  res.json({ removed: true });
});

router.patch('/:id/reactivate', async (req, res) => {
  const { id } = req.params;

  const product = await prisma.product.findFirst({
    where: { id, tenantId: req.tenantId },
    include: { printer: true, filament: true },
  });

  if (!product) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }

  if (!product.data_desativacao) {
    return res.status(400).json({ error: 'O produto já está ativo.' });
  }

  const existingActiveProduct = await prisma.product.findFirst({
    where: {
      tenantId: req.tenantId,
      id: { not: id },
      data_desativacao: null,
      sku: product.sku,
    },
  });

  if (existingActiveProduct) {
    return res.status(409).json({
      error: `Já existe um produto ativo com o SKU ${product.sku}. Ajuste o cadastro correspondente antes de reativar este item.`,
    });
  }

  const updated = await prisma.product.update({
    where: { id },
    data: { data_desativacao: null },
    include: { printer: true, filament: true },
  });

  res.json(updated);
});

export default router;
