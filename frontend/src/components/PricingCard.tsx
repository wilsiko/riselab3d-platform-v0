import type { ReactNode } from 'react';
import { AnimatedNumber } from './AnimatedNumber';

interface PricingCardProps {
  label: string;
  value: number;
  formatter: (value: number) => string;
  description?: string;
  tone?: 'default' | 'accent' | 'success' | 'warm';
  emphasize?: boolean;
  actionLabel?: string;
  actionAriaLabel?: string;
  onActionClick?: () => void;
  actionIcon?: ReactNode;
}

const toneMap: Record<NonNullable<PricingCardProps['tone']>, string> = {
  default: 'text-slate-100',
  accent: 'text-cyan-200',
  success: 'text-emerald-200',
  warm: 'text-amber-50',
};

export function PricingCard({
  label,
  value,
  formatter,
  description,
  tone = 'default',
  emphasize = false,
  actionLabel,
  actionAriaLabel,
  onActionClick,
  actionIcon,
}: PricingCardProps) {
  return (
    <article
      className={`rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(8,15,30,0.94))] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.24)] ${
        emphasize ? 'ring-1 ring-cyan-400/30' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">{label}</p>
        <div className="flex items-center gap-2">
          {onActionClick && (actionLabel || actionIcon) ? (
            <button
              type="button"
              onClick={onActionClick}
              aria-label={actionAriaLabel || actionLabel}
              className={`inline-flex items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/[0.08] text-cyan-200 transition hover:border-cyan-300/40 hover:bg-cyan-300/[0.12] focus:border-cyan-300/40 focus:bg-cyan-300/[0.12] focus:outline-none ${actionIcon ? 'h-7 w-7' : 'min-h-7 px-3 text-[11px] font-semibold uppercase tracking-[0.18em]'}`}
            >
              {actionIcon || actionLabel}
            </button>
          ) : null}
          {description ? (
            <div className="group relative shrink-0">
              <button
                type="button"
                aria-label={`Ajuda sobre ${label}`}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-xs font-semibold text-slate-300 transition hover:border-cyan-400/35 hover:bg-cyan-400/[0.08] hover:text-cyan-200 focus:border-cyan-400/35 focus:bg-cyan-400/[0.08] focus:text-cyan-200 focus:outline-none"
              >
                ?
              </button>
              <div className="pricing-help-popover pointer-events-none absolute right-0 top-[calc(100%+10px)] z-20 w-72 rounded-2xl p-4 text-left text-sm leading-6 opacity-0 transition duration-150 group-hover:opacity-100 group-focus-within:opacity-100">
                <p className="pricing-help-title text-[11px] font-semibold uppercase tracking-[0.2em]">Como calculamos</p>
                <p className="mt-2 whitespace-pre-line">{description}</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <AnimatedNumber
        value={value}
        format={formatter}
        className={`mt-4 block text-3xl font-semibold tracking-[-0.04em] ${toneMap[tone]}`}
      />
    </article>
  );
}