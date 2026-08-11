/**
 * The homepage hero (FabricWeaveHero) shows three fixed photos — one large
 * centre print and two smaller side prints. This is the shared shape both
 * that component and the admin editor (`/admin/hero-section`) read and
 * write, stored under this one settings key via the generic settings API
 * (`GET/PUT /api/v1/settings/hero_section_images`) rather than a dedicated
 * backend module — it's three URLs, not a new domain.
 *
 * Each slot remembers only the single image it replaced, not a full history:
 * uploading a new photo overwrites `previous` with whatever `url` was right
 * before it. That is what "reset to previous" resets to, and only within 30
 * days of that replacement — see `isPreviousResettable`.
 */

export const HERO_SECTION_IMAGES_KEY = 'hero_section_images';

export const HERO_SLOTS = ['main', 'pink', 'black'] as const;
export type HeroSlotId = (typeof HERO_SLOTS)[number];

export interface HeroImageSlot {
  url: string;
  previous: { url: string; changedAt: string } | null;
}

export type HeroSectionImages = Record<HeroSlotId, HeroImageSlot>;

/** The photos bundled with the site today — the fallback until an admin replaces one. */
export const DEFAULT_HERO_IMAGES: HeroSectionImages = {
  main: { url: '/hero/hero-main.jpg', previous: null },
  pink: { url: '/hero/pink_3.jpg', previous: null },
  black: { url: '/hero/black_3.jpg', previous: null },
};

export const HERO_SLOT_LABELS: Record<HeroSlotId, string> = {
  main: 'Centre print',
  pink: 'Left print',
  black: 'Right print',
};

/**
 * Resolve a hero slot's `url` to something an `<img>`/`next/image` can load.
 *
 * A default slot holds a bundled `/hero/*.jpg` path — a Next `public/` asset
 * served from this site's own origin, never the backend — so it must be left
 * exactly as-is. An admin-replaced slot holds whatever `/upload/image`
 * returned: an absolute Cloudinary URL or a backend-relative `/uploads/...`
 * path, both of which `getImageUrl` already knows how to resolve. Routing a
 * bundled default through `getImageUrl` would wrongly prefix it with the API
 * origin, so the two cases can't share one code path.
 */
export function resolveHeroImageUrl(url: string, getImageUrl: (path: string) => string): string {
  return url.startsWith('/hero/') ? url : getImageUrl(url);
}

const RESET_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

/** Whether a slot's `previous` image is still within its 30-day reset window. */
export function isPreviousResettable(slot: HeroImageSlot, now: number): boolean {
  if (!slot.previous) return false;
  const changedAt = Date.parse(slot.previous.changedAt);
  if (Number.isNaN(changedAt)) return false;
  return now - changedAt <= RESET_WINDOW_MS;
}
