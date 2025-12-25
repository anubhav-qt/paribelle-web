'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface Policy {
  enabled: boolean;
  text: string;
  days?: number;
}

interface PoliciesContextType {
  returnPolicy: Policy | null;
  cancellationPolicy: Policy | null;
  loading: boolean;
  fetchVendorPolicies: (vendorId: string) => Promise<{ returnPolicy: Policy | null; cancellationPolicy: Policy | null }>;
}

const PoliciesContext = createContext<PoliciesContextType>({
  returnPolicy: null,
  cancellationPolicy: null,
  loading: true,
  fetchVendorPolicies: async () => ({ returnPolicy: null, cancellationPolicy: null }),
});

// Cache utility functions
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getCachedPolicies(vendorId?: string) {
  const key = vendorId ? `vendor_${vendorId}_policies` : 'marketplace_policies';
  const timestampKey = vendorId ? `vendor_${vendorId}_policies_timestamp` : 'marketplace_policies_timestamp';
  
  const cached = localStorage.getItem(key);
  const timestamp = localStorage.getItem(timestampKey);
  
  if (cached && timestamp) {
    const age = Date.now() - parseInt(timestamp);
    if (age < CACHE_DURATION) {
      return JSON.parse(cached);
    }
  }
  return null;
}

function setCachedPolicies(policies: { return: Policy | null; cancellation: Policy | null }, vendorId?: string) {
  const key = vendorId ? `vendor_${vendorId}_policies` : 'marketplace_policies';
  const timestampKey = vendorId ? `vendor_${vendorId}_policies_timestamp` : 'marketplace_policies_timestamp';
  
  localStorage.setItem(key, JSON.stringify(policies));
  localStorage.setItem(timestampKey, Date.now().toString());
}

export function PoliciesProvider({ children }: { children: ReactNode }) {
  const [returnPolicy, setReturnPolicy] = useState<Policy | null>(null);
  const [cancellationPolicy, setCancellationPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch marketplace-wide policies
  useEffect(() => {
    const fetchMarketplacePolicies = async () => {
      // Check cache first
      const cached = getCachedPolicies();
      if (cached) {
        setReturnPolicy(cached.return);
        setCancellationPolicy(cached.cancellation);
        setLoading(false);
        return;
      }

      // Fetch fresh policies
      try {
        const [returnRes, cancellationRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/return_policy`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/cancellation_policy`),
        ]);

        const returnData = await returnRes.json();
        const cancellationData = await cancellationRes.json();

        const returnPolicyData = returnData.value ? JSON.parse(returnData.value) : null;
        const cancellationPolicyData = cancellationData.value ? JSON.parse(cancellationData.value) : null;

        setReturnPolicy(returnPolicyData);
        setCancellationPolicy(cancellationPolicyData);

        // Cache the policies
        setCachedPolicies({
          return: returnPolicyData,
          cancellation: cancellationPolicyData,
        });
      } catch (error) {
        console.error('Error fetching marketplace policies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketplacePolicies();
  }, []);

  // Function to fetch vendor-specific policies (with caching)
  const fetchVendorPolicies = useCallback(async (vendorId: string) => {
    // Check cache first
    const cached = getCachedPolicies(vendorId);
    if (cached) {
      return { returnPolicy: cached.return, cancellationPolicy: cached.cancellation };
    }

    // Fetch vendor details which include policies
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}`);
      if (!response.ok) throw new Error('Failed to fetch vendor');
      
      const vendor = await response.json();
      
      // Use vendor-specific policies if set, otherwise fall back to marketplace defaults
      const vendorReturnPolicy = vendor.returnPolicy || returnPolicy;
      const vendorCancellationPolicy = vendor.cancellationPolicy || cancellationPolicy;

      // Cache vendor-specific policies
      setCachedPolicies({
        return: vendorReturnPolicy,
        cancellation: vendorCancellationPolicy,
      }, vendorId);

      return { 
        returnPolicy: vendorReturnPolicy, 
        cancellationPolicy: vendorCancellationPolicy 
      };
    } catch (error) {
      console.error('Error fetching vendor policies:', error);
      // Fallback to marketplace policies
      return { returnPolicy, cancellationPolicy };
    }
  }, [returnPolicy, cancellationPolicy]);

  return (
    <PoliciesContext.Provider value={{ returnPolicy, cancellationPolicy, loading, fetchVendorPolicies }}>
      {children}
    </PoliciesContext.Provider>
  );
}

export function usePolicies() {
  return useContext(PoliciesContext);
}
