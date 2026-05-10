/**
 * Mock Data Layer
 * Simulação de dados para desenvolvimento sem PostgreSQL
 * Usado quando o banco não está disponível
 */

import { printerCatalogSeeds } from './data/printerCatalog';

const mockPrinters = printerCatalogSeeds.map((printer) => ({
  ...printer,
  tenantId: 'tenant_1',
}));

export const mockData = {
  tenant1: {
    printers: mockPrinters,
    filaments: [
      {
        id: 'filament_1',
        tenantId: 'tenant_1',
        marca: 'Prusa',
        tipo: 'PLA',
        custo_por_kg: 120,
      },
      {
        id: 'filament_2',
        tenantId: 'tenant_1',
        marca: 'Prusament',
        tipo: 'PETG',
        custo_por_kg: 150,
      },
    ],
    settings: {
      id: 'settings_1',
      tenantId: 'tenant_1',
      custo_kwh: 1.05,
      direct_margin_percent: 20,
      ecommerce_margin_percent: 35,
      end_customer_margin_percent: 50,
      error_rate_percent: 10,
    },
    products: [
      {
        id: 'prod_1',
        tenantId: 'tenant_1',
        nome: 'Suporte',
        cor: 'Preto',
        variacao: 'P',
        sku: 'Suporte_Preto_P',
        peso_gramas: 50,
        tempo_impressao_horas: 1.5,
        custo_material: 6.0,
        custo_energia: 0.189,
        custo_amortizacao: 0.12,
        custo_total: 6.31,
        printerId: 'printer_bambu_lab_a1_mini',
        filamentId: 'filament_1',
        printer: mockPrinters[0],
        filament: {
          id: 'filament_1',
          tenantId: 'tenant_1',
          marca: 'Prusa',
          tipo: 'PLA',
          custo_por_kg: 120,
        },
      },
      {
        id: 'prod_2',
        tenantId: 'tenant_1',
        nome: 'Peça de Encaixe',
        cor: 'Azul',
        variacao: 'M',
        sku: 'Peça_de_Encaixe_Azul_M',
        peso_gramas: 75,
        tempo_impressao_horas: 2.0,
        custo_material: 9.0,
        custo_energia: 0.315,
        custo_amortizacao: 0.15,
        custo_total: 9.47,
        printerId: 'printer_creality_k1',
        filamentId: 'filament_2',
        printer: mockPrinters.find((printer) => printer.id === 'printer_creality_k1')!,
        filament: {
          id: 'filament_2',
          tenantId: 'tenant_1',
          marca: 'Prusament',
          tipo: 'PETG',
          custo_por_kg: 150,
        },
      },
    ],
    quotes: [],
  },
};
