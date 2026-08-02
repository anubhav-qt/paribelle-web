import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PageShell } from '@/components/layout/PageShell';

/**
 * PariBelle's shopfront chrome. Lives on the route group rather than the root
 * layout so the admin panel — which sits outside this group — gets its own
 * chrome instead of inheriting the floating storefront header.
 */
export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <PageShell>{children}</PageShell>
      <Footer />
    </>
  );
}
