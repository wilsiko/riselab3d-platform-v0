import { Printer, Filament, Product } from '@prisma/client';

export interface ValidationError {
  field: string;
  message: string;
}

function toPascalCaseSegment(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1).toLowerCase())
    .join('');
}

export function normalizeSku(nome: string, cor: string, variacao: string) {
  return [nome, cor, variacao].map(toPascalCaseSegment).join('');
}

export function validateProductData(
  pesoGramas: number,
  tempoHoras: number,
  printer: Pick<Printer, 'consumo_watts' | 'vida_util_horas'> | null,
  filament: Filament,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (pesoGramas <= 0) errors.push({ field: 'peso_gramas', message: 'Peso deve ser maior que 0' });
  if (pesoGramas > 10000) errors.push({ field: 'peso_gramas', message: 'Peso não pode exceder 10kg' });
  if (tempoHoras <= 0) errors.push({ field: 'tempo_impressao_horas', message: 'Tempo deve ser maior que 0' });
  if (tempoHoras > 1000) errors.push({ field: 'tempo_impressao_horas', message: 'Tempo não pode exceder 1000h' });
  if (printer && printer.consumo_watts <= 0) errors.push({ field: 'printer', message: 'Impressora com consumo inválido' });
  if (printer && printer.vida_util_horas <= 0) errors.push({ field: 'printer', message: 'Impressora com vida útil inválida' });
  if (filament.custo_por_kg <= 0) errors.push({ field: 'filament', message: 'Filamento com custo inválido' });

  return errors;
}

export function calculateProductCosts(
  pesoGramas: number,
  tempoHoras: number,
  printer: Pick<Printer, 'consumo_watts' | 'custo_aquisicao' | 'vida_util_horas'> | null,
  filament: Filament,
  custoKwh: number,
  additionalCost = 0,
  falhaPercentual = 10,
) {
  const custoMaterial = (pesoGramas / 1000) * filament.custo_por_kg;
  const custoEnergia = printer ? (printer.consumo_watts / 1000) * tempoHoras * custoKwh : 0;
  const custoAmortizacao = printer ? (printer.custo_aquisicao / printer.vida_util_horas) * tempoHoras : 0;
  const subtotal = custoMaterial + custoEnergia + custoAmortizacao + additionalCost;
  const custoFalhas = subtotal * (falhaPercentual / 100);
  const custoTotal = subtotal + custoFalhas;

  return {
    custoMaterial,
    custoEnergia,
    custoAmortizacao,
    custoAdicional: additionalCost,
    falhaPercentual,
    custoFalhas,
    custoTotal,
  };
}

export function calculateQuoteItemUnitPrice(
  product: Pick<Product, 'custo_material' | 'custo_adicional' | 'falha_percentual' | 'tempo_impressao_horas'>,
  printer: Pick<Printer, 'consumo_watts' | 'custo_aquisicao' | 'vida_util_horas'>,
  custoKwh: number,
) {
  const custoEnergia = (printer.consumo_watts / 1000) * product.tempo_impressao_horas * custoKwh;
  const custoAmortizacao = (printer.custo_aquisicao / printer.vida_util_horas) * product.tempo_impressao_horas;
  const subtotal = product.custo_material + custoEnergia + custoAmortizacao + product.custo_adicional;
  const custoFalhas = subtotal * (product.falha_percentual / 100);

  return subtotal + custoFalhas;
}

export interface QuotePricingSettings {
  margem_venda_direta: number;
  margem_venda_ecommerce: number;
  margem_venda_consumidor_final: number;
}

export function applyMargin(baseCost: number, marginPercent: number) {
  return baseCost * (1 + marginPercent / 100);
}

export function buildQuotePricingOptions(baseCost: number, settings: QuotePricingSettings) {
  return [
    {
      id: 'venda_direta',
      label: 'Venda Direta (B2B)',
      marginPercent: settings.margem_venda_direta,
      finalPrice: applyMargin(baseCost, settings.margem_venda_direta),
    },
    {
      id: 'ecommerce',
      label: 'Venda em E-Commerce',
      marginPercent: settings.margem_venda_ecommerce,
      finalPrice: applyMargin(baseCost, settings.margem_venda_ecommerce),
    },
    {
      id: 'consumidor_final',
      label: 'Venda ao Usuário Final',
      marginPercent: settings.margem_venda_consumidor_final,
      finalPrice: applyMargin(baseCost, settings.margem_venda_consumidor_final),
    },
  ];
}
