import * as React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'sale' | 'new' | 'low-stock' | 'sold-out' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  sale: 'bg-[hsl(var(--pb-danger))] text-white',
  new: 'bg-[hsl(var(--pb-ink))] text-white',
  'low-stock': 'bg-[hsl(var(--pb-warning))] text-white',
  'sold-out': 'bg-[hsl(var(--pb-ink-faint))] text-white',
  neutral: 'bg-[hsl(var(--pb-shell))] text-[hsl(var(--pb-ink-muted))]',
};

export function Badge({ className, variant = 'neutral', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[2px] px-2 py-0.5 text-[0.6875rem] font-sans font-medium uppercase tracking-wide',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}
