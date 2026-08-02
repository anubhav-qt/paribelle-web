'use client';

import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-xs text-[hsl(var(--pb-ink-muted))]">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full appearance-none rounded-sm border bg-transparent px-3.5 py-3 pr-9 text-sm font-sans text-[hsl(var(--pb-ink))]',
              'border-[hsl(var(--pb-linen))] transition-colors duration-150 ease-pb',
              'focus:outline-none focus:border-[hsl(var(--pb-rose))]',
              error && 'border-[hsl(var(--pb-danger))]',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--pb-ink-faint))]" />
        </div>
        {error && <p className="mt-1.5 text-xs text-[hsl(var(--pb-danger))]">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };
