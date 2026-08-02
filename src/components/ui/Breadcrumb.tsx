import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumb({ items, className }: { items: BreadcrumbItem[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center flex-wrap gap-1.5 text-xs', className)}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-[hsl(var(--pb-ink-muted))] hover:text-[hsl(var(--pb-rose-deep))] transition-colors duration-150"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-[hsl(var(--pb-ink))]' : 'text-[hsl(var(--pb-ink-muted))]'}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight className="h-3 w-3 text-[hsl(var(--pb-ink-faint))]" />}
          </span>
        );
      })}
    </nav>
  );
}
