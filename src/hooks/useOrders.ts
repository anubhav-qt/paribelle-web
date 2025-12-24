'use client';

import { useQuery } from '@tanstack/react-query';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
}

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
