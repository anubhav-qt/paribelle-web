'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, ShoppingBag, User, Menu, Package, LogOut } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { MegaMenu } from './MegaMenu';
import { MobileNav } from './MobileNav';
import { cn } from '@/lib/utils';
import { LOOKBOOK_ENABLED } from '@/lib/features';
import { NotificationBell } from '@/components/NotificationBell';
import { WalletBadge } from '@/components/WalletBadge';

const STATIC_LINKS = [{ label: 'Home', href: '/' }];

/** Shared shape for every interactive element inside the pill. */
const PILL_ITEM =
  'rounded-full transition-colors duration-150 focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 focus-visible:outline-[hsl(var(--pb-rose-deep))]';

const NAV_LINK = `${PILL_ITEM} px-3.5 py-2 text-sm font-medium`;
const ICON_BUTTON = `${PILL_ITEM} relative p-2 hover:bg-[hsl(var(--pb-blush-wash))]`;

function Divider() {
  return <span aria-hidden="true" className="mx-1 h-5 w-px bg-[hsl(var(--pb-linen))]" />;
}

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--pb-rose-deep))] text-[10px] font-medium text-white">
      {count}
    </span>
  );
}

/**
 * The storefront header: a single floating pill centred over the page, holding
 * every destination and action. Nothing is anchored to the left or right edge,
 * so the bar reads as one object rather than a full-width band — and whatever
 * is behind it (the blush collage, page content) stays visible either side.
 *
 * The wrapper is `fixed`, not `sticky` — it never occupies layout space, so
 * every page's first section runs right to the top of the viewport with the
 * pill floating over it from the very first frame, not after a reserved band
 * of body background scrolls away. The pill itself firms up its background
 * past a small scroll threshold, since content passing behind needs more
 * separation once it's no longer the hero.
 */
export function Header() {
  const pathname = usePathname();
  const { data: categories = [] } = useCategories();
  const { totalItems, openCart } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const { user, isLoggedIn, logout } = useCurrentUser();

  const [scrolled, setScrolled] = React.useState(false);
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [accountOpen, setAccountOpen] = React.useState(false);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sliding nav highlighter: one shared pill measures the currently active
  // link's own rect (relative to the nav container) and animates to it,
  // rather than every link independently toggling its own background.
  const navContainerRef = React.useRef<HTMLElement | null>(null);
  const navLinkRefs = React.useRef<Map<string, HTMLAnchorElement>>(new Map());
  const [pillRect, setPillRect] = React.useState<{ left: number; width: number } | null>(null);
  const [pillAnimReady, setPillAnimReady] = React.useState(false);

  const setNavLinkRef = (key: string) => (el: HTMLAnchorElement | null) => {
    if (el) navLinkRefs.current.set(key, el);
    else navLinkRefs.current.delete(key);
  };

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openMegaMenu = (categoryId: string) => {
    clearCloseTimer();
    setActiveMenu(categoryId);
  };

  // A short delay rather than closing the instant the pointer leaves the nav
  // item — without it, a mouse moving diagonally from the trigger down into
  // the panel crosses a gap of no element and closes the menu before it
  // arrives.
  const scheduleCloseMegaMenu = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setActiveMenu(null), 120);
  };

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    setActiveMenu(null);
    setAccountOpen(false);
  }, [pathname]);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveMenu(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  React.useEffect(() => () => clearCloseTimer(), []);

  const activeCategory = categories.find((c) => c.id === activeMenu && c.children?.length);

  // Current-page highlighting, kept separate from `activeMenu` (which tracks
  // the hovered/open mega menu, not location) so the two states can layer:
  // hovering a sibling category tints it without moving the "you are here"
  // marker off the actual current page. A hovered/open mega menu takes
  // precedence over plain location — it's the more specific state, and the
  // sliding pill below can only be in one place at a time.
  const activeNavKey = React.useMemo(() => {
    if (activeMenu) {
      const hovered = categories.find((c) => c.id === activeMenu);
      if (hovered) return hovered.id;
    }
    if (pathname === '/') return 'home';
    const activeCat = categories.find((c) => pathname === `/category/${c.slug}`);
    if (activeCat) return activeCat.id;
    if (LOOKBOOK_ENABLED && pathname === '/lookbook') return 'lookbook';
    if (pathname === '/about') return 'about';
    return null;
  }, [pathname, activeMenu, categories]);

  const navLinkClass = (isActive: boolean) =>
    cn(
      NAV_LINK,
      'relative z-10',
      isActive
        ? 'text-[hsl(var(--pb-rose-deep))]'
        : 'text-[hsl(var(--pb-ink-muted))] hover:bg-[hsl(var(--pb-blush-wash))] hover:text-[hsl(var(--pb-rose-deep))]'
    );

  const measurePill = React.useCallback(() => {
    const container = navContainerRef.current;
    const key = activeNavKey;
    if (!container || !key) {
      setPillRect(null);
      return;
    }
    const el = navLinkRefs.current.get(key);
    if (!el) {
      setPillRect(null);
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setPillRect({ left: elRect.left - containerRect.left, width: elRect.width });
  }, [activeNavKey]);

  React.useLayoutEffect(() => {
    measurePill();
  }, [measurePill]);

  React.useEffect(() => {
    window.addEventListener('resize', measurePill);
    return () => window.removeEventListener('resize', measurePill);
  }, [measurePill]);

  // Skip the transition on the very first measurement so the pill doesn't
  // animate in from a stale/zero position — only start animating once it has
  // settled at its correct initial spot.
  React.useEffect(() => {
    if (pillRect && !pillAnimReady) {
      const raf = requestAnimationFrame(() => setPillAnimReady(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [pillRect, pillAnimReady]);

  return (
    <>
      <header
        onMouseLeave={scheduleCloseMegaMenu}
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3"
      >
        <div
          className={cn(
            'relative flex items-center gap-0.5 rounded-full border px-2 py-1.5 backdrop-blur-xl transition-all duration-300 ease-pb',
            scrolled
              ? 'border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-ivory)/0.94)] shadow-pb-lg'
              : 'border-[hsl(var(--pb-linen)/0.7)] bg-[hsl(var(--pb-blush-wash)/0.55)] shadow-pb-md'
          )}
        >
          <button
            onClick={() => setMobileNavOpen(true)}
            className={`${PILL_ITEM} p-2 hover:bg-[hsl(var(--pb-blush-wash))] md:hidden`}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-[hsl(var(--pb-ink))]" />
          </button>

          <Link
            href="/"
            className={`${PILL_ITEM} px-3 py-1 font-display text-xl italic tracking-wide text-[hsl(var(--pb-ink))] hover:text-[hsl(var(--pb-rose-deep))]`}
          >
            PariBelle
          </Link>

          <Divider />

          <nav ref={navContainerRef} className="relative hidden items-center md:flex">
            {pillRect && (
              <span
                aria-hidden="true"
                className={cn(
                  'pointer-events-none absolute inset-y-0 rounded-full bg-[hsl(var(--pb-blush-wash))]',
                  pillAnimReady && 'transition-[transform,width] duration-300 ease-pb'
                )}
                style={{ transform: `translateX(${pillRect.left}px)`, width: pillRect.width }}
              />
            )}

            {STATIC_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                ref={setNavLinkRef('home')}
                className={navLinkClass(activeNavKey === 'home')}
              >
                {link.label}
              </Link>
            ))}

            {categories.map((cat) => {
              const hasChildren = !!cat.children?.length;
              const isActive = activeNavKey === cat.id;
              return (
                // A link, not a button: hovering opens the mega menu, but the
                // category name itself has to be clickable and keyboard-reachable.
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  ref={setNavLinkRef(cat.id)}
                  // A category with no children has nothing for the panel to
                  // show — opening it anyway is the empty-white-panel bug.
                  onMouseEnter={hasChildren ? () => openMegaMenu(cat.id) : undefined}
                  onFocus={hasChildren ? () => openMegaMenu(cat.id) : undefined}
                  className={navLinkClass(isActive)}
                >
                  {cat.name}
                </Link>
              );
            })}

            {LOOKBOOK_ENABLED && (
              <Link
                href="/lookbook"
                ref={setNavLinkRef('lookbook')}
                className={navLinkClass(activeNavKey === 'lookbook')}
              >
                Lookbook
              </Link>
            )}
            <Link href="/about" ref={setNavLinkRef('about')} className={navLinkClass(activeNavKey === 'about')}>
              About
            </Link>

            <Divider />
          </nav>

          {/* Signed out, the icon is a shortcut to the login page. Signed in,
              it opens the account menu — which is the only place on the
              storefront a customer can sign out from. */}
          {isLoggedIn ? (
            <div className="relative hidden md:block">
              <button
                onClick={() => setAccountOpen((open) => !open)}
                aria-label="Account"
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                className={cn(ICON_BUTTON, accountOpen && 'bg-[hsl(var(--pb-blush-wash))]')}
              >
                <User className="h-5 w-5 text-[hsl(var(--pb-ink))]" />
              </button>
              {accountOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setAccountOpen(false)} />
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-20 mt-2 min-w-[220px] rounded-sm border border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-ivory))] p-2 shadow-pb-md"
                  >
                    <p className="truncate px-3 py-2 text-xs text-[hsl(var(--pb-ink-faint))]">
                      {[user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email}
                    </p>
                    <Link
                      href="/profile"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-3 rounded-sm px-3 py-2 text-sm text-[hsl(var(--pb-ink))] hover:bg-[hsl(var(--pb-shell))]"
                    >
                      <User className="h-4 w-4" /> My Account
                    </Link>
                    <Link
                      href="/orders"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-3 rounded-sm px-3 py-2 text-sm text-[hsl(var(--pb-ink))] hover:bg-[hsl(var(--pb-shell))]"
                    >
                      <Package className="h-4 w-4" /> My Orders
                    </Link>
                    <WalletBadge variant="row" onNavigate={() => setAccountOpen(false)} />
                    <button
                      onClick={() => {
                        setAccountOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm text-[hsl(var(--pb-rose-deep))] hover:bg-[hsl(var(--pb-shell))]"
                    >
                      <LogOut className="h-4 w-4" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link href="/login" aria-label="Account" className={`${ICON_BUTTON} hidden md:inline-flex`}>
              <User className="h-5 w-5 text-[hsl(var(--pb-ink))]" />
            </Link>
          )}
          {isLoggedIn && (
            <NotificationBell buttonClassName={ICON_BUTTON} iconClassName="h-5 w-5 text-[hsl(var(--pb-ink))]" />
          )}
          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className={cn(ICON_BUTTON, pathname === '/wishlist' && 'bg-[hsl(var(--pb-blush-wash))]')}
          >
            <Heart className="h-5 w-5 text-[hsl(var(--pb-ink))]" />
            <CountBadge count={wishlistCount} />
          </Link>
          <button onClick={openCart} aria-label="Cart" className={ICON_BUTTON}>
            <ShoppingBag className="h-5 w-5 text-[hsl(var(--pb-ink))]" />
            <CountBadge count={totalItems} />
          </button>

          {/* Mega menu hangs off the pill rather than spanning the viewport, so
              it stays visually attached to the object it belongs to. The
              wrapper sizes to the panel's own content (via MegaMenu's
              `w-fit`) instead of always claiming a fixed 60rem, capped so it
              never overflows a narrow viewport; `onMouseEnter` cancels the
              pending close so moving the pointer down into the panel doesn't
              dismiss it. */}
          {activeCategory && (
            <div
              onMouseEnter={clearCloseTimer}
              onMouseLeave={scheduleCloseMegaMenu}
              className="absolute left-1/2 top-full hidden max-w-[calc(100vw-2rem)] -translate-x-1/2 pt-3 md:block"
            >
              <MegaMenu category={activeCategory} onNavigate={() => setActiveMenu(null)} />
            </div>
          )}
        </div>
      </header>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} categories={categories} />
    </>
  );
}
