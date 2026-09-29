'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { api } from '@/lib/api';
import type { AdminOrder } from '@/lib/admin/orders';

export const ADMIN_ORDERS_KEY = ['admin', 'orders'] as const;

/**
 * Every order, newest first. One store's order book is small enough to hold
 * whole, and holding it whole is what lets the dashboard, the Orders queues
 * and the bottom-nav badge all count from the same list without a request
 * each. Shared through React Query, so switching between them is instant.
 */
export function useAdminOrders(enabled = true) {
  return useQuery({
    queryKey: ADMIN_ORDERS_KEY,
    queryFn: () => api.get<AdminOrder[]>('/orders/admin/all'),
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    enabled,
  });
}

/** Refetch the order book, e.g. after an action or when a notification lands. */
export function useRefreshAdminOrders() {
  const queryClient = useQueryClient();
  return useCallback(() => queryClient.invalidateQueries({ queryKey: ADMIN_ORDERS_KEY }), [queryClient]);
}
