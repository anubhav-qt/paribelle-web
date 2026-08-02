import { SectionHeading } from '@/components/brand/SectionHeading';
import { RevealOnScroll } from '@/components/brand/RevealOnScroll';
import ProductCard from '@/components/product/ProductCard';
import type { Product } from '@/types/product';

export interface ProductRailProps {
  eyebrow?: string;
  title: string;
  products: Product[];
  viewAllHref?: string;
}

export function ProductRail({ eyebrow, title, products, viewAllHref }: ProductRailProps) {
  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">
      <SectionHeading eyebrow={eyebrow} title={title} viewAllHref={viewAllHref} />
      <div className="scrollbar-hide mt-8 flex gap-4 overflow-x-auto md:gap-6">
        {products.map((product, i) => (
          <RevealOnScroll key={product.id} delayMs={i * 40} className="w-[46%] shrink-0 sm:w-[30%] md:w-[22%] lg:w-[18%]">
            <ProductCard product={product} />
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
