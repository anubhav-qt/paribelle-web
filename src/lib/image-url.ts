/**
 * Get the full URL for an image, handling both full URLs and relative paths
 * @param imagePath - The image path (can be full URL starting with http:// or relative path starting with /)
 * @returns The full URL to the image
 */
export function getImageUrl(imagePath: string | undefined | null): string {
  if (!imagePath) {
    return '/placeholder-image.svg';
  }
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // If it's a relative path, prepend the API URL
  // Force use of backend port 3001
  const apiUrl = 'http://localhost:3001';
  const fullUrl = `${apiUrl}${imagePath}`;
  console.log('getImageUrl:', { imagePath, apiUrl, fullUrl });
  return fullUrl;
}

/**
 * Get the product image URL, trying images array first, then featuredImage
 * @param product - The product object with images array and/or featuredImage
 * @returns The full URL to the primary product image
 */
export function getProductImageUrl(product: { images?: string[]; featuredImage?: string }): string {
  const imagePath = product.images?.[0] || product.featuredImage;
  return getImageUrl(imagePath);
}
