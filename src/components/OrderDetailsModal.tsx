'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Printer } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { formatDateTime } from '@/lib/utils/date';
import { paymentStatusClass, paymentStatusLabel } from '@/lib/utils/payment-status';
import OrderReturnsDisplay from '@/components/OrderReturnsDisplay';
import ShipBackModal from '@/components/ShipBackModal';
import { Order, OrderItem } from '@/types/common';

// Format return reason from key to human-readable label
const formatReturnReason = (reason: string): string => {
  const reasons: Record<string, string> = {
    'defective': 'Defective or damaged item',
    'wrong_item': 'Wrong item received',
    'not_as_described': 'Item not as described',
    'size_fit': 'Size/fit issue',
    'quality': 'Poor quality',
    'changed_mind': 'Changed my mind',
    'other': 'Other reason'
  };
  return reasons[reason] || reason;
};

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
  onPrintInvoice: (orderId: string) => void;
  formatCurrency?: (amount: number) => string;
  formatDate?: (dateString: string) => string;
  getStatusColor: (status: string) => string;
  /** Called after the customer marks an exchange shipped, so the parent can refetch in the background. */
  onExchangeUpdated?: () => void;
}

const authHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export default function OrderDetailsModal({
  order,
  isAdmin,
  returnDetails,
  onClose,
  onPrintInvoice,
  formatCurrency,
  formatDate,
  getStatusColor,
  onExchangeUpdated,
}: OrderDetailsModalProps) {
  const [isReturnSectionExpanded, setIsReturnSectionExpanded] = useState(false);
  // Local copy so "I've shipped it back" reflects immediately without
  // waiting on the parent to refetch the whole order list.
  const [returnsOverride, setReturnsOverride] = useState<any[]>(order.returns || []);
  const [markingInTransitId, setMarkingInTransitId] = useState<string | null>(null);
  const [inTransitError, setInTransitError] = useState('');
  const [shipBackReturnId, setShipBackReturnId] = useState<string | null>(null);

  React.useEffect(() => {
    setReturnsOverride(order.returns || []);
  }, [order.id, order.returns]);

  const handleMarkShipped = async (returnId: string, trackingNumber?: string) => {
    setInTransitError('');
    setMarkingInTransitId(returnId);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/exchanges/${returnId}/in-transit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ trackingNumber }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to mark as shipped');
      }
      const updated = await res.json();
      // The API responds with the TypeORM entity (camelCase), but this
      // component's data comes from a raw-SQL `order.returns` join
      // elsewhere (snake_case) — map explicitly rather than spreading,
      // or the fresh fields silently wouldn't render.
      setReturnsOverride((prev) =>
        prev.map((r) =>
          r.id === returnId
            ? {
                ...r,
                status: updated.status,
                in_transit_at: updated.inTransitAt,
                customer_tracking_number: updated.customerTrackingNumber,
              }
            : r,
        ),
      );
      onExchangeUpdated?.();
    } catch (err: any) {
      setInTransitError(err?.message || 'Failed to mark as shipped');
      throw err;
    } finally {
      setMarkingInTransitId(null);
    }
  };

  // Default format functions if not provided
  const defaultFormatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const defaultFormatDate = formatDateTime; // Using centralized utility

  const currencyFormatter = formatCurrency || defaultFormatCurrency;
  const dateFormatter = formatDate || defaultFormatDate;

  // Determine if return section should be displayed
  // Only show if there are actual returns or return requests for this order
  const showReturnSection =
    returnsOverride.length > 0 ||
    (order.returnReason) ||
    (order.returnRejectedAt && order.returnRejectionReason);

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
                <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${paymentStatusClass(order.paymentStatus)}`}>
                  {paymentStatusLabel(order.paymentStatus)}
                </span>
              )}
              {order.status === 'cancelled' && order.cancellationReason && (
                <div className="mt-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Cancellation reason: </span>
                  {order.cancellationReason}
                </div>
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
                      {order.returnRejectedAt ? '❌' : '🔄'}
                    </span>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-foreground">
                        Exchange Requests
                        {returnsOverride.length > 0 && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">
                            ({returnsOverride.length} item{returnsOverride.length !== 1 ? 's' : ''})
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {order.returnRejectedAt ? (isAdmin ? 'Rejected' : 'Request Rejected') :
                         returnsOverride.length > 0 ? 'View exchange status' : 'View Details'}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      order.returnRejectedAt ? 'bg-red-100 text-red-800 border border-red-300' :
                      'bg-muted text-muted-foreground border border-border'
                    }`}>
                      {order.returnRejectedAt ? 'REJECTED' : `${returnsOverride.length} REQUEST${returnsOverride.length === 1 ? '' : 'S'}`}
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
                    {/* Return Items Details */}
                    {returnsOverride.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-foreground">Returned Items</h4>
                        <div className="space-y-2">
                          {returnsOverride.map((returnItem: any, idx: number) => (
                            <div key={idx} className="bg-accent/30 border border-border rounded-lg p-3">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1">
                                  <p className="font-medium text-foreground">{returnItem.product_name || returnItem.productName}</p>
                                  {returnItem.product_sku && (
                                    <p className="text-xs text-muted-foreground">SKU: {returnItem.product_sku}</p>
                                  )}
                                </div>
                                <span className={`px-2 py-1 rounded text-xs font-medium ml-2 ${
                                  returnItem.status === 'requested' ? 'bg-yellow-100 text-yellow-800' :
                                  returnItem.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                  returnItem.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  returnItem.status === 'in_transit' ? 'bg-indigo-100 text-indigo-800' :
                                  returnItem.status === 'received' ? 'bg-teal-100 text-teal-800' :
                                  returnItem.status === 'replacement_shipped' ? 'bg-purple-100 text-purple-800' :
                                  returnItem.status === 'completed' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {returnItem.status?.replace(/_/g, ' ').toUpperCase()}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                                <div>
                                  <span className="text-muted-foreground">Quantity:</span>
                                  <span className="ml-2 font-medium text-foreground">{returnItem.quantity}</span>
                                </div>
                                {Number(returnItem.refund_total || returnItem.refundTotal || 0) > 0 && (
                                  <div>
                                    <span className="text-muted-foreground">Credit issued:</span>
                                    <span className="ml-2 font-medium text-foreground">
                                      {formatCurrency ? formatCurrency(returnItem.refund_total || returnItem.refundTotal || 0) : `₹${returnItem.refund_total || returnItem.refundTotal || 0}`}
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className="text-sm">
                                <p className="text-muted-foreground mb-1">Reason:</p>
                                <p className="text-foreground bg-background/50 p-2 rounded">{formatReturnReason(returnItem.reason)}</p>
                              </div>

                              {returnItem.customer_notes && (
                                <div className="text-sm mt-2">
                                  <p className="text-muted-foreground mb-1">Customer Notes:</p>
                                  <p className="text-foreground bg-background/50 p-2 rounded">{returnItem.customer_notes}</p>
                                </div>
                              )}

                              {/* Exchange History Timeline */}
                              <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Exchange Timeline:</p>
                                <div className="space-y-1 text-xs">
                                  {returnItem.requested_at && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
                                      <span>Requested: {new Date(returnItem.requested_at).toLocaleString()}</span>
                                    </div>
                                  )}
                                  {returnItem.approved_at && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                      <span>Approved: {new Date(returnItem.approved_at).toLocaleString()}</span>
                                    </div>
                                  )}
                                  {returnItem.rejected_at && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                                      <span>Rejected: {new Date(returnItem.rejected_at).toLocaleString()}</span>
                                      {returnItem.rejection_reason && (
                                        <span className="text-red-600">- {returnItem.rejection_reason}</span>
                                      )}
                                    </div>
                                  )}
                                  {returnItem.in_transit_at && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                      <span>Shipped back by customer: {new Date(returnItem.in_transit_at).toLocaleString()}</span>
                                    </div>
                                  )}
                                  {returnItem.received_at && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                                      <span>Received{returnItem.inspection_result ? ` (inspection: ${returnItem.inspection_result})` : ''}: {new Date(returnItem.received_at).toLocaleString()}</span>
                                    </div>
                                  )}
                                  {returnItem.replacement_shipped_at && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                      <span>Replacement shipped: {new Date(returnItem.replacement_shipped_at).toLocaleString()}</span>
                                    </div>
                                  )}
                                  {returnItem.completed_at && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                      <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                                      <span>Completed: {new Date(returnItem.completed_at).toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {isAdmin && returnItem.admin_notes && (
                                <div className="mt-2 pt-2 border-t border-border text-sm">
                                  <p className="text-xs font-medium text-muted-foreground">Admin Notes:</p>
                                  <p className="text-foreground bg-blue-50 dark:bg-blue-900/20 p-2 rounded">{returnItem.admin_notes}</p>
                                </div>
                              )}

                              {/* Customer action for Approved Exchanges — this is the missing link: the
                                  admin can't inspect anything until the customer says it's on its way. */}
                              {!isAdmin && returnItem.status === 'approved' && (
                                <div className="mt-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-3 rounded-lg">
                                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                                    ✓ Exchange approved! Ship the item back, then let us know it's on its way — we'll inspect it and take it from there.
                                  </p>
                                  <button
                                    onClick={() => setShipBackReturnId(returnItem.id)}
                                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                                  >
                                    Where do I send it?
                                  </button>
                                </div>
                              )}
                              {!isAdmin && returnItem.status === 'in_transit' && (
                                <div className="mt-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 p-3 rounded-lg">
                                  <p className="text-sm text-indigo-800 dark:text-indigo-200">
                                    📦 Marked as shipped — we're waiting for it to arrive so we can inspect it.
                                    {returnItem.customer_tracking_number && ` Tracking: ${returnItem.customer_tracking_number}`}
                                  </p>
                                </div>
                              )}
                              {isAdmin && returnItem.status === 'in_transit' && (
                                <div className="mt-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 p-3 rounded-lg">
                                  <p className="text-sm text-indigo-800 dark:text-indigo-200">
                                    📦 Customer says this has shipped. Once it physically arrives, record the inspection result from the
                                    Exchange Requests panel — passing it is how you tell the system "I've got it."
                                  </p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Legacy Return Reason (for old full-order returns without individual items) */}
                    {order.returnReason && (!order.returns || order.returns.length === 0) && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2">
                          {isAdmin ? 'Customer Return Request' : 'Your Return Request'}
                        </h4>
                        <div className="bg-accent/50 border border-border p-3 rounded-lg">
                          <p className="text-sm text-foreground">{order.returnReason}</p>
                        </div>
                        
                        {/* Note: Legacy full-order returns are no longer supported via admin panel */}
                        {/* Admin actions are now handled per individual return item above */}

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
                  <span>{currencyFormatter(order.total || 0)}</span>
                </div>
              </div>
            </div>
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

      <ShipBackModal
        isOpen={!!shipBackReturnId}
        onClose={() => setShipBackReturnId(null)}
        productName={returnsOverride.find((r) => r.id === shipBackReturnId)?.productName}
        onConfirm={async (trackingNumber) => {
          if (!shipBackReturnId) return;
          await handleMarkShipped(shipBackReturnId, trackingNumber);
          setShipBackReturnId(null);
        }}
      />
    </div>
  );
}
