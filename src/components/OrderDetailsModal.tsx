'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Printer } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import OrderReturnsDisplay from '@/components/OrderReturnsDisplay';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  productImage?: string;
  returnedQuantity?: number;
  returnStatus?: 'none' | 'partial' | 'full';
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

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  subtotal?: number;
  tax?: number;
  shippingCost?: number;
  createdAt: string;
  deliveredAt?: string;
  items?: OrderItem[];
  returns?: any[];
  returnReason?: string;
  returnApprovedAt?: string;
  returnRejectedAt?: string;
  returnRejectionReason?: string;
  shippingName?: string;
  shippingEmail?: string;
  shippingPhone?: string;
  shippingAddress?: string | {
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
  paymentStatus?: string;
  paymentMethod?: string;
  vendor?: {
    businessName: string;
    storeName: string;
  };
  user?: {
    email: string;
    name: string;
  };
}

interface ReturnDetails {
  orderNumber: string;
  returnAuthNumber: string;
  returnReason: string;
  qrCodeDataUrl: string;
  returnAddress: {
    name: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };
  instructions: string[];
}

interface OrderDetailsModalProps {
  order: Order;
  isAdmin: boolean;
  returnDetails?: ReturnDetails | null;
  onClose: () => void;
  onApproveReturn?: (orderId: string) => void;
  onRejectReturn?: (orderId: string) => void;
  onConfirmReceived?: (orderId: string) => void;
  onPrintInvoice: (orderId: string) => void;
  formatCurrency?: (amount: number) => string;
  formatDate?: (dateString: string) => string;
  getStatusColor: (status: string) => string;
}

export default function OrderDetailsModal({
  order,
  isAdmin,
  returnDetails,
  onClose,
  onApproveReturn,
  onRejectReturn,
  onConfirmReceived,
  onPrintInvoice,
  formatCurrency,
  formatDate,
  getStatusColor,
}: OrderDetailsModalProps) {
  const [isReturnSectionExpanded, setIsReturnSectionExpanded] = useState(false);

  // Default format functions if not provided
  const defaultFormatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const defaultFormatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currencyFormatter = formatCurrency || defaultFormatCurrency;
  const dateFormatter = formatDate || defaultFormatDate;

  // Determine if return section should be displayed
  const showReturnSection = 
    (((order.status === 'return_requested' || order.status === 'return_approved' || order.status === 'returned') && order.returnReason) || 
    (order.returnRejectedAt && order.returnRejectionReason) ||
    (order.returnReason && order.status === 'delivered') ||
    (order.returns && order.returns.length > 0));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-card rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col border border-border">
        {/* Modal Header */}
        <div className="p-6 border-b border-border bg-white dark:bg-card flex-shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-foreground">
                Order {order.orderNumber}
              </h2>
              <p className="text-gray-600 dark:text-muted-foreground mt-1">
                {dateFormatter(order.createdAt)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-muted-foreground dark:hover:text-foreground text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Status */}
            <div>
              <h3 className="font-semibold text-foreground mb-2">Status</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                {order.status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </span>
              {order.paymentStatus && (
                <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                  order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                  order.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-800' :
                  order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                </span>
              )}
            </div>

            {/* Collapsible Return Information Section */}
            {showReturnSection && (
              <div className="border border-border rounded-lg overflow-hidden">
                {/* Collapsible Header */}
                <button
                  onClick={() => setIsReturnSectionExpanded(!isReturnSectionExpanded)}
                  className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="text-xl">
                      {order.status === 'return_requested' ? '🔄' :
                       order.status === 'return_approved' ? '✅' :
                       order.status === 'returned' ? '📦' :
                       order.returnRejectedAt ? '❌' : '📋'}
                    </span>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-foreground">
                        Return Information
                        {order.returns && order.returns.length > 0 && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            ({order.returns.length} item{order.returns.length !== 1 ? 's' : ''})
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {order.status === 'return_requested' ? 'Pending Review' :
                         order.status === 'return_approved' ? (isAdmin ? 'Approved - Awaiting Return' : 'Approved - Please Ship Back') :
                         order.status === 'returned' ? 'Completed' :
                         order.returnRejectedAt ? (isAdmin ? 'Rejected' : 'Request Rejected') : 
                         order.returns && order.returns.length > 0 ? 'Item Returns' : 'View Details'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.status === 'return_requested' ? 'bg-yellow-100 text-yellow-800 border border-yellow-300' :
                      order.status === 'return_approved' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                      order.status === 'returned' ? 'bg-green-100 text-green-800 border border-green-300' :
                      order.returnRejectedAt ? 'bg-red-100 text-red-800 border border-red-300' : 
                      'bg-muted text-muted-foreground border border-border'
                    }`}>
                      {order.status === 'return_requested' ? 'PENDING REVIEW' :
                       order.status === 'return_approved' ? 'APPROVED' :
                       order.status === 'returned' ? 'RETURNED' :
                       order.returnRejectedAt ? 'REJECTED' : 'UNKNOWN'}
                    </span>
                  </div>
                  <svg
                    className={`w-5 h-5 text-muted-foreground transition-transform ${isReturnSectionExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Collapsible Content */}
                {isReturnSectionExpanded && (
                  <div className="p-4 space-y-4 border-t border-border">
                    {/* Return Reason */}
                    {order.returnReason && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2">
                          {isAdmin ? 'Customer Return Request' : 'Your Return Request'}
                        </h4>
                        <div className="bg-accent/50 border border-border p-3 rounded-lg">
                          <p className="text-sm text-foreground">{order.returnReason}</p>
                        </div>
                        
                        {/* Admin Actions for Return Request */}
                        {isAdmin && order.status === 'return_requested' && onApproveReturn && onRejectReturn && (
                          <div className="mt-3 flex gap-2">
                            <button
                              onClick={() => onApproveReturn(order.id)}
                              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => onRejectReturn(order.id)}
                              className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
                            >
                              Reject Return
                            </button>
                          </div>
                        )}

                        {/* Admin Actions for Approved Return */}
                        {isAdmin && order.status === 'return_approved' && onConfirmReceived && (
                          <div className="mt-3">
                            <div className="bg-primary/10 border border-primary/30 p-3 rounded-lg mb-3">
                              <p className="text-sm text-primary">⏳ Waiting for customer to ship the item back</p>
                            </div>
                            <button
                              onClick={() => onConfirmReceived(order.id)}
                              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                            >
                              Confirm Item Received & Process Refund
                            </button>
                          </div>
                        )}

                        {/* Customer Status Message */}
                        {!isAdmin && order.status === 'return_requested' && (
                          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-3 rounded-lg mt-3">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              ⏳ Your return request is being reviewed by our team. You'll be notified once approved.
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Item-Level Return Requests */}
                    {order.returns && order.returns.length > 0 && (
                      <div>
                        <h4 className="font-medium text-foreground mb-3">Item Return Requests</h4>
                        <OrderReturnsDisplay returns={order.returns} />
                      </div>
                    )}

                    {/* Return Rejection Information */}
                    {order.returnRejectedAt && order.returnRejectionReason && (
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-destructive mb-2">
                            {isAdmin ? 'Admin Response' : 'Return Request Rejected'}
                          </h4>
                          <div className="bg-destructive/10 border border-destructive/30 p-3 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-destructive">❌</span>
                              {!isAdmin && <p className="text-sm font-semibold text-destructive">Return Rejected</p>}
                              <span className="text-xs text-destructive/70">
                                {new Date(order.returnRejectedAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-destructive mb-1">Reason:</p>
                            <p className="text-sm text-foreground">{order.returnRejectionReason}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Return QR Code and Instructions */}
            {returnDetails && (order.status === 'return_approved' || order.status === 'returned') && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">📦</span>
                  <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg">Return Shipping Information</h3>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-4 border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <h4 className="font-semibold text-center text-gray-700 dark:text-gray-300 mb-3">
                    📱 Return QR Code - Scan at Carrier
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
                    Show this code at UPS, FedEx, or USPS - No printing required!
                  </p>
                  
                  <div className="flex justify-center mb-4">
                    <div className="bg-white p-3 rounded-lg border-4 border-green-500">
                      <img 
                        src={returnDetails.qrCodeDataUrl} 
                        alt="Return QR Code" 
                        className="w-64 h-64"
                      />
                    </div>
                  </div>

                  <div className="text-center space-y-1">
                    <p className="font-bold text-lg text-gray-900 dark:text-gray-100">
                      RMA: {returnDetails.returnAuthNumber}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Order: {returnDetails.orderNumber}
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700">
                  <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Return To:</h4>
                  <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    <p className="font-medium">{returnDetails.returnAddress.name}</p>
                    <p>{returnDetails.returnAddress.addressLine1}</p>
                    <p>
                      {returnDetails.returnAddress.city}, {returnDetails.returnAddress.state}{' '}
                      {returnDetails.returnAddress.postalCode}
                    </p>
                    <p>{returnDetails.returnAddress.country}</p>
                    <p>Phone: {returnDetails.returnAddress.phone}</p>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded">
                  <h4 className="font-semibold text-amber-900 dark:text-amber-200 mb-2">
                    📋 Return Instructions
                  </h4>
                  <ol className="text-sm text-amber-900 dark:text-amber-200 space-y-2 ml-4 list-decimal">
                    {returnDetails.instructions.map((instruction, idx) => (
                      <li key={idx}>{instruction}</li>
                    ))}
                  </ol>
                  <p className="text-sm text-amber-800 dark:text-amber-300 mt-3 font-medium">
                    ⚠️ Important: Refund will be processed within 3-5 business days after we receive and inspect the returned item.
                  </p>
                </div>
              </div>
            )}

            {/* Customer Info (Admin only) */}
            {isAdmin && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-foreground mb-2">Customer Information</h3>
                <div className="bg-gray-50 dark:bg-muted p-4 rounded-lg space-y-1">
                  <p>
                    <span className="font-medium">Name:</span> {order.shippingName}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {order.shippingEmail || order.user?.email || 'N/A'}
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span> {order.shippingPhone || 'N/A'}
                  </p>
                </div>
              </div>
            )}

            {/* Order Info (Customer only) */}
            {!isAdmin && (
              <div>
                <h3 className="font-semibold mb-3 text-foreground">Order Information</h3>
                <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Number:</span>
                    <span className="font-medium text-foreground">{order.orderNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Date:</span>
                    <span className="font-medium text-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {order.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payment Method:</span>
                      <span className="font-medium text-foreground">
                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Shipping Address */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-foreground mb-2">Shipping Address</h3>
              <div className="bg-gray-50 dark:bg-muted p-4 rounded-lg">
                {typeof order.shippingAddress === 'string' ? (
                  <>
                    <p>{order.shippingAddress}</p>
                    <p>
                      {order.shippingCity}, {order.shippingState}
                    </p>
                  </>
                ) : typeof order.shippingAddress === 'object' && order.shippingAddress ? (
                  <>
                    {order.shippingAddress.fullName && <p className="font-medium">{order.shippingAddress.fullName}</p>}
                    <p>{order.shippingAddress.addressLine1}</p>
                    {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                      {order.shippingAddress.postalCode}
                    </p>
                    {order.shippingAddress.country && <p>{order.shippingAddress.country}</p>}
                  </>
                ) : (
                  <p>No address provided</p>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-foreground mb-2">
                {isAdmin ? 'Order Items' : 'Items Ordered'}
              </h3>
              {!isAdmin && order.items ? (
                <div className="space-y-3">
                  {order.items.map((item) => {
                    const productImage = item.productImage || item.product?.featuredImage;
                    const productSlug = item.product?.slug;
                    const vendorSlug = item.product?.vendor?.slug;
                    const vendorName = item.product?.vendor?.businessName;

                    return (
                      <div key={item.id} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                        {productImage && (
                          <Link href={`/products/${productSlug}`} className="flex-shrink-0">
                            <img
                              src={productImage.startsWith('http') ? productImage : `${process.env.NEXT_PUBLIC_API_URL}${productImage}`}
                              alt={item.productName}
                              className="w-20 h-20 object-cover rounded hover:opacity-80 transition-opacity"
                            />
                          </Link>
                        )}
                        <div className="flex-1 min-w-0">
                          <Link 
                            href={`/products/${productSlug}`}
                            className="font-medium text-foreground hover:text-primary block mb-1"
                          >
                            {item.productName}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            Qty: {item.quantity} × {formatPrice(item.price, 'INR')}
                          </p>
                          {vendorName && (
                            <Link 
                              href={`/vendors/${vendorSlug}`}
                              className="text-sm text-primary hover:underline mt-1 inline-block"
                            >
                              Sold by {vendorName}
                            </Link>
                          )}
                        </div>
                        <p className="font-semibold flex-shrink-0 text-foreground">
                          {formatPrice(item.price * item.quantity, 'INR')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-muted p-4 rounded-lg space-y-2">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>
                        {item.productName} x {item.quantity}
                      </span>
                      <span className="font-medium">{currencyFormatter(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-foreground mb-2">Order Summary</h3>
              <div className="bg-gray-50 dark:bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{currencyFormatter(order.subtotal || 0)}</span>
                </div>
                {order.shippingCost !== undefined && (
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>{currencyFormatter(order.shippingCost)}</span>
                  </div>
                )}
                {order.tax !== undefined && (
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{currencyFormatter(order.tax)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total:</span>
                  <span>{currencyFormatter(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Vendor Info */}
            {order.vendor && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-foreground mb-2">Vendor</h3>
                <div className="bg-gray-50 dark:bg-muted p-4 rounded-lg">
                  <p className="font-medium">{order.vendor.businessName}</p>
                  {order.vendor.storeName && (
                    <p className="text-sm text-gray-600 dark:text-muted-foreground">{order.vendor.storeName}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Footer Buttons */}
        <div className="p-6 border-t border-border bg-gray-50 dark:bg-muted flex gap-3 flex-shrink-0">
          <button
            onClick={() => onPrintInvoice(order.id)}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            Print Invoice
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
