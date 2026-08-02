'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Heart, ShoppingBag, User, Menu } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { MegaMenu } from './MegaMenu';
import { MobileNav } from './MobileNav';
import { SearchOverlay } from './SearchOverlay';
import { cn } from '@/lib/utils';

const STATIC_LINKS = [{ label: 'New In', href: '/category/new-in' }];

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

  const [scrolled, setScrolled] = React.useState(false);
  const [activeMenu, setActiveMenu] = React.useState<string | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  React.useEffect(() => {
    setActiveMenu(null);
  }, [pathname]);

  const activeCategory = categories.find((c) => c.id === activeMenu);

  return (
    <>
      <header
        onMouseLeave={() => setActiveMenu(null)}
        className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3"
      >
        <div
          className={cn(
            'relative flex items-center gap-0.5 rounded-full border px-2 py-1.5 backdrop-blur-xl transition-all duration-300 ease-pb',
            scrolled
              ? 'border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-ivory)/0.94)] shadow-pb-lg'
              : 'border-[hsl(var(--pb-linen)/0.7)] bg-[hsl(var(--pb-ivory)/0.72)] shadow-pb-md'
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

          <nav className="hidden items-center md:flex">
            {STATIC_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${NAV_LINK} text-[hsl(var(--pb-ink-muted))] hover:bg-[hsl(var(--pb-blush-wash))] hover:text-[hsl(var(--pb-rose-deep))]`}
              >
                {link.label}
              </Link>
            ))}

            {categories.map((cat) => (
              // A link, not a button: hovering opens the mega menu, but the
              // category name itself has to be clickable and keyboard-reachable.
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                onMouseEnter={() => setActiveMenu(cat.id)}
                onFocus={() => setActiveMenu(cat.id)}
                className={cn(
                  NAV_LINK,
                  activeMenu === cat.id
                    ? 'bg-[hsl(var(--pb-blush-wash))] text-[hsl(var(--pb-rose-deep))]'
                    : 'text-[hsl(var(--pb-ink-muted))] hover:bg-[hsl(var(--pb-blush-wash))] hover:text-[hsl(var(--pb-rose-deep))]'
                )}
              >
                {cat.name}
              </Link>
            ))}

            <Link
              href="/lookbook"
              className={`${NAV_LINK} text-[hsl(var(--pb-ink-muted))] hover:bg-[hsl(var(--pb-blush-wash))] hover:text-[hsl(var(--pb-rose-deep))]`}
            >
              Lookbook
            </Link>
            <Link
              href="/about"
              className={`${NAV_LINK} text-[hsl(var(--pb-ink-muted))] hover:bg-[hsl(var(--pb-blush-wash))] hover:text-[hsl(var(--pb-rose-deep))]`}
            >
              About
            </Link>

            <Divider />
          </nav>

          <button onClick={() => setSearchOpen(true)} aria-label="Search" className={ICON_BUTTON}>
            <Search className="h-5 w-5 text-[hsl(var(--pb-ink))]" />
          </button>
          <Link href="/login" aria-label="Account" className={`${ICON_BUTTON} hidden md:inline-flex`}>
            <User className="h-5 w-5 text-[hsl(var(--pb-ink))]" />
          </Link>
          <Link href="/wishlist" aria-label="Wishlist" className={ICON_BUTTON}>
            <Heart className="h-5 w-5 text-[hsl(var(--pb-ink))]" />
            <CountBadge count={wishlistCount} />
          </Link>
          <button onClick={openCart} aria-label="Cart" className={ICON_BUTTON}>
            <ShoppingBag className="h-5 w-5 text-[hsl(var(--pb-ink))]" />
            <CountBadge count={totalItems} />
          </button>

          {/* Mega menu hangs off the pill rather than spanning the viewport, so
              it stays visually attached to the object it belongs to. */}
          {activeCategory && (
            <div className="absolute left-1/2 top-full hidden w-[min(60rem,calc(100vw-2rem))] -translate-x-1/2 pt-3 md:block">
              <MegaMenu category={activeCategory} onNavigate={() => setActiveMenu(null)} />
            </div>
          )}
        </div>
      </header>

      <MobileNav open={mobileNavOpen} onClose={() => setMobileNavOpen(false)} categories={categories} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
