'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: React.ReactNode;
  disabled?: boolean;
  id?: string;
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, label, disabled, id }, ref) => {
    return (
      <label htmlFor={id} className="inline-flex items-center gap-2.5 cursor-pointer select-none">
        <button
          ref={ref}
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          disabled={disabled}
          onClick={() => onCheckedChange(!checked)}
          className={cn(
            'relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 ease-pb disabled:opacity-50 disabled:cursor-not-allowed',
            checked ? 'bg-[hsl(var(--pb-rose))]' : 'bg-[hsl(var(--pb-linen))]'
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-pb-sm transition-transform duration-150 ease-pb',
              checked && 'translate-x-4'
            )}
          />
        </button>
        {label && <span className="text-sm text-[hsl(var(--pb-ink))]">{label}</span>}
      </label>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };
