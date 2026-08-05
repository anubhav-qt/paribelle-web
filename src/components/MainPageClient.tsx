'use client';

import { Suspense, useMemo } from 'react';
import GoogleAuthHandler from '@/components/GoogleAuthHandler';
import { FabricWeaveHero } from '@/components/home/FabricWeaveHero';
import { ProductRail } from '@/components/home/ProductRail';
import { ShopByCategorySection } from '@/components/home/ShopByCategorySection';
import { LookbookTeaser } from '@/components/home/LookbookTeaser';
import { TrustStrip } from '@/components/home/TrustStrip';
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
  uncategorizedProducts: Product[];
}

const BOOKINGS_KEY = 'bookings-services';

export default function MainPageClient({
  categories,
  productsByCategory,
  uncategorizedProducts,
}: MainPageClientProps) {
  const bookingProducts = productsByCategory[BOOKINGS_KEY] || [];

  const shopCategories = useMemo(
    () => categories.filter((c) => c.slug !== BOOKINGS_KEY),
    [categories]
  );

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

  const newInProducts = useMemo(() => {
    const all = [
      ...uncategorizedProducts,
      ...Object.entries(productsByCategory)
        .filter(([slug]) => slug !== BOOKINGS_KEY)
        .flatMap(([, products]) => products),
    ];
    const seen = new Set<string>();
    const unique = all.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));
    return unique
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 12);
  }, [uncategorizedProducts, productsByCategory]);

  return (
    <div className="min-h-screen bg-[hsl(var(--pb-ivory))]">
      <Suspense fallback={null}>
        <GoogleAuthHandler />
      </Suspense>

      <FabricWeaveHero />
      <ProductRail eyebrow="Just Arrived" title="New In" products={newInProducts} viewAllHref="/category/new-in" />
      <ShopByCategorySection categories={browseCategories} productsByCategory={productsByCategory} />
      {LOOKBOOK_ENABLED && <LookbookTeaser />}
      {bookingProducts.length > 0 && (
        <ProductRail eyebrow="Book an Experience" title="Bookings & Services" products={bookingProducts} />
      )}
      <TrustStrip />
    </div>
  );
}
