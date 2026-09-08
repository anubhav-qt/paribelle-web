import MainPageClient from '@/components/MainPageClient';

/**
 * The homepage is rebuilt at most every five minutes, not on every request.
 *
 * `force-dynamic` plus `cache: 'no-store'` meant a shopper returning to `/` —
 * including by pressing Back — waited on a fresh `/homepage/data` round trip
 * before seeing anything, even though the hero, the category tiles and the
 * rails had not changed since they left. Serving the last build and
 * revalidating behind it keeps the return trip instant; a genuine change
 * appears on the following visit rather than costing every visit a wait.
 */
export const revalidate = 300;

async function getHomepageData() {
  try {
    // Use server-side API URL or fallback to localhost:3001 for development
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = new URL(`${apiUrl}/api/v1/homepage/data`);

    const response = await fetch(url.toString(), {
      next: { revalidate: 300 },
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
    />
  );
}
