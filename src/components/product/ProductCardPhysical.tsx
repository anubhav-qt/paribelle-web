'use client';

import { ProductCardShell } from './ProductCardShell';
import { Rating } from '@/components/ui/Rating';
import { PriceTag } from '@/components/ui/PriceTag';
import { useWishlist } from '@/contexts/WishlistContext';
import { STORE_VENDOR_ID } from '@/lib/auth';
import { isOutOfStock, isLowStock, getDisplayImage } from '@/lib/utils/product-card-helpers';
import type { BadgeVariant } from '@/components/ui/Badge';

export interface ProductCardPhysicalProps {
  id: string;
  slug: string;
  name: string;
  featuredImage?: string;
  images?: string[];
  price: number;
  compareAtPrice?: number;
  stockQuantity?: number;
  averageRating?: number;
  reviewCount?: number;
  vendorId?: string;
  variantSwatches?: string[];
  isNew?: boolean;
  categoryLabel?: string;
  sectionBg?: 'light' | 'tinted';
}

export default function ProductCardPhysical({
  id,
  slug,
  name,
  featuredImage,
  images,
  price,
  compareAtPrice,
  stockQuantity = 0,
  averageRating = 0,
  reviewCount = 0,
  vendorId,
  variantSwatches,
  isNew,
  categoryLabel,
  sectionBg,
}: ProductCardPhysicalProps) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const displayImage = getDisplayImage(featuredImage, images) || '/placeholder-image.svg';
  const secondImage = images && images.length > 1 ? images[1] : undefined;
  const outOfStock = isOutOfStock(stockQuantity);
  const lowStock = isLowStock(stockQuantity);
  const wishlisted = isInWishlist(id);

  // The discount percentage already surfaces inline in PriceTag below, right
  // next to the struck-through price — a separate "X% Off" tag up here would
  // just repeat it a few lines apart, which reads as clutter once both sit
  // in the same caption instead of one floating over the photo.
  const badges: Array<{ label: string; variant: BadgeVariant }> = [];
  if (outOfStock) badges.push({ label: 'Sold Out', variant: 'sold-out' });
  if (isNew && !outOfStock) badges.push({ label: 'New', variant: 'new' });

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist({
      productId: id,
      name,
      slug,
      price,
      image: displayImage,
      vendorId: vendorId || STORE_VENDOR_ID,
      addedAt: Date.now(),
    });
  };

  return (
    <ProductCardShell
      href={`/products/${slug}`}
      name={name}
      image={displayImage}
      secondImage={secondImage}
      badges={badges}
      wishlisted={wishlisted}
      onToggleWishlist={handleToggleWishlist}
      sectionBg={sectionBg}
    >
      {categoryLabel && (
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.08em] text-[hsl(var(--pb-ink-faint))]">
          {categoryLabel}
        </p>
      )}
      {/* min-h reserves the full two-line slot even when a name only takes
          one line — line-clamp-2 alone only caps the tall side, so short
          and long names would otherwise leave cards in the same row sitting
          at different heights. */}
      <h3 className="mt-0.5 line-clamp-2 min-h-[2.65rem] font-display text-[1.05rem] leading-tight text-[hsl(var(--pb-ink))] transition-colors duration-150 group-hover:text-[hsl(var(--pb-rose-deep))]">
        {name}
      </h3>

      {variantSwatches && variantSwatches.length > 1 && (
        <div className="mt-1.5 flex gap-1">
          {variantSwatches.slice(0, 5).map((color, i) => (
            <span
              key={i}
              className="h-3 w-3 rounded-full border border-[hsl(var(--pb-linen))]"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}

      {reviewCount > 0 && <Rating value={averageRating} count={reviewCount} size="sm" className="mt-1.5" />}

      <PriceTag price={price} compareAtPrice={compareAtPrice} className="mt-1.5" />

      {lowStock && (
        <p className="mt-1 text-xs text-[hsl(var(--pb-warning))]">Only {stockQuantity} left</p>
      )}
    </ProductCardShell>
  );
}
