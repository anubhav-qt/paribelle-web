// Centralized common types used across the application

// Location related interfaces
export interface City {
  id: string;
  name: string;
  state?: string;
}

export interface SubLocation {
  id: string;
  name: string;
  cityId: string;
  zipCode?: string;
}

// Policy interfaces
export interface Policy {
  id: string;
  type: string;
  content: string;
}

// Vendor policy interface (different from platform Policy)
export interface VendorPolicy {
  enabled: boolean;
  text: string;
  days?: number;
}

// Theme configuration
export interface ThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  headingFont?: string;
  layout?: string;
  templateId?: string;
  customCss?: string;
  showLogo?: boolean;
  showSearchBar?: boolean;
  footerText?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    linkedin?: string;
  };
}

// Order related interfaces
export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal?: number;
  image?: string;
  productImage?: string;
  returnedQuantity?: number;
  returnStatus?: 'none' | 'partial' | 'full';
  review?: any;
  product?: {
    id: string;
    slug: string;
    featuredImage?: string;
    vendor?: {
      id: string;
      slug: string;
      businessName: string;
      subdomain?: string;
    };
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  vendorId?: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  total?: number;
  totalAmount?: number;
  subtotal?: number;
  tax?: number;
  shippingCost?: number;
  vendorPayout?: number;
  commissionAmount?: number;
  commissionRate?: number;
  createdAt: string;
  updatedAt?: string;
  deliveredAt?: string;
  items: OrderItem[];
  user?: {
    id?: string;
    email: string;
    name: string;
  };
  returns?: any[];
  returnReason?: string;
  returnApprovedAt?: string;
  returnRejectedAt?: string;
  returnRejectionReason?: string;
  shippingName?: string;
  shippingEmail?: string;
  shippingPhone?: string;
  shippingAddress?: string | Address | {
    fullName?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  shippingCity?: string;
  shippingState?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  vendor?: {
    id?: string;
    storeName?: string;
    businessName?: string;
  };
  vendorReview?: any;
  invoices?: Array<{
    id?: string;
    type?: string;
    invoiceNumber?: string;
    payoutAmount?: number;
  }>;
  returnPolicy?: {
    allowReturns?: boolean;
    returnPolicyDays?: number;
  };
  invoice?: any;
}

export interface OrderFilters {
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit?: number;
  totalPages?: number;
}

// Address interfaces
export interface Address {
  id?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  postalCode?: string;
  country?: string;
  isDefault?: boolean;
}

// User interfaces
export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'customer' | 'vendor' | 'admin';
}

// Vendor related interfaces
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
  vendorId?: string;
  title: string;
  slug: string;
  pageType?: string;
  showInNavigation: boolean;
  isHomePage?: boolean;
  content?: string;
  order?: number;
  status?: string;
  updatedAt?: string;
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
  errors?: string[];
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
