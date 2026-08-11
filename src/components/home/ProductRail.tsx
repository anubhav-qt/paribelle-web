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
      {/* pt-6 is headroom, not spacing — `overflow-x-auto` forces overflow-y
          to `auto` too (the CSS overflow spec computes a `visible` axis as
          `auto` the moment its sibling axis isn't `visible`), so with too
          little top padding a card's thread-and-eyelet ornament (which
          pokes ~16px above the card's own top edge) plus its 6px hover lift
          would move past this row's own top edge and get clipped
          mid-motion. 24px covers both with a little room to spare. mt-4
          rather than the original mt-8 keeps the heading-to-card gap close
          to what it was before this padding was added. */}
      <div className="scrollbar-hide mt-4 flex gap-4 overflow-x-auto pt-6 md:gap-6">
        {products.map((product, i) => (
          <RevealOnScroll key={product.id} delayMs={i * 40} className="w-[46%] shrink-0 sm:w-[30%] md:w-[22%] lg:w-[18%]">
            <ProductCard product={product} sectionBg={tinted ? 'tinted' : 'light'} />
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
