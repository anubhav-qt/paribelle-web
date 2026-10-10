'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Product } from '@/types/product';
import { api } from '@/lib/api';

interface UseAdminProductsOptions {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  stock?: 'low' | 'out' | '';
}

interface ProductsResponse {
  products: Product[];
  total: number;
}

export function useAdminProducts(options: UseAdminProductsOptions = {}) {
  const { page = 1, limit = 20, status, search, stock } = options;

  return useQuery({
    queryKey: ['admin-products', page, limit, status, search, stock],
    queryFn: async () => {
      // Sent with the admin's token: without it the API lists only what is
      // on sale, not drafts or archived products.
      const data = await api.get<any>('/products', {
        params: {
          status: status && status !== 'all' ? status : undefined,
          search,
          stock,
          page,
          limit,
        },
      });

      // Handle both array and paginated response formats
      if (Array.isArray(data)) {
        return { products: data, total: data.length };
      }
      return { products: data.products || [], total: data.total || 0 };
    },
    staleTime: 30000, // 30 seconds
  });
}

export interface AdminProductStats {
  total: number;
  active: number;
  draft: number;
  archived: number;
  lowStock: number;
  outOfStock: number;
}

/**
 * Counts over the whole catalogue. The stat tiles used to filter whichever
 * 20-row page was loaded, which is why "Active" could never read above the
 * page size no matter how many products actually qualified.
 */
export function useAdminProductStats() {
  return useQuery({
    queryKey: ['admin-products-stats'],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/admin/stats`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json() as Promise<AdminProductStats>;
    },
    staleTime: 30000,
  });
}

export function useUpdateProductStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ productId, status }: { productId: string; status: string }) => {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${productId}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );
      
      if (!response.ok) throw new Error('Failed to update status');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch products
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: string) =>
      api.delete<{ message: string; outcome: 'deleted' | 'archived' | 'already_archived' }>(
        `/products/${productId}`,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });
}
