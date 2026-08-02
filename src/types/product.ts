// Centralized Product types - use these across the entire application

import { ThemeConfig } from './common';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive?: boolean;
  sortOrder?: number;
  level?: number;
  vendorId?: string | null;
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

export interface Vendor {
  id: string;
  storeName?: string;
  businessName?: string;
  name?: string;
  email?: string;
  phone?: string;
  slug?: string;
  contactEmail?: string;
  subdomain?: string;
  description?: string;
  logo?: string;
  banner?: string;
  city?: string;
  state?: string;
  status?: string;
  totalSales?: number;
  totalProducts?: number;
  totalOrders?: number;
  rating?: number;
  kycStatus?: 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  kycRejectedReason?: string;
  kycSubmittedAt?: string;
  kycBusinessRegistration?: string;
  kycTaxDocument?: string;
  kycIdentityProof?: string;
  createdAt?: string;
  cityId?: string | null;
  subLocationId?: string | null;
  locationCity?: { id: string; name: string } | null;
  locationSubLocation?: { id: string; name: string } | null;
  themeConfig?: ThemeConfig;
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
  vendor?: Vendor;
  vendorId?: string;
  createdAt?: string;
  averageRating?: string | number;
  reviewCount?: number;
  
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

  attributes?: Record<string, any>;
}
