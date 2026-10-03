'use client';

import { Suspense, useMemo } from 'react';
import GoogleAuthHandler from '@/components/GoogleAuthHandler';
import { FabricWeaveHero } from '@/components/home/FabricWeaveHero';
import { ProductRail } from '@/components/home/ProductRail';
import { ShopByCategorySection } from '@/components/home/ShopByCategorySection';
import { LookbookTeaser } from '@/components/home/LookbookTeaser';
import { LOOKBOOK_ENABLED } from '@/lib/features';
import type { Category, Product } from '@/types/product';

interface MainPageClientProps {
  settings: {
    locationFilterEnabled: boolean;
    currency: string;
    categoryDisplayMode: 'top' | 'sidebar';
    marketplaceName: string;
  };
  categories: Category[];
  productsByCategory: Record<string, Product[]>;
}

const BOOKINGS_KEY = 'bookings-services';

export default function MainPageClient({
  categories,
  productsByCategory,
}: MainPageClientProps) {
  const bookingProducts = productsByCategory[BOOKINGS_KEY] || [];

  const shopCategories = useMemo(
    () => categories.filter((c) => c.slug !== BOOKINGS_KEY),
    [categories]
  );

  /**
   * The small-screen hero's one button. It will open the Seelie
   * recommendation experience once that exists; until then it goes to the
   * first top-level category that actually has stock (Kurtis, today —
   * Jewellery is still empty), so it never lands on a "coming soon" page.
   */
  const heroCta = useMemo(() => {
    const stocked = shopCategories.find((c) => (productsByCategory[c.slug] || []).length > 0);
    return stocked ? { label: 'Find Your Pick', href: `/category/${stocked.slug}` } : undefined;
  }, [shopCategories, productsByCategory]);

  /**
   * Shop-the-edit sections and the portal grid are keyed on the categories a
   * shopper actually browses. The root store's tree is one parent (Fashion)
   * over the real destinations (Kurtis, Jewellery), so flatten to the leaves
   * wherever a category has children — otherwise both surfaces would show a
   * single undifferentiated "Fashion" tile.
   */
  const browseCategories = useMemo(
    () => shopCategories.flatMap((cat) => (cat.children?.length ? cat.children : [cat])),
    [shopCategories]
  );

  /**
   * The hero's follow-up rail: top 5 by sales, but never at the cost of
   * range — at least 2 Kurtis and 2 Jewellery pieces are guaranteed (when
   * stock allows), with the 5th slot going to whichever product sold best
   * among what's left over. Picking straight top-5-by-salesCount could
   * easily land all five from one category.
   */
  const topSellingProducts = useMemo(() => {
    const bySales = (a: Product, b: Product) => (b.salesCount || 0) - (a.salesCount || 0);
    const kurtis = [...(productsByCategory['kurtis'] || [])].sort(bySales);
    const jewellery = [...(productsByCategory['jewellery'] || [])].sort(bySales);

    const picked: Product[] = [];
    const seen = new Set<string>();
    const take = (list: Product[], count: number) => {
      for (const p of list) {
        if (picked.length >= 5 || seen.has(p.id)) continue;
        if (count-- <= 0) break;
        seen.add(p.id);
        picked.push(p);
      }
    };

    take(kurtis, 2);
    take(jewellery, 2);

    const remainder = [...kurtis, ...jewellery]
      .filter((p) => !seen.has(p.id))
      .sort(bySales);
    take(remainder, 5 - picked.length);

    return picked.sort(bySales);
  }, [productsByCategory]);

  return (
    <div className="min-h-screen bg-[hsl(var(--pb-ivory))]">
      <Suspense fallback={null}>
        <GoogleAuthHandler />
      </Suspense>

      <FabricWeaveHero cta={heroCta} />
      <ProductRail eyebrow="Most Loved" title="Top Sellers" products={topSellingProducts} tinted />
      <ShopByCategorySection categories={browseCategories} productsByCategory={productsByCategory} />
      {LOOKBOOK_ENABLED && <LookbookTeaser />}
      {bookingProducts.length > 0 && (
        <ProductRail eyebrow="Book an Experience" title="Bookings & Services" products={bookingProducts} />
      )}
    </div>
  );
}
