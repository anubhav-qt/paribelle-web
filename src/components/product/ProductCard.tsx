import ProductCardPhysical from './ProductCardPhysical';
import type { Product } from '@/types/product';

export interface ProductCardProps {
  product: Product;
}

/**
 * The storefront product card. PariBelle sells physical goods only, so there
 * is a single presentation — the type dispatch this file used to do (booking,
 * tour) went away with those product types.
 */
export default function ProductCard({ product }: ProductCardProps) {
  const price = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
  const compareAtPrice =
    product.compareAtPrice != null
      ? typeof product.compareAtPrice === 'string'
        ? parseFloat(product.compareAtPrice)
        : product.compareAtPrice
      : undefined;
  const averageRating =
    typeof product.averageRating === 'string' ? parseFloat(product.averageRating) : product.averageRating;

  return (
    <ProductCardPhysical
      id={product.id}
      slug={product.slug}
      name={product.name}
      featuredImage={product.featuredImage}
      images={product.images}
      price={price}
      compareAtPrice={compareAtPrice}
      stockQuantity={product.stockQuantity}
      averageRating={averageRating || 0}
      reviewCount={product.reviewCount || 0}
      vendorId={product.vendorId || product.vendor?.id}
      isNew={
        product.createdAt
          ? Date.now() - new Date(product.createdAt).getTime() < 1000 * 60 * 60 * 24 * 21
          : false
      }
    />
  );
}
