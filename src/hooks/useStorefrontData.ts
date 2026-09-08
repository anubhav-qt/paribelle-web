'use client';

import * as React from 'react';
import { useCachedData, TTL } from '@/lib/store/dataCache';
import {
  DEFAULT_HERO_IMAGES,
  HERO_SECTION_IMAGES_KEY,
  type HeroSectionImages,
} from '@/lib/heroSectionImages';
import type { Category, Product } from '@/types/product';
import type { VendorPolicy } from '@/types/common';

/**
 * The storefront's public reads, all routed through the shared cache.
 *
 * Each of these used to be an inline `useEffect` + `fetch` inside whichever
 * component happened to need it, which meant every one of them re-ran on every
 * mount — `settings/currency` alone was fetched afresh by the category page and
 * the product page on each navigation between them. Naming them here also stops
 * two components inventing two different cache keys for the same request.
 *
 * Nothing user-specific belongs in this file: the cart, wishlist, orders and
 * notifications each have their own context, and their data must not land in a
 * store that is written through to localStorage.
 */

const API = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function getJSON<T>(path: string): Promise<T> {
  const response = await fetch(`${API()}${path}`);
  if (!response.ok) throw new Error(`Request failed: ${response.status}`);
  return response.json() as Promise<T>;
}

/**
 * One marketplace setting by key.
 *
 * Returns the fallback while the value is still unknown, so a caller renders
 * the same thing it used to render from its `useState` initialiser — no
 * intermediate empty state, and no visual change on a cache miss.
 */
export function useSetting(key: string, fallback: string): string {
  const { data } = useCachedData<{ value?: string }>(
    `setting:${key}`,
    () => getJSON<{ value?: string }>(`/api/v1/settings/${key}`),
    { ttl: TTL.CONFIG, persistToDisk: true }
  );
  return data?.value || fallback;
}

/** The marketplace's display currency. */
export function useCurrency(): string {
  return useSetting('currency', 'INR');
}

/** Whether the product gallery stacks its thumbnails vertically or horizontally. */
export function useThumbnailLayout(): 'vertical' | 'horizontal' {
  return useSetting('thumbnailLayout', 'vertical') === 'horizontal' ? 'horizontal' : 'vertical';
}

export interface FooterSettings {
  aboutText: string;
  socialLinks: Array<{ platform: string; url: string }>;
  customSections: Array<{ title: string; links: Array<{ label: string; url: string }>; enabled: boolean }>;
  contactInfo: { phone: string; email: string; address: string };
  copyrightText: string;
}

export function useFooterSettings() {
  return useCachedData<FooterSettings | null>(
    'footer-settings',
    async () => {
      const response = await fetch(`${API()}/api/v1/footer-settings`);
      // A missing footer config is a normal state, not a failure — the footer
      // renders its own defaults. Returning null caches that answer instead of
      // re-asking on every mount.
      return response.ok ? ((await response.json()) as FooterSettings) : null;
    },
    { ttl: TTL.CONFIG, persistToDisk: true }
  );
}

/**
 * The three hero photographs, with the bundled defaults filled in per slot.
 *
 * Persisted, and for a more visible reason than most: the hero deliberately
 * renders nothing at all until this resolves, rather than showing the bundled
 * images and swapping them for the admin's a moment later. That avoided a
 * flash at the cost of an empty hero on every single load. Reading the last
 * known value off disk means the hero is there in the first frame, and a
 * genuine change still swaps in once its refetch lands.
 */
export function useHeroSectionImages() {
  return useCachedData<HeroSectionImages>(
    'hero-section-images',
    async () => {
      const response = await fetch(`${API()}/api/v1/settings/${HERO_SECTION_IMAGES_KEY}`);
      // An unset setting is a normal state — every slot falls back on its own,
      // so an admin who has replaced only one image keeps the defaults for the
      // other two.
      const data = response.ok
        ? ((await response.json()) as { value?: Partial<HeroSectionImages> } | null)
        : null;
      return {
        main: data?.value?.main?.url ? data.value.main : DEFAULT_HERO_IMAGES.main,
        pink: data?.value?.pink?.url ? data.value.pink : DEFAULT_HERO_IMAGES.pink,
        black: data?.value?.black?.url ? data.value.black : DEFAULT_HERO_IMAGES.black,
      };
    },
    { ttl: TTL.CONFIG, persistToDisk: true }
  );
}

export interface MarketplacePolicies {
  returnPolicy: VendorPolicy | null;
  cancellationPolicy: VendorPolicy | null;
}

/** The marketplace-wide return and cancellation policies. */
export function useMarketplacePolicies() {
  return useCachedData<MarketplacePolicies>(
    'policies:marketplace',
    async () => {
      const [returnRes, cancellationRes] = await Promise.all([
        fetch(`${API()}/api/v1/settings/return_policy`),
        fetch(`${API()}/api/v1/settings/cancellation_policy`),
      ]);

      // Each policy is stored as a JSON string inside a settings row, and an
      // unset one is an empty value rather than a missing row.
      const parse = async (response: Response): Promise<VendorPolicy | null> => {
        if (!response.ok) return null;
        const body = await response.json();
        if (!body?.value) return null;
        try {
          return JSON.parse(body.value) as VendorPolicy;
        } catch {
          return null;
        }
      };

      return {
        returnPolicy: await parse(returnRes),
        cancellationPolicy: await parse(cancellationRes),
      };
    },
    { ttl: TTL.CONFIG, persistToDisk: true }
  );
}

/** A vendor's policies, falling back to the marketplace defaults per field. */
export function useVendorPoliciesFor(vendorId: string | undefined | null) {
  const { data: marketplace } = useMarketplacePolicies();

  const { data: vendor } = useCachedData<{ returnPolicy?: VendorPolicy; cancellationPolicy?: VendorPolicy } | null>(
    vendorId ? `policies:vendor:${vendorId}` : null,
    () => getJSON(`/api/v1/vendors/${vendorId}`),
    { ttl: TTL.CONFIG }
  );

  return React.useMemo(
    () => ({
      returnPolicy: vendor?.returnPolicy ?? marketplace?.returnPolicy ?? null,
      cancellationPolicy: vendor?.cancellationPolicy ?? marketplace?.cancellationPolicy ?? null,
    }),
    [vendor, marketplace]
  );
}

/** A category and its descendant tree, by slug. */
export function useCategoryTree(slug: string | null) {
  return useCachedData<Category | null>(
    slug ? `category-tree:${slug}` : null,
    async () => {
      const response = await fetch(`${API()}/api/v1/categories/slug/${slug}/tree`);
      return response.ok ? ((await response.json()) as Category) : null;
    },
    { ttl: TTL.CATALOGUE }
  );
}

/**
 * The products in a category.
 *
 * Memory-only: a full category's products is far too large to sit in
 * localStorage alongside everything else, and it is the read most likely to
 * change. Within a tab it is still shared, so stepping into a product and back
 * out reuses it instead of re-fetching the whole grid.
 */
export function useCategoryProducts(categoryId: string | null) {
  return useCachedData<Product[]>(
    categoryId ? `category-products:${categoryId}` : null,
    async () => {
      const data = await getJSON<Product[] | { products: Product[] }>(
        `/api/v1/products?categoryId=${categoryId}`
      );
      return Array.isArray(data) ? data : data.products || [];
    },
    { ttl: TTL.CATALOGUE }
  );
}

/** Every active product, for the virtual collections (New In, Sale). */
export function useAllProducts(enabled: boolean) {
  return useCachedData<Product[]>(
    enabled ? 'products:all-active' : null,
    async () => {
      const data = await getJSON<Product[] | { products: Product[] }>(
        '/api/v1/products?status=active&limit=100'
      );
      return Array.isArray(data) ? data : data.products || [];
    },
    { ttl: TTL.CATALOGUE }
  );
}

type CategoryFilterDef = NonNullable<Category['filterConfig']>['filters'][number];

/** The filters a category's live catalogue actually offers. */
export function useEffectiveFilters(categoryId: string | null) {
  return useCachedData<CategoryFilterDef[]>(
    categoryId ? `category-filters:${categoryId}` : null,
    async () => {
      const response = await fetch(`${API()}/api/v1/categories/${categoryId}/filters/effective`);
      if (!response.ok) return [];
      const data = await response.json();
      return (data?.filters || []) as CategoryFilterDef[];
    },
    { ttl: TTL.CATALOGUE }
  );
}

/** One product, by slug. */
export function useProductBySlug(slug: string | null) {
  return useCachedData<Product | null>(
    slug ? `product:${slug}` : null,
    async () => {
      const response = await fetch(`${API()}/api/v1/products/slug/${slug}`);
      return response.ok ? ((await response.json()) as Product) : null;
    },
    { ttl: TTL.CATALOGUE }
  );
}

/** One product, by id. Used by the mega menu's Editor's Pick and the page builder. */
export function useProductById(id: string | null) {
  return useCachedData<Product | null>(
    id ? `product-id:${id}` : null,
    async () => {
      const response = await fetch(`${API()}/api/v1/products/${id}`);
      return response.ok ? ((await response.json()) as Product) : null;
    },
    { ttl: TTL.CATALOGUE }
  );
}

/** A product's reviews, first page. */
export function useProductReviews(productId: string | null) {
  return useCachedData<{ reviews: any[]; total: number; averageRating: number }>(
    productId ? `product-reviews:${productId}` : null,
    () => getJSON(`/api/v1/reviews/products/${productId}?page=1&limit=10`),
    { ttl: TTL.SHORT }
  );
}

/** A vendor's aggregate review stats. */
export function useVendorReviewStats(vendorId: string | null) {
  return useCachedData<{ totalReviews: number; averageRating: number } | null>(
    vendorId ? `vendor-review-stats:${vendorId}` : null,
    () => getJSON(`/api/v1/reviews/vendors/${vendorId}/stats`),
    { ttl: TTL.CONFIG }
  );
}
