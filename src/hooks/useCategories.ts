'use client';

import { useQuery } from '@tanstack/react-query';
import { Category } from '@/types/product';

interface UseCategoriesOptions {
  vendorId?: string;
  locale?: string;
  hideEmptyCategories?: boolean;
}

const filterCategoriesWithProducts = (categories: Category[]): Category[] => {
  return categories
    .map((category) => ({
      ...category,
      children: category.children
        ? filterCategoriesWithProducts(category.children)
        : undefined,
    }))
    .filter((category) => {
      const hasProducts = (category.productCount ?? 0) > 0;
      const hasChildrenWithProducts =
        category.children && category.children.length > 0;
      return hasProducts || hasChildrenWithProducts;
    });
};

export function useCategories({
  vendorId,
  locale = 'en',
  // Off by default: this storefront's nav (Header, Footer) is built from
  // exactly two top-level categories, Kurtis and Jewellery, and both should
  // stay visible as permanent anchors even while a category is temporarily
  // out of active stock. "Active product count" was never the right signal
  // for whether a nav item should exist. Pass true explicitly for a caller
  // that genuinely wants empty branches pruned (e.g. a large multi-vendor
  // category tree).
  hideEmptyCategories = false,
}: UseCategoriesOptions = {}) {
  return useQuery({
    queryKey: ['categories', vendorId, locale, hideEmptyCategories],
    queryFn: async () => {
      let url: string;
      
      if (vendorId) {
        // For vendor pages, get vendor-specific categories
        url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/categories/vendor/${vendorId}`;
        
        // Add withProductCounts query parameter if hiding empty categories
        if (hideEmptyCategories) {
          url += '?withProductCounts=true';
        }
      } else {
        // For main pages, get global categories
        url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/categories/tree`;
        
        // Add withProductCounts query parameter if hiding empty categories
        if (hideEmptyCategories) {
          url += '?withProductCounts=true';
        }
      }
      
      // Add language parameter
      url += (url.includes('?') ? '&' : '?') + `lang=${locale}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }
      
      let data = await response.json() as Category[];
      
      // If hideEmptyCategories is true, filter out categories without products
      if (hideEmptyCategories) {
        data = filterCategoriesWithProducts(data);
      }
      
      return data;
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes (renamed from cacheTime in v5)
  });
}
