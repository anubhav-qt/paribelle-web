'use client';

import Link from 'next/link';
import { Star, Calendar, ExternalLink, Heart } from 'lucide-react';
import { getCurrencySymbol } from '@/lib/currency';
import { getProductImageUrl } from '@/lib/image-url';
import { calculateDiscount, getStockStatus, formatRating } from '@/lib/product';
import { useWishlist } from '@/contexts/WishlistContext';
import { useVendorContext } from '@/contexts/VendorContext';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { Product, Category } from '@/types/product';

interface ProductGridProps {
  products: Product[];
  currency: string;
  isLocationFilterActive?: boolean;
  showLocationInfo?: boolean;
}

export default function ProductGrid({ 
  products, 
  currency, 
  isLocationFilterActive = false,
  showLocationInfo = true 
}: ProductGridProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isVendorStore } = useVendorContext();
  const theme = useThemeClasses();
  
  // Split products by location if filter is active
  const productsWithLocation = isLocationFilterActive 
    ? products.filter(p => p.vendor?.cityId || p.vendor?.subLocationId)
    : products;
    
  const productsWithoutLocation = isLocationFilterActive
    ? products.filter(p => !p.vendor?.cityId && !p.vendor?.subLocationId)
    : [];

  const renderProduct = (product: Product) => {
    const discount = calculateDiscount(product.price, product.compareAtPrice);
    const stockStatus = getStockStatus(product);
    
    if (!product.slug) {
      console.warn('Product missing slug:', product.id, product.name);
      return null;
    }

    return (
      <div key={product.id} className={theme.combine('group/card rounded-lg overflow-hidden hover:shadow-xl transition-all relative', isVendorStore ? 'vendor-product-card' : 'border border-border bg-card')}>
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist({
              productId: product.id,
              name: product.name,
              slug: product.slug,
              price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
              image: getProductImageUrl(product),
              vendorId: product.vendor?.id || '',
              vendorName: product.vendor?.businessName || product.vendor?.storeName || '',
              vendorSlug: product.vendor?.subdomain,
              addedAt: Date.now(),
            });
          }}
          className="absolute top-3 right-3 z-10 p-2 bg-white/90 dark:bg-gray-800/90 rounded-full hover:bg-white dark:hover:bg-gray-800 transition-all shadow-md"
          aria-label="Add to wishlist"
        >
          <Heart 
            className={`w-5 h-5 ${
              isInWishlist(product.id) 
                ? 'fill-red-600 text-red-600' 
                : 'text-gray-600 dark:text-gray-300'
            }`} 
          />
        </button>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <Link href={product.productType === 'booking' && product.attributes?.tour?.tourMode ? `/tours/${product.slug}` : `/products/${product.slug}`}>
            <img
              src={getProductImageUrl(product)}
              alt={product.name}
              className="w-full h-full object-cover group-hover/card:scale-105 transition-transform"
            />
          </Link>
          {discount && (
            <span className="absolute top-2 left-2 bg-accent text-primary-foreground px-2 py-1 rounded text-xs font-bold">
              {discount}% OFF
            </span>
          )}
          {product.productType === 'booking' && (
            <span className="absolute top-2 right-2 bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Booking
            </span>
          )}
          {product.productType === 'physical' && product.stockQuantity === 0 && !product.hasVariants && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                SOLD OUT
              </span>
            </div>
          )}
        </div>
        <div className="p-4">
          <Link href={product.productType === 'booking' && product.attributes?.tour?.tourMode ? `/tours/${product.slug}` : `/products/${product.slug}`}>
            <h3 className={theme.combine('font-medium mb-1 line-clamp-2 text-sm min-h-[40px] transition-colors', theme.text, isVendorStore ? 'group-hover/card:vendor-primary' : 'group-hover/card:text-primary')}>
              {product.name}
            </h3>
          </Link>
          <div className="flex items-center gap-1 mb-2">
            <div className="flex items-center gap-1 bg-accent text-primary-foreground px-2 py-0.5 rounded text-xs">
              <span className="font-semibold">
                {formatRating(product.averageRating)}
              </span>
              <Star className="w-3 h-3 fill-current" />
            </div>
            <span className="text-xs text-muted-foreground">
              ({product.reviewCount})
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={theme.combine('text-lg font-bold', isVendorStore ? 'vendor-product-price' : theme.text)}>
              {getCurrencySymbol(currency)}{Number(product.price).toFixed(2)}
            </span>
            {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
              <span className={theme.combine('text-xs line-through', theme.textMuted)}>
                {getCurrencySymbol(currency)}{Number(product.compareAtPrice).toFixed(2)}
              </span>
            )}
          </div>
          
          {/* Stock Status */}
          {stockStatus && (
            <div className="mt-2">
              <span className={`text-xs font-semibold ${
                stockStatus.severity === 'error' ? 'text-red-600 dark:text-red-400' :
                stockStatus.severity === 'warning' ? 'text-orange-600 dark:text-orange-400' :
                'text-green-600 dark:text-green-400'
              }`}>
                {stockStatus.label}
              </span>
            </div>
          )}
          
          {/* Variation indicator */}
          {((product.isParent && (product.variations?.length ?? 0) > 0) ||
            (product.hasVariants && (product.productVariants?.length ?? 0) > 0)) && (
            <div className="mt-2 text-xs text-muted-foreground">
              {(product.isParent ? product.variations?.length : product.productVariants?.length) ?? 0} options available
            </div>
          )}
          
          {showLocationInfo && isLocationFilterActive && product.vendor?.locationCity && (
            <div className={theme.combine('text-xs mt-1', theme.textMuted)}>
              📍 {product.vendor.locationCity.name}
              {product.vendor.locationSubLocation && ` - ${product.vendor.locationSubLocation.name}`}
            </div>
          )}
          
          {/* Vendor Name - Always show if available */}
          {product.vendor && (
            <div className={theme.combine('text-xs mt-1', theme.textMuted)}>
              by{' '}
              {product.vendor.subdomain ? (
                <a
                  href={`http://${product.vendor.subdomain}.localhost:3000`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={theme.combine('hover:underline inline-flex items-center gap-0.5', isVendorStore ? 'vendor-themed-link' : 'text-primary hover:text-primary/80')}
                >
                  {product.vendor.businessName || product.vendor.storeName}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ) : (
                <span className={theme.combine('font-medium', theme.text)}>
                  {product.vendor.businessName || product.vendor.storeName}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* Products with Location */}
      {productsWithLocation.length > 0 && (
        <div className={productsWithoutLocation.length > 0 && isLocationFilterActive ? "mb-6" : ""}>
          {isLocationFilterActive && productsWithoutLocation.length > 0 && (
            <h3 className={theme.combine('text-sm font-semibold mb-3', theme.text)}>
              Available in Selected Location ({productsWithLocation.length})
            </h3>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {productsWithLocation.map(renderProduct)}
          </div>
        </div>
      )}

      {/* Products without Location (Unknown Location) */}
      {productsWithoutLocation.length > 0 && (
        <div>
          {isLocationFilterActive && (
            <h3 className={theme.combine('text-sm font-semibold mb-3', theme.text)}>
              Other Locations ({productsWithoutLocation.length})
            </h3>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {productsWithoutLocation.map(renderProduct)}
          </div>
        </div>
      )}

      {products.length === 0 && (
        <p className={theme.combine('text-center py-8', theme.textMuted)}>No products found</p>
      )}
    </div>
  );
}
