'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, Heart, User, Package, LogOut, LogIn } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Monogram } from '@/components/brand/Monogram';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/product';
import { useState } from 'react';
import { LOOKBOOK_ENABLED } from '@/lib/features';

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
}

const TOP_LINK = 'py-3 text-sm font-medium border-b border-[hsl(var(--pb-linen))]';

export function MobileNav({ open, onClose, categories }: MobileNavProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const { user, isLoggedIn, logout } = useCurrentUser();
  const pathname = usePathname();

  return (
    <Drawer open={open} onClose={onClose} side="right" title={<Monogram className="h-6 w-6 text-[hsl(var(--pb-rose))]" />}>
      <nav className="flex flex-col px-6 py-4">
        <Link
          href="/"
          onClick={onClose}
          className={cn(TOP_LINK, pathname === '/' ? 'text-[hsl(var(--pb-rose-deep))]' : 'text-[hsl(var(--pb-ink))]')}
        >
          Home
        </Link>
        {categories.map((cat) => {
          const hasChildren = !!cat.children && cat.children.length > 0;
          const isActive = pathname === `/category/${cat.slug}`;
          return (
            <div key={cat.id} className="border-b border-[hsl(var(--pb-linen))]">
              {hasChildren ? (
                <button
                  onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
                  className="flex w-full items-center justify-between py-3 text-left text-sm font-medium text-[hsl(var(--pb-ink))]"
                >
                  {cat.name}
                  <ChevronDown
                    className={`h-4 w-4 text-[hsl(var(--pb-ink-faint))] transition-transform duration-200 ${
                      expanded === cat.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              ) : (
                <Link
                  href={`/category/${cat.slug}`}
                  onClick={onClose}
                  className={cn(
                    'block py-3 text-sm font-medium',
                    isActive ? 'text-[hsl(var(--pb-rose-deep))]' : 'text-[hsl(var(--pb-ink))]'
                  )}
                >
                  {cat.name}
                </Link>
              )}
              {expanded === cat.id && hasChildren && (
                <div className="flex flex-col gap-1 pb-3 pl-4">
                  {cat.children!.map((child) => (
                    <Link
                      key={child.id}
                      href={`/category/${child.slug}`}
                      onClick={onClose}
                      className="py-1.5 text-sm text-[hsl(var(--pb-ink-muted))]"
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {LOOKBOOK_ENABLED && (
          <Link
            href="/lookbook"
            onClick={onClose}
            className={cn(TOP_LINK, pathname === '/lookbook' ? 'text-[hsl(var(--pb-rose-deep))]' : 'text-[hsl(var(--pb-ink))]')}
          >
            Lookbook
          </Link>
        )}
        <Link
          href="/about"
          onClick={onClose}
          className={cn(TOP_LINK, pathname === '/about' ? 'text-[hsl(var(--pb-rose-deep))]' : 'text-[hsl(var(--pb-ink))]')}
        >
          About
        </Link>

        <div className="mt-6 flex flex-col gap-1">
          {isLoggedIn && (
            <p className="truncate pb-1 text-xs text-[hsl(var(--pb-ink-faint))]">
              Signed in as {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email}
            </p>
          )}
          <Link href="/profile" onClick={onClose} className="flex items-center gap-3 py-2.5 text-sm text-[hsl(var(--pb-ink-muted))]">
            <User className="h-4 w-4" /> My Account
          </Link>
          <Link href="/wishlist" onClick={onClose} className="flex items-center gap-3 py-2.5 text-sm text-[hsl(var(--pb-ink-muted))]">
            <Heart className="h-4 w-4" /> Wishlist
          </Link>
          <Link href="/orders" onClick={onClose} className="flex items-center gap-3 py-2.5 text-sm text-[hsl(var(--pb-ink-muted))]">
            <Package className="h-4 w-4" /> Orders
          </Link>

          {/* The drawer is the whole account menu on small screens — the
              header pill has no room for one — so signing out has to be
              reachable from here. */}
          {isLoggedIn ? (
            <button
              onClick={() => {
                onClose();
                logout();
              }}
              className="flex items-center gap-3 py-2.5 text-left text-sm text-[hsl(var(--pb-rose-deep))]"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          ) : (
            <Link href="/login" onClick={onClose} className="flex items-center gap-3 py-2.5 text-sm text-[hsl(var(--pb-rose-deep))]">
              <LogIn className="h-4 w-4" /> Sign In
            </Link>
          )}
        </div>
      </nav>
    </Drawer>
  );
}
