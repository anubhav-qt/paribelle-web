'use client';

import * as React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/image-url';
import { Badge, BadgeVariant } from '@/components/ui/Badge';

export interface ProductCardShellProps {
  href: string;
  name: string;
  image: string;
  secondImage?: string;
  badges?: Array<{ label: string; variant: BadgeVariant }>;
  wishlisted?: boolean;
  onToggleWishlist?: (e: React.MouseEvent) => void;
  quickViewLabel?: string;
  onQuickView?: (e: React.MouseEvent) => void;
  children: React.ReactNode;
}

/**
 * Shared visual chassis for every product card variant (physical, booking, tour):
 * 4:5 portrait image, second-image cross-fade on hover, wishlist heart, badges,
 * and a quick-view bar that slides up on desktop hover.
 */
export function ProductCardShell({
  href,
  name,
  image,
  secondImage,
  badges = [],
  wishlisted,
  onToggleWishlist,
  quickViewLabel = 'Quick View',
  onQuickView,
  children,
}: ProductCardShellProps) {
  return (
    <Link href={href} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-[hsl(var(--pb-shell))] rounded-sm">
        <img
          src={getImageUrl(image)}
          alt={name}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-pb',
            secondImage && 'group-hover:opacity-0'
          )}
        />
        {secondImage && (
          <img
            src={getImageUrl(secondImage)}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-700 ease-pb group-hover:opacity-100"
          />
        )}

        {badges.length > 0 && (
          <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
            {badges.map((b) => (
              <Badge key={b.label} variant={b.variant}>
                {b.label}
              </Badge>
            ))}
          </div>
        )}

        {onToggleWishlist && (
          <button
            onClick={onToggleWishlist}
            aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={wishlisted}
            className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-[hsl(var(--pb-ivory)/0.9)] backdrop-blur-sm transition-transform duration-150 hover:scale-110"
          >
            <Heart
              className={cn(
                'h-4 w-4 transition-colors duration-150',
                wishlisted ? 'fill-[hsl(var(--pb-rose))] text-[hsl(var(--pb-rose))]' : 'text-[hsl(var(--pb-ink-muted))]'
              )}
            />
          </button>
        )}

        {onQuickView && (
          <button
            onClick={onQuickView}
            className="absolute inset-x-0 bottom-0 hidden translate-y-full bg-[hsl(var(--pb-ink)/0.9)] py-2.5 text-xs font-medium uppercase tracking-wide text-white transition-transform duration-300 ease-pb group-hover:translate-y-0 md:block"
          >
            {quickViewLabel}
          </button>
        )}
      </div>
      <div className="pt-3">{children}</div>
    </Link>
  );
}
