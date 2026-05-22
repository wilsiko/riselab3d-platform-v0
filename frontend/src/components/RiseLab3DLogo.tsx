interface RiseLab3DLogoProps {
  variant?: 'full' | 'compact' | 'header';
  className?: string;
}

interface RiseLab3DBrandLockupProps {
  className?: string;
  textClassName?: string;
}

export function RiseLab3DBrandLockup({ className = '', textClassName = '' }: RiseLab3DBrandLockupProps) {
  const rootClassName = className ? `riselab-brand-lockup ${className}` : 'riselab-brand-lockup';
  const labelClassName = textClassName ? `riselab-brand-wordmark ${textClassName}` : 'riselab-brand-wordmark';

  return (
    <span className={rootClassName}>
      <RiseLab3DLogo variant="compact" className="riselab-brand-icon" />
      <span className={labelClassName} aria-hidden="true">
        <span className="riselab-brand-wordmark-main">RiseLab</span>
        <span className="riselab-brand-wordmark-accent">3D</span>
      </span>
    </span>
  );
}

export function RiseLab3DLogo({ variant = 'full', className = '' }: RiseLab3DLogoProps) {
  const rootClassName = className ? `riselab-logo ${className}` : 'riselab-logo';

  if (variant === 'header') {
    return (
      <svg viewBox="0 0 360 92" role="img" aria-label="RiseLab3D" className={rootClassName}>
        <g fill="none" fillRule="evenodd">
          <path d="M16 18h52c24 0 38 13 38 35 0 12-5 22-14 29l28 24H86L60 82H42l27-22H40L16 36h54c9 0 15-6 15-13s-6-13-15-13H42L16 18Z" fill="#111111" transform="translate(4 -6) scale(.74)" />
          <path d="M118 28h26c13 0 22 8 22 18s-9 18-22 18h-33l10-10h20c5 0 8-3 8-7s-3-7-8-7h-28l5-12Z" fill="#2563EB" transform="translate(-12 2) scale(.78)" />
          <path d="M168 28h28c21 0 36 15 36 34s-15 34-36 34h-28l10-12h15c11 0 19-9 19-22s-8-22-19-22h-25V28Z" fill="#2563EB" transform="translate(-14 2) scale(.78)" />
          <text x="106" y="63" fill="#111111" fontFamily="Inter, Arial, sans-serif" fontSize="28" fontWeight="500" letterSpacing="4">RiseLab</text>
          <text x="264" y="63" fill="#2563EB" fontFamily="Inter, Arial, sans-serif" fontSize="28" fontWeight="600" letterSpacing="0.5">3D</text>
        </g>
      </svg>
    );
  }

  if (variant === 'compact') {
    return (
      <svg viewBox="0 0 220 72" role="img" aria-label="RiseLab3D" className={rootClassName}>
        <g fill="none" fillRule="evenodd">
          <path d="M16 12h34c16 0 26 9 26 24 0 9-4 16-10 20l18 16H62L45 56H33l19-16H32l-16-16h35c6 0 10-4 10-9s-4-9-10-9H32L16 12Z" fill="#111111" transform="translate(2 -2) scale(.82)" />
          <path d="M118 22h19c10 0 17 6 17 14s-7 14-17 14h-24l7-8h15c3 0 5-2 5-5s-2-5-5-5h-21l4-10Z" fill="#2563EB" transform="translate(-18 1) scale(.84)" />
          <path d="M157 22h20c15 0 26 11 26 25s-11 25-26 25h-20l7-9h11c9 0 15-7 15-16s-6-16-15-16h-18v-9Z" fill="#2563EB" transform="translate(-22 1) scale(.84)" />
        </g>
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 640 180" role="img" aria-label="RiseLab3D Imprima ideias. Realize solucoes." className={rootClassName}>
      <g fill="none" fillRule="evenodd">
        <path d="M104 28h86c39 0 63 22 63 58 0 20-8 37-23 48l47 42h-55l-45-42h-30l48-40h-40l-40-40h88c14 0 24-10 24-22s-10-22-24-22h-47l-16-18Z" fill="#111111" />
        <path d="M323 72h48c25 0 42 15 42 35s-17 35-42 35h-61l18-20h38c8 0 14-5 14-12s-6-12-14-12h-53l10-26Z" fill="#2563EB" />
        <path d="M414 72h51c39 0 67 28 67 63s-28 63-67 63h-51l18-22h28c22 0 37-17 37-41s-15-41-37-41h-46V72Z" fill="#2563EB" />
        <text x="28" y="156" fill="#111111" fontFamily="Inter, Arial, sans-serif" fontSize="56" fontWeight="500" letterSpacing="10">RiseLab</text>
        <text x="404" y="156" fill="#2563EB" fontFamily="Inter, Arial, sans-serif" fontSize="56" fontWeight="600" letterSpacing="2">3D</text>
        <text x="32" y="178" fill="#4B5563" fontFamily="Inter, Arial, sans-serif" fontSize="15" fontWeight="500" letterSpacing="8">IMPRIMA IDEIAS. REALIZE SOLUCOES.</text>
      </g>
    </svg>
  );
}