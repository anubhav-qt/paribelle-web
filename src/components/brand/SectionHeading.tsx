import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Divider } from '@/components/ui/Divider';

export interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  viewAllHref?: string;
  viewAllLabel?: string;
  align?: 'left' | 'center';
  showRule?: boolean;
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  viewAllHref,
  viewAllLabel = 'View all',
  align = 'left',
  showRule = false,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex items-end justify-between gap-4',
        align === 'center' && 'flex-col items-center text-center',
        className
      )}
    >
      <div className={cn(align === 'center' && 'flex flex-col items-center')}>
        {eyebrow && (
          <p className="text-eyebrow mb-2 text-[hsl(var(--pb-rose-deep))]">{eyebrow}</p>
        )}
        <h2 className="text-display-lg text-[hsl(var(--pb-ink))]">{title}</h2>
        {showRule && <Divider variant="gold-flourish" className="mt-3" />}
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="group flex shrink-0 items-center gap-1.5 text-sm font-medium text-[hsl(var(--pb-rose-deep))] hover:text-[hsl(var(--pb-ink))] transition-colors duration-150"
        >
          {viewAllLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 ease-pb group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
