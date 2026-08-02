import { cn } from '@/lib/utils';
import { Monogram } from '@/components/brand/Monogram';

const sizeClasses = {
  sm: 'h-6 w-6',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
} as const;

/**
 * Brand loading indicator — the PariBelle monogram, pulsing rather than
 * spinning fast, since a detailed mark reads better slow. Respects
 * prefers-reduced-motion by holding a static, slightly faded mark instead.
 */
export function Loader({
  size = 'md',
  className,
}: {
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  return (
    <Monogram
      className={cn(
        sizeClasses[size],
        'text-primary animate-pulse motion-reduce:animate-none motion-reduce:opacity-60',
        className
      )}
    />
  );
}
