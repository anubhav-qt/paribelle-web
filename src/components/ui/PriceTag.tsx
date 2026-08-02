import { formatPrice } from '@/lib/currency';
import { cn } from '@/lib/utils';

export interface PriceTagProps {
  price: number | string;
  compareAtPrice?: number | string | null;
  currency?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'font-display text-2xl',
};

export function PriceTag({ price, compareAtPrice, currency = 'INR', size = 'md', className }: PriceTagProps) {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  const numCompare =
    compareAtPrice != null ? (typeof compareAtPrice === 'string' ? parseFloat(compareAtPrice) : compareAtPrice) : null;
  const hasDiscount = numCompare != null && numCompare > numPrice;
  const discountPct = hasDiscount ? Math.round(((numCompare! - numPrice) / numCompare!) * 100) : 0;

  return (
    <div className={cn('flex items-baseline gap-2', className)}>
      <span className={cn('font-medium text-[hsl(var(--pb-ink))]', sizeClasses[size])}>
        {formatPrice(numPrice, currency)}
      </span>
      {hasDiscount && (
        <>
          <span className="text-sm text-[hsl(var(--pb-ink-faint))] line-through">
            {formatPrice(numCompare!, currency)}
          </span>
          <span className="text-xs font-medium text-[hsl(var(--pb-danger))]">{discountPct}% off</span>
        </>
      )}
    </div>
  );
}
