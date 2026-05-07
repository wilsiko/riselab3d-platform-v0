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
}

export interface Product {
  id: string;
  nome: string;
  cor: string;
  variacao: string;
  sku: string;
  peso_gramas: number;
  tempo_impressao_horas: number;
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
  notes?: string | null;
  sale_channel?: string;
  subtotal_custo?: number;
  margem_percentual?: number;
  valor_total: number;
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
