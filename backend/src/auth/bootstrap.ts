import { prisma } from '../prisma';
import { printerCatalogSeeds } from '../data/printerCatalog';

export async function ensurePublicTenantSeed() {
  const tenantId = process.env.PUBLIC_TENANT_ID || 'tenant_1';

  await prisma.tenant.upsert({
    where: { id: tenantId },
    update: { name: 'RiseLab3D Company' },
    create: { id: tenantId, name: 'RiseLab3D Company' },
  });

  const printersCount = await prisma.printer.count({ where: { tenantId } });

  if (!printersCount) {
    await prisma.printer.createMany({
      data: printerCatalogSeeds.map((printer) => ({
        id: printer.id,
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
      })),
      skipDuplicates: true,
    });
  }

  await prisma.filament.upsert({
    where: { id: 'filament_1' },
    update: {
      marca: 'Prusa',
      tipo: 'PLA',
      custo_por_kg: 120,
      tenantId,
    },
    create: {
      id: 'filament_1',
      tenantId,
      marca: 'Prusa',
      tipo: 'PLA',
      custo_por_kg: 120,
    },
  });

  await prisma.globalSettings.upsert({
    where: { tenantId },
    update: { custo_kwh: 1.05, direct_margin_percent: 20, ecommerce_margin_percent: 35, end_customer_margin_percent: 50 },
    create: { tenantId, custo_kwh: 1.05, direct_margin_percent: 20, ecommerce_margin_percent: 35, end_customer_margin_percent: 50 },
  });

  const printer = await prisma.printer.findFirst({ where: { tenantId }, orderBy: { nome: 'asc' } });

  if (printer) {
    await prisma.product.upsert({
      where: { sku: 'Suporte_Preto_P' },
      update: { nome: 'Suporte', cor: 'Preto', variacao: 'P', peso_gramas: 50, tempo_impressao_horas: 1.5, printerId: printer.id, filamentId: 'filament_1', custo_material: 6, custo_energia: 0.189, custo_amortizacao: 1.125, custo_total: 7.314, tenantId },
      create: {
        tenantId,
        nome: 'Suporte',
        cor: 'Preto',
        variacao: 'P',
        sku: 'Suporte_Preto_P',
        peso_gramas: 50,
        tempo_impressao_horas: 1.5,
        printerId: printer.id,
        filamentId: 'filament_1',
        custo_material: 6,
        custo_energia: 0.189,
        custo_amortizacao: 1.125,
        custo_total: 7.314,
      },
    });
  }
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
    },
  });

  await prisma.printer.createMany({
    data: printerCatalogSeeds.slice(0, 3).map((printer) => ({
      tenantId: tenant.id,
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
    })),
  });

  return tenant;
}
