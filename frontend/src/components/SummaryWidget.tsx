interface SummaryWidgetProps {
  label: string;
  value: string;
  description: string;
}

export function SummaryWidget({ label, value, description }: SummaryWidgetProps) {
  return (
    <article className="rounded-[26px] border border-white/10 bg-[#0a1228]/78 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.18)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-3 text-xl font-semibold tracking-[-0.03em] text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </article>
  );
}