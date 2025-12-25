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
