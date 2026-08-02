'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Package, Heart, MapPin, FileText, Gift, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: LayoutGrid },
  { href: '/orders', label: 'Orders', icon: Package },
  { href: '/wishlist', label: 'Wishlist', icon: Heart },
  { href: '/profile', label: 'Addresses', icon: MapPin },
  { href: '/dashboard/invoices', label: 'Invoices', icon: FileText },
  { href: '/dashboard#referrals', label: 'Referrals', icon: Gift },
  { href: '/profile', label: 'Profile', icon: User },
];

export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <div className="flex flex-col gap-10 md:flex-row">
        <aside className="shrink-0 md:w-56">
          <nav className="flex gap-1 overflow-x-auto md:sticky md:top-24 md:flex-col md:overflow-visible">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = pathname === href.split('#')[0];
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
