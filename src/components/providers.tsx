'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { PoliciesProvider } from '@/contexts/PoliciesContext';
import { VendorProvider } from '@/contexts/VendorContext';
import CartDrawer from './CartDrawer';

export function Providers({ 
  children,
  initialVendorSlug,
  initialVendorData 
}: { 
  children: React.ReactNode;
  initialVendorSlug?: string;
  initialVendorData?: any;
}) {
  const pathname = usePathname();
  const [vendorSlug, setVendorSlug] = useState<string | undefined>(initialVendorSlug);
  
  console.log('🟠 Providers initialized:', { 
    initialVendorSlug, 
    vendorSlug, 
    pathname,
    hasInitialVendorData: !!initialVendorData,
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'server'
  });
  
  // Update vendor slug if pathname changes (for /vendor/slug routes)
  useEffect(() => {
    console.log('🟠 Providers useEffect:', { initialVendorSlug, pathname });
    
    // If we already have a vendor slug from server (subdomain), don't override it
    if (initialVendorSlug) {
      console.log('🟠 Using initialVendorSlug from server (subdomain):', initialVendorSlug);
      setVendorSlug(initialVendorSlug);
      return;
    }
    
    // Check pathname for /vendor/slug pattern
    const match = pathname?.match(/^\/vendor\/([^\/]+)/);
    const slug = match?.[1];
    console.log('🟠 Pathname check:', { match, slug });
    setVendorSlug(slug);
  }, [pathname, initialVendorSlug]);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  console.log('🟠 Providers rendering with vendorSlug:', vendorSlug);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <VendorProvider vendorSlug={vendorSlug} initialData={initialVendorData}>
          <PoliciesProvider>
            <CartProvider>
              <WishlistProvider>
                {children}
                <CartDrawer />
              </WishlistProvider>
            </CartProvider>
          </PoliciesProvider>
        </VendorProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
