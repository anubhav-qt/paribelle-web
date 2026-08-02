// Centralized product form utilities
import { Product } from '@/types/product';

/**
 * Convert Product to form data format
 * Handles type conversions (string | number -> number)
 */
export const productToFormData = (product: Product) => {
  return {
    name: product.name,
    description: product.description || '',
    shortDescription: product.shortDescription || '',
    price: typeof product.price === 'string' ? parseFloat(product.price) || 0 : (product.price || 0),
    compareAtPrice: typeof product.compareAtPrice === 'string' 
      ? parseFloat(product.compareAtPrice) || 0 
      : (product.compareAtPrice || 0),
    stockQuantity: product.stockQuantity || 0,
    sku: product.sku || '',
    featuredImage: product.featuredImage || '',
    images: product.images || [],
    hasVariants: product.hasVariants || product.isParent || false,
    variations: product.variations || [],
    variationThemes: product.variationThemes || [],
    productVariants: product.productVariants || [],
    variantOptions: product.variantOptions || [],
    categoryIds: product.categories?.map(c => c.id) || [],
    attributes: product.attributes || {},
  };
};

/**
 * Get empty/reset form data
 */
export const getEmptyFormData = () => ({
  name: '',
  description: '',
  shortDescription: '',
  price: 0,
  compareAtPrice: 0,
  stockQuantity: 0,
  sku: '',
  featuredImage: '',
  images: [] as string[],
  hasVariants: false,
  variations: [] as any[],
  variationThemes: [] as string[],
  productVariants: [] as any[],
  variantOptions: [] as any[],
  categoryIds: [] as string[],
  attributes: {},
});

/**
 * Convert price (string | number) to number safely
 */
export const priceToNumber = (price: string | number | undefined): number => {
  if (typeof price === 'string') {
    const parsed = parseFloat(price);
    return isNaN(parsed) ? 0 : parsed;
  }
  return price || 0;
};

/**
 * Calculate discount percentage
 */
export const calculateDiscount = (price: string | number, compareAtPrice: string | number | undefined): number | null => {
  if (!compareAtPrice) return null;
  
  const priceNum = priceToNumber(price);
  const compareNum = priceToNumber(compareAtPrice);
  
  if (compareNum <= priceNum) return null;
  
  return Math.round(((compareNum - priceNum) / compareNum) * 100);
};

/**
 * Get stock status color class
 */
export const getStockColor = (stockQuantity: number): string => {
  if (stockQuantity === 0) return 'text-red-600 font-semibold';
  if (stockQuantity < 10) return 'text-orange-600 font-semibold';
  return 'text-green-600';
};

/**
 * Get status badge color class
 */
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'draft':
      return 'bg-gray-100 text-gray-800';
    case 'archived':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Format price display with currency
 */
export const formatPrice = (price: string | number, currency: string = '₹'): string => {
  const priceNum = priceToNumber(price);
  return `${currency}${priceNum.toFixed(2)}`;
};

/**
 * Get price display for products with variants (shows range if different prices)
 */
export const getVariantPriceDisplay = (product: Product, currency: string = '₹'): { display: string; isRange: boolean } => {
  if (product.hasVariants && product.productVariants && product.productVariants.length > 0) {
    const prices = product.productVariants
      .map(v => priceToNumber(v.price))
      .filter(p => !isNaN(p) && p > 0);
    
    if (prices.length === 0) return { display: `${currency}0.00`, isRange: false };
    
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    if (minPrice === maxPrice) {
      return { display: `${currency}${minPrice.toFixed(2)}`, isRange: false };
    }
    return { display: `${currency}${minPrice.toFixed(2)} - ${currency}${maxPrice.toFixed(2)}`, isRange: true };
  }
  
  return { display: formatPrice(product.price || 0, currency), isRange: false };
};
