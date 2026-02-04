'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Order, OrderFilters, OrdersResponse } from '@/types/common';

export function useOrders(token?: string) {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/orders`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch orders');
      return response.json() as Promise<Order[]>;
    },
    enabled: !!token,
    staleTime: 30 * 1000, // 30 seconds (fresh data needed)
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useOrder(orderId: string, token?: string) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch order');
      return response.json() as Promise<Order>;
    },
    enabled: !!orderId && !!token,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// Fetch orders (works for both vendor and admin)
async function fetchOrdersList(filters: OrderFilters = {}, isAdmin = false): Promise<OrdersResponse> {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const params = new URLSearchParams();
  if (filters.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const endpoint = isAdmin ? 'admin/orders' : 'vendors/orders';
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/${endpoint}?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch orders');
  }

  return response.json();
}

// Update order status
async function updateOrderStatus(data: { orderId: string; status: string }): Promise<void> {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders/${data.orderId}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: data.status }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update order status');
  }
}

// Hook to fetch vendor orders
export function useVendorOrders(filters: OrderFilters = {}) {
  return useQuery<OrdersResponse>({
    queryKey: ['vendor-orders', filters],
    queryFn: () => fetchOrdersList(filters, false),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook to fetch admin orders
export function useAdminOrders(filters: OrderFilters = {}) {
  return useQuery<OrdersResponse>({
    queryKey: ['admin-orders', filters],
    queryFn: () => fetchOrdersList(filters, true),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook to update order status
export function useUpdateOrderStatus(isAdmin = false) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: () => {
      // Invalidate both vendor and admin orders queries
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
  });
}

