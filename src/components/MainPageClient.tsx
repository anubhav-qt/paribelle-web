'use client';

import ThemeSelector from '@/components/ThemeSelector';
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import Footer from '@/components/Footer';
import HomepageContent from '@/components/HomepageContent';
import { Suspense } from 'react';
import GoogleAuthHandler from '@/components/GoogleAuthHandler';

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
}

interface MainPageClientProps {
  settings: {
    locationFilterEnabled: boolean;
    currency: string;
    categoryDisplayMode: 'top' | 'sidebar';
    marketplaceName: string;
  };
  categories: Category[];
  productsByCategory: Record<string, any[]>;
  uncategorizedProducts: any[];
}

export default function MainPageClient({
  settings,
  categories,
  productsByCategory,
  uncategorizedProducts,
}: MainPageClientProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Suspense fallback={null}>
        <GoogleAuthHandler />
      </Suspense>
      <Header showLocationFilter={settings.locationFilterEnabled} />

      <HeroCarousel />

      <HomepageContent
        initialCategories={categories}
        initialProductsByCategory={productsByCategory}
        initialUncategorizedProducts={uncategorizedProducts}
        categoryDisplayMode={settings.categoryDisplayMode}
        currency={settings.currency}
        locationFilterEnabled={settings.locationFilterEnabled}
      />

      <Footer categories={categories} marketplaceName={settings.marketplaceName} />
      <ThemeSelector />
    </div>
  );
}
