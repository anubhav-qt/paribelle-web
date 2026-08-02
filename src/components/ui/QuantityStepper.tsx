'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
}

export function QuantityStepper({ value, onChange, min = 1, max = 99, className }: QuantityStepperProps) {
  return (
    <div className={cn('inline-flex items-center border border-[hsl(var(--pb-linen))] rounded-sm', className)}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className="flex h-9 w-9 items-center justify-center text-[hsl(var(--pb-ink-muted))] hover:bg-[hsl(var(--pb-shell))] disabled:opacity-40 transition-colors duration-150"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <span className="w-8 text-center text-sm font-medium text-[hsl(var(--pb-ink))]" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
        className="flex h-9 w-9 items-center justify-center text-[hsl(var(--pb-ink-muted))] hover:bg-[hsl(var(--pb-shell))] disabled:opacity-40 transition-colors duration-150"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
