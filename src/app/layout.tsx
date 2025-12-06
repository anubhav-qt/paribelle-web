import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Multi-Vendor Marketplace',
  description: 'Shop from multiple vendors in one place',
  keywords: ['marketplace', 'e-commerce', 'multi-vendor', 'online shopping'],
  authors: [{ name: 'Marketplace Team' }],
  openGraph: {
    title: 'Multi-Vendor Marketplace',
    description: 'Shop from multiple vendors in one place',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
