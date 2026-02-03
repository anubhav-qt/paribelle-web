'use client';

import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';
import {
  ProductCardImage,
  ProductCardBadge,
  ProductCardRating,
  ProductCardPrice,
  ProductCardVendor,
  ProductCardStockBadge,
} from '@/components/common/ProductCardComponents';
import {
  calculateDiscountPercent,
  hasDiscount,
  isOutOfStock,
  isLowStock,
  getDisplayImage,
} from '@/lib/utils/product-card-helpers';

interface PhysicalProductCardProps {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string;
  featuredImage?: string;
  images?: string[];
  price: number;
  compareAtPrice?: number;
  stockQuantity?: number;
  averageRating?: number;
  reviewCount?: number;
  vendorName?: string;
}

export default function PhysicalProductCard({
  id,
  slug,
  name,
  shortDescription,
  featuredImage,
  images,
  price,
  compareAtPrice,
  stockQuantity = 0,
  averageRating = 0,
  reviewCount = 0,
  vendorName,
}: PhysicalProductCardProps) {
  const displayImage = getDisplayImage(featuredImage, images) || '/placeholder-product.jpg';
  const discount = hasDiscount(price, compareAtPrice);
  const discountPercent = calculateDiscountPercent(price, compareAtPrice);
  const lowStock = isLowStock(stockQuantity);
  const outOfStock = isOutOfStock(stockQuantity);

  return (
    <Link href={`/products/${slug}`}>
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
        <ProductCardImage imageUrl={displayImage} alt={name}>
          {/* Type Badge */}
          <ProductCardBadge 
            text="📦 Product" 
            position="topLeft" 
            className="bg-blue-600 text-white"
          />

          {/* Discount Badge */}
          {discount && (
            <ProductCardBadge 
              text={`${discountPercent}% OFF`} 
              position="topRight" 
              className="bg-red-600 text-white"
            />
          )}

          {/* Stock Status */}
          {outOfStock && <ProductCardStockBadge stockQuantity={0} />}
        </ProductCardImage>

        <CardContent className="p-4">
          {/* Product Name */}
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {name}
          </h3>

          {/* Short Description */}
          {shortDescription && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {shortDescription}
            </p>
          )}

          {/* Rating */}
          <ProductCardRating 
            rating={averageRating} 
            reviewCount={reviewCount}
          />

          {/* Stock Warning */}
          {lowStock && (
            <div className="mb-3">
              <ProductCardStockBadge stockQuantity={stockQuantity} />
            </div>
          )}

          {/* Pricing */}
          <div className="flex items-center justify-between pt-3 border-t">
            <ProductCardPrice 
              price={price} 
              compareAtPrice={compareAtPrice}
            />
            
            <button 
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium flex items-center gap-2"
              onClick={(e) => {
                e.preventDefault();
                // Add to cart logic
              }}
              disabled={outOfStock}
            >
              <ShoppingCart className="w-4 h-4" />
              {outOfStock ? 'Sold Out' : 'Add'}
            </button>
          </div>

          {/* Vendor Name */}
          <ProductCardVendor vendorName={vendorName} />
        </CardContent>
      </Card>
    </Link>
  );
}
