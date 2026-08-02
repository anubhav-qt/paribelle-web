import Link from 'next/link';
import { SectionHeading } from '@/components/brand/SectionHeading';
import { RevealOnScroll } from '@/components/brand/RevealOnScroll';
import ProductCard from '@/components/product/ProductCard';
import type { Category, Product } from '@/types/product';

export interface ShopByCategorySectionProps {
  categories: Category[];
  productsByCategory: Record<string, Product[]>;
}

export function ShopByCategorySection({ categories, productsByCategory }: ShopByCategorySectionProps) {
  const sections = categories
    .map((cat) => ({ cat, products: productsByCategory[cat.slug] || [] }))
    .filter((s) => s.products.length > 0);

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
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6">
              {products.slice(0, 8).map((product, i) => (
                <RevealOnScroll key={product.id} delayMs={i * 40}>
                  <ProductCard product={product} />
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
}
