/**
 * Centralized status color utilities
 * Used across order, invoice, vendor, and product pages
 */

type StatusType = 'order' | 'invoice' | 'vendor' | 'product' | 'kyc';

interface StatusColors {
  [key: string]: string;
}

const ORDER_STATUS_COLORS: StatusColors = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  confirmed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  processing: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200',
  shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
  delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  return_requested: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
  return_approved: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200',
  returned: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

const INVOICE_STATUS_COLORS: StatusColors = {
  paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
};

const VENDOR_STATUS_COLORS: StatusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  rejected: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

const PRODUCT_STATUS_COLORS: StatusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  archived: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  out_of_stock: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
};

const KYC_STATUS_COLORS: StatusColors = {
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
  incomplete: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

/**
 * Get status color classes based on status type and value
 */
export function getStatusColor(status: string, type: StatusType = 'order'): string {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
  
  const colorMap: Record<StatusType, StatusColors> = {
    order: ORDER_STATUS_COLORS,
    invoice: INVOICE_STATUS_COLORS,
    vendor: VENDOR_STATUS_COLORS,
    product: PRODUCT_STATUS_COLORS,
    kyc: KYC_STATUS_COLORS,
  };

  return colorMap[type][normalizedStatus] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase());
}
