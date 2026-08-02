'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'gold-outline' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[hsl(var(--pb-rose))] text-white hover:bg-[hsl(var(--pb-rose-deep))] disabled:hover:bg-[hsl(var(--pb-rose))]',
  secondary:
    'bg-[hsl(var(--pb-ink))] text-white hover:bg-[hsl(var(--pb-ink)/0.85)]',
  ghost:
    'bg-transparent text-[hsl(var(--pb-ink))] hover:bg-[hsl(var(--pb-shell))]',
  'gold-outline':
    'bg-transparent text-[hsl(var(--pb-ink))] border border-[hsl(var(--pb-gold))] hover:bg-[hsl(var(--pb-gold-soft)/0.25)]',
  danger:
    'bg-[hsl(var(--pb-danger))] text-white hover:bg-[hsl(var(--pb-danger)/0.85)]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-xs',
  md: 'h-11 px-6 text-sm',
  lg: 'h-14 px-9 text-sm',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-sans font-medium tracking-wide',
          'transition-colors duration-150 ease-pb',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--pb-rose))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--pb-ivory))]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button };
