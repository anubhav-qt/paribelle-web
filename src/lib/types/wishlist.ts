export interface WishlistItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  vendorId: string;
  addedAt: number;
}

export interface WishlistContextType {
  items: WishlistItem[];
  addToWishlist: (item: WishlistItem) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (item: WishlistItem) => void;
  clearWishlist: () => void;
  totalItems: number;
}
