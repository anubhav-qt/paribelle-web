import MainPageClient from '@/components/MainPageClient';

// Disable static generation for homepage due to client components
export const dynamic = 'force-dynamic';

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
}

async function getHomepageData() {
  try {
    // Use server-side API URL or fallback to localhost:3001 for development
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    console.log('[Server] Fetching homepage data from:', `${apiUrl}/api/v1/homepage/data`);
    
    const response = await fetch(
      `${apiUrl}/api/v1/homepage/data`,
      {
        cache: 'no-store', // Always fetch fresh data for now
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error('[Server] Homepage API returned error:', response.status, response.statusText);
      throw new Error(`Failed to fetch homepage data: ${response.status}`);
    }

    const data = await response.json();
    console.log('[Server] Homepage data fetched successfully');
    console.log('[Server] Categories count:', data.categories?.length || 0);
    console.log('[Server] Products by category keys:', Object.keys(data.productsByCategory || {}));
    console.log('[Server] Uncategorized products count:', data.uncategorizedProducts?.length || 0);
    
    return data;
  } catch (error) {
    console.error('[Server] Error fetching homepage data:', error);
    return {
      settings: {
        locationFilterEnabled: true,
        currency: 'INR',
        categoryDisplayMode: 'sidebar',
        marketplaceLogo: '',
        marketplaceName: 'Marketplace',
      },
      categories: [],
      productsByCategory: {},
      uncategorizedProducts: [],
    };
  }
}

export default async function Home() {
  const homepageData = await getHomepageData();
  const { settings, categories, productsByCategory, uncategorizedProducts } = homepageData;

  console.log('[Server] Rendering homepage with:');
  console.log('[Server] Categories:', categories?.length || 0);
  console.log('[Server] Product categories:', Object.keys(productsByCategory || {}).length);

  return (
    <MainPageClient
      settings={settings}
      categories={categories}
      productsByCategory={productsByCategory}
      uncategorizedProducts={uncategorizedProducts}
    />
  );
}
