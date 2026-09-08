'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getImageUrl } from '@/lib/image-url';
import type { Category, Product } from '@/types/product';

export interface MegaMenuProps {
  category: Category;
  onNavigate: () => void;
}

/**
 * The hover panel for a top-level category. It renders whatever tree the API
 * returns:
 *
 *  - Grandchildren present (Kurtis › By Style › Top Only …) → each child is a
 *    labelled group, its own children are the rows.
 *  - Only one level of children → a single unlabelled column of rows.
 *  - No children at all (Jewellery, for now) → a short "coming soon" state,
 *    because the header opens this panel for every anchor category, not just
 *    the stocked ones.
 *
 * The right-hand tile is the Editor's Pick: the same tall wine-gradient block
 * the seasonal promo used to occupy, now showing the category's featured
 * product (or, with nothing to show, a plain "explore" prompt).
 */

// Tonal fills for a sub-category that has no image of its own. Hashed off the
// slug so a given category always gets the same one.
const PLACEHOLDER_TINTS = [
  'from-[hsl(var(--pb-rose)/0.55)] to-[hsl(var(--pb-rose-deep)/0.75)]',
  'from-[hsl(var(--pb-gold-soft))] to-[hsl(var(--pb-gold))]',
  'from-[hsl(var(--pb-blush))] to-[hsl(var(--pb-rose))]',
  'from-[hsl(var(--pb-wine)/0.85)] to-[hsl(var(--pb-wine-deep))]',
];

function tintFor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PLACEHOLDER_TINTS[hash % PLACEHOLDER_TINTS.length];
}

function useFeaturedProduct(categoryId: string | undefined) {
  return useQuery({
    queryKey: ['megamenu-featured', categoryId],
    enabled: !!categoryId,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    queryFn: async (): Promise<Product | null> => {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${base}/api/v1/products?categoryId=${categoryId}&limit=1`);
      if (!res.ok) return null;
      const data = await res.json();
      const list: Product[] = Array.isArray(data) ? data : data.products || [];
      return list[0] ?? null;
    },
  });
}

function SubCategoryRow({ child, onNavigate }: { child: Category; onNavigate: () => void }) {
  const count = typeof child.productCount === 'number' ? child.productCount : undefined;
  return (
    <Link
      href={`/category/${child.slug}`}
      onClick={onNavigate}
      className="group flex items-center gap-3 rounded-md p-2 transition-colors duration-150 hover:bg-[hsl(var(--pb-shell))]"
    >
      <span className="relative h-14 w-11 flex-none overflow-hidden rounded-md shadow-[inset_0_0_0_1px_hsl(var(--pb-ink)/0.06)]">
        {child.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getImageUrl(child.image)}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 ease-pb group-hover:scale-105"
          />
        ) : (
          <span className={`block h-full w-full bg-gradient-to-br ${tintFor(child.slug || child.name)}`} />
        )}
      </span>
      <span className="flex flex-col">
        <span className="font-display text-[17px] font-medium leading-tight text-[hsl(var(--pb-ink))]">
          {child.name}
        </span>
        {count !== undefined && count > 0 && (
          <span className="text-[11px] text-[hsl(var(--pb-ink-faint))]">
            {count} {count === 1 ? 'piece' : 'pieces'}
          </span>
        )}
      </span>
    </Link>
  );
}

function EditorsPick({ category, onNavigate }: { category: Category; onNavigate: () => void }) {
  const { data: featured } = useFeaturedProduct(category.id);
  const image = featured?.featuredImage || featured?.images?.[0] || category.image;
  const href = featured ? `/products/${featured.slug}` : `/category/${category.slug}`;
  const price =
    featured && featured.price != null ? Number(featured.price) : undefined;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="relative flex w-52 flex-none select-none flex-col justify-end self-stretch overflow-hidden rounded-lg bg-gradient-to-b from-[hsl(var(--pb-wine))] to-[hsl(var(--pb-wine-deep))] p-4"
      style={{ minHeight: '15rem' }}
    >
      {image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getImageUrl(image)} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <span className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--pb-wine-deep)/0.9)] via-[hsl(var(--pb-wine-deep)/0.35)] to-transparent" />
        </>
      ) : (
        <span
          className="absolute inset-0"
          style={{ background: 'radial-gradient(80% 60% at 20% 15%, hsl(var(--pb-gold) / 0.4), transparent 70%)' }}
        />
      )}

      <span className="relative flex flex-col gap-1">
        <span className="text-eyebrow text-[hsl(var(--pb-gold-soft))]">
          {featured ? "Editor's Pick" : 'Featured'}
        </span>
        <span className="font-display text-xl font-medium leading-tight text-white">
          {featured ? featured.name : category.name}
        </span>
        {price !== undefined && Number.isFinite(price) && (
          <span className="text-[13px] text-white/80">₹{price.toLocaleString('en-IN')}</span>
        )}
        <span className="mt-3 inline-flex w-fit rounded-full bg-[hsl(var(--pb-rose))] px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-[hsl(var(--pb-wine-deep))]">
          {featured ? 'View piece' : `Explore ${category.name}`}
        </span>
      </span>
    </Link>
  );
}

export function MegaMenu({ category, onNavigate }: MegaMenuProps) {
  const children = category.children ?? [];
  const groups = children.filter((child) => (child.children?.length ?? 0) > 0);
  const isGrouped = groups.length > 0;
  const isEmpty = children.length === 0;

  return (
    // Rounded panel that hangs off the nav — reads as part of the same object.
    // `w-fit` lets it shrink to its content instead of claiming a fixed width.
    <div className="w-fit overflow-hidden rounded-lg border border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-ivory)/0.97)] shadow-pb-lg backdrop-blur-xl">
      {isEmpty ? (
        // No sub-categories yet — still open a panel (the header opens one for
        // every anchor category), just with a single "shop all" prompt beside
        // the Editor's Pick. EditorsPick falls back to an "explore" tile when
        // the category has no products at all.
        <div className="flex gap-7 px-7 py-6">
          <div className="flex w-48 flex-col justify-center gap-2">
            <span className="text-eyebrow text-[hsl(var(--pb-ink-faint))]">{category.name}</span>
            <p className="text-sm leading-relaxed text-[hsl(var(--pb-ink-muted))]">
              Browse the full {category.name} collection.
            </p>
            <Link
              href={`/category/${category.slug}`}
              onClick={onNavigate}
              className="mt-1 text-sm text-[hsl(var(--pb-rose-deep))] transition-colors duration-150 hover:text-[hsl(var(--pb-rose-ink))]"
            >
              Shop all {category.name} &rarr;
            </Link>
          </div>
          <EditorsPick category={category} onNavigate={onNavigate} />
        </div>
      ) : (
        <div className="flex gap-7 px-7 py-6">
          {isGrouped ? (
            groups.map((group, i) => (
              <div key={group.id} className="flex gap-7">
                {i > 0 && <span className="w-px flex-none self-stretch bg-[hsl(var(--pb-linen))]" />}
                <div className="flex w-52 flex-col gap-3">
                  <span className="text-eyebrow text-[hsl(var(--pb-ink-faint))]">{group.name}</span>
                  <div className="flex flex-col gap-1">
                    {group.children!.map((child) => (
                      <SubCategoryRow key={child.id} child={child} onNavigate={onNavigate} />
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex w-56 flex-col gap-3">
              <span className="text-eyebrow text-[hsl(var(--pb-ink-faint))]">Shop {category.name}</span>
              <div className="flex flex-col gap-1">
                {children.map((child) => (
                  <SubCategoryRow key={child.id} child={child} onNavigate={onNavigate} />
                ))}
              </div>
            </div>
          )}

          <EditorsPick category={category} onNavigate={onNavigate} />
        </div>
      )}
    </div>
  );
}
