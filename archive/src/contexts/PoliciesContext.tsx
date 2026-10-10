'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useStorePolicies } from '@/hooks/useStorefrontData';
import type { StorePolicy } from '@/types/common';

interface PoliciesContextType {
  returnPolicy: StorePolicy | null;
  cancellationPolicy: StorePolicy | null;
  loading: boolean;
}

const PoliciesContext = createContext<PoliciesContextType>({
  returnPolicy: null,
  cancellationPolicy: null,
  loading: true,
});

/** The store's return and cancellation policies, read once through the shared data cache. */
export function PoliciesProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useStorePolicies();

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
