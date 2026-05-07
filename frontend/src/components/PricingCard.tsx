import { AnimatedNumber } from './AnimatedNumber';

interface PricingCardProps {
  label: string;
  value: number;
  formatter: (value: number) => string;
  description: string;
  tone?: 'default' | 'accent' | 'success' | 'warm';
  emphasize?: boolean;
}

const toneMap: Record<NonNullable<PricingCardProps['tone']>, string> = {
  default: 'text-slate-100',
  accent: 'text-cyan-200',
  success: 'text-emerald-200',
  warm: 'text-amber-50',
};

export function PricingCard({ label, value, formatter, description, tone = 'default', emphasize = false }: PricingCardProps) {
  return (
    <article
      className={`rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(8,15,30,0.94))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] ${
        emphasize ? 'ring-1 ring-cyan-400/30' : ''
      }`}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
      <AnimatedNumber
        value={value}
        format={formatter}
        className={`mt-4 block text-3xl font-semibold tracking-[-0.04em] ${toneMap[tone]}`}
      />
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
    </article>
  );
}