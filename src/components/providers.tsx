'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';
import { hydrateDataCache } from '@/lib/store/dataCache';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { PoliciesProvider } from '@/contexts/PoliciesContext';
import { StockWebSocketProvider } from '@/contexts/StockWebSocketContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { ToastProvider } from '@/components/ui/Toast';
import { DialogHost } from '@/lib/dialog';
import CartDrawer from './layout/CartDrawer';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // The storefront's public reads live in the Zustand cache (see
            // lib/store/dataCache) rather than here; what is left on React
            // Query is the admin and vendor surfaces, where a write is
            // followed by an explicit `invalidateQueries`. Those explicit
            // invalidations are what keeps those screens correct, so the
            // ambient refetch triggers are pure cost — every remount and
            // every reconnect re-issued a request whose answer had not
            // changed.
            staleTime: 5 * 60 * 1000,
            gcTime: 30 * 60 * 1000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            refetchOnMount: false,
          },
        },
      })
  );

  // Read the persisted cache back off disk. Deliberately in an effect rather
  // than at module load: the server rendered with an empty cache, so filling
  // it before the first client render would be a hydration mismatch. See
  // `skipHydration` in lib/store/dataCache.
  useEffect(() => {
    void hydrateDataCache();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} forcedTheme="light">
        <StockWebSocketProvider>
          <NotificationsProvider>
            <PoliciesProvider>
              <CartProvider>
                <WishlistProvider>
                  <ToastProvider>
                    {children}
                    <CartDrawer />
                    <DialogHost />
                  </ToastProvider>
                </WishlistProvider>
              </CartProvider>
            </PoliciesProvider>
          </NotificationsProvider>
        </StockWebSocketProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
