// Centralized common types used across the application

export interface VendorStatus {
  kycStatus: string;
  storeName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  canAddProducts: boolean;
  blockReason: string | null;
}

export interface VendorPage {
  id: string;
  title: string;
  slug: string;
  showInNavigation: boolean;
  content?: string;
  order?: number;
  status?: string;
}

export interface LinkableProduct {
  id: string;
  name: string;
  slug: string;
  productType: string;
  isTour: boolean;
}

export interface ImportMessage {
  type: 'success' | 'error';
  text: string;
}

export interface SortConfig<T extends string = string> {
  field: T;
  order: 'asc' | 'desc';
}

export interface FilterConfig {
  searchQuery?: string;
  statusFilter?: string;
  typeFilter?: string;
  categoryFilter?: string;
}
