import MainPageClient from '@/components/MainPageClient';

// Disable static generation for homepage due to client components
export const dynamic = 'force-dynamic';

async function getHomepageData() {
  try {
    // Use server-side API URL or fallback to localhost:3001 for development
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = new URL(`${apiUrl}/api/v1/homepage/data`);

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

    return await response.json();
  } catch (error) {
    console.error('[Server] Error fetching homepage data:', error);
    return {
      settings: {
        currency: 'INR',
        marketplaceLogo: '',
        marketplaceName: 'PariBelle',
      },
      categories: [],
      productsByCategory: {},
      uncategorizedProducts: [],
      heroCarouselSlides: [],
    };
  }
}

export default async function HomePage() {
  const data = await getHomepageData();

  return (
    <MainPageClient
      settings={data.settings}
      categories={data.categories}
      productsByCategory={data.productsByCategory}
      uncategorizedProducts={data.uncategorizedProducts}
    />
  );
}
