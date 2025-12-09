'use client';

import { useCart } from '@/contexts/CartContext';
import { X, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { formatPrice } from '@/lib/currency';
import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';

export default function CartDrawer() {
  const { items, totalPrice, totalItems, isOpen, closeCart, updateQuantity, removeFromCart } = useCart();
  const pathname = usePathname();
  
  // Try to get locale from next-intl, fallback to pathname extraction for vendor routes
  let locale = 'en';
  try {
    locale = useLocale();
  } catch {
    // Extract locale from pathname for vendor routes
    const localeMatch = pathname?.match(/^\/(en|hi|mr)/);
    locale = localeMatch ? localeMatch[1] : 'en';
  }

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-card shadow-2xl z-50 flex flex-col animate-slide-in border-l border-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Shopping Cart</h2>
            {totalItems > 0 && (
              <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                {totalItems}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-muted rounded-full transition-colors text-foreground"
            aria-label="Close cart"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Your cart is empty</h3>
              <p className="text-muted-foreground mb-6">Add items to get started</p>
              <button
                onClick={closeCart}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 border border-border rounded-lg hover:border-primary/50 transition-colors"
                >
                  {/* Product Image */}
                  <Link
                    href={`/${locale}/products/${item.slug}`}
                    onClick={closeCart}
                    className="flex-shrink-0"
                  >
                    <img
                      src={item.image || '/placeholder-product.png'}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/${locale}/products/${item.slug}`}
                      onClick={closeCart}
                      className="font-semibold text-foreground hover:text-primary line-clamp-2 mb-1"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-muted-foreground mb-2">{item.vendorName}</p>
                    
                    {item.productType === 'booking' && (
                      <span className="inline-block text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded mb-2">
                        Booking
                      </span>
                    )}

                    <div className="flex items-center justify-between">
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="p-1 hover:bg-muted rounded transition-colors text-foreground"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium text-foreground">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="p-1 hover:bg-muted rounded transition-colors text-foreground"
                          disabled={
                            item.productType === 'physical' &&
                            item.stockQuantity !== undefined &&
                            item.quantity >= item.stockQuantity
                          }
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="font-bold text-foreground">
                          {formatPrice(item.price * item.quantity, 'INR')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(item.price, 'INR')} each
                        </p>
                      </div>
                    </div>

                    {/* Stock Warning */}
                    {item.productType === 'physical' && item.stockQuantity !== undefined && item.stockQuantity < 5 && (
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                        Only {item.stockQuantity} left in stock
                      </p>
                    )}
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="flex-shrink-0 p-2 hover:bg-destructive/10 rounded-full transition-colors group"
                    aria-label="Remove item"
                  >
                    <Trash2 className="w-5 h-5 text-muted-foreground group-hover:text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border p-6 space-y-4">
            {/* Subtotal */}
            <div className="flex justify-between items-center text-lg">
              <span className="font-semibold text-muted-foreground">Subtotal:</span>
              <span className="font-bold text-foreground">
                {formatPrice(totalPrice, 'INR')}
              </span>
            </div>

            <p className="text-sm text-muted-foreground">
              Shipping and taxes calculated at checkout
            </p>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Link
                href={`/${locale}/checkout`}
                onClick={closeCart}
                className="block w-full bg-primary text-primary-foreground text-center py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Proceed to Checkout
              </Link>
              <button
                onClick={closeCart}
                className="block w-full border border-border text-foreground text-center py-3 rounded-lg font-semibold hover:bg-muted transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
