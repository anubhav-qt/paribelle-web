'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { PriceTag } from '@/components/ui/PriceTag';
import { showAlert } from '@/lib/dialog';
import { useCart } from '@/contexts/CartContext';
import { STORE_VENDOR_ID } from '@/lib/auth';
import type { HeroBlobProduct } from './heroBlobProducts';

interface HeroBlobPanelProps {
  product: HeroBlobProduct;
  image: string;
  /** Panel content is hidden from assistive tech and untabbable while collapsed. */
  interactive: boolean;
}

/**
 * The order-details panel that appears in the space a hero blob opens up on
 * hover. Placeholder copy (name/price/description), but size selection,
 * add-to-cart and buy-now are fully wired to the real cart — swapping in
 * live product data later is just a different `HeroBlobProduct`.
 */
export function HeroBlobPanel({ product, image, interactive }: HeroBlobPanelProps) {
  const { addToCart, closeCart } = useCart();
  const router = useRouter();
  const [size, setSize] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<'cart' | 'buy' | null>(null);

  const selectedVariant = product.variants.find((v) => v.size === size) || null;
  const tabIndex = interactive ? 0 : -1;

  const buildCartItem = () => ({
    productId: product.productId,
    variantId: selectedVariant ? `${product.productId}-${selectedVariant.size}` : undefined,
    variantAttributes: selectedVariant ? { Size: selectedVariant.size, Color: product.colorLabel } : undefined,
    name: selectedVariant ? `${product.name} — ${selectedVariant.size}` : product.name,
    slug: product.slug,
    price: product.price,
    quantity: 1,
    image,
    vendorId: STORE_VENDOR_ID,
    stockQuantity: selectedVariant?.stockQuantity,
    maxQuantity: selectedVariant?.stockQuantity,
  });

  const handleAddToCart = (): boolean => {
    if (!size) {
      showAlert('Please select a size.', 'warning');
      return false;
    }
    if (!selectedVariant || selectedVariant.stockQuantity <= 0) {
      showAlert('Sorry, this size is out of stock.', 'warning');
      return false;
    }
    return addToCart(buildCartItem());
  };

  const onAddToCart = () => {
    setBusy('cart');
    handleAddToCart();
    setBusy(null);
  };

  const onBuyNow = () => {
    setBusy('buy');
    if (!localStorage.getItem('token')) {
      if (handleAddToCart()) {
        closeCart();
        router.push(`/login?returnUrl=${encodeURIComponent('/checkout')}`);
      }
      setBusy(null);
      return;
    }
    if (handleAddToCart()) router.push('/checkout');
    setBusy(null);
  };

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col justify-center gap-2.5 overflow-hidden px-4 py-3 lg:gap-3 lg:px-5">
      <div>
        <p className="text-[0.6rem] font-medium uppercase tracking-[0.12em] text-[hsl(var(--pb-rose-deep))]">
          {product.colorLabel}
        </p>
        <h3 className="font-display text-lg leading-tight text-[hsl(var(--pb-ink))] lg:text-xl">
          {product.name}
        </h3>
      </div>

      <p className="hidden text-xs leading-snug text-[hsl(var(--pb-ink-muted))] lg:line-clamp-2 lg:block">
        {product.description}
      </p>

      <PriceTag price={product.price} compareAtPrice={product.compareAtPrice} size="md" />

      <div>
        <p className="mb-1.5 text-[0.65rem] font-medium uppercase tracking-[0.08em] text-[hsl(var(--pb-ink-faint))]">
          Size{size && <span className="ml-1.5 normal-case text-[hsl(var(--pb-rose-deep))]">{size}</span>}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {product.variants.map((variant) => {
            const outOfStock = variant.stockQuantity <= 0;
            const selected = size === variant.size;
            return (
              <button
                key={variant.size}
                type="button"
                tabIndex={tabIndex}
                disabled={outOfStock}
                onClick={() => setSize(variant.size)}
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-[0.7rem] font-medium transition-colors duration-150 ${
                  selected
                    ? 'border-[hsl(var(--pb-rose-deep))] bg-[hsl(var(--pb-rose-deep))] text-white'
                    : outOfStock
                      ? 'cursor-not-allowed border-[hsl(var(--pb-linen))] text-[hsl(var(--pb-ink-faint))] line-through'
                      : 'border-[hsl(var(--pb-ink-faint))] text-[hsl(var(--pb-ink))] hover:border-[hsl(var(--pb-rose-deep))]'
                }`}
              >
                {variant.size}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-1 flex gap-2">
        <Button
          type="button"
          variant="gold-outline"
          size="sm"
          tabIndex={tabIndex}
          loading={busy === 'cart'}
          onClick={onAddToCart}
          className="flex-1"
        >
          Add to Cart
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          tabIndex={tabIndex}
          loading={busy === 'buy'}
          onClick={onBuyNow}
          className="flex-1"
        >
          Buy Now
        </Button>
      </div>
    </div>
  );
}
