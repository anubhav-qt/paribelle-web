import { Providers } from '@/components/providers';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
