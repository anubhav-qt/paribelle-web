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
  vendorName: string;
  vendorSlug?: string;
  productType: 'physical' | 'booking';
  stockQuantity?: number;
  maxQuantity?: number;
  priceType?: string; // 'mrp_with_gst' | 'selling_price_without_gst'
  gstRate?: number; // GST rate (e.g., 18 for 18%)
}

export interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}
