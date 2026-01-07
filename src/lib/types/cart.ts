export interface CartItem {
  id: string;
  productId: string;
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
  variationAttributes?: Record<string, string>;
  priceType?: string; // 'mrp_with_gst' | 'selling_price_without_gst'
  gstRate?: number; // GST rate (e.g., 18 for 18%)
}

export interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
}
