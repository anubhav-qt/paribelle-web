/**
 * Shared product card helpers.
 */

export function isOutOfStock(stockQuantity: number): boolean {
  return stockQuantity === 0;
}

export function isLowStock(stockQuantity: number, threshold: number = 10): boolean {
  return stockQuantity > 0 && stockQuantity < threshold;
}

export function getDisplayImage(featuredImage?: string, images?: string[]): string | undefined {
  return featuredImage || images?.[0];
}
