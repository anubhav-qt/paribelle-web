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
 * Clear authentication data from localStorage
 */
export function clearAuth() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Trigger storage event for other tabs/components
  window.dispatchEvent(new Event('storage'));
  window.dispatchEvent(new CustomEvent('userChanged'));
}

/**
 * Handle authentication errors (401 Unauthorized)
 * Clears auth data and redirects to login
 */
export function handleAuthError(_error?: any): void {
  clearAuth();

  const params = new URLSearchParams();
  params.set('error', 'session_expired');
  params.set('message', 'Your session has expired. Please login again.');

  // Come back here after signing in. The login page reads `returnUrl`.
  const currentPath = window.location.pathname;
  if (currentPath && currentPath !== '/login') {
    params.set('returnUrl', currentPath + window.location.search);
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
