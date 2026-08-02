'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Product } from '@/types/product';

interface UseProductsOptions {
  categoryId?: string;
  search?: string;
  vendorId?: string;
  limit?: number;
  enabled?: boolean;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export function useInfiniteProducts(options: UseProductsOptions = {}) {
  const { categoryId, search, vendorId, limit = 20, enabled = true } = options;
  
  return useInfiniteQuery({
    queryKey: ['products', 'infinite', categoryId, search, vendorId, limit],
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      if (categoryId) params.append('categoryId', categoryId);
      if (search) params.append('search', search);
      if (vendorId) params.append('vendorId', vendorId);
      params.append('page', pageParam.toString());
      params.append('limit', limit.toString());
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/products?${params.toString()}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      
      const data = await response.json();
      
      // Handle both array and paginated responses
      if (Array.isArray(data)) {
        return {
          products: data,
          nextPage: undefined,
          totalPages: 1,
          hasMore: false,
        };
      }
      
      return {
        products: data.products || data,
        nextPage: data.hasMore ? pageParam + 1 : undefined,
        totalPages: data.totalPages || 1,
        hasMore: data.hasMore || false,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useProductById(id: string | undefined) {
  return useQuery({
    queryKey: ['product', 'id', id],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/products/${id}`
      );
      if (!response.ok) throw new Error('Product not found');
      return response.json() as Promise<Product>;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled: !!id,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/products/slug/${slug}`
      );
      if (!response.ok) throw new Error('Product not found');
      return response.json() as Promise<Product>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    enabled: !!slug,
  });
}
