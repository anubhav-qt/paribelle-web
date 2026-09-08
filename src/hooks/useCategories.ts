'use client';

import { useCachedData, TTL } from '@/lib/store/dataCache';
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

/**
 * The category tree the navigation is built from.
 *
 * Cached through the shared store rather than fetched per mount: this is the
 * data the header needs before it can render anything at all, so paying for it
 * again on every route change is the most visible instance of the problem the
 * cache exists to solve. It is small, public and slow-moving, so it is also
 * written through to localStorage — which is what lets the nav render filled
 * in on the very first frame after a reload instead of popping in.
 */
export function useCategories({
  vendorId,
  locale = 'en',
  // Off by default: this storefront's nav (Header, MobileNav) is built from
  // exactly two top-level categories, Kurtis and Jewellery, and both should
  // stay visible as permanent anchors even while a category is temporarily
  // out of active stock. "Active product count" was never the right signal
  // for whether a nav item should exist. Pass true explicitly for a caller
  // that genuinely wants empty branches pruned (e.g. a large multi-vendor
  // category tree).
  hideEmptyCategories = false,
}: UseCategoriesOptions = {}) {
  return useCachedData<Category[]>(
    `categories:${vendorId ?? 'global'}:${locale}:${hideEmptyCategories}`,
    async () => {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      let url = vendorId
        ? `${base}/api/v1/categories/vendor/${vendorId}`
        : `${base}/api/v1/categories/tree`;

      if (hideEmptyCategories) url += '?withProductCounts=true';
      url += (url.includes('?') ? '&' : '?') + `lang=${locale}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status}`);
      }

      const data = (await response.json()) as Category[];
      return hideEmptyCategories ? filterCategoriesWithProducts(data) : data;
    },
    { ttl: TTL.CONFIG, persistToDisk: true }
  );
}
