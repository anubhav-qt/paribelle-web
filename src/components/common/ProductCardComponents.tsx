import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCardImageProps {
  imageUrl: string;
  alt: string;
  children?: React.ReactNode;
}

/**
 * Reusable Product Card Image Component (Web)
 * Displays product image with Next.js Image optimization
 */
export function ProductCardImage({ imageUrl, alt, children }: ProductCardImageProps) {
  return (
    <div className="relative h-48 overflow-hidden">
      <Image
        src={imageUrl}
        alt={alt}
        fill
        className="object-cover group-hover:scale-110 transition-transform duration-300"
      />
      {children}
    </div>
  );
}

interface BadgeProps {
  text: string;
  position: 'topLeft' | 'topRight';
  className?: string;
}

/**
 * Reusable Badge Component for cards
 */
export function ProductCardBadge({ text, position, className }: BadgeProps) {
  const positionClass = position === 'topLeft' ? 'top-3 left-3' : 'top-3 right-3';
  
  return (
    <Badge className={cn('absolute', positionClass, className)}>
      {text}
    </Badge>
  );
}

interface OverlayProps {
  icon: React.ReactNode;
  text: string;
  className?: string;
}

/**
 * Reusable Bottom Overlay Component
 * Used for locations, destinations, etc.
 */
export function ProductCardOverlay({ icon, text, className }: OverlayProps) {
  return (
    <div className={cn(
      'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3',
      className
    )}>
      <div className="flex items-center gap-1 text-white text-sm">
        {icon}
        <span className="line-clamp-1">{text}</span>
      </div>
    </div>
  );
}

interface RatingProps {
  rating: number;
  reviewCount: number;
  className?: string;
}

/**
 * Reusable Rating Display Component
 */
export function ProductCardRating({ rating, reviewCount, className }: RatingProps) {
  if (reviewCount === 0) return null;
  
  return (
    <div className={cn('flex items-center gap-2 mb-3', className)}>
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
        <span className="text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
      <span className="text-xs text-gray-500">({reviewCount} reviews)</span>
    </div>
  );
}

interface VendorNameProps {
  vendorName?: string;
  className?: string;
}

/**
 * Reusable Vendor Name Component
 */
export function ProductCardVendor({ vendorName, className }: VendorNameProps) {
  if (!vendorName) return null;
  
  return (
    <p className={cn('text-xs text-gray-500 mt-2', className)}>
      by {vendorName}
    </p>
  );
}

interface PriceProps {
  price: number;
  unit?: string;
  compareAtPrice?: number;
  className?: string;
}

/**
 * Reusable Price Display Component
 */
export function ProductCardPrice({ price, unit, compareAtPrice, className }: PriceProps) {
  return (
    <div className={className}>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-primary">
          ₹{price.toLocaleString('en-IN')}
        </span>
        {compareAtPrice && compareAtPrice > price && (
          <span className="text-sm text-gray-500 line-through">
            ₹{compareAtPrice.toLocaleString('en-IN')}
          </span>
        )}
      </div>
      {unit && (
        <span className="text-sm text-gray-600">{unit}</span>
      )}
    </div>
  );
}

interface StockBadgeProps {
  stockQuantity: number;
}

/**
 * Stock Status Badge Component
 */
export function ProductCardStockBadge({ stockQuantity }: StockBadgeProps) {
  if (stockQuantity === 0) {
    return (
      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
        <Badge variant="destructive" className="text-lg px-4 py-2">
          Out of Stock
        </Badge>
      </div>
    );
  }
  
  if (stockQuantity < 10) {
    return (
      <div className="flex items-center gap-1 text-sm text-amber-700 bg-amber-50 px-2 py-1 rounded">
        <span>⚠️ Only {stockQuantity} left</span>
      </div>
    );
  }
  
  return null;
}
