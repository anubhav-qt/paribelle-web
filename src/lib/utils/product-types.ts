/**
 * Product type utilities and helpers
 */

export type ProductType = 'physical' | 'booking' | 'tour';

/**
 * Get emoji icon for product type
 */
export function getProductTypeIcon(type?: ProductType | string): string {
  switch (type) {
    case 'tour':
      return '🎫';
    case 'booking':
      return '📅';
    case 'physical':
      return '📦';
    default:
      return '';
  }
}

/**
 * Get label for product type
 */
export function getProductTypeLabel(type?: ProductType | string): string {
  switch (type) {
    case 'tour':
      return 'Tour Package';
    case 'booking':
      return 'Service Booking';
    case 'physical':
      return 'Physical Product';
    default:
      return 'Product';
  }
}

/**
 * Check if product is a tour
 */
export function isTourProduct(productType?: string, attributes?: any): boolean {
  return productType === 'booking' && attributes?.tour?.tourMode === true;
}

/**
 * Check if product is a booking service
 */
export function isBookingProduct(productType?: string, attributes?: any): boolean {
  return productType === 'booking' && (!attributes?.tour || attributes?.tour?.tourMode !== true);
}

/**
 * Check if product is physical
 */
export function isPhysicalProduct(productType?: string): boolean {
  return productType === 'physical';
}

/**
 * Get primary product type from category type distribution
 */
export function getPrimaryProductType(typeDistribution?: {
  physical: number;
  booking: number;
  tour: number;
}): ProductType {
  if (!typeDistribution) return 'physical';
  
  const { physical, booking, tour } = typeDistribution;
  
  if (tour > physical && tour > booking) return 'tour';
  if (booking > physical) return 'booking';
  return 'physical';
}
