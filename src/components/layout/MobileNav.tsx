'use client';

import Link from 'next/link';
import { ChevronDown, Heart, User, Package } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Monogram } from '@/components/brand/Monogram';
import type { Category } from '@/types/product';
import { useState } from 'react';

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
}

export function MobileNav({ open, onClose, categories }: MobileNavProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Drawer open={open} onClose={onClose} side="right" title={<Monogram className="h-6 w-6 text-[hsl(var(--pb-rose))]" />}>
      <nav className="flex flex-col px-6 py-4">
        <Link href="/category/new-in" onClick={onClose} className="py-3 text-sm font-medium text-[hsl(var(--pb-ink))] border-b border-[hsl(var(--pb-linen))]">
          New In
        </Link>
        {categories.map((cat) => {
          const hasChildren = !!cat.children && cat.children.length > 0;
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
                  className="block py-3 text-sm font-medium text-[hsl(var(--pb-ink))]"
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
        <Link href="/lookbook" onClick={onClose} className="py-3 text-sm font-medium text-[hsl(var(--pb-ink))] border-b border-[hsl(var(--pb-linen))]">
          Lookbook
        </Link>
        <Link href="/about" onClick={onClose} className="py-3 text-sm font-medium text-[hsl(var(--pb-ink))] border-b border-[hsl(var(--pb-linen))]">
          About
        </Link>

        <div className="mt-6 flex flex-col gap-1">
          <Link href="/profile" onClick={onClose} className="flex items-center gap-3 py-2.5 text-sm text-[hsl(var(--pb-ink-muted))]">
            <User className="h-4 w-4" /> My Account
          </Link>
          <Link href="/wishlist" onClick={onClose} className="flex items-center gap-3 py-2.5 text-sm text-[hsl(var(--pb-ink-muted))]">
            <Heart className="h-4 w-4" /> Wishlist
          </Link>
          <Link href="/orders" onClick={onClose} className="flex items-center gap-3 py-2.5 text-sm text-[hsl(var(--pb-ink-muted))]">
            <Package className="h-4 w-4" /> Orders
          </Link>
        </div>
      </nav>
    </Drawer>
  );
}
