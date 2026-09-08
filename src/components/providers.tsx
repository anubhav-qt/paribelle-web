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
            // lib/store/dataCache), not here. What is left on React Query is
            // the admin and vendor surfaces, and these defaults are
            // deliberately *not* loosened for them.
            //
            // Widening staleTime or turning off refetch-on-mount would be
            // free on a storefront, but every one of those hooks already sets
            // its own staleTime for a reason — orders sit at 30 seconds
            // because an admin watching for new ones needs them to arrive. A
            // global `refetchOnMount: false` would mean returning to the
            // orders screen showed whatever was last fetched and never went
            // back for more, which is a much worse failure than a redundant
            // request.
            //
            // gcTime is the one safe widening: it only governs how long an
            // unused result is kept before eviction, so it makes returning to
            // an admin screen render from cache while the refetch runs, and
            // cannot serve anything staler than staleTime already allows.
            staleTime: 60 * 1000,
            gcTime: 30 * 60 * 1000,
            refetchOnWindowFocus: false,
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
