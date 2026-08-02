/**
 * The single store this site sells for. The backend still models products as
 * belonging to a vendor, so every write needs an id — but there is only ever
 * one, so it comes from configuration rather than from the logged-in user.
 */
export const STORE_VENDOR_ID =
  process.env.NEXT_PUBLIC_STORE_VENDOR_ID || '00000000-0000-0000-0000-000000000001';

/**
 * The store's vendor id. Kept as a function (rather than callers reading the
 * constant) so the admin pages read the same way they did when the id varied.
 */
export function getVendorId(): string {
  return STORE_VENDOR_ID;
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
 * Vendor id to stamp on newly created products — always the store's own.
 */
export function getProductVendorId(): string {
  return STORE_VENDOR_ID;
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
