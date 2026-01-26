/**
 * Shared Product Card Helper Functions
 * Used across all product card components for consistent logic
 */

/**
 * Calculate discount percentage
 */
export function calculateDiscountPercent(price: number, compareAtPrice?: number): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

/**
 * Check if product has discount
 */
export function hasDiscount(price: number, compareAtPrice?: number): boolean {
  return Boolean(compareAtPrice && compareAtPrice > price);
}

/**
 * Check if product is out of stock
 */
export function isOutOfStock(stockQuantity: number): boolean {
  return stockQuantity === 0;
}

/**
 * Check if product has low stock
 */
export function isLowStock(stockQuantity: number, threshold: number = 10): boolean {
  return stockQuantity > 0 && stockQuantity < threshold;
}

/**
 * Get duration display text for booking services
 */
export function getDurationDisplay(
  duration?: number,
  durationUnit?: 'hours' | 'days' | 'sessions'
): string | null {
  if (!duration || !durationUnit) return null;

  switch (durationUnit) {
    case 'hours':
      return `${duration} hour${duration > 1 ? 's' : ''}`;
    case 'days':
      return `${duration} day${duration > 1 ? 's' : ''}`;
    case 'sessions':
      return `${duration} session${duration > 1 ? 's' : ''}`;
    default:
      return null;
  }
}

/**
 * Get price unit suffix for booking services
 */
export function getPriceUnit(durationUnit?: 'hours' | 'days' | 'sessions'): string {
  if (!durationUnit) return '';

  switch (durationUnit) {
    case 'hours':
      return '/hour';
    case 'days':
      return '/day';
    case 'sessions':
      return '/session';
    default:
      return '';
  }
}

/**
 * Calculate available seats for tours
 */
export function calculateAvailableSeats(
  totalSeats: number,
  bookedSeats: number
): number {
  return Math.max(0, totalSeats - bookedSeats);
}

/**
 * Get seats status info for tours
 */
export function getSeatsStatus(availableSeats: number): {
  text: string;
  severity: 'success' | 'warning' | 'danger';
} {
  if (availableSeats === 0) {
    return {
      text: '❌ Sold Out',
      severity: 'danger',
    };
  }
  
  if (availableSeats < 5) {
    return {
      text: `⚠️ Only ${availableSeats} left`,
      severity: 'warning',
    };
  }
  
  return {
    text: `${availableSeats} seats available`,
    severity: 'success',
  };
}

/**
 * Format destinations array to string
 */
export function formatDestinations(destinations?: string[]): string {
  if (!destinations || destinations.length === 0) return '';
  return destinations.join(', ');
}

/**
 * Capitalize first letter of string
 */
export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Get display image from product
 */
export function getDisplayImage(
  featuredImage?: string,
  images?: string[]
): string | undefined {
  return featuredImage || images?.[0];
}

/**
 * Format rating for display
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

/**
 * Check if rating should be displayed
 */
export function shouldShowRating(reviewCount: number): boolean {
  return reviewCount > 0;
}

/**
 * Get stock badge info
 */
export function getStockBadge(stockQuantity: number): {
  text: string;
  variant: 'default' | 'warning' | 'destructive';
} | null {
  if (stockQuantity === 0) {
    return {
      text: 'Out of Stock',
      variant: 'destructive',
    };
  }
  
  if (stockQuantity < 10) {
    return {
      text: `⚠️ Only ${stockQuantity} left`,
      variant: 'warning',
    };
  }
  
  return null;
}

/**
 * Format available days list (show first N items)
 */
export function formatAvailableDays(
  days?: string[],
  maxDisplay: number = 3
): { visible: string[]; remaining: number } {
  if (!days || days.length === 0) {
    return { visible: [], remaining: 0 };
  }

  const visible = days.slice(0, maxDisplay);
  const remaining = Math.max(0, days.length - maxDisplay);

  return { visible, remaining };
}

/**
 * Get booking attributes from product
 */
export function getBookingAttributes(attributes: any): {
  duration?: number;
  durationUnit?: 'hours' | 'days' | 'sessions';
  availableDays?: string[];
  location?: string;
} {
  return {
    duration: attributes?.booking?.duration,
    durationUnit: attributes?.booking?.durationUnit,
    availableDays: attributes?.booking?.availableDays,
    location: attributes?.booking?.location,
  };
}

/**
 * Get tour details from product
 */
export function getTourDetails(attributes: any): {
  destinations?: string[];
  tourType?: string;
  difficulty?: string;
  groupSize?: { min: number; max: number };
} {
  return {
    destinations: attributes?.tour?.details?.destinations,
    tourType: attributes?.tour?.details?.tourType,
    difficulty: attributes?.tour?.details?.difficulty,
    groupSize: attributes?.tour?.details?.groupSize,
  };
}
