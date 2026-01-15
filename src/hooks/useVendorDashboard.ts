import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

interface Vendor {
  id: string;
  storeName: string;
  status: string;
  description?: string;
  city?: string;
  state?: string;
  totalSales: number;
  totalOrders: number;
  rating: number;
  kycStatus?: 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  kycRejectedReason?: string;
}

interface VendorDashboardData {
  vendor: Vendor;
  adminUser: any;
}

// Get vendor ID from JWT token or localStorage
function getVendorIdFromToken(): string | null {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    return null;
  }

  const user = JSON.parse(userStr);
  let vendorId = user.vendorId || localStorage.getItem('vendorId');
  
  // Extract from JWT if not found
  if (!vendorId && token) {
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
          vendorId = decodedToken.vendorId;
          localStorage.setItem('vendorId', vendorId);
        }
      }
    } catch (decodeError) {
      console.error('Error decoding JWT token:', decodeError);
    }
  }
  
  return vendorId;
}

// Fetch vendor dashboard data
async function fetchVendorDashboard(): Promise<VendorDashboardData> {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (!token || !userStr) {
    throw new Error('Authentication required');
  }

  const user = JSON.parse(userStr);
  
  // Check if user is a vendor admin or super admin
  if (user.role !== 'vendor_admin' && user.role !== 'super_admin') {
    throw new Error('This account is not a vendor account. Please use a vendor or admin login.');
  }
  
  // For super admin, they might be accessing any vendor's dashboard
  // The vendorId should be passed via context or route params
  // For now, we'll allow super admin to proceed even without vendorId in token
  const vendorId = getVendorIdFromToken();
  
  if (!vendorId && user.role !== 'super_admin') {
    console.error('Vendor ID not found in token or localStorage');
    console.log('User object:', user);
    console.log('Token parts available:', !!token);
    throw new Error('Your vendor account is not properly linked. Please log out and log in again. If the issue persists, contact support.');
  }

  // For super admin accessing vendor pages, we might need to get vendorId from URL or context
  // If vendorId is not available and user is super_admin, we should redirect to vendor selection
  if (!vendorId && user.role === 'super_admin') {
    throw new Error('Please select a vendor from the admin panel to manage their dashboard.');
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let errorMessage = `Failed to fetch vendor data (${response.status})`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      errorMessage = `Failed to fetch vendor data: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  const contentType = response.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Server returned non-JSON response');
  }

  const text = await response.text();
  
  if (!text) {
    throw new Error('Server returned empty response');
  }

  const vendor = JSON.parse(text);

  return { vendor, adminUser: user };
}

// Hook to fetch vendor dashboard data
export function useVendorDashboard() {
  const router = useRouter();
  
  return useQuery<VendorDashboardData>({
    queryKey: ['vendor-dashboard'],
    queryFn: fetchVendorDashboard,
    staleTime: 0, // Always fetch fresh data - no caching
    refetchOnMount: 'always', // Always refetch when component mounts
    retry: false,
    // Redirect on auth error
    throwOnError: (error: any) => {
      if (error.message === 'Authentication required') {
        router.push('/login');
        return false;
      }
      return true;
    },
  });
}
