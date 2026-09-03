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
    // flex-wrap, not nowrap: on a narrow product card the price, the
    // struck-through compare price and the discount label don't all fit
    // on one line — without wrap they used to overflow the card's own
    // width and bleed into whatever sat next to it, rather than dropping
    // "50% off" to a second line the way this now does. whitespace-nowrap
    // on each span keeps the wrap between them, not inside a number.
    <div className={cn('flex flex-wrap items-baseline gap-x-2 gap-y-0.5', className)}>
      <span className={cn('whitespace-nowrap font-medium text-[hsl(var(--pb-ink))]', sizeClasses[size])}>
        {formatPrice(numPrice, currency)}
      </span>
      {hasDiscount && (
        <>
          <span className="whitespace-nowrap text-sm text-[hsl(var(--pb-ink-faint))] line-through">
            {formatPrice(numCompare!, currency)}
          </span>
          <span className="whitespace-nowrap text-xs font-medium text-[hsl(var(--pb-danger))]">
            {discountPct}% off
          </span>
        </>
      )}
    </div>
  );
}
