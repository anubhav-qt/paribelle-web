'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

/**
 * Compensates for the header no longer reserving layout space (see Header.tsx —
 * it's `fixed`, so the floating pill never pushes content down). The homepage
 * wants that: the scrapbook hero should run edge-to-edge with the nav floating
 * over it from the first frame. Every other page still needs its own top
 * content clear of the pill, so this adds the equivalent breathing room there.
 */
export function PageShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  // Matches the header's actual rendered height (61px, constant across
  // breakpoints — its own padding doesn't change at `md`). The old
  // `pt-20 md:pt-24` (80px / 96px) overshot it by 19–35px, leaving a bare
  // white strip between the header and every non-home page's content.
  return <div className={cn(!isHome && 'pt-[61px]')}>{children}</div>;
}
