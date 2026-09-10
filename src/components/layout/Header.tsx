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

const NAV_LINK = `${PILL_ITEM} whitespace-nowrap px-3 py-2 text-xs font-medium uppercase tracking-wide`;
const ICON_BUTTON = `${PILL_ITEM} relative p-2 hover:bg-[hsl(var(--pb-blush-wash))]`;

/**
 * How far every panel hangs below the header's content box, and the reason it
 * is a number rather than a `mt-2`.
 *
 * The panels anchor to triggers of different heights: the nav links are 32px
 * and the icon buttons 36px, both centred in the same 36px content box, so a
 * nav link's bottom edge sits 2px above an icon's. The mega menu clears its
 * own trigger with a `pt-4` bridge and lands 14px below the content box; the
 * icon dropdowns used `mt-2` off a taller trigger and landed at 8px — six
 * pixels high, and visibly out of line with the mega menu when you moved
 * between them.
 *
 * Stated here so the two stay locked together. It doubles as the hover bridge
 * on the account menu: as padding on a wrapper rather than a margin on the
 * panel, the gap is part of the panel's hit area, so a pointer crossing it
 * doesn't leave the menu and dismiss it.
 */
const PANEL_DROP = 'pt-[14px]';

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[hsl(var(--pb-rose-deep))] text-[10px] font-medium text-white">
      {count}
    </span>
  );
}

/**
 * The storefront header: a full-width bar in three zones — nav links left,
 * the PariBelle wordmark dead-centre, action icons right. A CSS grid with a
 * fixed centre column (rather than flex + margins) is what keeps the
 * wordmark truly centred on the viewport regardless of how many categories
 * load into the left column or how many icons render on the right.
 *
 * The wrapper is `fixed`, not `sticky` — it never occupies layout space, so
 * every page's first section runs right to the top of the viewport with the
 * bar floating over it from the very first frame, not after a reserved band
 * of body background scrolls away. The bar itself firms up its background
 * past a small scroll threshold, since content passing behind needs more
 * separation once it's no longer the hero.
 */
export function Header() {
  const pathname = usePathname();
  const { data: categories = [] } = useCategories();
  const { totalItems, openCart } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const { user, isLoggedIn, logout } = useCurrentUser();

  // Same test the admin pages themselves use (lib/auth.ts, useAdminAuth). Only
  // gates which nav links render; the /admin route guards itself server-side.
  const isAdmin = isLoggedIn && user?.role === 'super_admin';

  const [scrolled, setScrolled] = React.useState(false);
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [accountOpen, setAccountOpen] = React.useState(false);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const accountCloseTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const accountRef = React.useRef<HTMLDivElement | null>(null);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const clearAccountCloseTimer = () => {
    if (accountCloseTimer.current) {
      clearTimeout(accountCloseTimer.current);
      accountCloseTimer.current = null;
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

  /**
   * Close immediately, for the header's own non-category targets.
   *
   * Moving between two elements inside the header never fires the header's
   * `onMouseLeave`, and only the category links had an `onMouseEnter` — so
   * hovering Kurtis and then sliding across to Home, About or the wordmark
   * left `activeMenu` set and the panel hanging open over the page. The delay
   * used when leaving the bar entirely is deliberately skipped here: the
   * pointer has arrived somewhere definite that isn't the menu, so there is no
   * diagonal-travel gap to protect against and waiting only looks sticky.
   */
  const closeMegaMenuNow = () => {
    clearCloseTimer();
    setActiveMenu(null);
  };

  /**
   * The account menu opens on hover as well as on click.
   *
   * Hover alone would strand anyone without a pointer, so the button stays a
   * real toggle: tapping it still opens and closes the menu, and the same
   * click also serves keyboard users arriving via Enter. The close is delayed
   * for the same reason the mega menu's is — a pointer travelling from the
   * icon towards the menu momentarily leaves both.
   *
   * Notifications are deliberately NOT given this treatment. Opening that
   * panel marks nothing read on its own, but it is the surface people act
   * from, and having it appear because a pointer passed over the bell on its
   * way to the cart would be a panel nobody asked for, covering the page.
   */
  const openAccountMenu = () => {
    clearAccountCloseTimer();
    setAccountOpen(true);
  };

  const scheduleCloseAccountMenu = () => {
    clearAccountCloseTimer();
    accountCloseTimer.current = setTimeout(() => setAccountOpen(false), 120);
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

  React.useEffect(() => {
    return () => {
      clearCloseTimer();
      clearAccountCloseTimer();
    };
  }, []);

  /**
   * Dismiss the account menu on a click anywhere outside it.
   *
   * This replaces a `fixed inset-0` click-catcher that sat at z-10 over the
   * whole viewport whenever the menu was open. It caught outside clicks, but
   * it also swallowed every pointer event underneath — with the menu open the
   * cart and wishlist icons beside it were unclickable. Harmless enough while
   * the menu only opened on a deliberate click; not once a passing pointer
   * can open it.
   */
  React.useEffect(() => {
    if (!accountOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };

    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [accountOpen]);

  // The panel now opens for every top-level category, stocked or not — an
  // empty one (Jewellery, for now) gets a "coming soon" state from MegaMenu
  // rather than no panel at all.
  const activeCategory = categories.find((c) => c.id === activeMenu);

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
    if (pathname === '/admin' || pathname.startsWith('/admin/')) return 'admin';
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

  return (
    <>
      <header
        onMouseLeave={scheduleCloseMegaMenu}
        className={cn(
          'fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-all duration-300 ease-pb',
          scrolled
            ? 'border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-ivory)/0.94)] shadow-pb-lg'
            : 'border-transparent bg-[hsl(var(--pb-blush-wash)/0.55)]'
        )}
      >
        <div className="relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          {/* Left zone: hamburger on mobile, nav links from md up. Natural
              width, never squeezed — the logo below is centred by absolute
              position instead of a grid track, so it can't force this
              column to shrink and wrap category names onto two lines. */}
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={() => setMobileNavOpen(true)}
              className={`${PILL_ITEM} p-2 hover:bg-[hsl(var(--pb-blush-wash))] md:hidden`}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5 text-[hsl(var(--pb-ink))]" />
            </button>

            <nav className="relative hidden items-center md:flex">
              {STATIC_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onMouseEnter={closeMegaMenuNow}
                  onFocus={closeMegaMenuNow}
                  className={navLinkClass(activeNavKey === 'home')}
                >
                  {link.label}
                </Link>
              ))}

              {categories.map((cat) => {
                const isActive = activeNavKey === cat.id;
                return (
                  // A link, not a button: hovering (or focusing) opens the mega
                  // menu, but the category name itself stays a real link — a
                  // click goes straight to the category page. MegaMenu renders a
                  // "coming soon" state for a category with no children, so it is
                  // safe to open the panel for every anchor category.
                  <Link
                    key={cat.id}
                    href={`/category/${cat.slug}`}
                    onMouseEnter={() => openMegaMenu(cat.id)}
                    onFocus={() => openMegaMenu(cat.id)}
                    className={navLinkClass(isActive)}
                  >
                    {cat.name}
                  </Link>
                );
              })}

              {LOOKBOOK_ENABLED && (
                <Link
                  href="/lookbook"
                  onMouseEnter={closeMegaMenuNow}
                  onFocus={closeMegaMenuNow}
                  className={navLinkClass(activeNavKey === 'lookbook')}
                >
                  Lookbook
                </Link>
              )}
              <Link
                href="/about"
                onMouseEnter={closeMegaMenuNow}
                onFocus={closeMegaMenuNow}
                className={navLinkClass(activeNavKey === 'about')}
              >
                About
              </Link>

              {isAdmin && (
                <>
                  <Link
                    href="/admin"
                    onMouseEnter={closeMegaMenuNow}
                    onFocus={closeMegaMenuNow}
                    className={navLinkClass(activeNavKey === 'admin')}
                  >
                    Admin
                  </Link>
                  {/* A plain anchor, not next/link: /pom is the OMS, a separate
                      Next app behind a rewrite, so it needs a full navigation
                      rather than a client route transition to a path this app
                      does not have. */}
                  <a
                    href="/pom"
                    onMouseEnter={closeMegaMenuNow}
                    onFocus={closeMegaMenuNow}
                    className={navLinkClass(false)}
                  >
                    OMS
                  </a>
                </>
              )}

              {/* Mega menu hangs off the nav rather than spanning the viewport, so
                  it stays visually attached to the links it belongs to. The
                  wrapper sizes to the panel's own content (via MegaMenu's
                  `w-fit`) instead of always claiming a fixed 60rem, capped so it
                  never overflows a narrow viewport; `onMouseEnter` cancels the
                  pending close so moving the pointer down into the panel doesn't
                  dismiss it. */}
              {activeCategory && (
                <div
                  onMouseEnter={clearCloseTimer}
                  onMouseLeave={scheduleCloseMegaMenu}
                  // The `pt-4` is a transparent bridge: it keeps a visible gap
                  // between the bar and the panel and gives the pointer a strip
                  // to cross without triggering `mouseleave`.
                  className="absolute left-0 top-full max-w-[calc(100vw-2rem)] pt-4"
                >
                  <MegaMenu category={activeCategory} onNavigate={() => setActiveMenu(null)} />
                </div>
              )}
            </nav>
          </div>

          {/* Centre zone: the wordmark, pinned to the true centre of the bar
              via absolute positioning rather than a grid track — so it never
              fights the left/right zones for space and can't force either
              to shrink. */}
          <Link
            href="/"
            onMouseEnter={closeMegaMenuNow}
            className={`${PILL_ITEM} absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1 font-logo text-2xl tracking-wide text-[hsl(var(--pb-ink))] hover:text-[hsl(var(--pb-rose-deep))] md:text-3xl`}
          >
            PariBelle
          </Link>

          {/* Right zone: account, wishlist, cart. */}
          <div onMouseEnter={closeMegaMenuNow} className="flex shrink-0 items-center gap-0.5">
            {/* Signed out, the icon is a shortcut to the login page. Signed in,
                it opens the account menu — which is the only place on the
                storefront a customer can sign out from. */}
            {isLoggedIn ? (
              <div
                ref={accountRef}
                onMouseEnter={openAccountMenu}
                onMouseLeave={scheduleCloseAccountMenu}
                className="relative hidden md:block"
              >
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
                  // Same two-part shape as the mega menu: an outer wrapper
                  // whose top padding is the transparent bridge across the
                  // gap, and the panel itself inside it. The menu is a DOM
                  // child of the hover region, so pointer travel from the icon
                  // through the bridge and into the menu never leaves it.
                  <div className={cn('absolute right-0 top-full z-20', PANEL_DROP)}>
                    <div
                      role="menu"
                      className="min-w-[220px] rounded-sm border border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-ivory))] p-2 shadow-pb-md"
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
                  </div>
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
          </div>
        </div>
      </header>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} categories={categories} />
    </>
  );
}
