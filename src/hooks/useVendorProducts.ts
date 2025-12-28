import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVendorId } from '@/lib/auth';

interface Product {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  status: string;
  sku: string;
  featuredImage?: string;
  images?: string[];
  productType: 'physical' | 'booking';
  categories?: Array<{ id: string; name: string }>;
  isParent?: boolean;
  parentProductId?: string;
  variations?: Product[];
  variationAttributes?: Record<string, string>;
  variationThemes?: string[];
  attributes?: {
    booking?: {
      duration: number;
      durationUnit: 'hours' | 'days' | 'sessions';
      bufferTime: number;
      availableDays: string[];
      timeSlots: Array<{ start: string; end: string }>;
    };
  };
}

interface VendorProductsFilters {
  status?: string;
  productType?: string;
  categoryId?: string;
  search?: string;
}

// Fetch vendor products
async function fetchVendorProducts(filters?: VendorProductsFilters): Promise<Product[]> {
  const token = localStorage.getItem('token');
  const vendorId = getVendorId();
  
  if (!token || !vendorId) {
    throw new Error('Authentication required');
  }

  const params = new URLSearchParams();
  if (filters?.status && filters.status !== 'all') params.append('status', filters.status);
  if (filters?.productType && filters.productType !== 'all') params.append('productType', filters.productType);
  if (filters?.categoryId && filters.categoryId !== 'all') params.append('categoryId', filters.categoryId);
  if (filters?.search) params.append('search', filters.search);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/vendor/${vendorId}?${params}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
}

// Update product
async function updateProduct(data: { productId: string; updates: Partial<Product> }): Promise<Product> {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${data.productId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data.updates),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update product');
  }

  return response.json();
}

// Delete product
async function deleteProduct(productId: string): Promise<void> {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${productId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete product');
  }
}

// Hook to fetch vendor products
export function useVendorProducts(filters?: VendorProductsFilters) {
  return useQuery<Product[]>({
    queryKey: ['vendor-products', filters],
    queryFn: () => fetchVendorProducts(filters),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// Hook to update product
export function useUpdateVendorProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
    },
  });
}

// Hook to delete product
export function useDeleteVendorProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] });
    },
  });
}
