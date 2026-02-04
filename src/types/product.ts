// Centralized Product types - use these across the entire application

import { ThemeConfig } from './common';

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  level?: number;
  vendorId?: string | null;
  children?: Category[];
  parent?: Category;
  _count?: {
    products: number;
  };
  primaryProductType?: 'physical' | 'booking' | 'tour';
  productCount?: number;
  typeDistribution?: {
    physical: number;
    booking: number;
    tour: number;
  };
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

export interface BookingAttributes {
  duration: number;
  durationUnit: 'hours' | 'days' | 'sessions';
  bufferTime: number;
  availableDays: string[];
  timeSlots: Array<{ start: string; end: string }>;
}

export interface TourDeparture {
  id?: string;
  departureDate: string;
  returnDate: string;
  availableSeats: number;
  pricePerPerson: number;
  status: 'active' | 'full' | 'cancelled' | 'available' | 'soldOut'; // Support both formats
}

export interface TourItinerary {
  day: number;
  title: string;
  description: string;
  activities: string[];
  meals: string[];
  accommodation: string;
}

export interface TourDetails {
  destinations: string[];
  tourType: string;
  difficulty: 'easy' | 'moderate' | 'challenging' | 'difficult';
  groupSize: { min: number; max: number };
  inclusions: string[];
  exclusions: string[];
  pickupPoints: Array<{ location: string; time: string }>;
  dropPoints: Array<{ location: string; time: string }>;
  accommodation: string;
  transportation: string;
  languages: string[];
  ageRestriction: string;
}

export interface TourAttributes {
  tourMode: boolean;
  departures: TourDeparture[];
  itinerary: TourItinerary[];
  details: TourDetails;
}

export interface ProductAttributes {
  booking?: BookingAttributes;
  tour?: TourAttributes;
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
  productType?: 'physical' | 'booking';
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
  
  // Booking and tour attributes
  attributes?: ProductAttributes;
}
