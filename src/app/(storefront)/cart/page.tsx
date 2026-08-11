'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/currency';
import { Button } from '@/components/ui/Button';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { EmptyState } from '@/components/ui/EmptyState';
import { Breadcrumb } from '@/components/ui/Breadcrumb';

export default function CartPage() {
  const { items, totalPrice, totalItems, updateQuantity, removeFromCart } = useCart();
  const router = useRouter();

  // Signed-out shoppers go straight to sign-in rather than to a checkout
  // page that would just bounce them back with a duplicate prompt.
  const handleCheckoutClick = () => {
    if (!localStorage.getItem('token')) {
      router.push(`/login?returnUrl=${encodeURIComponent('/checkout')}`);
    } else {
      router.push('/checkout');
    }
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-10 w-10" />}
        title="Your bag is empty"
        description="Add some pieces to get started."
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
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Bag' }]} className="mb-6" />
      <h1 className="font-display text-3xl text-[hsl(var(--pb-ink))]">Your Bag ({totalItems})</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {items.map((item) => (
            <div key={item.id} className="flex gap-4 border-b border-[hsl(var(--pb-linen))] pb-6">
              <Link href={`/products/${item.slug}`} className="shrink-0">
                <img
                  src={item.image?.startsWith('http') ? item.image : `${process.env.NEXT_PUBLIC_API_URL}${item.image}`}
                  alt={item.name}
                  className="h-32 w-24 rounded-sm object-cover"
                />
              </Link>
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/products/${item.slug}`} className="font-medium text-[hsl(var(--pb-ink))] hover:text-[hsl(var(--pb-rose-deep))]">
                      {item.name}
                    </Link>
                    {item.variantAttributes && (
                      <p className="mt-0.5 text-xs text-[hsl(var(--pb-ink-faint))]">
                        {Object.values(item.variantAttributes).join(' · ')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    aria-label="Remove item"
                    className="shrink-0 text-[hsl(var(--pb-ink-faint))] hover:text-[hsl(var(--pb-danger))] transition-colors duration-150"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-auto flex items-end justify-between">
                  <QuantityStepper
                    value={item.quantity}
                    onChange={(q) => updateQuantity(item.id, q)}
                    max={item.stockQuantity || 99}
                  />
                  <div className="text-right">
                    <p className="font-display text-lg text-[hsl(var(--pb-ink))]">{formatPrice(item.price * item.quantity, 'INR')}</p>
                    <p className="text-xs text-[hsl(var(--pb-ink-faint))]">{formatPrice(item.price, 'INR')} each</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 rounded-sm border border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-shell))] p-6">
            <h2 className="font-display text-xl text-[hsl(var(--pb-ink))]">Order Summary</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-[hsl(var(--pb-ink-muted))]">
                <span>Subtotal ({totalItems} items)</span>
                <span>{formatPrice(totalPrice, 'INR')}</span>
              </div>
              <p className="text-xs text-[hsl(var(--pb-ink-faint))]">Inclusive of all taxes</p>
              <div className="flex justify-between text-[hsl(var(--pb-ink-muted))]">
                <span>Shipping</span>
                <span>Calculated at checkout</span>
              </div>
            </div>
            <div className="mt-4 flex justify-between border-t border-[hsl(var(--pb-linen))] pt-4">
              <span className="font-medium text-[hsl(var(--pb-ink))]">Estimated Total</span>
              <span className="font-display text-xl text-[hsl(var(--pb-rose-deep))]">{formatPrice(totalPrice, 'INR')}</span>
            </div>
            <Button fullWidth size="lg" className="mt-6" onClick={handleCheckoutClick}>
              Proceed to Checkout
            </Button>
            <Link href="/" className="mt-3 block">
              <Button fullWidth variant="ghost">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
