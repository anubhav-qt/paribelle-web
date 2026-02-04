import { headers } from 'next/headers';
import MainPageClient from '@/components/MainPageClient';

// Disable static generation for homepage due to client components
import { Category } from '@/types/product';

export const dynamic = 'force-dynamic';

async function getHomepageData(locale?: string, vendorSlug?: string) {
  try {
    // Use server-side API URL or fallback to localhost:3001 for development
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    const url = new URL(`${apiUrl}/api/v1/homepage/data`);
    if (locale) {
      url.searchParams.append('lang', locale);
    }
    if (vendorSlug) {
      url.searchParams.append('vendorSlug', vendorSlug);
    }
    
    console.log('[Server] Fetching homepage data from:', url.toString());
    
    const response = await fetch(url.toString(), {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[Server] Homepage API returned error:', response.status, response.statusText);
      throw new Error(`Failed to fetch homepage data: ${response.status}`);
    }

    const data = await response.json();
    console.log('[Server] Homepage data fetched successfully');
    
    return data;
  } catch (error) {
    console.error('[Server] Error fetching homepage data:', error);
    return {
      settings: {
        locationFilterEnabled: true,
        currency: 'INR',
        categoryDisplayMode: 'sidebar',
        marketplaceLogo: '',
        marketplaceName: 'GaliCart',
      },
      categories: [],
      productsByCategory: {},
      uncategorizedProducts: [],
      heroCarouselSlides: [],
    };
  }
}

export default async function HomePage({ params }: { params: { locale: string } }) {
  // Get vendor slug from headers (set by middleware)
  const headersList = headers();
  const vendorSlug = headersList.get('x-vendor-slug') || undefined;
  
  const data = await getHomepageData(params.locale, vendorSlug);

  return (
    <MainPageClient
      settings={data.settings}
      categories={data.categories}
      productsByCategory={data.productsByCategory}
      uncategorizedProducts={data.uncategorizedProducts}
    />
  );
}
