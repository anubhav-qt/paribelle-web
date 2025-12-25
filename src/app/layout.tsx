import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
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

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
