'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useMarketplacePolicies } from '@/hooks/useStorefrontData';
import { VendorPolicy } from '@/types/common';

interface PoliciesContextType {
  returnPolicy: VendorPolicy | null;
  cancellationPolicy: VendorPolicy | null;
  loading: boolean;
}

const PoliciesContext = createContext<PoliciesContextType>({
  returnPolicy: null,
  cancellationPolicy: null,
  loading: true,
});

/**
 * The marketplace-wide return and cancellation policies.
 *
 * This used to run its own fetch on mount behind a hand-rolled 24-hour
 * localStorage cache, and hand out a `fetchVendorPolicies` callback that
 * repeated the trick per vendor with its own key scheme. Both now go through
 * the shared data cache (see `useMarketplacePolicies` and
 * `useVendorPoliciesFor`), which gives the same "don't re-ask on every mount"
 * behaviour without a second, differently-expiring copy of the caching rules —
 * and without the stale entries the old one left behind, since it had no way
 * to invalidate what an admin had just changed.
 */
export function PoliciesProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useMarketplacePolicies();

  return (
    <PoliciesContext.Provider
      value={{
        returnPolicy: data?.returnPolicy ?? null,
        cancellationPolicy: data?.cancellationPolicy ?? null,
        loading: isLoading,
      }}
    >
      {children}
    </PoliciesContext.Provider>
  );
}

export function usePolicies() {
  return useContext(PoliciesContext);
}
