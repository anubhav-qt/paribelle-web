import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { headers } from 'next/headers';
import { Providers } from '@/components/providers';
import ThemeProvider from '@/components/ThemeProvider';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GaliCart',
  description: 'Shop from multiple vendors in one place',
  keywords: ['marketplace', 'e-commerce', 'multi-vendor', 'online shopping'],
  authors: [{ name: 'Marketplace Team' }],
  openGraph: {
    title: 'GaliCart',
    description: 'Shop from multiple vendors in one place',
    type: 'website',
  },
};

// Fetch default theme on server
async function getDefaultTheme() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${apiUrl}/api/v1/settings/default-theme`, {
      cache: 'no-store',
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.value) {
        return JSON.parse(data.value);
      }
    }
  } catch (error) {
    console.error('[Layout] Error fetching theme:', error);
  }
  return null;
}

export default async function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const defaultTheme = await getDefaultTheme();
  
  // Get vendor slug from headers (set by middleware)
  const headersList = headers();
  const vendorSlug = headersList.get('x-vendor-slug') || undefined;
  
  console.log('🟣 Layout (server-side):', {
    vendorSlug,
    hasVendorSlug: !!vendorSlug,
    allHeaders: Object.fromEntries(headersList.entries())
  });

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider initialTheme={defaultTheme}>
          <Providers initialVendorSlug={vendorSlug}>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
