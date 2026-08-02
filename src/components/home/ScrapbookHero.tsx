'use client';

import * as React from 'react';
import Link from 'next/link';
import { Monogram } from '@/components/brand/Monogram';
import { cn } from '@/lib/utils';

interface CollageTile {
  id: string;
  src: string;
  alt: string;
  /** Placement on the 100×100 stage, in percent, plus a resting tilt. */
  left: number;
  top: number;
  width: number;
  rotate: number;
  /** Aspect ratio of the printed photo, `w / h`. */
  aspect: string;
  /** Where the print drops in from on load, in percent of its own box. */
  fromX: number;
  fromY: number;
  fromRotate: number;
  /** 0 → 0.5, multiplied by 900ms. Staggers this print's arrival. */
  delay: number;
  /** Mobile placement — a tighter five-tile edit of the same collage. */
  mobile?: { left: number; top: number; width: number } | null;
}

/**
 * The pinned photo. Everything else recedes around it during the zoom beat,
 * so this is the shot that has to carry the brand on its own.
 */
const HERO_TILE_ID = 'store-floral';

/**
 * Photographs live in `public/hero/`. They are brand stills rather than
 * merchandised content, so they are pinned in source instead of coming from
 * the hero-banner setting — the composition depends on each specific crop
 * sitting in its own slot.
 */
const TILES: CollageTile[] = [
  {
    id: 'ivory-floral',
    src: '/hero/ivory-floral.jpg',
    alt: 'Ivory kurti with pink floral embroidery on a hanger in the PariBelle store',
    left: 1,
    top: 6,
    width: 22,
    rotate: -5,
    aspect: '4 / 5',
    fromX: -46,
    fromY: 16,
    fromRotate: -12,
    delay: 0.16,
    mobile: { left: 1, top: 8, width: 46 },
  },
  {
    id: 'detail-tag',
    src: '/hero/detail-rose-tag.jpg',
    alt: 'Rose kurti with chikankari neckline beside the PariBelle swing tag',
    left: 26,
    top: 0,
    width: 22,
    rotate: 3.5,
    aspect: '1 / 1',
    fromX: -12,
    fromY: -44,
    fromRotate: 9,
    delay: 0.3,
    mobile: null,
  },
  {
    id: HERO_TILE_ID,
    src: '/hero/hero-store-floral.jpg',
    alt: 'Blush floral kurti on a PariBelle hanger beneath the store signage',
    left: 35,
    top: 28,
    width: 30,
    rotate: -1.5,
    aspect: '1 / 1',
    fromX: 0,
    fromY: 22,
    fromRotate: 3,
    delay: 0,
    mobile: { left: 18, top: 34, width: 64 },
  },
  {
    id: 'store-rose',
    src: '/hero/store-rose.jpg',
    alt: 'Rose linen kurti with white chikankari embroidery on the shop floor',
    left: 64,
    top: 2,
    width: 28,
    rotate: 4,
    aspect: '1 / 1',
    fromX: 40,
    fromY: -20,
    fromRotate: 11,
    delay: 0.22,
    mobile: { left: 52, top: 2, width: 46 },
  },
  {
    id: 'carry-bag',
    src: '/hero/packaging-bag.jpg',
    alt: 'PariBelle branded carry bag',
    left: 26,
    top: 66,
    width: 22,
    rotate: 4.5,
    aspect: '1 / 1',
    fromX: -8,
    fromY: 38,
    fromRotate: 13,
    delay: 0.38,
    mobile: { left: 1, top: 66, width: 42 },
  },
  {
    id: 'packed-rose',
    src: '/hero/packed-rose.jpg',
    alt: 'Folded pink floral kurti in a resealable PariBelle pouch',
    left: 2,
    top: 46,
    width: 21,
    rotate: -3.5,
    aspect: '4 / 5',
    fromX: -16,
    fromY: 42,
    fromRotate: -10,
    delay: 0.46,
    mobile: null,
  },
  {
    id: 'packed-ivory',
    src: '/hero/packed-ivory.jpg',
    alt: 'Ivory kurti packed in a PariBelle presentation sleeve',
    left: 72,
    top: 40,
    width: 24,
    rotate: -4,
    aspect: '2 / 3',
    fromX: 42,
    fromY: 26,
    fromRotate: -12,
    delay: 0.32,
    mobile: { left: 57, top: 62, width: 40 },
  },
];

/** Viewport heights of scroll the pinned collage consumes. */
const SCROLL_LENGTH_VH = 240;

/**
 * Stage aspect ratios, as width ÷ height. These must stay in step with the
 * `aspect-ratio` on `.pb-scrap-stage` in globals.css — they are what turns a
 * tile's width percentage into a height percentage.
 */
const STAGE_RATIO_WIDE = 7 / 5;
const STAGE_RATIO_NARROW = 5 / 9;

/**
 * Where the pinned photo's centre sits on the stage, and how far the stage has
 * to move to bring that point to true centre. The zoom beat scales about the
 * first and translates by the second, so the photo grows in place and then
 * settles centred rather than drifting toward a corner.
 *
 * The two breakpoints place the pinned photo differently on differently shaped
 * stages, so each needs its own pair.
 */
const HERO_TILE = TILES.find((t) => t.id === HERO_TILE_ID)!;

function heroFocus(
  placement: { top: number; width: number },
  stageRatio: number
): { origin: number; offset: number } {
  const [aw, ah] = HERO_TILE.aspect.split('/').map((n) => parseFloat(n));
  const heightPct = placement.width * (ah / aw) * stageRatio;
  const centreY = placement.top + heightPct / 2;
  return { origin: centreY, offset: 50 - centreY };
}

const FOCUS_WIDE = heroFocus(HERO_TILE, STAGE_RATIO_WIDE);
const FOCUS_NARROW = heroFocus(HERO_TILE.mobile!, STAGE_RATIO_NARROW);

export interface ScrapbookHeroProps {
  /** Destinations for the rail pinned to the base of the collage. */
  links?: Array<{ label: string; href: string }>;
}

/**
 * The landing hero: an asymmetric, scrapbook-style collage of brand
 * photography, pinned while scroll scrubs a two-beat choreography.
 *
 * Scroll progress (0 → 1) is written once per frame to a `--p` custom property
 * on the section. Every moving part derives its own transform from that one
 * number in CSS, which keeps the whole composition off the React render path
 * and on the compositor.
 *
 * The prints drop onto the page on load, staggered, so the hero is composed
 * before a visitor touches the wheel. Scroll then runs two beats:
 *   1. Frame — the collage rises the last few percent into its finished
 *      framing, fully on screen. This beat only translates.
 *   2. Zoom — further scroll immediately pushes into the centre photo. It
 *      straightens and grows until it reads a step larger than its neighbours,
 *      which dim and soften behind it. Scroll past that and the section unpins.
 *
 * Scale belongs to beat 2 alone, so the push-in is one continuous motion rather
 * than a settle-back followed by a zoom.
 *
 * With `prefers-reduced-motion` the collage renders composed and un-zoomed and
 * the scroll runway collapses, so nothing depends on movement to be readable.
 */
export function ScrapbookHero({ links }: ScrapbookHeroProps) {
  const sectionRef = React.useRef<HTMLElement | null>(null);
  const [reducedMotion, setReducedMotion] = React.useState(false);
  const [failed, setFailed] = React.useState<Record<string, boolean>>({});

  React.useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  React.useEffect(() => {
    const section = sectionRef.current;
    if (!section || reducedMotion) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const { top, height } = section.getBoundingClientRect();
      const runway = height - window.innerHeight;
      const progress = runway <= 0 ? 1 : Math.min(Math.max(-top / runway, 0), 1);
      section.style.setProperty('--p', progress.toFixed(4));
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [reducedMotion]);

  // Falls back to New In, which every storefront has, when the caller has no
  // categories to offer yet.
  const railLinks =
    links && links.length > 0 ? links.slice(0, 4) : [{ label: 'New In', href: '/category/new-in' }];

  return (
    <section
      ref={sectionRef}
      className={cn('pb-scrap relative', reducedMotion && 'pb-scrap-static')}
      style={
        {
          height: reducedMotion ? 'auto' : `${SCROLL_LENGTH_VH}vh`,
          '--focus-origin': `${FOCUS_WIDE.origin}%`,
          '--focus-y': `${FOCUS_WIDE.offset}%`,
          '--focus-origin-narrow': `${FOCUS_NARROW.origin}%`,
          '--focus-y-narrow': `${FOCUS_NARROW.offset}%`,
        } as React.CSSProperties
      }
      aria-label="PariBelle"
    >
      {/* The collage carries the brand visually; the page still needs one
          heading for assistive tech and search. */}
      <h1 className="sr-only">PariBelle — Designer Kurtis &amp; Artificial Jewellery</h1>

      <div className="pb-scrap-pin sticky top-0 flex h-screen items-center overflow-hidden bg-[hsl(var(--pb-ivory))]">
        {/* Paper ground: a blush wash with a faint grain so the prints read as
            pinned to a page rather than floating on flat white. */}
        <div className="pb-scrap-paper pointer-events-none absolute inset-0" aria-hidden="true" />

        <div className="relative mx-auto w-full max-w-[1180px] px-4 md:px-8">
          <div className="pb-scrap-stage relative mx-auto">
            {TILES.map((tile) => {
              const isHero = tile.id === HERO_TILE_ID;
              return (
                <figure
                  key={tile.id}
                  className={cn(
                    'pb-scrap-tile absolute',
                    isHero && 'pb-scrap-tile--hero',
                    !tile.mobile && 'pb-scrap-tile--wide-only'
                  )}
                  style={
                    {
                      '--l': `${tile.left}%`,
                      '--t': `${tile.top}%`,
                      '--w': `${tile.width}%`,
                      '--r': `${tile.rotate}deg`,
                      '--ex': `${tile.fromX}%`,
                      '--ey': `${tile.fromY}%`,
                      '--er': `${tile.fromRotate}deg`,
                      '--d': tile.delay,
                      '--ml': tile.mobile ? `${tile.mobile.left}%` : undefined,
                      '--mt': tile.mobile ? `${tile.mobile.top}%` : undefined,
                      '--mw': tile.mobile ? `${tile.mobile.width}%` : undefined,
                      aspectRatio: tile.aspect,
                    } as React.CSSProperties
                  }
                >
                  <div className="pb-scrap-print">
                    {failed[tile.id] ? (
                      <div className="flex h-full w-full items-center justify-center bg-[hsl(var(--pb-rose-mist))]">
                        <Monogram className="h-8 w-8 text-[hsl(var(--pb-rose))]" />
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={tile.src}
                        alt={tile.alt}
                        className="h-full w-full object-cover"
                        loading={isHero ? 'eager' : 'lazy'}
                        fetchPriority={isHero ? 'high' : undefined}
                        onError={() => setFailed((f) => ({ ...f, [tile.id]: true }))}
                        draggable={false}
                      />
                    )}
                  </div>
                </figure>
              );
            })}

          </div>
        </div>

        {/* Category rail — holds the base of the frame throughout. */}
        <div className="pb-scrap-rail absolute inset-x-0 bottom-0 border-t border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-ivory)/0.85)] backdrop-blur-sm">
          <div className="mx-auto flex max-w-4xl items-stretch justify-center divide-x divide-[hsl(var(--pb-linen))]">
            {railLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-eyebrow flex-1 px-4 py-4 text-center text-[hsl(var(--pb-ink-muted))] transition-colors duration-150 hover:bg-[hsl(var(--pb-blush-wash))] hover:text-[hsl(var(--pb-rose-deep))] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[hsl(var(--pb-rose-deep))]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Scroll cue — retires as soon as the visitor takes the hint. */}
        <div className="pb-scrap-cue absolute bottom-20 left-1/2 -translate-x-1/2">
          <span className="block h-10 w-px bg-gradient-to-b from-transparent to-[hsl(var(--pb-rose))]" />
        </div>
      </div>
    </section>
  );
}
