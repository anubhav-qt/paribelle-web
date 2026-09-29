/**
 * Reading a product the way the shop thinks about it: which colours it comes
 * in, how many of each size are left, what it costs. A kurti's variants are
 * colour x size, so almost everything here groups by those two.
 */

import { sortSizes } from '@/components/admin/pom/swatch';
import type { Product, ProductVariant } from '@/types/product';

const COLOUR_KEY = /^colou?r$/i;
const SIZE_KEY = /^size$/i;

function attr(v: Pick<ProductVariant, 'variantAttributes'>, re: RegExp) {
  const a = v.variantAttributes || {};
  const key = Object.keys(a).find((k) => re.test(k.trim()));
  return key ? String(a[key]) : null;
}

export const variantColour = (v: Pick<ProductVariant, 'variantAttributes'>) => attr(v, COLOUR_KEY);
export const variantSize = (v: Pick<ProductVariant, 'variantAttributes'>) => attr(v, SIZE_KEY);

/** Everything that is neither size nor colour, e.g. "Length: Ankle". */
export function variantOther(v: Pick<ProductVariant, 'variantAttributes'>) {
  return Object.entries(v.variantAttributes || {})
    .filter(([k]) => !COLOUR_KEY.test(k.trim()) && !SIZE_KEY.test(k.trim()))
    .map(([k, val]) => `${k}: ${val}`)
    .join(' · ');
}

export function variantsOf(p: Product): ProductVariant[] {
  return p.hasVariants || (p.productVariants?.length ?? 0) > 0 ? p.productVariants ?? [] : [];
}

export function productColours(p: Product): string[] {
  const seen = new Map<string, string>();
  for (const v of variantsOf(p)) {
    const c = variantColour(v);
    if (c && !seen.has(c.toLowerCase())) seen.set(c.toLowerCase(), c);
  }
  return Array.from(seen.values());
}

export function totalStock(p: Product): number {
  const vs = variantsOf(p);
  return vs.length > 0 ? vs.reduce((n, v) => n + (Number(v.stockQuantity) || 0), 0) : Number(p.stockQuantity) || 0;
}

/** Stock per size across every colour, in size order. */
export function sizeStock(p: Product): { size: string; stock: number }[] {
  const map = new Map<string, number>();
  for (const v of variantsOf(p)) {
    const s = variantSize(v);
    if (!s) continue;
    map.set(s, (map.get(s) ?? 0) + (Number(v.stockQuantity) || 0));
  }
  return sortSizes(Array.from(map.keys())).map((size) => ({ size, stock: map.get(size) ?? 0 }));
}

export function priceRange(p: Product): { min: number; max: number; compare: number | null } {
  const vs = variantsOf(p);
  const prices = (vs.length > 0 ? vs.map((v) => Number(v.price)) : [Number(p.price)]).filter((n) => Number.isFinite(n) && n > 0);
  const compares = (vs.length > 0 ? vs.map((v) => Number(v.compareAtPrice)) : [Number(p.compareAtPrice)]).filter(
    (n) => Number.isFinite(n) && n > 0,
  );
  if (prices.length === 0) return { min: 0, max: 0, compare: null };
  return { min: Math.min(...prices), max: Math.max(...prices), compare: compares.length ? Math.max(...compares) : null };
}

export const LOW_STOCK = 10;

export function stockTone(n: number): 'danger' | 'warn' | 'ok' {
  return n <= 0 ? 'danger' : n < LOW_STOCK ? 'warn' : 'ok';
}

export const PRODUCT_STATUS: Record<string, { label: string; tone: 'ok' | 'neutral' | 'danger' }> = {
  active: { label: 'On sale', tone: 'ok' },
  draft: { label: 'Draft', tone: 'neutral' },
  archived: { label: 'Archived', tone: 'danger' },
};
