interface NumericInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  prefix?: string;
  suffix?: string;
  hint?: string;
  placeholder?: string;
  step?: string;
  min?: string;
}

export function NumericInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  hint,
  placeholder,
  step = '0.01',
  min = '0',
}: NumericInputProps) {
  return (
    <label className="block rounded-[28px] border border-white/10 bg-[#0a1228]/85 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-medium text-slate-200">{label}</span>
        {hint ? <span className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{hint}</span> : null}
      </div>

      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 focus-within:border-cyan-400/40 focus-within:bg-cyan-400/[0.05]">
        {prefix ? <span className="text-sm font-semibold text-cyan-200">{prefix}</span> : null}
        <input
          type="number"
          inputMode="decimal"
          step={step}
          min={min}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full border-0 bg-transparent p-0 text-base font-semibold text-white outline-none placeholder:text-slate-500"
        />
        {suffix ? <span className="text-sm font-semibold text-slate-400">{suffix}</span> : null}
      </div>
    </label>
  );
}