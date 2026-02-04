'use client';

import { useQuery } from '@tanstack/react-query';
import { Vendor } from '@/types/product';
import { VendorPage } from '@/types/common';

export function useVendor(slug: string) {
  return useQuery({
    queryKey: ['vendor', slug],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/vendors/${slug}`
      );
      if (!response.ok) throw new Error('Vendor not found');
      return response.json() as Promise<Vendor>;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!slug,
  });
}

export function useVendorPages(vendorId: string) {
  return useQuery({
    queryKey: ['vendorPages', vendorId],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/vendors/${vendorId}/pages`
      );
      if (!response.ok) throw new Error('Failed to fetch vendor pages');
      const pages = await response.json() as VendorPage[];
      return pages.filter((p) => p.showInNavigation);
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 30 * 60 * 1000,
    enabled: !!vendorId,
  });
}
