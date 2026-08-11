'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { getCurrencySymbol } from '@/lib/currency';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { AccountShell } from '@/components/account/AccountShell';
import { ProductCardShell } from '@/components/product/ProductCardShell';

export default function WishlistPage() {
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [currency, setCurrency] = useState('INR');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/settings/currency`)
      .then(res => res.json())
      .then(data => setCurrency(data.value || 'INR'))
      .catch(err => console.error('Error fetching currency setting:', err));
  }, []);

  const handleMoveToCart = (item: any) => {
    addToCart({
      productId: item.productId,
      name: item.name,
      slug: item.slug,
      price: item.price,
      quantity: 1,
      image: item.image,
      vendorId: item.vendorId,
    });
    removeFromWishlist(item.productId);
  };

  if (items.length === 0) {
    return (
      <AccountShell>
        <EmptyState
          icon={<Heart className="h-10 w-10" />}
          title="Your wishlist is empty"
          description="Save pieces you love and check them out anytime."
          action={
            <Link href="/">
              <Button size="sm">Start Shopping</Button>
            </Link>
          }
          className="min-h-[60vh]"
        />
      </AccountShell>
    );
  }

  return (
    <AccountShell wide>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 font-display text-3xl text-[hsl(var(--pb-ink))]">
            <Heart className="h-7 w-7 fill-[hsl(var(--pb-rose))] text-[hsl(var(--pb-rose))]" />
            My Wishlist
          </h1>
          <p className="mt-1 text-sm text-[hsl(var(--pb-ink-muted))]">
            {items.length} {items.length === 1 ? 'item' : 'items'} saved for later
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={clearWishlist}>
          Clear All
        </Button>
      </div>

      {/* Same hangtag chassis as the rest of the storefront — the wishlist
          heart doubles as the remove action here (it's always filled, since
          every item on this page is by definition already saved), so there's
          no second icon-only button competing for the same corner. */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6 xl:grid-cols-5">
        {items.map((item) => (
          // The Add to Cart button sits outside ProductCardShell on
          // purpose — its children render inside the card's own link, and a
          // <button> nested in an <a> is invalid HTML that also fights the
          // link for the click.
          <div key={item.productId}>
            <ProductCardShell
              href={`/products/${item.slug}`}
              name={item.name}
              image={item.image || '/placeholder-image.svg'}
              wishlisted
              onToggleWishlist={(e) => {
                e.preventDefault();
                e.stopPropagation();
                removeFromWishlist(item.productId);
              }}
            >
              <h3 className="line-clamp-2 min-h-[2.65rem] font-display text-[1.05rem] leading-tight text-[hsl(var(--pb-ink))] transition-colors duration-150 group-hover:text-[hsl(var(--pb-rose-deep))]">
                {item.name}
              </h3>
              <p className="mt-1.5 font-display text-lg text-[hsl(var(--pb-ink))]">
                {getCurrencySymbol(currency)}{item.price.toLocaleString()}
              </p>
            </ProductCardShell>
            <Button size="sm" fullWidth className="mt-2" onClick={() => handleMoveToCart(item)}>
              <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link href="/">
          <Button variant="ghost">Continue Shopping</Button>
        </Link>
      </div>
    </AccountShell>
  );
}
