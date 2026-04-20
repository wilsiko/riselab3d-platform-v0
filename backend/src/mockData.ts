/**
 * Mock Data Layer
 * Simulação de dados para desenvolvimento sem PostgreSQL
 * Usado quando o banco não está disponível
 */

export const mockData = {
  tenant1: {
    printers: [
      {
        id: 'printer_1',
        tenantId: 'tenant_1',
        nome: 'Ender 3 Pro',
        consumo_watts: 120,
        custo_aquisicao: 1500,
        vida_util_horas: 2000,
      },
      {
        id: 'printer_2',
        tenantId: 'tenant_1',
        nome: 'Creality Ender 5',
        consumo_watts: 150,
        custo_aquisicao: 2000,
        vida_util_horas: 2500,
      },
    ],
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
        printerId: 'printer_1',
        filamentId: 'filament_1',
        printer: {
          id: 'printer_1',
          tenantId: 'tenant_1',
          nome: 'Ender 3 Pro',
          consumo_watts: 120,
          custo_aquisicao: 1500,
          vida_util_horas: 2000,
        },
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
        printerId: 'printer_2',
        filamentId: 'filament_2',
        printer: {
          id: 'printer_2',
          tenantId: 'tenant_1',
          nome: 'Creality Ender 5',
          consumo_watts: 150,
          custo_aquisicao: 2000,
          vida_util_horas: 2500,
        },
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
