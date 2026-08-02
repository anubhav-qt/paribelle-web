'use client';

import * as React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, id, ...props }, ref) => {
    const generatedId = React.useId();
    const checkboxId = id || generatedId;

    return (
      <label htmlFor={checkboxId} className="inline-flex items-center gap-2.5 cursor-pointer select-none">
        <span className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className="peer absolute inset-0 h-4 w-4 cursor-pointer appearance-none rounded-[2px] border border-[hsl(var(--pb-linen))] bg-transparent checked:bg-[hsl(var(--pb-rose))] checked:border-[hsl(var(--pb-rose))] transition-colors duration-150 ease-pb"
            {...props}
          />
          <Check className="pointer-events-none absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100" />
        </span>
        {label && <span className="text-sm text-[hsl(var(--pb-ink))]">{label}</span>}
      </label>
    );
  }
);
Checkbox.displayName = 'Checkbox';

export { Checkbox };
