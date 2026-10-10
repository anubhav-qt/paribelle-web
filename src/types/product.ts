// Centralized Product types - use these across the entire application

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive?: boolean;
  sortOrder?: number;
  level?: number;
  /** Product an admin pinned as this category's mega-menu Editor's Pick. */
  featuredProductId?: string | null;
  /**
   * Which of that product's images the Editor's Pick tile shows. May be one of
   * the product's own or one of its variants'. Null falls back to the
   * product's first image.
   */
  featuredImageUrl?: string | null;
  /** CSS `object-position` for that image inside the tile's tall crop, e.g. "50% 30%". */
  featuredImagePosition?: string | null;
  children?: Category[];
  parent?: Category;
  _count?: {
    products: number;
  };
  productCount?: number;
  filterConfig?: {
    filters: Array<{
      id: string;
      label: string;
      type: 'select' | 'multiselect' | 'checkbox' | 'range';
      options?: Array<{ value: string; label: string }>;
      min?: number;
      max?: number;
      step?: number;
    }>;
  };
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  variantAttributes: Record<string, string>;
  price: string | number;
  compareAtPrice?: string | number;
  stockQuantity: number;
  status?: string;
  featuredImage?: string;
  images?: string[];
  isActive: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: string | number;
  compareAtPrice?: string | number;
  stockQuantity?: number;
  status?: string;
  sku?: string;
  featuredImage?: string;
  images?: string[];
  categories?: Category[];
  createdAt?: string;
  averageRating?: string | number;
  reviewCount?: number;
  salesCount?: number;

  // Variation support (legacy)
  isParent?: boolean;
  parentProductId?: string;
  variations?: Product[];
  variationAttributes?: Record<string, string>;
  variationThemes?: string[];
  
  // Product variants support (new)
  hasVariants?: boolean;
  variantOptions?: any[];
  productVariants?: ProductVariant[];

  /**
   * The attributes every one of this product's variants agrees on — its
   * Fabric, its Finish. Computed by the API on each read from
   * `productVariants`, never stored: attributes live on the variants, and a
   * second copy on the product is what let filters and the variant picker
   * disagree. Send it back on a write and the API folds it into the variants.
   */
  attributes?: Record<string, string>;

  /** Non-filterable extras. */
  metadata?: Record<string, any>;
}
