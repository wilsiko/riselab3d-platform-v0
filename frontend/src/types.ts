export interface PrinterModel {
  id: string;
  name: string;
  consumoWattsPadrao: number;
  vidaUtilHorasPadrao: number;
}

export interface ProductColor {
  id: string;
  name: string;
}

export interface Printer {
  id: string;
  nome: string;
  modelId: string;
  model: PrinterModel;
  consumo_watts: number;
  custo_aquisicao: number;
  vida_util_horas: number;
  data_desativacao?: string | null;
}

export interface Filament {
  id: string;
  marca: string;
  lote: string;
  data_compra: string;
  tipo: string;
  custo_por_kg: number;
  data_desativacao?: string | null;
}

export interface Settings {
  custo_kwh: number;
  margem_venda_direta: number;
  margem_venda_ecommerce: number;
  margem_venda_consumidor_final: number;
  logo_data_url?: string | null;
}

export interface QuoteSummaryItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  printerId: string | null;
  printerName: string | null;
  unitCost: number;
  subtotalCost: number;
}

export interface QuotePricingOption {
  id: string;
  label: string;
  marginPercent: number;
  finalPrice: number;
}

export type QuoteSaleType = 'venda_direta' | 'ecommerce' | 'consumidor_final';

export interface Product {
  id: string;
  nome: string;
  cor: string;
  variacao: string;
  sku: string;
  peso_gramas: number;
  tempo_impressao_horas: number;
  custo_material: number;
  custo_energia: number;
  custo_amortizacao: number;
  custo_adicional: number;
  falha_percentual: number;
  custo_total: number;
  printer?: Printer | null;
  filament: Filament;
  data_desativacao?: string | null;
}

export interface QuoteItem {
  productId: string;
  quantidade: number;
  preco_unitario: number;
}

export interface Quote {
  id: string;
  nome_cliente: string;
  data: string;
  tipo_venda: QuoteSaleType;
  valor_custo: number;
  margem_percentual: number;
  valor_total: number;
  items: Array<{ id: string; productId: string; printerId?: string | null; product: Product; printer?: Printer | null; quantidade: number; preco_unitario: number }>;
  summary: {
    items: QuoteSummaryItem[];
    totalCost: number;
    selectedSaleType: QuoteSaleType;
    selectedSaleTypeLabel: string;
    selectedMarginPercent: number;
    pricingOptions: QuotePricingOption[];
  };
}

export interface Feedback {
  id: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
}

export interface AdminOverview {
  metrics: {
    accountsCount: number;
    tenantsCount: number;
    productsCount: number;
    quotesCount: number;
    printersCount: number;
    filamentsCount: number;
    totalQuoteValue: number;
    averageQuoteValue: number;
    recentAccountsCount: number;
    recentQuotesCount: number;
  };
  latestAccounts: Array<{
    id: string;
    name: string;
    email: string;
    tenantName: string;
    createdAt: string;
  }>;
  tenantHighlights: Array<{
    id: string;
    name: string;
    usersCount: number;
    productsCount: number;
    quotesCount: number;
  }>;
}
