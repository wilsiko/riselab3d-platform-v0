const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

export type NumberInputValue = number | '';

export function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

export function parseNumberInputValue(value: string): NumberInputValue {
  if (value === '') {
    return '';
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : '';
}

export function parseDecimalInput(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return Number.NaN;
  }

  const normalizedValue = trimmedValue.includes(',')
    ? trimmedValue.replace(/\./g, '').replace(',', '.')
    : trimmedValue;

  return Number(normalizedValue);
}

export function formatDecimalInput(value: number, fractionDigits = 2) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}