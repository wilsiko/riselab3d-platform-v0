import { Printer, Filament } from '@prisma/client';

export interface ValidationError {
  field: string;
  message: string;
}

export function normalizeSku(nome: string, cor: string, variacao: string) {
  return `${nome.trim().replace(/\s+/g, '_')}_${cor.trim().replace(/\s+/g, '_')}_${variacao.trim().replace(/\s+/g, '_')}`;
}

export function validateProductData(
  pesoGramas: number,
  tempoHoras: number,
  printer: Printer,
  filament: Filament,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (pesoGramas <= 0) errors.push({ field: 'peso_gramas', message: 'Peso deve ser maior que 0' });
  if (pesoGramas > 10000) errors.push({ field: 'peso_gramas', message: 'Peso não pode exceder 10kg' });
  if (tempoHoras <= 0) errors.push({ field: 'tempo_impressao_horas', message: 'Tempo deve ser maior que 0' });
  if (tempoHoras > 1000) errors.push({ field: 'tempo_impressao_horas', message: 'Tempo não pode exceder 1000h' });
  if (printer.consumo_watts <= 0) errors.push({ field: 'printer', message: 'Impressora com consumo inválido' });
  if (printer.vida_util_horas <= 0) errors.push({ field: 'printer', message: 'Impressora com vida útil inválida' });
  if (filament.custo_por_kg <= 0) errors.push({ field: 'filament', message: 'Filamento com custo inválido' });

  return errors;
}

export function calculateProductCosts(
  pesoGramas: number,
  tempoHoras: number,
  printer: Printer,
  filament: Filament,
  custoKwh: number,
  additionalCost = 0,
) {
  const custoMaterial = (pesoGramas / 1000) * filament.custo_por_kg;
  const custoEnergia = (printer.consumo_watts / 1000) * tempoHoras * custoKwh;
  const custoAmortizacao = (printer.custo_aquisicao / printer.vida_util_horas) * tempoHoras;
  const custoTotal = custoMaterial + custoEnergia + custoAmortizacao + additionalCost;

  return {
    custoMaterial,
    custoEnergia,
    custoAmortizacao,
    custoTotal,
  };
}
