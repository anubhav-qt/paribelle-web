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
  // Which paper reads correctly against the section behind it. Ivory and
  // white sit close enough in lightness that a white card all but
  // disappears on an ivory page — 'light' (the default, since most listing
  // pages are ivory) gives the card a faint blush tint so it still separates
  // from that ground; 'tinted' is for the (rarer) blush-wash panels, where
  // plain white is what pops instead. Callers pass this, rather than the
  // card guessing from its own DOM position, because the section already
  // knows its own background — inferring it here would mean walking
  // ancestors at render time for something the caller can just state.
  sectionBg?: 'light' | 'tinted';
  children: React.ReactNode;
}

/**
 * Shared visual chassis for every product card: an instant photo, not a
 * catalogue tile. The print is a plain, unobstructed window onto the
 * garment — no badge, no heart, nothing painted over the photograph beyond
 * a small thread-and-pin ornament at one top corner — and every piece of
 * information lives in the paper margin beneath it, the way a caption sits
 * under a real Polaroid.
 *
 * Each card carries a faint, permanent tilt (alternating by grid position
 * via nth-child in globals.css, not random, so server and client render
 * identically) as if a stack of prints had been fanned across a table.
 * Every other card mirrors the whole arrangement — tilt direction, pivot
 * corner and the pin itself — to the opposite side, so a row reads as
 * genuinely alternating rather than one corner repeated with a wobble.
 * This component only ever renders the top-right case; globals.css mirrors
 * it to top-left for even cards. Hovering or focusing straightens the
 * print and lifts it toward the viewer while the photo itself keeps
 * drifting into a slow, independent zoom underneath — two layers of motion
 * reading as "picked up" rather than one flat scale.
 */
export function ProductCardShell({
  href,
  name,
  image,
  secondImage,
  badges = [],
  wishlisted,
  onToggleWishlist,
  sectionBg = 'light',
  children,
}: ProductCardShellProps) {
  return (
    <Link
      href={href}
      className={cn(
        // pb-polaroid-tilt (globals.css) owns the resting tilt and the
        // hover/focus straighten-and-lift transform entirely — see the
        // comment there for why that can't be split across Tailwind's
        // transform utilities too.
        // Top, left and right margins match (p-4) so the pin sits in a
        // frame whose photo perspective genuinely reads as bordered evenly
        // on three sides, the way a real Polaroid's mat is — only the
        // bottom (pb-3.5) is intentionally its own, smaller value, since
        // the caption area below adds its own spacing on top of it.
        'pb-polaroid-tilt group relative block p-4 pb-3.5 will-change-transform',
        sectionBg === 'tinted' ? 'bg-white' : 'bg-[hsl(var(--pb-blush-wash))]',
        'shadow-pb-sm hover:shadow-pb-lg focus-visible:shadow-pb-lg focus-visible:outline-none'
      )}
    >
      {/* The thread and eyelet, drawn as one SVG so they connect by
          construction — the thread's path literally starts on the ring's
          own circumference, in the same coordinate space, rather than
          being two independently-nudged elements that have to be eyeballed
          into alignment. Sits in the card's paper margin, above the photo,
          poking a little past the card's own top and right edges — not
          painted on the photo itself. The ring's fill matches this card's
          own background (white or blush) so it reads as a hole punched
          through the paper, not a mismatched dot sitting on top of it.
          `.pb-pin` is mirrored to the top-left for every other card via a
          plain CSS rule (globals.css) keyed off the same nth-child parity
          that alternates which corner the tilt itself pivots from — so
          this markup only ever has to describe the right-pivot case. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 36 36"
        className="pb-pin pointer-events-none absolute right-[2px] top-[-22px] z-20 h-9 w-9 overflow-visible"
      >
        <path
          d="M26 26 C 19 19, 22 8, 31 7 C 38 6, 43 11, 39 17"
          fill="none"
          stroke="hsl(var(--pb-gold))"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
        <circle
          cx="30"
          cy="30"
          r="6"
          fill={sectionBg === 'tinted' ? 'white' : 'hsl(var(--pb-blush-wash))'}
          stroke="hsl(var(--pb-gold))"
          strokeWidth="1.25"
        />
      </svg>

      {/* The photo: full-bleed inside its own thin margin, and entirely
          bare — badges and the wishlist heart live in the caption below
          instead of on top of it. */}
      <div className="relative aspect-[4/5] overflow-hidden bg-[hsl(var(--pb-shell))]">
        <img
          src={getImageUrl(image)}
          alt={name}
          className={cn(
            'absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-[1100ms] ease-pb',
            'group-hover:scale-[1.07] group-focus-visible:scale-[1.07]',
            'motion-reduce:transition-none motion-reduce:group-hover:scale-100',
            secondImage && 'group-hover:opacity-0 group-focus-visible:opacity-0'
          )}
        />
        {secondImage && (
          <img
            src={getImageUrl(secondImage)}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full scale-[1.07] object-cover opacity-0 transition-opacity duration-[1100ms] ease-pb group-hover:opacity-100 group-focus-visible:opacity-100"
          />
        )}
      </div>

      {/* The caption — the paper margin. Badges (when there are any) and the
          wishlist heart share a top line of their own; everything else the
          card knows about the product — category, name, rating, price —
          comes in as `children` and sits below it. */}
      <div className="px-0.5 pt-3">
        {(badges.length > 0 || onToggleWishlist) && (
          <div className="mb-1.5 flex items-start justify-between gap-2">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              {badges.map((b) => (
                <Badge key={b.label} variant={b.variant}>
                  {b.label}
                </Badge>
              ))}
            </div>
            {onToggleWishlist && (
              <button
                onClick={onToggleWishlist}
                aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                aria-pressed={wishlisted}
                className="-mr-0.5 -mt-0.5 shrink-0 p-1 transition-transform duration-200 ease-pb hover:scale-[1.15] active:scale-95"
              >
                <Heart
                  className={cn(
                    'h-4 w-4 transition-colors duration-200',
                    wishlisted
                      ? 'fill-[hsl(var(--pb-rose))] text-[hsl(var(--pb-rose))]'
                      : 'text-[hsl(var(--pb-ink-faint))] group-hover:text-[hsl(var(--pb-ink-muted))]'
                  )}
                />
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </Link>
  );
}

export { Badge };
export type { BadgeVariant };
