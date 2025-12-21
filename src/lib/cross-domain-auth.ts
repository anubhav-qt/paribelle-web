/**
 * Helper functions for cross-domain authentication using secure cookies
 */

/**
 * Gets a cookie value by name
 * @param name - Cookie name
 * @returns Cookie value or null if not found
 */
export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  
  return null;
}

/**
 * Sets a cookie with proper domain for cross-subdomain access
 * @param name - Cookie name
 * @param value - Cookie value
 * @param maxAge - Max age in seconds (default: 7 days)
 */
export function setAuthCookie(name: string, value: string, maxAge: number = 7 * 24 * 60 * 60): void {
  if (typeof document === 'undefined') {
    return;
  }
  
  // For localhost, browsers handle subdomain cookies differently
  // Try setting without the leading dot for localhost
  let domain = '';
  if (window.location.hostname.includes('localhost')) {
    domain = 'localhost';
  } else {
    // For production, use root domain with dot
    domain = `.${window.location.hostname.split('.').slice(-2).join('.')}`;
  }
  
  const cookieString = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax; domain=${domain}`;
  document.cookie = cookieString;
  
  console.log('setAuthCookie: Set cookie with domain:', domain);
  console.log('Cookie string:', cookieString.substring(0, 50) + '...');
  console.log('All cookies after set:', document.cookie);
}

/**
 * Removes a cookie from all domains
 * @param name - Cookie name
 */
export function removeAuthCookie(name: string): void {
  if (typeof document === 'undefined') {
    return;
  }
  
  let domain = '';
  if (window.location.hostname.includes('localhost')) {
    domain = 'localhost';
  } else {
    domain = `.${window.location.hostname.split('.').slice(-2).join('.')}`;
  }
  
  document.cookie = `${name}=; path=/; max-age=0; domain=${domain}`;
}

/**
 * Initializes auth from cookie if available
 * Should be called on page load for vendor subdomain pages
 * @returns token if found and synchronized
 */
export async function initAuthFromCookie(): Promise<string | null> {
  try {
    if (typeof window === 'undefined') {
      console.log('initAuthFromCookie: Running on server, skipping');
      return null;
    }

    console.log('=== initAuthFromCookie: Starting ===');
    console.log('Current hostname:', window.location.hostname);
    console.log('All cookies:', document.cookie);

    // Check if we already have token in localStorage
    const existingToken = localStorage.getItem('token');
    if (existingToken) {
      console.log('✓ Token already in localStorage, skipping cookie sync');
      return existingToken;
    }

    // Try to get token from cookie (shared across subdomains)
    const cookieToken = getCookie('token');
    
    console.log('Cookie token:', cookieToken ? `Found (length: ${cookieToken.length})` : 'Not found');
    
    if (cookieToken) {
      console.log('✓ Found auth token in cross-domain cookie');
      
      // Store in localStorage for this subdomain
      localStorage.setItem('token', cookieToken);
      
      // Fetch and store user data
      try {
        console.log('Fetching user data with cookie token...');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, {
          headers: {
            'Authorization': `Bearer ${cookieToken}`,
          },
        });
        
        console.log('User fetch response status:', response.status);
        
        if (response.ok) {
          const userData = await response.json();
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('✓ User data synchronized from cookie:', userData.email);
          
          // Dispatch custom event to notify components
          window.dispatchEvent(new CustomEvent('auth-synced', { detail: userData }));
          
          return cookieToken;
        } else {
          console.error('✗ Invalid auth cookie, removing');
          removeAuthCookie('token');
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('✗ Error validating auth cookie:', error);
      }
    } else {
      console.log('No auth cookie found, user needs to login');
    }
    
    return null;
  } catch (error) {
    console.error('initAuthFromCookie: Unexpected error:', error);
    return null;
  }
}
