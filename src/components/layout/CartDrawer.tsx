'use client';

import Link from 'next/link';
import { Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/currency';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';

const FREE_SHIPPING_THRESHOLD = 1999;

export default function CartDrawer() {
  const { items, totalPrice, totalItems, isOpen, closeCart, updateQuantity, removeFromCart } = useCart();

  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - totalPrice);
  const progress = Math.min(100, (totalPrice / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <Drawer open={isOpen} onClose={closeCart} title={`Your Bag${totalItems ? ` (${totalItems})` : ''}`}>
      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-10 w-10" />}
          title="Your bag is empty"
          description="Discover pieces made to be treasured."
          action={
            <Button size="sm" onClick={closeCart}>
              Continue Shopping
            </Button>
          }
          className="px-6"
        />
      ) : (
        <div className="flex h-full flex-col">
          <div className="border-b border-[hsl(var(--pb-linen))] px-6 py-4">
            <div className="mb-2 h-1 w-full overflow-hidden rounded-full bg-[hsl(var(--pb-shell))]">
              <div
                className="h-full bg-[hsl(var(--pb-rose))] transition-all duration-500 ease-pb"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-[hsl(var(--pb-ink-muted))]">
              {remaining > 0
                ? `Add ${formatPrice(remaining, 'INR')} more for complimentary shipping`
                : 'You’ve unlocked complimentary shipping'}
            </p>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4">
                <Link href={`/products/${item.slug}`} onClick={closeCart} className="shrink-0">
                  <img
                    src={item.image || '/placeholder-image.svg'}
                    alt={item.name}
                    className="h-24 w-20 rounded-sm object-cover"
                  />
                </Link>
                <div className="flex flex-1 flex-col min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={closeCart}
                      className="text-sm font-medium text-[hsl(var(--pb-ink))] line-clamp-2 hover:text-[hsl(var(--pb-rose-deep))]"
                    >
                      {item.name}
                    </Link>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      aria-label="Remove item"
                      className="shrink-0 text-[hsl(var(--pb-ink-faint))] hover:text-[hsl(var(--pb-danger))] transition-colors duration-150"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  {item.variantAttributes && (
                    <p className="mt-0.5 text-xs text-[hsl(var(--pb-ink-faint))]">
                      {Object.values(item.variantAttributes).join(' · ')}
                    </p>
                  )}
                  <div className="mt-2 flex items-center justify-between">
                    <QuantityStepper
                      value={item.quantity}
                      onChange={(q) => updateQuantity(item.id, q)}
                      max={item.stockQuantity || item.maxQuantity || 99}
                    />
                    <span className="text-sm font-medium text-[hsl(var(--pb-ink))]">
                      {formatPrice(item.price * item.quantity, 'INR')}
                    </span>
                  </div>
                  {item.stockQuantity !== undefined &&
                    item.stockQuantity < 5 && (
                      <p className="mt-1 text-xs text-[hsl(var(--pb-warning))]">
                        Only {item.stockQuantity} left
                      </p>
                    )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3 border-t border-[hsl(var(--pb-linen))] px-6 py-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[hsl(var(--pb-ink-muted))]">Subtotal</span>
              <span className="font-display text-xl text-[hsl(var(--pb-ink))]">
                {formatPrice(totalPrice, 'INR')}
              </span>
            </div>
            <p className="text-xs text-[hsl(var(--pb-ink-faint))]">Shipping and taxes calculated at checkout</p>
            <Link href="/checkout" onClick={closeCart}>
              <Button fullWidth size="lg">
                Proceed to Checkout
              </Button>
            </Link>
            <Button variant="ghost" fullWidth onClick={closeCart}>
              Continue Shopping
            </Button>
          </div>
        </div>
      )}
    </Drawer>
  );
}
