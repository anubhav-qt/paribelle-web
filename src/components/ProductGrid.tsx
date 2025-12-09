'use client';

import Link from 'next/link';
import { Star, Calendar, ExternalLink } from 'lucide-react';
import { getCurrencySymbol } from '@/lib/currency';
import { getProductImageUrl } from '@/lib/image-url';
import { useLocale } from 'next-intl';

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  price: string | number;
  compareAtPrice?: string | number;
  featuredImage: string;
  images?: string[];
  averageRating: string | number;
  reviewCount: number;
  categories: Category[];
  productType?: 'physical' | 'booking';
  attributes?: {
    booking?: {
      durationUnit?: 'hours' | 'days' | 'sessions';
      duration?: number;
    };
  };
  vendor?: {
    id: string;
    name: string;
    businessName?: string;
    subdomain?: string;
    cityId?: string | null;
    subLocationId?: string | null;
    locationCity?: { id: string; name: string } | null;
    locationSubLocation?: { id: string; name: string } | null;
  };
}

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
  const locale = useLocale();
  const getDiscount = (price: string | number, compareAtPrice?: string | number) => {
    if (!compareAtPrice || Number(compareAtPrice) <= Number(price)) return null;
    return Math.round(((Number(compareAtPrice) - Number(price)) / Number(compareAtPrice)) * 100);
  };

  // Split products by location if filter is active
  const productsWithLocation = isLocationFilterActive 
    ? products.filter(p => p.vendor?.cityId || p.vendor?.subLocationId)
    : products;
    
  const productsWithoutLocation = isLocationFilterActive
    ? products.filter(p => !p.vendor?.cityId && !p.vendor?.subLocationId)
    : [];

  const renderProduct = (product: Product) => {
    const discount = getDiscount(product.price, product.compareAtPrice);
    
    if (!product.slug) {
      console.warn('Product missing slug:', product.id, product.name);
      return null;
    }

    return (
      <div key={product.id} className="group/card border border-border rounded-lg overflow-hidden hover:shadow-xl transition-all bg-card">
        <Link href={`/${locale}/products/${product.slug}`} className="block">
          <div className="relative aspect-square overflow-hidden bg-muted">
            <img
              src={getProductImageUrl(product)}
              alt={product.name}
              className="w-full h-full object-cover group-hover/card:scale-105 transition-transform"
            />
            {discount && (
              <span className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
                {discount}% OFF
              </span>
            )}
            {product.productType === 'booking' && (
              <span className="absolute top-2 right-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Booking
              </span>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-medium mb-1 line-clamp-2 text-sm min-h-[40px] text-foreground group-hover/card:text-primary transition-colors">
              {product.name}
            </h3>
            <div className="flex items-center gap-1 mb-2">
              <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded text-xs">
                <span className="font-semibold">
                  {Number(product.averageRating).toFixed(1)}
                </span>
                <Star className="w-3 h-3 fill-white" />
              </div>
              <span className="text-xs text-muted-foreground">
                ({product.reviewCount})
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-foreground">
                {getCurrencySymbol(currency)}{Number(product.price).toFixed(2)}
              </span>
              {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                <span className="text-xs text-muted-foreground line-through">
                  {getCurrencySymbol(currency)}{Number(product.compareAtPrice).toFixed(2)}
                </span>
              )}
            </div>
            {showLocationInfo && isLocationFilterActive && product.vendor?.locationCity && (
              <div className="text-xs text-muted-foreground mt-1">
                📍 {product.vendor.locationCity.name}
                {product.vendor.locationSubLocation && ` - ${product.vendor.locationSubLocation.name}`}
              </div>
            )}
          </div>
        </Link>
        {product.vendor?.subdomain && (
          <div className="px-4 pb-3">
            <span
              onClick={(e) => {
                e.preventDefault();
                window.open(`http://${product.vendor?.subdomain}.localhost:3000`, '_blank', 'noopener,noreferrer');
              }}
              className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 cursor-pointer"
            >
              <span>{product.vendor.businessName || product.vendor.name}</span>
              <ExternalLink className="w-3 h-3" />
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Products with Location */}
      {productsWithLocation.length > 0 && (
        <div className={productsWithoutLocation.length > 0 && isLocationFilterActive ? "mb-6" : ""}>
          {isLocationFilterActive && productsWithoutLocation.length > 0 && (
            <h3 className="text-sm font-semibold text-foreground mb-3">
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
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Other Locations ({productsWithoutLocation.length})
            </h3>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {productsWithoutLocation.map(renderProduct)}
          </div>
        </div>
      )}

      {products.length === 0 && (
        <p className="text-muted-foreground text-center py-8">No products found</p>
      )}
    </div>
  );
}
