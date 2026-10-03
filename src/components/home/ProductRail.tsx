import { SectionHeading } from '@/components/brand/SectionHeading';
import { RevealGroup, RevealOnScroll } from '@/components/brand/RevealOnScroll';
import ProductCard from '@/components/product/ProductCard';
import type { Product } from '@/types/product';

export interface ProductRailProps {
  eyebrow?: string;
  title: string;
  products: Product[];
  viewAllHref?: string;
  tinted?: boolean;
}

/**
 * Below md the row runs edge to edge: it bleeds out through the section's
 * gutter so cards slide off the screen edge rather than into an invisible
 * wall 16px short of it, snaps card by card, and leaves the next card peeking
 * so it's obvious there is more to swipe to.
 */
export const PHONE_RAIL =
  'max-md:-mx-4 max-md:snap-x max-md:snap-mandatory max-md:scroll-px-4 max-md:gap-3 max-md:px-4 max-md:pb-4 max-md:pt-1';

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
          to what it was before this padding was added. Phones neither tilt
          nor lift, so they drop most of it (PHONE_RAIL). */}
      <RevealGroup
        media="(max-width: 767px)"
        className={`scrollbar-hide mt-4 flex gap-4 overflow-x-auto pt-6 md:gap-6 ${PHONE_RAIL}`}
      >
        {products.map((product, i) => (
          <RevealOnScroll
            key={product.id}
            delayMs={i * 40}
            className="w-[44%] shrink-0 snap-start sm:w-[30%] md:w-[22%] lg:w-[18%]"
          >
            <ProductCard product={product} sectionBg={tinted ? 'tinted' : 'light'} />
          </RevealOnScroll>
        ))}
      </RevealGroup>
    </>
  );

  if (tinted) {
    return (
      <section className="bg-[hsl(var(--pb-blush-wash))]">
        <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-12">{rail}</div>
      </section>
    );
  }

  return <section className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-12">{rail}</section>;
}
