// Centralized common types used across the application

// The store's return or cancellation policy
export interface StorePolicy {
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
  variantId?: string | null;
  returnedQuantity?: number;
  returnStatus?: 'none' | 'partial' | 'full';
  review?: any;
  product?: {
    id: string;
    slug: string;
    featuredImage?: string;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  status: string;
  paymentStatus?: string;
  paymentMethod?: string;
  cancellationReason?: string;
  total?: number;
  totalAmount?: number;
  subtotal?: number;
  tax?: number;
  shippingCost?: number;
  codCharge?: number;
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
  /** Set when this order IS the replacement a different-product exchange produced — see ExchangesService.createReplacementOrder. */
  replacementForExchange?: {
    returnNumber: string;
    exchangeStatus: string;
    originalOrderId: string;
    originalOrderNumber: string;
  } | null;
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
  invoices?: Array<{
    id?: string;
    type?: string;
    invoiceNumber?: string;
  }>;
  invoice?: any;
  /**
   * Computed server-side (see OrdersService.transformOrder) so the client
   * never re-implements the cancellation/exchange policy — a rule duplicated
   * in two places drifts. Cancel is only true while unpaid and not yet
   * shipped; exchange is only true once delivered, paid, and inside the
   * configured exchange window.
   */
  canCancel?: boolean;
  canExchange?: boolean;
  /**
   * Something is still owing on a card/UPI order — a checkout payment that
   * was dismissed or declined, or the replacement order an exchange creates,
   * which an admin places with nobody at a checkout screen to pay it. The
   * amount due is the order's own `total`.
   */
  canPayOnline?: boolean;
  exchangeWindowExpiresAt?: string | null;
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
