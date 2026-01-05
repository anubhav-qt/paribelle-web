'use client';

import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/currency';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import ThemeRenderer from '@/components/ThemeRenderer';
import CategoryNav from '@/components/CategoryNav';

export default function CartPage() {
  const { items, totalPrice, totalItems, updateQuantity, removeFromCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <ThemeRenderer component="header" showLocationFilter={false} showBookingsLink={true} />
        <CategoryNav mode="navigation" />

        {/* Empty Cart */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-card rounded-lg shadow-sm border border-border p-12">
              <ShoppingBag className="w-24 h-24 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">Your cart is empty</h2>
              <p className="text-muted-foreground mb-6">
                Add some products to get started!
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ThemeRenderer component="header" showLocationFilter={false} showBookingsLink={true} />
      <CategoryNav mode="navigation" />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-foreground">Shopping Cart ({totalItems} items)</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-card rounded-lg shadow-sm border border-border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {/* Product Image */}
                  <Link href={`/products/${item.slug}`} className="flex-shrink-0">
                    <img
                      src={item.image?.startsWith('http') ? item.image : `${process.env.NEXT_PUBLIC_API_URL}${item.image}`}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg hover:opacity-80 transition-opacity"
                    />
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      className="font-semibold text-lg text-foreground hover:text-primary line-clamp-2 mb-1"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-muted-foreground mb-2">
                      {item.vendorName && `Sold by ${item.vendorName}`}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-foreground">
                        {formatPrice(item.price, 'INR')}
                      </p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-border rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-2 hover:bg-muted rounded-l-lg transition-colors text-foreground"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 py-2 font-medium min-w-[3rem] text-center text-foreground">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-2 hover:bg-muted rounded-r-lg transition-colors text-foreground"
                            disabled={item.quantity >= (item.stockQuantity || 999)}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Remove from cart"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="mt-3 text-right">
                      <p className="text-sm text-muted-foreground">Subtotal:</p>
                      <p className="text-lg font-bold text-foreground">
                        {formatPrice(item.price * item.quantity, 'INR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-sm border border-border p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4 text-foreground">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({totalItems} items)</span>
                  <span className="font-medium">{formatPrice(totalPrice, 'INR')}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Tax</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
              </div>

              <div className="border-t border-border pt-4 mb-6">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-foreground">Estimated Total</span>
                  <span className="text-primary">{formatPrice(totalPrice, 'INR')}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="block w-full px-6 py-3 bg-primary text-primary-foreground text-center rounded-lg font-semibold hover:bg-primary/90 transition-colors mb-3"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/"
                className="block w-full px-6 py-3 border border-border text-foreground text-center rounded-lg font-semibold hover:bg-muted transition-colors"
              >
                Continue Shopping
              </Link>

              {/* Security Badges */}
              <div className="mt-6 pt-6 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  🔒 Secure Checkout • 📦 Free Shipping on orders over ₹500
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
