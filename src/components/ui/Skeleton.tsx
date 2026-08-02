import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-sm bg-[hsl(var(--pb-shell))]',
        'before:absolute before:inset-0 before:-translate-x-full before:animate-[pb-shimmer_1.6s_infinite] before:bg-gradient-to-r before:from-transparent before:via-[hsl(var(--pb-linen)/0.6)] before:to-transparent',
        className
      )}
    />
  );
}
