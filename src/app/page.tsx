import MainPageClient from '@/components/MainPageClient';

// Disable static generation for homepage due to client components
export const dynamic = 'force-dynamic';

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
}

async function getHomepageData(locale?: string) {
  try {
    // Use server-side API URL or fallback to localhost:3001 for development
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    const url = new URL(`${apiUrl}/api/v1/homepage/data`);
    if (locale) {
      url.searchParams.append('lang', locale);
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
    
    // Fetch default theme
    let defaultTheme = null;
    try {
      const themeResponse = await fetch(`${apiUrl}/api/v1/settings/default-theme`, {
        cache: 'no-store',
      });
      if (themeResponse.ok) {
        const themeData = await themeResponse.json();
        if (themeData.value) {
          defaultTheme = JSON.parse(themeData.value);
        }
      }
    } catch (error) {
      console.error('[Server] Error fetching theme:', error);
    }
    
    return { ...data, defaultTheme };
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
      defaultTheme: null,
    };
  }
}

export default async function HomePage({ params }: { params: { locale: string } }) {
  const data = await getHomepageData(params.locale);

  return (
    <MainPageClient
      settings={data.settings}
      categories={data.categories}
      productsByCategory={data.productsByCategory}
      uncategorizedProducts={data.uncategorizedProducts}
      initialTheme={data.defaultTheme}
    />
  );
}
