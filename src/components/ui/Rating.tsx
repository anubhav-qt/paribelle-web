import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RatingProps {
  value: number;
  count?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

const sizeClasses = { sm: 'h-3 w-3', md: 'h-4 w-4', lg: 'h-5 w-5' };
const textSizes = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' };

export function Rating({ value, count, size = 'md', showValue = true, className }: RatingProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const fill = Math.min(Math.max(value - i, 0), 1) * 100;
          return (
            <div key={i} className="relative">
              <Star className={cn(sizeClasses[size], 'text-[hsl(var(--pb-linen))]')} />
              <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill}%` }}>
                <Star className={cn(sizeClasses[size], 'fill-[hsl(var(--pb-gold))] text-[hsl(var(--pb-gold))]')} />
              </div>
            </div>
          );
        })}
      </div>
      {showValue && (
        <span className={cn(textSizes[size], 'font-medium text-[hsl(var(--pb-ink))]')}>{value.toFixed(1)}</span>
      )}
      {count !== undefined && (
        <span className={cn(textSizes[size], 'text-[hsl(var(--pb-ink-faint))]')}>({count})</span>
      )}
    </div>
  );
}
