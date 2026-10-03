'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, ChevronLeft, ChevronRight, Heart, LogOut, Package, User } from 'lucide-react';
import { buttonClasses } from '@/components/ui/Button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useHeroSectionImages } from '@/hooks/useStorefrontData';
import { usePresence } from '@/hooks/usePresence';
import { useWishlist } from '@/contexts/WishlistContext';
import { getImageUrl } from '@/lib/image-url';
import { resolveHeroImageUrl } from '@/lib/heroSectionImages';
import { LOOKBOOK_ENABLED } from '@/lib/features';
import { cn } from '@/lib/utils';
import type { Category } from '@/types/product';
import { useFeaturedProduct } from './MegaMenu';

export interface MobileNavProps {
  open: boolean;
  onClose: () => void;
  categories: Category[];
}

type Style = React.CSSProperties & Record<`--${string}`, string | number>;
const stagger = (i: number): Style => ({ '--i': i });

const hasChildren = (cat: Category) => (cat.children?.length ?? 0) > 0;

/**
 * Whether a leaf category has anything in it yet — the same check (and the
 * same cached request) the desktop mega menu uses for its "coming soon"
 * panel. Renders nothing until it knows.
 */
function ComingSoon({ category }: { category: Category }) {
  const { data, isLoading } = useFeaturedProduct(category);
  if (isLoading || data) return null;
  return (
    <span className="font-sans text-[10px] font-medium uppercase tracking-[0.16em] text-[hsl(var(--pb-ink-faint))]">
      Soon
    </span>
  );
}

/** The secondary, non-category destinations. */
function useExtraLinks() {
  const { user, isLoggedIn } = useCurrentUser();
  const isAdmin = isLoggedIn && user?.role === 'super_admin';
  const links: Array<{ label: string; href: string; external?: boolean }> = [{ label: 'Home', href: '/' }];
  if (LOOKBOOK_ENABLED) links.push({ label: 'Lookbook', href: '/lookbook' });
  links.push({ label: 'About', href: '/about' });
  if (isAdmin) {
    links.push({ label: 'Admin', href: '/admin' });
    // A plain anchor: /pom is a separate Next app behind a rewrite.
    links.push({ label: 'OMS', href: '/pom', external: true });
  }
  return links;
}

function displayName(user: { firstName?: string; lastName?: string; email?: string } | null | undefined) {
  return [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || '';
}

const SHEET_MS = 560;

/**
 * The phone menu (below md): a full-screen sheet. Opens beneath the header — which stays put and turns its hamburger into
 * the close button — wiping down over the page with its rows following in a
 * light stagger. A category with sub-categories drills into its own panel
 * (slides in from the right, "back" slides it away) rather than expanding in
 * place, so the top level stays short enough to take in at a glance.
 */
export function MobileNav({ open, onClose, categories }: MobileNavProps) {
  const pathname = usePathname();
  const { mounted, shown } = usePresence(open, SHEET_MS);
  const [panel, setPanel] = React.useState<string | null>(null);
  const extraLinks = useExtraLinks();
  const { data: heroImages } = useHeroSectionImages();

  React.useEffect(() => {
    if (!mounted) setPanel(null);
  }, [mounted]);

  React.useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!mounted) return null;

  const featuredCategory = categories.find(hasChildren) ?? categories[0];
  const featuredImage = heroImages ? resolveHeroImageUrl(heroImages.main.url, getImageUrl) : null;
  let i = 0;

  return (
    <div
      className="pb-sheet fixed inset-0 z-40 flex flex-col bg-[hsl(var(--pb-ivory))] pt-[57px] md:hidden"
      data-shown={shown}
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
    >
      <div className="relative flex-1 overflow-hidden">
        {/* Root panel */}
        <div
          aria-hidden={!!panel}
          className={cn(
            'absolute inset-0 overflow-y-auto overscroll-contain transition-[transform,opacity,visibility] duration-500 ease-sheet',
            panel && 'invisible -translate-x-[30%] opacity-0'
          )}
        >
          <div className="flex min-h-full flex-col px-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-7">
            <p className="pb-sheet-item text-eyebrow text-[hsl(var(--pb-ink-faint))]" style={stagger(i++)}>
              Shop
            </p>
            <ul className="mt-2">
              {categories.map((cat) => {
                const active = pathname === `/category/${cat.slug}`;
                const row = cn(
                  'pb-press flex w-full items-center justify-between gap-3 py-2 text-left font-display text-[2.2rem] font-light leading-[1.15]',
                  active ? 'text-[hsl(var(--pb-rose-deep))]' : 'text-[hsl(var(--pb-ink))]'
                );
                return (
                  <li key={cat.id} className="pb-sheet-item" style={stagger(i++)}>
                    {hasChildren(cat) ? (
                      <button onClick={() => setPanel(cat.id)} className={row} aria-label={`${cat.name} categories`}>
                        {cat.name}
                        <ChevronRight className="h-5 w-5 shrink-0 text-[hsl(var(--pb-ink-faint))]" strokeWidth={1.5} />
                      </button>
                    ) : (
                      <Link href={`/category/${cat.slug}`} onClick={onClose} className={row}>
                        {cat.name}
                        <ComingSoon category={cat} />
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>

            {featuredCategory && (
              <Link
                href={`/category/${featuredCategory.slug}`}
                onClick={onClose}
                className="pb-sheet-item pb-press relative mt-7 block aspect-[16/10] overflow-hidden rounded-[20px] bg-[hsl(var(--pb-blush-wash))]"
                style={stagger(i++)}
              >
                {featuredImage && (
                  <Image src={featuredImage} alt="" fill sizes="100vw" quality={80} className="object-cover object-[50%_22%]" />
                )}
                <span
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(to top, hsl(var(--pb-wine-deep) / 0.82), hsl(var(--pb-wine-deep) / 0.15) 55%, transparent)',
                  }}
                />
                <span className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-3">
                  <span className="flex flex-col gap-1.5">
                    <span className="text-eyebrow text-white/75">New this season</span>
                    <span className="font-display text-[1.6rem] italic leading-none text-white">
                      The {featuredCategory.name} edit
                    </span>
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-[hsl(var(--pb-ink))]">
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </span>
              </Link>
            )}

            <ul className="mt-6 flex flex-col">
              {extraLinks.map((link) => {
                const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                const className = cn(
                  'pb-press block py-2.5 text-[17px]',
                  active ? 'text-[hsl(var(--pb-rose-deep))]' : 'text-[hsl(var(--pb-ink))]'
                );
                return (
                  <li key={link.href} className="pb-sheet-item" style={stagger(i++)}>
                    {link.external ? (
                      <a href={link.href} onClick={onClose} className={className}>
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href} onClick={onClose} className={className}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="flex-1" />
            <div className="pb-sheet-item mt-8" style={stagger(i++)}>
              <AccountTiles onClose={onClose} />
            </div>
          </div>
        </div>

        {/* One drill-in panel per category that has sub-categories. */}
        {categories.filter(hasChildren).map((cat) => {
          const isOpen = panel === cat.id;
          const groups = cat.children!.filter(hasChildren);
          const flat = cat.children!.filter((c) => !hasChildren(c));
          return (
            <div
              key={cat.id}
              aria-hidden={!isOpen}
              className={cn(
                'absolute inset-0 overflow-y-auto overscroll-contain transition-[transform,opacity,visibility] duration-500 ease-sheet',
                !isOpen && 'invisible translate-x-full opacity-0'
              )}
            >
              <div className="px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
                <button
                  onClick={() => setPanel(null)}
                  className="pb-press -ml-1.5 flex items-center gap-0.5 py-2 text-[15px] text-[hsl(var(--pb-ink-muted))]"
                >
                  <ChevronLeft className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  Menu
                </button>
                <h2 className="mt-3 font-display text-[2.6rem] font-light leading-none text-[hsl(var(--pb-ink))]">
                  {cat.name}
                </h2>
                <Link
                  href={`/category/${cat.slug}`}
                  onClick={onClose}
                  className={buttonClasses({ size: 'lg', className: 'mt-5' })}
                >
                  Shop all {cat.name}
                </Link>

                {[...groups, ...(flat.length ? [{ ...cat, id: `${cat.id}-flat`, name: '', children: flat }] : [])].map(
                  (group) => (
                    <div key={group.id} className="mt-9">
                      {group.name && (
                        <p className="text-eyebrow text-[hsl(var(--pb-ink-faint))]">{group.name}</p>
                      )}
                      <ul className="mt-2 divide-y divide-[hsl(var(--pb-linen)/0.8)]">
                        {group.children!.map((child) => {
                          const active = pathname === `/category/${child.slug}`;
                          return (
                            <li key={child.id}>
                              <Link
                                href={`/category/${child.slug}`}
                                onClick={onClose}
                                className={cn(
                                  'pb-press flex items-center justify-between py-3.5 font-display text-[1.45rem] leading-tight',
                                  active ? 'text-[hsl(var(--pb-rose-deep))]' : 'text-[hsl(var(--pb-ink))]'
                                )}
                              >
                                {child.name}
                                <ChevronRight className="h-4 w-4 text-[hsl(var(--pb-ink-faint))]" strokeWidth={1.5} />
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Account, orders and wishlist as tiles, with sign in / out beneath. */
function AccountTiles({ onClose }: { onClose: () => void }) {
  const { user, isLoggedIn, logout } = useCurrentUser();
  const { totalItems: wishlistCount } = useWishlist();

  const tiles = [
    { label: 'Account', href: isLoggedIn ? '/profile' : '/login', icon: User },
    { label: 'Orders', href: '/orders', icon: Package },
    { label: 'Wishlist', href: '/wishlist', icon: Heart, count: wishlistCount },
  ];

  return (
    <div>
      {isLoggedIn && (
        <p className="mb-3 truncate text-[13px] text-[hsl(var(--pb-ink-faint))]">Signed in as {displayName(user)}</p>
      )}
      <div className="grid grid-cols-3 gap-2.5">
        {tiles.map(({ label, href, icon: Icon, count }) => (
          <Link
            key={label}
            href={href}
            onClick={onClose}
            className="pb-press relative flex flex-col items-start gap-3 rounded-[16px] border border-[hsl(var(--pb-ink)/0.07)] bg-white/70 p-3.5 text-[13px] text-[hsl(var(--pb-ink))]"
          >
            <Icon className="h-[18px] w-[18px] text-[hsl(var(--pb-rose-deep))]" strokeWidth={1.6} />
            {label}
            {!!count && (
              <span className="absolute right-3 top-3 flex h-5 min-w-5 items-center justify-center rounded-full bg-[hsl(var(--pb-rose-deep))] px-1.5 text-[10px] font-medium text-white">
                {count}
              </span>
            )}
          </Link>
        ))}
      </div>
      {isLoggedIn ? (
        <button
          onClick={() => {
            onClose();
            logout();
          }}
          className="pb-press mt-4 flex h-11 items-center gap-2 text-[14px] text-[hsl(var(--pb-rose-deep))]"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      ) : (
        <Link
          href="/login"
          onClick={onClose}
          className={buttonClasses({ size: 'lg', variant: 'secondary', fullWidth: true, className: 'mt-3' })}
        >
          Sign in
        </Link>
      )}
    </div>
  );
}
