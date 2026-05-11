import { prisma } from '../prisma';
import { printerCatalogSeeds } from '../data/printerCatalog';
import { calculateProductCosts } from '../services/cost';

function buildTenantPrinterData(tenantId: string) {
  return printerCatalogSeeds.map((printer) => ({
    tenantId,
    nome: printer.nome,
    brand: printer.brand,
    model: printer.model,
    technology: printer.technology,
    averagePowerConsumptionWatts: printer.averagePowerConsumptionWatts,
    peakPowerConsumptionWatts: printer.peakPowerConsumptionWatts,
    buildVolumeX: printer.buildVolumeX,
    buildVolumeY: printer.buildVolumeY,
    buildVolumeZ: printer.buildVolumeZ,
    averagePrintSpeed: printer.averagePrintSpeed,
    nozzleDiameter: printer.nozzleDiameter,
    isCoreXY: printer.isCoreXY,
    isEnclosed: printer.isEnclosed,
    status: printer.status,
    consumo_watts: printer.consumo_watts,
    custo_aquisicao: printer.custo_aquisicao,
    vida_util_horas: printer.vida_util_horas,
  }));
}

function getTenantSampleSku(tenantId: string) {
  return `Suporte_Preto_P_${tenantId}`;
}

export async function ensureTenantOperationalBaseline(tenantId: string, tenantName = 'RiseLab3D Company') {
  await prisma.tenant.upsert({
    where: { id: tenantId },
    update: { name: tenantName },
    create: { id: tenantId, name: tenantName },
  });

  const printerCount = await prisma.printer.count({ where: { tenantId } });

  if (!printerCount) {
    await prisma.printer.createMany({
      data: buildTenantPrinterData(tenantId),
    });
  }

  await prisma.printer.updateMany({
    where: {
      tenantId,
      vida_util_horas: 4000,
    },
    data: {
      vida_util_horas: 20000,
    },
  });

  const existingFilament = await prisma.filament.findFirst({
    where: {
      tenantId,
      marca: 'Prusa',
      tipo: 'PLA',
    },
  });

  const filament = existingFilament
    ? await prisma.filament.update({
        where: { id: existingFilament.id },
        data: {
          custo_por_kg: 120,
        },
      })
    : await prisma.filament.create({
        data: {
          tenantId,
          marca: 'Prusa',
          tipo: 'PLA',
          custo_por_kg: 120,
        },
      });

  await prisma.globalSettings.upsert({
    where: { tenantId },
    update: { custo_kwh: 1.05, direct_margin_percent: 20, ecommerce_margin_percent: 35, end_customer_margin_percent: 50, error_rate_percent: 10 },
    create: { tenantId, custo_kwh: 1.05, direct_margin_percent: 20, ecommerce_margin_percent: 35, end_customer_margin_percent: 50, error_rate_percent: 10 },
  });

  const printer = await prisma.printer.findFirst({
    where: { tenantId },
    orderBy: { nome: 'asc' },
  });
  const settings = await prisma.globalSettings.findUnique({ where: { tenantId } });

  if (printer && filament && settings) {
    const costData = calculateProductCosts(
      50,
      1.5,
      printer,
      filament,
      settings.custo_kwh,
      0,
      settings.error_rate_percent,
    );

    await prisma.product.upsert({
      where: { sku: getTenantSampleSku(tenantId) },
      update: { nome: 'Suporte', cor: 'Preto', variacao: 'P', peso_gramas: 50, tempo_impressao_horas: 1.5, printerId: printer.id, filamentId: filament.id, custo_material: costData.custoMaterial, custo_energia: costData.custoEnergia, custo_amortizacao: costData.custoAmortizacao, custo_total: costData.custoTotal, tenantId },
      create: {
        tenantId,
        nome: 'Suporte',
        cor: 'Preto',
        variacao: 'P',
        sku: getTenantSampleSku(tenantId),
        peso_gramas: 50,
        tempo_impressao_horas: 1.5,
        printerId: printer.id,
        filamentId: filament.id,
        custo_material: costData.custoMaterial,
        custo_energia: costData.custoEnergia,
        custo_amortizacao: costData.custoAmortizacao,
        custo_total: costData.custoTotal,
      },
    });
  }
}

export async function ensurePublicTenantSeed() {
  const tenantId = process.env.PUBLIC_TENANT_ID || 'tenant_1';
  await ensureTenantOperationalBaseline(tenantId, 'RiseLab3D Company');
}

export async function provisionTenantForUser(name: string, email: string) {
  const tenant = await prisma.tenant.create({
    data: {
      name: name.trim() || email.split('@')[0] || 'Nova operacao RiseLab3D',
    },
  });

  await prisma.globalSettings.create({
    data: {
      tenantId: tenant.id,
      custo_kwh: 1.05,
      direct_margin_percent: 20,
      ecommerce_margin_percent: 35,
      end_customer_margin_percent: 50,
      error_rate_percent: 10,
    },
  });

  await prisma.printer.createMany({
    data: buildTenantPrinterData(tenant.id),
  });

  return tenant;
}
