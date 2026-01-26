/**
 * Booking Actions Utilities
 * Reusable helper functions for booking, enquiry, share, email, and phone actions
 */

interface ProductInfo {
  id?: string;
  slug: string;
  name: string;
  price?: number;
}

/**
 * Navigate to booking page for a product/tour
 * @param productSlug - The product slug
 * @param hasAvailability - Whether the product has availability (e.g., tour departures, booking slots)
 * @returns void
 */
export const handleBookNow = (productSlug: string, hasAvailability: boolean = true): void => {
  if (!hasAvailability) {
    alert('No availability at the moment. Please enquire for custom dates or options.');
    return;
  }
  window.location.href = `/products/${productSlug}`;
};

/**
 * Navigate to contact/enquiry page with pre-filled information
 * @param product - Product information
 * @param customMessage - Optional custom message to pre-fill
 * @returns void
 */
export const handleEnquireNow = (
  product: ProductInfo,
  customMessage?: string
): void => {
  const subject = encodeURIComponent(product.name);
  const message = encodeURIComponent(
    customMessage || `Hi, I'm interested in ${product.name}. Can you provide more details?`
  );
  window.location.href = `/contact?subject=${subject}&message=${message}`;
};

/**
 * Share product/tour via Web Share API or fallback to clipboard
 * @param product - Product information
 * @param description - Optional description for sharing
 * @returns Promise<void>
 */
export const handleShare = async (
  product: ProductInfo,
  description?: string
): Promise<void> => {
  const url = `${window.location.origin}/tours/${product.slug}`;
  const shareData = {
    title: product.name,
    text: description || `Check out ${product.name}`,
    url: url,
  };

  try {
    // Check if Web Share API is available
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      // Fallback: Copy to clipboard
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  } catch (error) {
    // User cancelled or error occurred
    console.error('Error sharing:', error);
    // Fallback: Try copying to clipboard
    try {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    } catch (clipboardError) {
      console.error('Clipboard error:', clipboardError);
      alert(`Share this link: ${url}`);
    }
  }
};

/**
 * Initiate email to vendor/support
 * @param product - Product information
 * @param vendorEmail - Vendor email address (optional)
 * @param supportEmail - Support email address (default)
 * @returns void
 */
export const handleEmail = (
  product: ProductInfo,
  vendorEmail?: string,
  supportEmail: string = 'support@marketplace.com'
): void => {
  const email = vendorEmail || supportEmail;
  const subject = encodeURIComponent(`Inquiry about ${product.name}`);
  const body = encodeURIComponent(
    `Hi,\n\nI am interested in ${product.name}.\n\nPlease provide more information.\n\nThank you!`
  );
  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
};

/**
 * Initiate phone call to vendor/support
 * @param phoneNumber - Phone number to call
 * @param product - Product information (optional, for tracking)
 * @returns void
 */
export const handleCall = (phoneNumber: string, product?: ProductInfo): void => {
  if (!phoneNumber) {
    alert('Phone number not available. Please use email or enquiry form.');
    return;
  }
  // Remove any non-digit characters except +
  const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
  window.location.href = `tel:${cleanNumber}`;
};

/**
 * Add product to cart (for physical products)
 * @param productId - Product ID
 * @param quantity - Quantity to add
 * @returns Promise<boolean>
 */
export const handleAddToCart = async (
  productId: string,
  quantity: number = 1
): Promise<boolean> => {
  try {
    // This would typically call your cart API
    // For now, using localStorage as example
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item.productId === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ productId, quantity });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    return true;
  } catch (error) {
    console.error('Error adding to cart:', error);
    return false;
  }
};

/**
 * Check availability for booking products
 * @param productId - Product ID
 * @param date - Selected date
 * @returns Promise<boolean>
 */
export const checkAvailability = async (
  productId: string,
  date: string
): Promise<boolean> => {
  try {
    // This would typically call your availability API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${productId}/availability?date=${date}`
    );
    const data = await response.json();
    return data.available || false;
  } catch (error) {
    console.error('Error checking availability:', error);
    return false;
  }
};

/**
 * Format phone number for display
 * @param phoneNumber - Raw phone number
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Format as +XX XXXXX XXXXX or similar
  if (cleaned.startsWith('+91') && cleaned.length === 13) {
    return `+91 ${cleaned.slice(3, 8)} ${cleaned.slice(8)}`;
  }
  
  return cleaned;
};

/**
 * Open WhatsApp with pre-filled message
 * @param phoneNumber - WhatsApp number (with country code)
 * @param product - Product information
 * @returns void
 */
export const handleWhatsApp = (phoneNumber: string, product: ProductInfo): void => {
  const message = encodeURIComponent(
    `Hi, I'm interested in ${product.name}. Can you provide more details?`
  );
  const cleanNumber = phoneNumber.replace(/[^\d]/g, '');
  window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
};
