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
  // Use .localhost to share across all subdomains
  let domain = '';
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    domain = '.localhost';
  } else if (hostname.includes('localhost')) {
    // Handle localhost:3000 format - extract just localhost
    domain = '.localhost';
  } else {
    // For production, use root domain with dot
    domain = `.${hostname.split('.').slice(-2).join('.')}`;
  }
  
  const cookieString = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax; domain=${domain}`;
  document.cookie = cookieString;
  
  console.log('setAuthCookie: Set cookie with domain:', domain, 'for hostname:', hostname);
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
  
  const hostname = window.location.hostname;
  let domain = '';
  
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    domain = '.localhost';
  } else if (hostname.includes('localhost')) {
    domain = '.localhost';
  } else {
    domain = `.${hostname.split('.').slice(-2).join('.')}`;
  }
  
  document.cookie = `${name}=; path=/; max-age=0; domain=${domain}`;
  console.log('removeAuthCookie: Removed cookie from domain:', domain);
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
    console.log('Current URL:', window.location.href);
    console.log('All cookies:', document.cookie);

    // Check if we already have token in localStorage
    const existingToken = localStorage.getItem('token');
    const existingUser = localStorage.getItem('user');
    
    console.log('Existing token in localStorage:', existingToken ? `Found (${existingToken.substring(0, 20)}...)` : 'Not found');
    console.log('Existing user in localStorage:', existingUser ? 'Found' : 'Not found');
    
    if (existingToken && existingUser) {
      console.log('✓ Token and user already in localStorage, skipping cookie sync');
      return existingToken;
    }

    // Try to get token from cookie (shared across subdomains)
    const cookieToken = getCookie('token');
    const cookieUser = getCookie('user');
    
    console.log('Cookie token:', cookieToken ? `Found (length: ${cookieToken.length})` : 'Not found');
    console.log('Cookie user:', cookieUser ? `Found (length: ${cookieUser.length})` : 'Not found');
    
    if (!cookieToken && !cookieUser) {
      console.log('ℹ No auth cookies found. Please ensure you logged in on the main domain first.');
      console.log('ℹ Cookies are shared across subdomains with domain: .localhost');
    }
    
    if (cookieToken) {
      console.log('✓ Found auth token in cross-domain cookie');
      
      // Store in localStorage for this subdomain
      localStorage.setItem('token', cookieToken);
      
      // If user data is also in cookie, use it directly (faster)
      if (cookieUser) {
        try {
          console.log('Decoding user cookie...');
          const decodedUser = decodeURIComponent(cookieUser);
          console.log('Parsing user JSON...');
          const userData = JSON.parse(decodedUser);
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('✓ User data synchronized from cookie (direct):', userData.email, 'Role:', userData.role);
          
          // Dispatch custom event to notify components
          window.dispatchEvent(new CustomEvent('userChanged'));
          window.dispatchEvent(new Event('storage'));
          
          console.log('✓ Events dispatched: userChanged, storage');
          
          return cookieToken;
        } catch (error) {
          console.error('Error parsing user cookie, will fetch from API:', error);
        }
      }
      
      // Fetch and store user data from API if not in cookie
      try {
        console.log('Fetching user data with cookie token...');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        console.log('API URL:', apiUrl);
        
        const response = await fetch(`${apiUrl}/api/v1/auth/me`, {
          headers: {
            'Authorization': `Bearer ${cookieToken}`,
          },
        });
        
        console.log('User fetch response status:', response.status);
        
        if (response.ok) {
          const userData = await response.json();
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('✓ User data synchronized from cookie:', userData.email, 'Role:', userData.role);
          
          // Dispatch custom event to notify components
          window.dispatchEvent(new CustomEvent('userChanged'));
          window.dispatchEvent(new Event('storage'));
          
          console.log('✓ Events dispatched: userChanged, storage');
          
          return cookieToken;
        } else {
          const errorText = await response.text();
          console.error('✗ Invalid auth cookie, response:', errorText);
          removeAuthCookie('token');
          removeAuthCookie('user');
          localStorage.removeItem('token');
        }
      } catch (error) {
        console.error('✗ Error validating auth cookie:', error);
      }
    } else {
      console.log('ℹ No auth cookie found, user needs to login');
    }
    
    return null;
  } catch (error) {
    console.error('initAuthFromCookie: Unexpected error:', error);
    return null;
  }
}
