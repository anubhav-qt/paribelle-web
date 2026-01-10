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

/**
 * Clear authentication data from localStorage
 */
export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('vendorId');
  
  // Trigger storage event for other tabs/components
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new CustomEvent('userChanged'));
}

/**
 * Handle authentication errors (401 Unauthorized)
 * Clears auth data and redirects to login
 */
export function handleAuthError(error?: any): void {
  // Clear auth data
  clearAuth();
  
  // Check if error message indicates email verification needed
  const errorMessage = error?.message || '';
  const isEmailVerificationError = errorMessage.toLowerCase().includes('verify') || 
                                   errorMessage.toLowerCase().includes('verification');
  
  // Redirect to login with appropriate message
  const currentPath = window.location.pathname;
  const params = new URLSearchParams();
  
  if (isEmailVerificationError) {
    params.set('error', 'email_not_verified');
    params.set('message', 'Please verify your email before logging in.');
  } else {
    params.set('error', 'session_expired');
    params.set('message', 'Your session has expired. Please login again.');
  }
  
  // Preserve the current path as redirect target
  if (currentPath && currentPath !== '/login') {
    params.set('redirect', currentPath);
  }
  
  window.location.href = `/login?${params.toString()}`;
}

/**
 * Check API response for authentication errors
 * Call this after every API fetch to handle 401 responses
 */
export async function checkAuthResponse(response: Response): Promise<Response> {
  if (response.status === 401) {
    try {
      const errorData = await response.clone().json();
      handleAuthError(errorData);
    } catch {
      handleAuthError();
    }
    throw new Error('Unauthorized');
  }
  return response;
}
