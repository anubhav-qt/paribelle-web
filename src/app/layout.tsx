import type { Metadata } from 'next';
import { Cormorant_Garamond, Jost, Italiana } from 'next/font/google';
import { Providers } from '@/components/providers';
import ThemeProvider from '@/components/ThemeProvider';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

const jost = Jost({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-sans',
  display: 'swap',
});

const italiana = Italiana({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-logo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'PariBelle — Designer Kurtis & Artificial Jewellery',
    template: '%s | PariBelle',
  },
  description: 'Discover PariBelle — our own designer kurtis and artificial jewellery, designed in Jaipur with new pieces added every season.',
  keywords: ['PariBelle', 'designer kurtis', 'ethnic wear', 'artificial jewellery', 'Indian fashion', 'boutique'],
  authors: [{ name: 'PariBelle' }],
  icons: {
    icon: '/logo-mark.png',
    apple: '/logo-mark.png',
  },
  openGraph: {
    title: 'PariBelle — Designer Kurtis & Artificial Jewellery',
    description: 'Discover PariBelle — our own designer kurtis and artificial jewellery, designed in Jaipur with new pieces added every season.',
    type: 'website',
  },
};

// Fetch default theme on server
async function getDefaultTheme() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/v1/settings/default-theme`, {
      cache: 'no-store',
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.value) {
        // If value is already an object, return it directly
        // If it's a string, parse it as JSON
        return typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      }
    }
  } catch (error) {
    console.error('[Layout] Error fetching theme:', error);
  }
  return null;
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const defaultTheme = await getDefaultTheme();

  return (
    <html lang="en" suppressHydrationWarning className={`${cormorant.variable} ${jost.variable} ${italiana.variable}`}>
      <body className={jost.className}>
        <ThemeProvider initialTheme={defaultTheme}>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
