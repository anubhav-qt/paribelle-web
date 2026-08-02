'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { getCurrencySymbol } from '@/lib/currency';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

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
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Wishlist' }]} className="mb-6" />

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

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.productId} className="group">
            <Link
              href={`/products/${item.slug}`}
              className="block aspect-[4/5] overflow-hidden rounded-sm bg-[hsl(var(--pb-shell))]"
            >
              <img
                src={item.image || '/placeholder-image.svg'}
                alt={item.name}
                className="h-full w-full object-cover transition-transform duration-500 ease-pb group-hover:scale-105"
              />
            </Link>
            <div className="pt-3">
              <Link
                href={`/products/${item.slug}`}
                className="line-clamp-2 text-sm font-medium text-[hsl(var(--pb-ink))] hover:text-[hsl(var(--pb-rose-deep))]"
              >
                {item.name}
              </Link>
              <p className="mt-1.5 font-display text-lg text-[hsl(var(--pb-ink))]">
                {getCurrencySymbol(currency)}{item.price.toLocaleString()}
              </p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" fullWidth onClick={() => handleMoveToCart(item)}>
                  <ShoppingCart className="h-3.5 w-3.5" /> Add to Cart
                </Button>
                <button
                  onClick={() => removeFromWishlist(item.productId)}
                  aria-label="Remove from wishlist"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-[hsl(var(--pb-linen))] text-[hsl(var(--pb-ink-muted))] hover:border-[hsl(var(--pb-danger))] hover:text-[hsl(var(--pb-danger))] transition-colors duration-150"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link href="/">
          <Button variant="ghost">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
}
