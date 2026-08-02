/**
 * Shared product utility functions
 * Used across both mobile and web platforms
 */

export interface ProductBase {
  id: string;
  name: string;
  slug?: string;
  price: string | number;
  compareAtPrice?: string | number;
  featuredImage?: string;
  averageRating?: string | number;
  reviewCount?: number;
  stockQuantity?: number;
  vendor?: {
    id?: string;
    storeName?: string;
    businessName?: string;
    subdomain?: string;
  };
}

/**
 * Calculate discount percentage between original and sale price
 */
export const calculateDiscount = (
  price: string | number,
  compareAtPrice?: string | number
): number | null => {
  if (!compareAtPrice || Number(compareAtPrice) <= Number(price)) {
    return null;
  }
  return Math.round(((Number(compareAtPrice) - Number(price)) / Number(compareAtPrice)) * 100);
};

/**
 * Parse numeric value from string or number
 */
export const parseNumericValue = (value: string | number | undefined): number => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

/**
 * Check if product is out of stock
 */
export const isOutOfStock = (product: ProductBase): boolean => {
  return product.stockQuantity === 0;
};

/**
 * Check if product has low stock (5 or fewer items)
 */
export const isLowStock = (product: ProductBase): boolean => {
  return (
    product.stockQuantity !== undefined &&
    product.stockQuantity > 0 &&
    product.stockQuantity <= 5
  );
};

/**
 * Get stock status label
 */
export const getStockStatus = (
  product: ProductBase
): { label: string; severity: 'error' | 'warning' | 'success' | 'info' } | null => {
  if (product.stockQuantity === undefined) {
    return null;
  }

  if (product.stockQuantity === 0) {
    return { label: 'Out of Stock', severity: 'error' };
  }

  if (product.stockQuantity <= 5) {
    return { label: `Only ${product.stockQuantity} left!`, severity: 'warning' };
  }

  return { label: `${product.stockQuantity} in stock`, severity: 'success' };
};

/**
 * Get vendor display name
 */
export const getVendorName = (product: ProductBase): string | null => {
  if (!product.vendor) {
    return null;
  }
  return product.vendor.businessName || product.vendor.storeName || null;
};

/**
 * Format rating display
 */
export const formatRating = (rating: string | number | undefined): string => {
  const numRating = parseNumericValue(rating);
  return numRating.toFixed(1);
};

/**
 * Check if product has discount
 */
export const hasDiscount = (product: ProductBase): boolean => {
  return calculateDiscount(product.price, product.compareAtPrice) !== null;
};
