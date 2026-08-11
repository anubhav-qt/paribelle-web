'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';
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
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

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
