import { useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  value: number;
  format: (value: number) => string;
  duration?: number;
  className?: string;
}

export function AnimatedNumber({ value, format, duration = 320, className }: AnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValueRef = useRef(value);

  useEffect(() => {
    const startValue = previousValueRef.current;

    if (!Number.isFinite(value) || Math.abs(value - startValue) < 0.005) {
      setDisplayValue(value);
      previousValueRef.current = value;
      return;
    }

    let animationFrame = 0;
    const startedAt = performance.now();

    const animate = (currentTime: number) => {
      const progress = Math.min((currentTime - startedAt) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const nextValue = startValue + (value - startValue) * easedProgress;

      setDisplayValue(nextValue);

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animate);
        return;
      }

      previousValueRef.current = value;
    };

    animationFrame = window.requestAnimationFrame(animate);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [duration, value]);

  return <span className={className}>{format(displayValue)}</span>;
}