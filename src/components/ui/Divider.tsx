import { cn } from '@/lib/utils';

export interface DividerProps {
  variant?: 'plain' | 'gold-flourish';
  className?: string;
}

export function Divider({ variant = 'plain', className }: DividerProps) {
  if (variant === 'gold-flourish') {
    return (
      <div className={cn('flex items-center justify-center gap-3', className)}>
        <span className="h-px w-10 bg-[hsl(var(--pb-gold-soft))]" />
        <span className="h-1.5 w-1.5 rotate-45 bg-[hsl(var(--pb-gold))]" />
        <span className="h-px w-10 bg-[hsl(var(--pb-gold-soft))]" />
      </div>
    );
  }
  return <hr className={cn('border-t border-[hsl(var(--pb-linen))]', className)} />;
}
