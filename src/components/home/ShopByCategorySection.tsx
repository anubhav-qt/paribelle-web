import Link from 'next/link';
import { SectionHeading } from '@/components/brand/SectionHeading';
import { RevealOnScroll } from '@/components/brand/RevealOnScroll';
import ProductCard from '@/components/product/ProductCard';
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

export function ShopByCategorySection({ categories, productsByCategory }: ShopByCategorySectionProps) {
  const sections = categories
    .map((cat) => ({ cat, products: productsByCategory[cat.slug] || [] }))
    .filter((s) => s.products.length > 0)
    .slice(0, MAX_SECTIONS);

  if (sections.length === 0) return null;

  return (
    <>
      {sections.map(({ cat, products }, sectionIndex) => (
        <section
          key={cat.id}
          className={sectionIndex % 2 === 1 ? 'bg-[hsl(var(--pb-blush-wash))]' : undefined}
        >
          <div className="mx-auto max-w-7xl px-4 py-14 md:px-8">
            <SectionHeading eyebrow="Shop the Edit" title={cat.name} viewAllHref={`/category/${cat.slug}`} />
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6 xl:grid-cols-5">
              {products.slice(0, 10).map((product, i) => (
                <RevealOnScroll key={product.id} delayMs={i * 40}>
                  <ProductCard product={product} sectionBg={sectionIndex % 2 === 1 ? 'tinted' : 'light'} />
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
