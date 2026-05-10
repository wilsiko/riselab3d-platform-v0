export interface Printer {
  id: string;
  nome: string;
  consumo_watts: number;
  custo_aquisicao: number;
  vida_util_horas: number;
}

export interface Filament {
  id: string;
  marca: string;
  tipo: string;
  custo_por_kg: number;
}

export interface Settings {
  custo_kwh: number;
  direct_margin_percent: number;
  ecommerce_margin_percent: number;
  end_customer_margin_percent: number;
  error_rate_percent: number;
}

export interface Client {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

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
  custo_total: number;
  printer: Printer;
  filament: Filament;
}

export interface QuoteItem {
  productId?: string;
  quantidade: number;
  preco_unitario: number;
}

export interface Quote {
  id: string;
  nome_cliente: string;
  data: string;
  createdAt: string;
  updatedAt: string;
  notes?: string | null;
  sale_channel?: string;
  subtotal_custo?: number;
  margem_percentual?: number;
  valor_total: number;
  publicShareToken?: string | null;
  items: Array<{
    product?: Product | null;
    quantidade: number;
    preco_unitario: number;
    snapshot_nome?: string | null;
    snapshot_sku?: string | null;
    snapshot_material?: string | null;
    custo_base_unitario?: number | null;
    subtotal_custo?: number | null;
    subtotal_preco?: number | null;
  }>;
}

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  name: string | null;
  emailVerified: boolean;
  mustChangePassword: boolean;
}
