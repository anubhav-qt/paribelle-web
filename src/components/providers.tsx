'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { PoliciesProvider } from '@/contexts/PoliciesContext';
import { StockWebSocketProvider } from '@/contexts/StockWebSocketContext';
import { ToastProvider } from '@/components/ui/Toast';
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
          <PoliciesProvider>
            <CartProvider>
              <WishlistProvider>
                <ToastProvider>
                  {children}
                  <CartDrawer />
                </ToastProvider>
              </WishlistProvider>
            </CartProvider>
          </PoliciesProvider>
        </StockWebSocketProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
