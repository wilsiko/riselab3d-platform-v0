import { prisma } from './prisma';
import { printerCatalogSeeds } from './data/printerCatalog';
import bcrypt from 'bcryptjs';
import { calculateProductCosts } from './services/cost';

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

async function main() {
  const tenantId = 'tenant_1';

  const tenant = await prisma.tenant.upsert({
    where: { id: tenantId },
    update: { name: 'RiseLab3D Company' },
    create: { id: tenantId, name: 'RiseLab3D Company' },
  });

  await prisma.user.upsert({
    where: { email: 'admin@riselab3d.com' },
    update: { password: await bcrypt.hash('changeme123', 10), emailVerifiedAt: new Date(), name: 'Administrador' },
    create: { email: 'admin@riselab3d.com', password: await bcrypt.hash('changeme123', 10), emailVerifiedAt: new Date(), name: 'Administrador', tenantId: tenant.id },
  });

  await prisma.quoteItem.deleteMany({ where: { quote: { tenantId } } });
  await prisma.quote.deleteMany({ where: { tenantId } });
  await prisma.product.deleteMany({ where: { tenantId } });
  await prisma.printer.deleteMany({ where: { tenantId } });
  await prisma.filament.deleteMany({ where: { tenantId } });
  await prisma.globalSettings.deleteMany({ where: { tenantId } });

  await prisma.printer.createMany({
    data: buildTenantPrinterData(tenantId),
  });

  const printer = await prisma.printer.findFirstOrThrow({ where: { tenantId }, orderBy: { nome: 'asc' } });

  const filament = await prisma.filament.create({
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

  const settings = await prisma.globalSettings.findUniqueOrThrow({ where: { tenantId } });
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

  console.log('Seed completed for tenant:', tenant.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
