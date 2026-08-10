'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const radioId = id || generatedId;

    return (
      <label htmlFor={radioId} className="flex items-center gap-2.5 cursor-pointer select-none">
        <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            className="peer absolute inset-0 h-4 w-4 cursor-pointer appearance-none rounded-full border border-[hsl(var(--pb-linen))] bg-transparent checked:border-[hsl(var(--pb-rose))] transition-colors duration-150 ease-pb"
            {...props}
          />
          <span className="pointer-events-none absolute h-2 w-2 rounded-full bg-[hsl(var(--pb-rose))] opacity-0 peer-checked:opacity-100 transition-opacity duration-150 ease-pb" />
        </span>
        {label && <span className="text-sm text-[hsl(var(--pb-ink))]">{label}</span>}
      </label>
    );
  }
);
Radio.displayName = 'Radio';

export { Radio };
