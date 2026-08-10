import { SectionHeading } from '@/components/brand/SectionHeading';
import { RevealOnScroll } from '@/components/brand/RevealOnScroll';
import ProductCard from '@/components/product/ProductCard';
import type { Product } from '@/types/product';

export interface ProductRailProps {
  eyebrow?: string;
  title: string;
  products: Product[];
  viewAllHref?: string;
  tinted?: boolean;
}

export function ProductRail({ eyebrow, title, products, viewAllHref, tinted }: ProductRailProps) {
  if (products.length === 0) return null;

  const rail = (
    <>
      <SectionHeading eyebrow={eyebrow} title={title} viewAllHref={viewAllHref} />
      <div className="scrollbar-hide mt-8 flex gap-4 overflow-x-auto md:gap-6">
        {products.map((product, i) => (
          <RevealOnScroll key={product.id} delayMs={i * 40} className="w-[46%] shrink-0 sm:w-[30%] md:w-[22%] lg:w-[18%]">
            <ProductCard product={product} />
          </RevealOnScroll>
        ))}
      </div>
    </>
  );

  if (tinted) {
    return (
      <section className="bg-[hsl(var(--pb-blush-wash))]">
        <div className="mx-auto max-w-7xl px-4 py-12 md:px-8">{rail}</div>
      </section>
    );
  }

  return <section className="mx-auto max-w-7xl px-4 py-12 md:px-8">{rail}</section>;
}
