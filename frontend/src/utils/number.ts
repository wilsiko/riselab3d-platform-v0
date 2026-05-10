export function parseLocaleNumber(value: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return 0;
  }

  const sanitizedValue = normalizedValue.includes(',')
    ? normalizedValue.replace(/\./g, '').replace(',', '.')
    : normalizedValue;

  const parsedValue = Number(sanitizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}