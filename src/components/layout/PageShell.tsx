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

  return <div className={cn(!isHome && 'pt-20 md:pt-24')}>{children}</div>;
}
