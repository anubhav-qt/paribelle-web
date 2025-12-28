import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVendorId } from '@/lib/auth';

interface VendorSettings {
  id: string;
  storeName: string;
  businessName: string;
  contactEmail: string;
  contactPhone: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  cityId?: string;
  subLocationId?: string;
  pincode?: string;
  shippingCost?: string;
  freeShippingThreshold?: string;
  logo?: string;
}

interface UpdateVendorSettingsPayload {
  storeName: string;
  businessName: string;
  contactEmail: string;
  contactPhone: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  cityId?: string;
  subLocationId?: string;
  pincode?: string;
  shippingCost?: string;
  freeShippingThreshold?: string;
  logo?: string;
}

// Fetch vendor settings
async function fetchVendorSettings(): Promise<VendorSettings> {
  const token = localStorage.getItem('token');
  const vendorId = getVendorId();
  
  if (!token || !vendorId) {
    throw new Error('Authentication required');
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch vendor settings');
  }

  return response.json();
}

// Update vendor settings
async function updateVendorSettings(payload: UpdateVendorSettingsPayload): Promise<VendorSettings> {
  const token = localStorage.getItem('token');
  const vendorId = getVendorId();
  
  if (!token || !vendorId) {
    throw new Error('Authentication required');
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update vendor settings');
  }

  return response.json();
}

// Hook to fetch vendor settings
export function useVendorSettings() {
  return useQuery<VendorSettings>({
    queryKey: ['vendor-settings'],
    queryFn: fetchVendorSettings,
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: false,
  });
}

// Hook to update vendor settings
export function useUpdateVendorSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateVendorSettings,
    onSuccess: (data) => {
      // Update cache with new data
      queryClient.setQueryData(['vendor-settings'], data);
      // Also invalidate dashboard data as it might include vendor info
      queryClient.invalidateQueries({ queryKey: ['vendor-dashboard'] });
    },
  });
}
