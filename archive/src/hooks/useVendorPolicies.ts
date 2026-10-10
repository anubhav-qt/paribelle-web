import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVendorId } from '@/lib/auth';
import { VendorPolicy } from '@/types/common';

interface MarketplacePolicies {
  returnPolicy: VendorPolicy | null;
  cancellationPolicy: VendorPolicy | null;
}

interface VendorPoliciesData {
  vendor: any;
  marketplacePolicies: MarketplacePolicies;
}

interface UpdatePoliciesPayload {
  returnPolicy: VendorPolicy | null;
  cancellationPolicy: VendorPolicy | null;
}

// Fetch marketplace default policies
async function fetchMarketplacePolicies(): Promise<MarketplacePolicies> {
  const [returnRes, cancellationRes] = await Promise.all([
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/return_policy`),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/cancellation_policy`),
  ]);

  const returnPolicy = returnRes.ok 
    ? JSON.parse((await returnRes.json()).value || 'null')
    : null;
  
  const cancellationPolicy = cancellationRes.ok 
    ? JSON.parse((await cancellationRes.json()).value || 'null')
    : null;

  return { returnPolicy, cancellationPolicy };
}

// Fetch vendor data and policies
async function fetchVendorPolicies(): Promise<VendorPoliciesData> {
  const token = localStorage.getItem('token');
  const vendorId = getVendorId();

  if (!token || !vendorId) {
    throw new Error('Authentication required');
  }

  // Fetch marketplace policies and vendor data in parallel
  const [marketplacePolicies, vendorResponse] = await Promise.all([
    fetchMarketplacePolicies(),
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  ]);

  if (!vendorResponse.ok) {
    throw new Error('Failed to fetch vendor data');
  }

  const vendor = await vendorResponse.json();

  return { vendor, marketplacePolicies };
}

// Update vendor policies
async function updateVendorPolicies(payload: UpdatePoliciesPayload): Promise<void> {
  const token = localStorage.getItem('token');
  const vendorId = getVendorId();

  if (!token || !vendorId) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}/policies`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update policies');
  }

  // Clear localStorage cache
  const cacheKey = `vendor_${vendorId}_policies`;
  const timestampKey = `vendor_${vendorId}_policies_timestamp`;
  localStorage.removeItem(cacheKey);
  localStorage.removeItem(timestampKey);
}

// Hook to fetch vendor policies
export function useVendorPolicies() {
  return useQuery<VendorPoliciesData>({
    queryKey: ['vendor-policies'],
    queryFn: fetchVendorPolicies,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

// Hook to update vendor policies
export function useUpdateVendorPolicies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateVendorPolicies,
    onSuccess: () => {
      // Invalidate and refetch policies
      queryClient.invalidateQueries({ queryKey: ['vendor-policies'] });
    },
  });
}
