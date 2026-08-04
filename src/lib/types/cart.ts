export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;          // ProductVariant.id (new variant system)
  variantSku?: string;         // Variant SKU for order display
  variantAttributes?: Record<string, string>; // e.g. { Size: 'M', Color: 'Red' }
  name: string;
  slug: string;
  price: number; // Tax-inclusive price
  quantity: number;
  image: string;
  vendorId: string;
  stockQuantity?: number;
  maxQuantity?: number;
  priceType?: string; // 'mrp_with_gst' | 'selling_price_without_gst'
  gstRate?: number; // GST rate (e.g., 18 for 18%)
}

/** What a pass of `reconcile` changed, for reporting back to the shopper. */
export interface CartReconciliation {
  /** Lines dropped because the product is gone, archived, or out of stock. */
  removed: CartItem[];
  /** Lines whose price has moved since they were added. */
  repriced: Array<{ item: CartItem; from: number; to: number }>;
  /** Lines trimmed because stock no longer covers the requested quantity. */
  restocked: Array<{ item: CartItem; from: number; to: number }>;
}

export interface CartContextType {
  items: CartItem[];
  /** Adds a line; `false` means a stock check refused it. */
  addToCart: (item: Omit<CartItem, 'id'>) => boolean;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  /** Re-check every line against the catalogue. See CartContext. */
  reconcile: () => Promise<CartReconciliation>;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}
