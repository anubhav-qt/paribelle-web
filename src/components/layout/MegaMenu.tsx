'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getImageUrl } from '@/lib/image-url';
import { Monogram } from '@/components/brand/Monogram';
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
 *    labelled group, its own children are the plain text rows.
 *  - Only one level of children → a single unlabelled column of rows.
 *  - No children → EmptyCategoryPanel: a "coming soon" note when the category
 *    has no products at all (Jewellery, for now), otherwise a "shop all"
 *    prompt. The header opens a panel for every anchor category.
 *
 * The right-hand column is the Editor's Monthly Pick: an "Editor's Monthly
 * Pick" eyebrow over a tall wine-gradient tile showing the admin-pinned
 * product (category.featuredProductId) or the category's first product.
 */

function useFeaturedProduct(category: Category) {
  const { id, featuredProductId } = category;
  return useQuery({
    queryKey: ['megamenu-featured', id, featuredProductId ?? null],
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    queryFn: async (): Promise<Product | null> => {
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      // An admin-pinned pick wins; otherwise show the category's first product.
      if (featuredProductId) {
        const res = await fetch(`${base}/api/v1/products/${featuredProductId}`);
        return res.ok ? ((await res.json()) as Product) : null;
      }
      const res = await fetch(`${base}/api/v1/products?categoryId=${id}&limit=1`);
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
      className="flex items-baseline gap-2 rounded-none px-2 py-2 font-display text-[17px] font-medium leading-tight text-[hsl(var(--pb-ink))] transition-colors duration-150 hover:bg-[hsl(var(--pb-shell))] hover:text-[hsl(var(--pb-rose-deep))]"
    >
      {child.name}
      {count !== undefined && count > 0 && (
        <span className="font-sans text-[11px] font-normal text-[hsl(var(--pb-ink-faint))]">{count}</span>
      )}
    </Link>
  );
}

function EditorsPick({ category, onNavigate }: { category: Category; onNavigate: () => void }) {
  const { data: featured } = useFeaturedProduct(category);
  const image = featured?.featuredImage || featured?.images?.[0] || category.image;
  const href = featured ? `/products/${featured.slug}` : `/category/${category.slug}`;
  const price =
    featured && featured.price != null ? Number(featured.price) : undefined;

  return (
    <div className="flex w-52 flex-none flex-col gap-3 self-stretch">
      <span className="text-eyebrow text-[hsl(var(--pb-ink-faint))]">Editor&apos;s Monthly Pick</span>
      <Link
        href={href}
        onClick={onNavigate}
        className="relative flex flex-1 select-none flex-col justify-end overflow-hidden rounded-none bg-gradient-to-b from-[hsl(var(--pb-wine))] to-[hsl(var(--pb-wine-deep))] p-4"
        style={{ minHeight: '13rem' }}
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
    </div>
  );
}

/**
 * The panel a top-level category with no sub-categories opens. If the category
 * has no products at all (Jewellery, for now) it shows a calm "coming soon"
 * note; otherwise a "shop all" prompt beside the Editor's Pick.
 */
function EmptyCategoryPanel({ category, onNavigate }: { category: Category; onNavigate: () => void }) {
  const { data: featured, isLoading } = useFeaturedProduct(category);

  if (isLoading) {
    return <div className="w-80 px-10 py-12" aria-hidden />;
  }

  if (!featured) {
    return (
      <div className="flex w-80 flex-col items-center gap-3 px-10 py-12 text-center">
        <Monogram className="h-7 w-7 text-[hsl(var(--pb-gold))]" />
        <span className="text-eyebrow text-[hsl(var(--pb-ink-faint))]">{category.name}</span>
        <span className="font-display text-2xl italic text-[hsl(var(--pb-ink))]">Coming soon</span>
        <p className="max-w-[16rem] text-sm leading-relaxed text-[hsl(var(--pb-ink-muted))]">
          We&apos;re adding {category.name} to the collection. Do check back shortly.
        </p>
      </div>
    );
  }

  return (
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
  );
}

export function MegaMenu({ category, onNavigate }: MegaMenuProps) {
  const children = category.children ?? [];
  const groups = children.filter((child) => (child.children?.length ?? 0) > 0);
  const isGrouped = groups.length > 0;
  const isEmpty = children.length === 0;

  return (
    // Square panel that hangs off the nav — matches the storefront's crisp
    // (near-zero radius) chrome. `w-fit` shrinks it to its content.
    <div className="w-fit overflow-hidden rounded-none border border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-ivory)/0.97)] shadow-pb-lg backdrop-blur-xl">
      {isEmpty ? (
        <EmptyCategoryPanel category={category} onNavigate={onNavigate} />
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
