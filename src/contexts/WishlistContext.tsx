'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { WishlistItem, WishlistContextType } from '@/lib/types/wishlist';
import { api, ApiError } from '@/lib/api';

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = 'marketplace_wishlist';

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load wishlist from localStorage on mount
  useEffect(() => {
    const savedWishlist = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (savedWishlist) {
      try {
        const parsedWishlist = JSON.parse(savedWishlist);
        setItems(Array.isArray(parsedWishlist) ? parsedWishlist : []);
      } catch (error) {
        console.error('Failed to parse wishlist from localStorage:', error);
        localStorage.removeItem(WISHLIST_STORAGE_KEY);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addToWishlist = (newItem: WishlistItem) => {
    setItems((prev) => {
      const exists = prev.find((item) => item.productId === newItem.productId);
      if (exists) {
        return prev; // Don't add duplicates
      }
      return [...prev, { ...newItem, addedAt: Date.now() }];
    });
  };

  const removeFromWishlist = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const isInWishlist = (productId: string): boolean => {
    return items.some((item) => item.productId === productId);
  };

  const toggleWishlist = (item: WishlistItem) => {
    if (isInWishlist(item.productId)) {
      removeFromWishlist(item.productId);
    } else {
      addToWishlist(item);
    }
  };

  const clearWishlist = () => {
    setItems([]);
  };

  /**
   * Drop saved items whose product has been deleted or archived. Same reasoning
   * as the cart: the list lives in localStorage, so the server cannot prune it
   * and the list has to check itself on read.
   */
  const reconcile = useCallback(async (): Promise<{ removed: WishlistItem[] }> => {
    const current = itemsRef.current;
    if (current.length === 0) return { removed: [] };

    const results = await Promise.all(
      current.map(async (item) => {
        try {
          const product = await api.get<any>(`/products/${item.productId}`, { auth: false });
          const gone = !product || (product.status && product.status !== 'active');
          return { item, gone, price: Number(product?.price) };
        } catch (error) {
          // Only a confirmed 404 removes an item — a network blip must not.
          if (error instanceof ApiError && error.status === 404) {
            return { item, gone: true, price: NaN };
          }
          return { item, gone: false, price: NaN };
        }
      }),
    );

    const removed = results.filter((r) => r.gone).map((r) => r.item);
    setItems(
      results
        .filter((r) => !r.gone)
        .map((r) => (Number.isFinite(r.price) ? { ...r.item, price: r.price } : r.item)),
    );

    return { removed };
  }, []);

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (!isLoaded) return;
    reconcile().catch((error) => console.error('Wishlist reconciliation failed:', error));
    // Runs once per mount, not on every wishlist change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const totalItems = items.length;

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
        clearWishlist,
        reconcile,
        totalItems,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
