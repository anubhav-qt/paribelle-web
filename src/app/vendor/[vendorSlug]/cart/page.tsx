'use client';

import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/currency';
import Link from 'next/link';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import CategoryNav from '@/components/CategoryNav';
import VendorHeader from '@/components/VendorHeader';

export default function VendorCartPage() {
  const params = useParams();
  const vendorSlug = params.vendorSlug as string;
  const { items, totalPrice, totalItems, updateQuantity, removeFromCart } = useCart();
  const [vendor, setVendor] = useState<any>(null);

  // Filter items for this vendor only
  const vendorItems = items.filter(item => item.vendorSlug === vendorSlug);
  const vendorTotalPrice = vendorItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const vendorTotalItems = vendorItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    // Fetch vendor data for logo
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/vendors/${vendorSlug}`)
      .then(res => res.json())
      .then(data => setVendor(data))
      .catch(err => console.error('Error fetching vendor:', err));

    // Check for authToken in URL (from login redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const authToken = urlParams.get('authToken');
    
    if (authToken) {
      console.log('Auth token found in URL, storing in localStorage and cookie');
      localStorage.setItem('token', authToken);
      
      // Fetch user data
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      })
        .then(res => res.json())
        .then(userData => {
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('User data stored:', userData.email);
        })
        .catch(err => console.error('Error fetching user data:', err));
      
      // Set cookie for this subdomain
      document.cookie = `token=${authToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      
      // Remove token from URL for security
      urlParams.delete('authToken');
      const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  if (vendorItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <VendorHeader 
          vendorSlug={vendorSlug}
          vendorId={vendor?.id}
          searchPlaceholder="Search in this store..."
        />

        <CategoryNav vendorId={vendor?.id} vendorSlug={vendorSlug} mode="scroll" />

        {/* Empty Cart */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg shadow-sm border p-12">
              <ShoppingBag className="w-24 h-24 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">
                Add some products to get started!
              </p>
              <Link
                href={`/vendor/${vendorSlug}`}
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
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
    <div className="min-h-screen bg-gray-50">
      <VendorHeader 
        vendorSlug={vendorSlug}
        vendorId={vendor?.id}
        searchPlaceholder="Search in this store..."
      />

      <CategoryNav vendorId={vendor?.id} vendorSlug={vendorSlug} mode="scroll" />

      <div className="container mx-auto px-4 py-8">\n        <h1 className="text-3xl font-bold mb-8">Shopping Cart ({vendorTotalItems} items)</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {vendorItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {/* Product Image */}
                  <Link href={`/vendor/${vendorSlug}/products/${item.slug}`} className="flex-shrink-0">
                    <img
                      src={item.image?.startsWith('http') ? item.image : `${process.env.NEXT_PUBLIC_API_URL}${item.image}`}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg hover:opacity-80 transition-opacity"
                    />
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/vendor/${vendorSlug}/products/${item.slug}`}
                      className="font-semibold text-lg text-gray-900 hover:text-blue-600 line-clamp-2 mb-1"
                    >
                      {item.name}
                    </Link>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-gray-900">
                        {formatPrice(item.price, 'INR')}
                      </p>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-3">
                        <div className="flex items-center border rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-2 hover:bg-gray-100 rounded-l-lg transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-2 hover:bg-gray-100 rounded-r-lg transition-colors"
                            disabled={item.quantity >= (item.stockQuantity || 999)}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.productId)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove from cart"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="mt-3 text-right">
                      <p className="text-sm text-gray-600">Subtotal:</p>
                      <p className="text-lg font-bold text-gray-900">
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
            <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({vendorTotalItems} items)</span>
                  <span className="font-medium">{formatPrice(vendorTotalPrice, 'INR')}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span className="font-medium">Calculated at checkout</span>
                </div>
              </div>

              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between text-lg font-bold">
                  <span>Estimated Total</span>
                  <span className="text-blue-600">{formatPrice(vendorTotalPrice, 'INR')}</span>
                </div>
              </div>

              <Link
                href={`/vendor/${vendorSlug}/checkout`}
                className="block w-full px-6 py-3 bg-blue-600 text-white text-center rounded-lg font-semibold hover:bg-blue-700 transition-colors mb-3"
              >
                Proceed to Checkout
              </Link>

              <Link
                href={`/vendor/${vendorSlug}`}
                className="block w-full px-6 py-3 border border-gray-300 text-gray-700 text-center rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </Link>

              {/* Security Badges */}
              <div className="mt-6 pt-6 border-t">
                <p className="text-xs text-gray-500 text-center">
                  🔒 Secure Checkout • 📦 Fast Delivery
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
