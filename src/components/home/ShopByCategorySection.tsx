'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SectionHeading } from '@/components/brand/SectionHeading';
import { RevealGroup, RevealOnScroll } from '@/components/brand/RevealOnScroll';
import ProductCard from '@/components/product/ProductCard';
import { PHONE_RAIL } from '@/components/home/ProductRail';
import { cn } from '@/lib/utils';
import type { Category, Product } from '@/types/product';

export interface ShopByCategorySectionProps {
  categories: Category[];
  productsByCategory: Record<string, Product[]>;
}

// With many categories this section becomes an endless page of
// near-identical rows — capped so the homepage stays finite. The header's
// nav already lists every category permanently, so nothing is lost by not
// repeating the rest here.
const MAX_SECTIONS = 3;

const PER_SECTION = 10;

/**
 * A grid of up to ten from md up. Below that the same cards become a swipe
 * rail — ten cards in a 2-up grid is five screens of scrolling per section —
 * ending on a "view all" tile so the end of the rail leads somewhere.
 */
export function ShopByCategorySection({ categories, productsByCategory }: ShopByCategorySectionProps) {
  const sections = categories
    .map((cat) => ({ cat, products: productsByCategory[cat.slug] || [] }))
    .filter((s) => s.products.length > 0)
    .slice(0, MAX_SECTIONS);

  if (sections.length === 0) return null;

  return (
    <>
      {sections.map(({ cat, products }, sectionIndex) => {
        const tinted = sectionIndex % 2 === 1;
        const shown = products.slice(0, PER_SECTION);
        return (
          <section key={cat.id} className={tinted ? 'bg-[hsl(var(--pb-blush-wash))]' : undefined}>
            <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
              <SectionHeading eyebrow="Shop the Edit" title={cat.name} viewAllHref={`/category/${cat.slug}`} />
              <RevealGroup
                media="(max-width: 767px)"
                className={cn(
                  'mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6 xl:grid-cols-5',
                  'scrollbar-hide max-md:mt-5 max-md:flex max-md:overflow-x-auto',
                  PHONE_RAIL
                )}
              >
                {shown.map((product, i) => (
                  <RevealOnScroll
                    key={product.id}
                    delayMs={i * 40}
                    className="max-md:w-[44%] max-md:shrink-0 max-md:snap-start sm:max-md:w-[30%]"
                  >
                    <ProductCard product={product} sectionBg={tinted ? 'tinted' : 'light'} />
                  </RevealOnScroll>
                ))}

                <RevealOnScroll
                  delayMs={shown.length * 40}
                  className="w-[44%] shrink-0 snap-start sm:w-[30%] md:hidden"
                >
                  <Link
                    href={`/category/${cat.slug}`}
                    className={cn(
                      'pb-press flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-[13px] border border-[hsl(var(--pb-ink)/0.08)] text-center',
                      tinted ? 'bg-white/70' : 'bg-[hsl(var(--pb-blush-wash)/0.7)]'
                    )}
                  >
                    <span className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-[hsl(var(--pb-ink))] text-white">
                      <ArrowRight className="h-[18px] w-[18px]" />
                    </span>
                    <span className="font-display text-[1.35rem] leading-none text-[hsl(var(--pb-ink))]">View all</span>
                    <span className="text-xs text-[hsl(var(--pb-ink-faint))]">
                      {products.length} {products.length === 1 ? 'piece' : 'pieces'}
                    </span>
                  </Link>
                </RevealOnScroll>
              </RevealGroup>
            </div>
          </section>
        );
      })}
    </>
  );
}
