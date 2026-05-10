import { prisma } from './prisma';
import { printerCatalogSeeds } from './data/printerCatalog';

async function main() {
  const tenantId = 'tenant_1';

  const tenant = await prisma.tenant.upsert({
    where: { id: tenantId },
    update: { name: 'RiseLab3D Company' },
    create: { id: tenantId, name: 'RiseLab3D Company' },
  });

  await prisma.user.upsert({
    where: { email: 'admin@riselab3d.com' },
    update: { password: 'changeme' },
    create: { email: 'admin@riselab3d.com', password: 'changeme', tenantId: tenant.id },
  });

  await prisma.quoteItem.deleteMany({ where: { quote: { tenantId } } });
  await prisma.quote.deleteMany({ where: { tenantId } });
  await prisma.product.deleteMany({ where: { tenantId } });
  await prisma.printer.deleteMany({ where: { tenantId } });
  await prisma.filament.deleteMany({ where: { tenantId } });
  await prisma.globalSettings.deleteMany({ where: { tenantId } });

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
  });

  const printer = await prisma.printer.findUniqueOrThrow({ where: { id: printerCatalogSeeds[0].id } });

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
    update: { custo_kwh: 1.05 },
    create: { tenantId, custo_kwh: 1.05 },
  });

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
