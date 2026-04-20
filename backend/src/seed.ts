import { prisma } from './prisma';
import { PLATFORM_ADMIN_ROLE, hashPassword } from './auth';

const defaultPrinterModels = [
  { name: 'A1', consumoWattsPadrao: 120, vidaUtilHorasPadrao: 2000 },
  { name: 'A1 Mini', consumoWattsPadrao: 95, vidaUtilHorasPadrao: 1800 },
  { name: 'P1S', consumoWattsPadrao: 350, vidaUtilHorasPadrao: 2500 },
  { name: 'P1P', consumoWattsPadrao: 340, vidaUtilHorasPadrao: 2400 },
  { name: 'P2S', consumoWattsPadrao: 420, vidaUtilHorasPadrao: 3000 },
  { name: 'X1 Carbon', consumoWattsPadrao: 360, vidaUtilHorasPadrao: 2800 },
  { name: 'K1', consumoWattsPadrao: 300, vidaUtilHorasPadrao: 2200 },
  { name: 'K1 Max', consumoWattsPadrao: 350, vidaUtilHorasPadrao: 2500 },
  { name: 'Ender 3 V3', consumoWattsPadrao: 120, vidaUtilHorasPadrao: 2000 },
  { name: 'Neptune 4 Pro', consumoWattsPadrao: 330, vidaUtilHorasPadrao: 2300 },
];

const defaultProductColors = [
  'Preto',
  'Branco',
  'Cinza',
  'Vermelho',
  'Azul',
  'Verde',
  'Amarelo',
  'Laranja',
  'Roxo',
  'Rosa',
  'Marrom',
  'Bege',
  'Transparente',
];

async function main() {
  const tenantId = 'tenant_1';
  const adminPasswordHash = await hashPassword('RiseLab@16');

  const printerModels = await Promise.all(
    defaultPrinterModels.map((model) =>
      prisma.printerModel.upsert({
        where: { name: model.name },
        update: {
          consumoWattsPadrao: model.consumoWattsPadrao,
          vidaUtilHorasPadrao: model.vidaUtilHorasPadrao,
        },
        create: model,
      }),
    ),
  );
  await Promise.all(
    defaultProductColors.map((name) =>
      prisma.productColor.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );
  const ender3v3Model = printerModels.find((model) => model.name === 'Ender 3 V3');
  const k1MaxModel = printerModels.find((model) => model.name === 'K1 Max');

  const tenant = await prisma.tenant.upsert({
    where: { id: tenantId },
    update: { name: 'RiseLab3D Company' },
    create: { id: tenantId, name: 'RiseLab3D Company' },
  });

  await prisma.user.upsert({
    where: { email: 'admin@riselab3d.com.br' },
    update: { name: 'Administrador RiseLab3D', password: adminPasswordHash, role: PLATFORM_ADMIN_ROLE },
    create: { name: 'Administrador RiseLab3D', email: 'admin@riselab3d.com.br', password: adminPasswordHash, role: PLATFORM_ADMIN_ROLE, tenantId: tenant.id },
  });

  const printer = await prisma.printer.upsert({
    where: { id: 'printer_1' },
    update: {
      nome: 'Ender 3 Pro',
      modelId: ender3v3Model?.id || printerModels[0].id,
      consumo_watts: 120,
      custo_aquisicao: 1500,
      vida_util_horas: 2000,
      tenantId,
    },
    create: {
      id: 'printer_1',
      tenantId,
      nome: 'Ender 3 Pro',
      modelId: ender3v3Model?.id || printerModels[0].id,
      consumo_watts: 120,
      custo_aquisicao: 1500,
      vida_util_horas: 2000,
    },
  });

  await prisma.printer.upsert({
    where: { id: 'printer_2' },
    update: {
      nome: 'K1 Max da produção',
      modelId: k1MaxModel?.id || printerModels[0].id,
      consumo_watts: 150,
      custo_aquisicao: 3200,
      vida_util_horas: 2500,
      tenantId,
    },
    create: {
      id: 'printer_2',
      tenantId,
      nome: 'K1 Max da produção',
      modelId: k1MaxModel?.id || printerModels[0].id,
      consumo_watts: 150,
      custo_aquisicao: 3200,
      vida_util_horas: 2500,
    },
  });

  await prisma.filament.upsert({
    where: { id: 'filament_1' },
    update: {
      marca: 'Prusa',
      lote: 'L001',
      data_compra: new Date('2026-04-01T00:00:00.000Z'),
      tipo: 'PLA',
      custo_por_kg: 120,
      tenantId,
    },
    create: {
      id: 'filament_1',
      tenantId,
      marca: 'Prusa',
      lote: 'L001',
      data_compra: new Date('2026-04-01T00:00:00.000Z'),
      tipo: 'PLA',
      custo_por_kg: 120,
    },
  });

  await prisma.filament.upsert({
    where: { id: 'filament_2' },
    update: {
      marca: 'Prusament',
      lote: 'P2026-02',
      data_compra: new Date('2026-04-12T00:00:00.000Z'),
      tipo: 'PETG',
      custo_por_kg: 150,
      tenantId,
    },
    create: {
      id: 'filament_2',
      tenantId,
      marca: 'Prusament',
      lote: 'P2026-02',
      data_compra: new Date('2026-04-12T00:00:00.000Z'),
      tipo: 'PETG',
      custo_por_kg: 150,
    },
  });

  await prisma.globalSettings.upsert({
    where: { tenantId },
    update: {
      custo_kwh: 1.05,
      margem_venda_direta: 20,
      margem_venda_ecommerce: 35,
      margem_venda_consumidor_final: 50,
      logo_data_url: null,
    },
    create: {
      tenantId,
      custo_kwh: 1.05,
      margem_venda_direta: 20,
      margem_venda_ecommerce: 35,
      margem_venda_consumidor_final: 50,
      logo_data_url: null,
    },
  });

  await prisma.product.upsert({
    where: { sku: 'SuportePretoP' },
    update: { nome: 'Suporte', cor: 'Preto', variacao: 'P', peso_gramas: 50, tempo_impressao_horas: 1.5, printerId: null, filamentId: 'filament_1', custo_material: 6, custo_energia: 0, custo_amortizacao: 0, custo_adicional: 0, falha_percentual: 10, custo_total: 6.6, tenantId },
    create: {
      tenantId,
      nome: 'Suporte',
      cor: 'Preto',
      variacao: 'P',
      sku: 'SuportePretoP',
      peso_gramas: 50,
      tempo_impressao_horas: 1.5,
      printerId: null,
      filamentId: 'filament_1',
      custo_material: 6,
      custo_energia: 0,
      custo_amortizacao: 0,
      custo_adicional: 0,
      falha_percentual: 10,
      custo_total: 6.6,
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
