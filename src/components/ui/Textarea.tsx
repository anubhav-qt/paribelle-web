'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, placeholder, rows = 4, ...props }, ref) => {
    const generatedId = React.useId();
    const areaId = id || generatedId;

    return (
      <div className="w-full">
        <div className="relative">
          <textarea
            ref={ref}
            id={areaId}
            rows={rows}
            placeholder={label ? ' ' : placeholder}
            className={cn(
              'peer w-full rounded-sm border bg-transparent px-3.5 pt-5 pb-2 text-sm font-sans text-[hsl(var(--pb-ink))]',
              'border-[hsl(var(--pb-linen))] transition-colors duration-150 ease-pb resize-y',
              'focus:outline-none focus:border-[hsl(var(--pb-rose))]',
              error && 'border-[hsl(var(--pb-danger))]',
              !label && 'pt-3.5',
              className
            )}
            {...props}
          />
          {label && (
            <label
              htmlFor={areaId}
              className={cn(
                'pointer-events-none absolute left-3.5 top-3.5 text-sm text-[hsl(var(--pb-ink-faint))] transition-all duration-150 ease-pb',
                'peer-focus:top-1.5 peer-focus:text-[0.6875rem] peer-focus:text-[hsl(var(--pb-rose-deep))]',
                'peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[0.6875rem]'
              )}
            >
              {label}
            </label>
          )}
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-[hsl(var(--pb-danger))]">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-[hsl(var(--pb-ink-faint))]">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';

export { Textarea };
