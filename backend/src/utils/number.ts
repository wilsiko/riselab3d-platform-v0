export function parseDecimalValue(value: unknown) {
  const stringValue = String(value ?? '').trim();

  if (!stringValue) {
    return Number.NaN;
  }

  const normalizedValue = stringValue.includes(',')
    ? stringValue.replace(/\./g, '').replace(',', '.')
    : stringValue;

  return Number(normalizedValue);
}