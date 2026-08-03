'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { CartItem, CartContextType, CartReconciliation } from '@/lib/types/cart';
import { api, ApiError } from '@/lib/api';

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'marketplace_cart';

/**
 * Cap applied when a line item carries no stock figure at all. Only ever used
 * for *absent* stock — a stock of `0` means out of stock and must never be
 * treated as "no limit known".
 */
const UNKNOWN_STOCK_LIMIT = 99;

/**
 * How many of this line the shopper may hold.
 *
 * `stockQuantity` is the variant's own stock when the line is for a variant,
 * and the product's otherwise, so this is always the figure that matters.
 * Written out longhand because `||` here used to turn both `undefined` and `0`
 * into 999 — which is how a product with two in stock offered 999 and let
 * people order them.
 */
function stockLimitFor(item: Pick<CartItem, 'stockQuantity' | 'maxQuantity'>): number {
  const { stockQuantity, maxQuantity } = item;

  const known = stockQuantity ?? null;
  if (known === null) {
    return maxQuantity ?? UNKNOWN_STOCK_LIMIT;
  }

  return maxQuantity === undefined || maxQuantity === null
    ? known
    : Math.min(maxQuantity, known);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsedCart = JSON.parse(savedCart);
        setItems(Array.isArray(parsedCart) ? parsedCart : []);
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
        localStorage.removeItem(CART_STORAGE_KEY);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, isLoaded]);

  // Lets `reconcile` read the current lines without being rebuilt on every
  // cart change (and so re-running its effect).
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const addToCart = (newItem: Omit<CartItem, 'id'>) => {
    setItems((prev) => {
      // Deduplicate: same variant = same line item; same product without variant = same line item
      const existingItem = prev.find((item) =>
        newItem.variantId
          ? item.variantId === newItem.variantId
          : item.productId === newItem.productId && !item.variantId
      );
      
      if (existingItem) {
        // Trust the incoming stock figure over the one saved in localStorage,
        // which may be weeks old.
        const merged = {
          ...existingItem,
          stockQuantity: newItem.stockQuantity ?? existingItem.stockQuantity,
          maxQuantity: newItem.maxQuantity ?? existingItem.maxQuantity,
        };
        const maxStock = stockLimitFor(merged);

        if (maxStock === 0) {
          alert(`${newItem.name} is out of stock.`);
          return prev;
        }

        const newQuantity = existingItem.quantity + newItem.quantity;
        if (newQuantity > maxStock) {
          alert(`Cannot add more. Only ${maxStock} items available in stock.`);
          return prev;
        }

        // Update quantity if item already exists
        return prev.map((item) =>
          item.id === existingItem.id
            ? { ...merged, quantity: newQuantity }
            : item
        );
      }

      // Check stock for new item
      const maxStock = stockLimitFor(newItem);
      if (maxStock === 0) {
        alert(`${newItem.name} is out of stock.`);
        return prev;
      }
      if (newItem.quantity > maxStock) {
        alert(`Cannot add ${newItem.quantity} items. Only ${maxStock} available in stock.`);
        return prev;
      }

      // Add new item with generated ID
      const cartItem: CartItem = {
        ...newItem,
        id: `${newItem.productId}-${newItem.variantId || 'base'}-${Date.now()}`,
      };
      
      return [...prev, cartItem];
    });
    
    // Open cart drawer when item is added
    setIsOpen(true);
  };

  const removeFromCart = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setItems((prev) =>
      prev.flatMap((item) => {
        if (item.id !== itemId) return [item];

        const maxStock = stockLimitFor(item);

        // Stock can drop to zero while the line sits in the cart. Drop the
        // line rather than leaving a zero-quantity row behind.
        if (maxStock === 0) {
          alert(`${item.name} is out of stock and has been removed from your cart.`);
          return [];
        }

        if (quantity > maxStock) {
          alert(`Maximum ${maxStock} items available in stock.`);
        }

        return [{ ...item, quantity: Math.min(quantity, maxStock) }];
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  /**
   * Re-check every line against the catalogue.
   *
   * The cart lives only in localStorage, so the server cannot reach in and
   * remove a line when its product is deleted or archived — a shopper can hold
   * a cart for weeks and check out with something that no longer exists.
   * Instead the cart reconciles itself on read and again at checkout: lines
   * whose product is gone are dropped, and the ones that survive pick up the
   * current price and stock.
   *
   * Returns what changed so the caller can tell the shopper. A network failure
   * leaves the cart untouched rather than emptying it.
   */
  const reconcile = useCallback(async (): Promise<CartReconciliation> => {
    const current = itemsRef.current;
    if (current.length === 0) return { removed: [], repriced: [], restocked: [] };

    const results = await Promise.all(
      current.map(async (item) => {
        try {
          const product = await api.get<any>(`/products/${item.productId}`, { auth: false });

          // Archived and draft products are no longer purchasable.
          if (!product || (product.status && product.status !== 'active')) {
            return { item, gone: true as const };
          }

          const variant = item.variantId
            ? (product.productVariants || product.variants || []).find(
                (v: any) => v.id === item.variantId,
              )
            : null;

          // A variant that has since been removed takes its line with it.
          if (item.variantId && !variant) {
            return { item, gone: true as const };
          }

          const price = Number(variant ? variant.price : product.price);
          const stockQuantity = variant ? variant.stockQuantity : product.stockQuantity;

          return {
            item,
            gone: false as const,
            price: Number.isFinite(price) ? price : item.price,
            stockQuantity,
          };
        } catch (error) {
          // A missing product is a removal; anything else (offline, 500) is
          // not, and must not silently delete someone's cart.
          if (error instanceof ApiError && error.status === 404) {
            return { item, gone: true as const };
          }
          return { item, gone: false as const, unavailable: true as const };
        }
      }),
    );

    const removed: CartItem[] = [];
    const repriced: Array<{ item: CartItem; from: number; to: number }> = [];
    const restocked: Array<{ item: CartItem; from: number; to: number }> = [];
    const next: CartItem[] = [];

    for (const result of results) {
      if (result.gone) {
        removed.push(result.item);
        continue;
      }
      if ('unavailable' in result) {
        next.push(result.item);
        continue;
      }

      const updated: CartItem = {
        ...result.item,
        price: result.price,
        stockQuantity: result.stockQuantity,
        maxQuantity: result.stockQuantity,
      };

      const limit = stockLimitFor(updated);
      if (limit === 0) {
        removed.push(result.item);
        continue;
      }

      if (result.price !== result.item.price) {
        repriced.push({ item: updated, from: result.item.price, to: result.price });
      }
      if (updated.quantity > limit) {
        restocked.push({ item: updated, from: updated.quantity, to: limit });
        updated.quantity = limit;
      }

      next.push(updated);
    }

    setItems(next);
    return { removed, repriced, restocked };
  }, []);

  // Reconcile once the stored cart has been read back in.
  useEffect(() => {
    if (!isLoaded) return;
    reconcile().catch((error) => console.error('Cart reconciliation failed:', error));
    // Deliberately runs once per mount, not on every cart change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen((prev) => !prev);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  
  // Calculate total price accounting for tax-inclusive and tax-exclusive products
  const totalPrice = items.reduce((sum, item) => {
    const itemTotal = item.price * item.quantity;
    const priceType = item.priceType || 'mrp_with_gst';
    
    if (priceType === 'mrp_with_gst') {
      // Price already includes tax
      return sum + itemTotal;
    } else {
      // Price excludes tax - add GST on top
      const gstRate = (item.gstRate !== undefined && item.gstRate !== null) ? item.gstRate : 18;
      const taxAmount = itemTotal * (gstRate / 100);
      return sum + itemTotal + taxAmount;
    }
  }, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        reconcile,
        totalItems,
        totalPrice,
        isOpen,
        openCart,
        closeCart,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
