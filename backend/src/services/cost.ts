import { Printer, Filament } from '@prisma/client';

export interface ValidationError {
  field: string;
  message: string;
}

export function calculatePrinterHourlyCost(
  printer: Pick<Printer, 'custo_aquisicao' | 'vida_util_horas'> | null,
) {
  if (!printer || printer.custo_aquisicao <= 0 || printer.vida_util_horas <= 0) {
    return 0;
  }

  return printer.custo_aquisicao / printer.vida_util_horas;
}

export function calculatePrinterEnergyCost(
  printer: Pick<Printer, 'consumo_watts'> | null,
  tempoHoras: number,
  custoKwh: number,
) {
  if (!printer || tempoHoras <= 0 || custoKwh <= 0) {
    return 0;
  }

  return (printer.consumo_watts / 1000) * tempoHoras * custoKwh;
}

export function calculatePrinterAmortizationCost(
  printer: Pick<Printer, 'custo_aquisicao' | 'vida_util_horas'> | null,
  tempoHoras: number,
) {
  if (!printer || tempoHoras <= 0) {
    return 0;
  }

  return calculatePrinterHourlyCost(printer) * tempoHoras;
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
  const custoEnergia = calculatePrinterEnergyCost(printer, tempoHoras, custoKwh);
  const custoAmortizacao = calculatePrinterAmortizationCost(printer, tempoHoras);
  const subtotal = custoMaterial + custoEnergia + custoAmortizacao + additionalCost;
  const custoFalhas = subtotal * (falhaPercentual / 100);
  const custoTotal = subtotal + custoFalhas;

  return {
    custoMaterial,
    custoEnergia,
    custoHoraImpressora: calculatePrinterHourlyCost(printer),
    custoAmortizacao,
    custoFalhas,
    falhaPercentual,
    custoTotal,
  };
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
      label: 'Venda personalizada',
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
