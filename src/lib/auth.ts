/**
 * Extract vendorId from JWT token
 * Falls back to localStorage or user object
 */
export function getVendorId(): string | null {
  try {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (!userStr || !token) {
      return null;
    }

    const user = JSON.parse(userStr);
    
    // First check user object
    if (user.vendorId) {
      return user.vendorId;
    }
    
    // Then check localStorage
    const storedVendorId = localStorage.getItem('vendorId');
    if (storedVendorId) {
      return storedVendorId;
    }
    
    // Finally, extract from JWT token
    try {
      const tokenParts = token.split('.');
      if (tokenParts.length === 3) {
        const base64Url = tokenParts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        const decodedToken = JSON.parse(jsonPayload);
        
        if (decodedToken.vendorId) {
          // Cache it in localStorage
          localStorage.setItem('vendorId', decodedToken.vendorId);
          return decodedToken.vendorId;
        }
      }
    } catch (decodeError) {
      console.error('Error decoding JWT token:', decodeError);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting vendorId:', error);
    return null;
  }
}

/**
 * Get current user's ID
 */
export function getUserId(): string | null {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    const user = JSON.parse(userStr);
    return user.id || null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
}

/**
 * Check if current user is super admin
 */
export function isSuperAdmin(): boolean {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    
    const user = JSON.parse(userStr);
    return user.role === 'super_admin';
  } catch (error) {
    return false;
  }
}

/**
 * Platform vendor ID for marketplace products created by super admin
 */
export const PLATFORM_VENDOR_ID = '00000000-0000-0000-0000-000000000001';

/**
 * Get vendorId for product creation
 * For super admin: returns platform vendor ID (for marketplace products)
 * For vendors: returns their vendorId
 */
export function getProductVendorId(): string | null {
  if (isSuperAdmin()) {
    return PLATFORM_VENDOR_ID; // Use platform vendor ID for marketplace products
  }
  return getVendorId(); // Use actual vendorId for vendor products
}
