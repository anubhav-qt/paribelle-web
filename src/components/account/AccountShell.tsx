'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Package, Heart, FileText, User, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

// Every href here must be unique — `active` below matches by exact pathname,
// and two entries sharing a target (as Addresses/Profile and the dead
// `#referrals` anchor used to) both light up whenever either is current.
const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutGrid },
  { href: '/orders', label: 'Orders', icon: Package },
  { href: '/wallet', label: 'Wallet', icon: Wallet },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/dashboard/invoices', label: 'Invoices', icon: FileText },
  { href: '/profile', label: 'Profile', icon: User },
];

export interface AccountShellProps {
  children: React.ReactNode;
  // Every account page shares this shell's width except Wishlist, whose
  // product grid wants the same five-up column count as the rest of the
  // storefront — cramped at the default width once the nav rail eats into
  // it. Opt-in and defaulted off so no other account page shifts.
  wide?: boolean;
}

export function AccountShell({ children, wide }: AccountShellProps) {
  const pathname = usePathname();

  return (
    <div className={cn('mx-auto px-4 py-8 md:px-8', wide ? 'max-w-[1600px]' : 'max-w-7xl')}>
      <div className="flex flex-col gap-10 md:flex-row">
        <aside className="shrink-0 md:w-56">
          <nav className="flex gap-1 overflow-x-auto md:sticky md:top-24 md:flex-col md:overflow-visible">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={label}
                  href={href}
                  className={cn(
                    'flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-sm px-3 py-2.5 text-sm transition-colors duration-150',
                    active
                      ? 'bg-[hsl(var(--pb-blush-wash))] font-medium text-[hsl(var(--pb-rose-deep))]'
                      : 'text-[hsl(var(--pb-ink-muted))] hover:bg-[hsl(var(--pb-shell))]'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
