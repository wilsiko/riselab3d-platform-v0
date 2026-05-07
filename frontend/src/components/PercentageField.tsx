import { NumericInput } from './NumericInput';

interface PercentageFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}

export function PercentageField({ label, value, onChange, hint }: PercentageFieldProps) {
  return <NumericInput label={label} value={value} onChange={onChange} suffix="%" step="0.1" min="0" hint={hint} />;
}