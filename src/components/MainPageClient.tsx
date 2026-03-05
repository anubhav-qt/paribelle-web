'use client';
import ThemeRenderer from '@/components/ThemeRenderer';
import HeroCarousel from '@/components/HeroCarousel';
import Footer from '@/components/Footer';
import HomepageContent from '@/components/HomepageContent';
import { Suspense } from 'react';
import GoogleAuthHandler from '@/components/GoogleAuthHandler';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { Category } from '@/types/product';

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
  const theme = useThemeClasses();
  
  return (
    <div className={theme.combine('min-h-screen', theme.bg)}>
      <Suspense fallback={null}>
        <GoogleAuthHandler />
      </Suspense>
      
      <ThemeRenderer 
        component="header" 
        showLocationFilter={settings.locationFilterEnabled}
      />

      <HeroCarousel />

      <HomepageContent
        initialCategories={categories}
        initialProductsByCategory={productsByCategory}
        initialUncategorizedProducts={uncategorizedProducts}
        categoryDisplayMode={settings.categoryDisplayMode}
        currency={settings.currency}
        locationFilterEnabled={settings.locationFilterEnabled}
      />

      <ThemeRenderer 
        component="footer" 
        fallback={<Footer categories={categories} marketplaceName={settings.marketplaceName} />}
        categories={categories}
        marketplaceName={settings.marketplaceName}
      />
      
    </div>
  );
}
