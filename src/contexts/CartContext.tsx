'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CartItem, CartContextType } from '@/lib/types/cart';

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'marketplace_cart';

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

  const addToCart = (newItem: Omit<CartItem, 'id'>) => {
    setItems((prev) => {
      // Deduplicate: same variant = same line item; same product without variant = same line item
      const existingItem = prev.find((item) =>
        newItem.variantId
          ? item.variantId === newItem.variantId
          : item.productId === newItem.productId && !item.variantId
      );
      
      if (existingItem) {
        // Check stock limit
        const maxStock = existingItem.stockQuantity || 999;
        const newQuantity = existingItem.quantity + newItem.quantity;
        
        if (newQuantity > maxStock) {
          alert(`Cannot add more. Only ${maxStock} items available in stock.`);
          return prev;
        }
        
        // Update quantity if item already exists
        return prev.map((item) =>
          item.id === existingItem.id
            ? {
                ...item,
                quantity: Math.min(
                  item.quantity + newItem.quantity,
                  item.maxQuantity || item.stockQuantity || 999
                ),
              }
            : item
        );
      }
      
      // Check stock for new item
      const maxStock = newItem.stockQuantity || 999;
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
      prev.map((item) => {
        if (item.id === itemId) {
          const maxStock = item.maxQuantity || item.stockQuantity || 999;
          const newQuantity = Math.min(quantity, maxStock);
          
          if (quantity > maxStock) {
            alert(`Maximum ${maxStock} items available in stock.`);
          }
          
          return {
            ...item,
            quantity: newQuantity,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

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
