'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Heart, ShoppingCart, Trash2, ExternalLink } from 'lucide-react';
import ThemeRenderer from '@/components/ThemeRenderer';
import CategoryNav from '@/components/CategoryNav';
import Footer from '@/components/Footer';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { getCurrencySymbol } from '@/lib/currency';

export default function WishlistPage() {
  const router = useRouter();
  const params = useParams();
  const { items, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const [currency, setCurrency] = useState('INR');

  useEffect(() => {
    // Fetch currency setting
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/settings/currency`)
      .then(res => res.json())
      .then(data => {
        setCurrency(data.value || 'INR');
      })
      .catch(err => console.error('Error fetching currency setting:', err));
  }, []);

  const handleMoveToCart = (item: any) => {
    // Add to cart
    addToCart({
      productId: item.productId,
      name: item.name,
      slug: item.slug,
      price: item.price,
      quantity: 1,
      image: item.image,
      vendorId: item.vendorId,
      vendorName: item.vendorName,
      vendorSlug: item.vendorSlug,
      productType: 'physical',
    });
    
    // Remove from wishlist
    removeFromWishlist(item.productId);
  };

  return (
    <div className="min-h-screen bg-background">
      <ThemeRenderer component="header" />
      <CategoryNav mode="scroll" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Heart className="w-8 h-8 text-red-600 fill-red-600" />
                My Wishlist
              </h1>
              <p className="text-muted-foreground mt-2">
                {items.length} {items.length === 1 ? 'item' : 'items'} saved for later
              </p>
            </div>
            {items.length > 0 && (
              <button
                onClick={clearWishlist}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>

          {/* Wishlist Items */}
          {items.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-lg border border-border">
              <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-foreground mb-2">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-6">
                Save items you love to your wishlist and check them out anytime!
              </p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                >
                  {/* Product Image */}
                  <Link
                    href={
                      item.vendorSlug
                        ? `/vendor/${item.vendorSlug}/products/${item.slug}`
                        : `/products/${item.slug}`
                    }
                    className="block relative aspect-square overflow-hidden bg-muted"
                  >
                    <img
                      src={item.image || '/placeholder-product.png'}
                      alt={item.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  {/* Product Info */}
                  <div className="p-4">
                    <Link
                      href={
                        item.vendorSlug
                          ? `/vendor/${item.vendorSlug}/products/${item.slug}`
                          : `/products/${item.slug}`
                      }
                      className="block"
                    >
                      <h3 className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-2 mb-2">
                        {item.name}
                      </h3>
                    </Link>

                    {/* Vendor */}
                    {item.vendorName && (
                      <p className="text-sm text-muted-foreground mb-2">
                        by {item.vendorName}
                      </p>
                    )}

                    {/* Price */}
                    <p className="text-xl font-bold text-foreground mb-4">
                      {getCurrencySymbol(currency)}
                      {item.price.toLocaleString()}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleMoveToCart(item)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>
                      <button
                        onClick={() => removeFromWishlist(item.productId)}
                        className="px-3 py-2 border border-border rounded-lg hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Continue Shopping */}
          {items.length > 0 && (
            <div className="mt-8 text-center">
              <Link
                href="/"
                className="inline-block px-6 py-3 border border-border rounded-lg hover:bg-muted text-foreground transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
