'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice } from '@/lib/currency';
import { getStatusColor } from '@/lib/utils/status';
import { toggleSort } from '@/lib/utils/sort';
import { Package, Clock, CheckCircle, XCircle, Truck, Eye, Download, Printer } from 'lucide-react';
import { AccountShell } from '@/components/account/AccountShell';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { useToast, useConfirm } from '@/hooks/useDialogs';
import Toast from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import ReturnRequestModal from '@/components/ReturnRequestModal';
import OrderReturnsDisplay from '@/components/OrderReturnsDisplay';
import OrderDetailsModal from '@/components/OrderDetailsModal';
import { useMarketplaceWebSocket } from '@/contexts/StockWebSocketContext';
import { Order, OrderItem } from '@/types/common';
import { Loader } from '@/components/ui/Loader';

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

export default function OrdersPage() {
  const router = useRouter();
  const theme = useThemeClasses();
  const { toast, showToast, hideToast } = useToast();
  const { confirm, showConfirm, hideConfirm } = useConfirm();
  const { subscribeToOrderStatusUpdates } = useMarketplaceWebSocket();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [returnDetails, setReturnDetails] = useState<ReturnDetails | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showReturnConfirmation, setShowReturnConfirmation] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelReasonOther, setCancelReasonOther] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [orderToAction, setOrderToAction] = useState<Order | null>(null);
  
  // Status change modal state for admin/vendor
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedOrderForStatusChange, setSelectedOrderForStatusChange] = useState<Order | null>(null);
  const [user, setUser] = useState<any>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token) {
      alert('Please login to view your orders');
      router.push('/login');
      return;
    }

    if (userStr) {
      setUser(JSON.parse(userStr));
    }

    fetchOrders();
  }, [router]);

  // Subscribe to order status updates via WebSocket
  useEffect(() => {
    const unsubscribe = subscribeToOrderStatusUpdates((update) => {
      console.log('Order status updated via WebSocket:', update);
      // Refresh orders when any order status changes
      fetchOrders();
      
      // Show toast notification
      showToast(`Order status updated to: ${update.status}`, 'info');
    });

    return () => {
      unsubscribe();
    };
  }, [subscribeToOrderStatusUpdates]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get next possible statuses based on current status
  const getNextStatuses = (currentStatus: string): string[] => {
    const statusMap: { [key: string]: string[] } = {
      'pending': ['processing', 'cancelled'],
      'processing': ['shipped', 'cancelled'],
      'shipped': ['delivered', 'cancelled'],
      'delivered': [],
      'cancelled': [],
      'return_requested': [],
      'return_approved': [],
    };
    return statusMap[currentStatus.toLowerCase()] || [];
  };

  // Admin/Vendor: Handle status badge click
  const handleStatusBadgeClick = (order: Order, event: React.MouseEvent) => {
    event.stopPropagation();
    if (user?.role === 'super_admin' || user?.role === 'vendor_admin') {
      const nextStatuses = getNextStatuses(order.status);
      if (nextStatuses.length > 0) {
        setSelectedOrderForStatusChange(order);
        setShowStatusModal(true);
      }
    }
  };

  // Admin/Vendor: Update order status
  const handleUpdateOrderStatus = async (newStatus: string) => {
    if (!selectedOrderForStatusChange) return;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders/${selectedOrderForStatusChange.id}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        showToast(`Order status updated to ${newStatus}`, 'success');
        setShowStatusModal(false);
        setSelectedOrderForStatusChange(null);
        fetchOrders();
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to update order status', 'error');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast('Failed to update order status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Check if user is admin or vendor
  const isAdminOrVendor = user?.role === 'super_admin' || user?.role === 'vendor_admin';

  const handleCancelOrder = async () => {
    if (!orderToAction || !cancelReason) {
      alert('Please select a cancellation reason');
      return;
    }

    if (cancelReason === 'other' && !cancelReasonOther.trim()) {
      showToast('Please specify your cancellation reason', 'warning');
      return;
    }

    const finalReason = cancelReason === 'other' ? cancelReasonOther : cancelReason;

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders/${orderToAction.id}/cancel`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: finalReason }),
        }
      );

      if (response.ok) {
        showToast('Order cancelled successfully', 'success');
        setShowCancelModal(false);
        setCancelReason('');
        setCancelReasonOther('');
        setOrderToAction(null);
        fetchOrders();
      } else {
        const error = await response.json();
        showToast(error.message || 'Failed to cancel order', 'error');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      showToast('Failed to cancel order. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Check if order can be returned based on vendor's return policy
  const canReturnOrder = (order: Order): boolean => {
    // Only allow returns for delivered orders
    const isDelivered = order.status.toLowerCase() === 'delivered';
    
    if (!isDelivered) return false;
    
    // Ensure deliveredAt date exists
    if (!order.deliveredAt) return false;
    
    // Default to allowing returns if returnPolicy is not present (backward compatibility)
    const allowReturns = order.returnPolicy?.allowReturns ?? true;
    const returnPolicyDays = order.returnPolicy?.returnPolicyDays ?? 7;
    
    if (!allowReturns || returnPolicyDays === 0) return false;
    
    // Check if within return window
    const deliveryDate = new Date(order.deliveredAt);
    const currentDate = new Date();
    const daysSinceDelivery = Math.floor((currentDate.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceDelivery <= returnPolicyDays;
  };

  const getReturnPolicyMessage = (order: Order): string => {
    const allowReturns = order.returnPolicy?.allowReturns ?? true;
    const returnPolicyDays = order.returnPolicy?.returnPolicyDays ?? 7;
    
    if (!allowReturns) return 'Vendor does not accept returns';
    if (returnPolicyDays === 0) return 'Returns not allowed';
    
    // For COD orders, allow returns after delivery. For online payments, allow after payment or delivery
    const isDeliveredOrPaid = order.deliveredAt || (order.paymentStatus === 'paid');
    if (!isDeliveredOrPaid) return 'Order not yet delivered or paid';
    
    const deliveryDate = order.deliveredAt ? new Date(order.deliveredAt) : new Date();
    const currentDate = new Date();
    const daysSinceDelivery = Math.floor((currentDate.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
    const remainingDays = returnPolicyDays - daysSinceDelivery;
    
    if (remainingDays <= 0) {
      return `Return period has expired (${returnPolicyDays} days from delivery)`;
    }
    return `Return within ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
  };

  const handleDownloadInvoice = async (orderId: string, orderNumber: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders/${orderId}/invoice/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading invoice:', error);
      showToast('Failed to download invoice. Please try again.', 'error');
    }
  };

  const handlePrintInvoice = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders/${orderId}/invoice/download`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          showToast('Invoice not yet available. Invoices are generated after payment completion.', 'warning');
          return;
        }
        throw new Error('Failed to load invoice');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
          // Clean up the blob URL after a delay
          setTimeout(() => window.URL.revokeObjectURL(url), 100);
        };
      }
    } catch (error) {
      console.error('Error printing invoice:', error);
      showToast('Failed to print invoice. Please try again.', 'error');
    }
  };

  const handleReturnOrder = async (returnData: {
    orderItemId: string;
    quantity: number;
    reason: string;
    customerNotes?: string;
    images?: string[];
  }) => {
    if (!orderToAction) {
      showToast('No order selected', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders/${orderToAction.id}/items/${returnData.orderItemId}/return`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            quantity: returnData.quantity,
            reason: returnData.reason,
            customerNotes: returnData.customerNotes,
            images: returnData.images
          }),
        }
      );

      if (response.ok) {
        hideConfirm();
        showToast('Return request submitted successfully', 'success');
        setShowReturnModal(false);
        setOrderToAction(null);
        fetchOrders();
      } else {
        const error = await response.json();
        hideConfirm();
        showToast(error.message || 'Failed to submit return request', 'error');
      }
    } catch (error) {
      console.error('Error requesting return:', error);
      hideConfirm();
      showToast('Failed to submit return request. Please try again.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-purple-600" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Package className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'processing':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      case 'shipped':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200';
      case 'delivered':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Filter and sort orders
  const filteredAndSortedOrders = orders
    .filter((order) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !order.id.toLowerCase().includes(query) &&
          !order.orderNumber?.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      // Status filter
      if (statusFilter !== 'all' && order.status.toLowerCase() !== statusFilter) {
        return false;
      }
      // Date range filter
      if (startDate) {
        const orderDate = new Date(order.createdAt);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (orderDate < start) {
          return false;
        }
      }
      if (endDate) {
        const orderDate = new Date(order.createdAt);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (orderDate > end) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'amount':
          comparison = (a.total || 0) - (b.total || 0);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: 'date' | 'amount') => {
    const result = toggleSort(sortBy, field, sortOrder);
    setSortBy(result.field);
    setSortOrder(result.order);
  };

  if (loading) {
    return (
      <AccountShell>
        <div className="flex items-center justify-center py-20">
          <Loader size="md" />
        </div>
      </AccountShell>
    );
  }

  return (
    <AccountShell>
            <div className="mb-6">
              <h1 className="font-display text-3xl text-[hsl(var(--pb-ink))]">My Orders</h1>
            </div>

        {/* Filters and Search */}
        <div className="bg-card rounded-lg shadow-sm border border-border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Search</label>
              <input
                type="text"
                placeholder="Order ID or number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Sort By</label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
                  className="flex-1 px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-input bg-background text-foreground rounded-md hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Results count */}
          <div className="mt-3 text-sm text-muted-foreground">
            Showing {filteredAndSortedOrders.length} of {orders.length} orders
          </div>
        </div>

        {filteredAndSortedOrders.length === 0 ? (
          <div className="bg-card rounded-lg shadow-sm border border-border p-12 text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {orders.length === 0 ? 'No orders yet' : 'No orders match your filters'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {orders.length === 0 
                ? "You haven't placed any orders. Start shopping now!"
                : 'Try adjusting your search or filter criteria'
              }
            </p>
            {orders.length === 0 && (
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                Start Shopping
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedOrders.map((order) => (
              <div
                key={order.id}
                className="bg-card rounded-lg shadow-sm border border-border hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          Order #{order.orderNumber || order.id.slice(0, 8)}
                        </h3>
                        {/* Current Order Status */}
                        <span
                          onClick={(e) => handleStatusBadgeClick(order, e)}
                          className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(
                            order.status
                          )} ${
                            isAdminOrVendor && getNextStatuses(order.status).length > 0
                              ? 'cursor-pointer hover:opacity-80 transition-opacity'
                              : ''
                          }`}
                          title={
                            isAdminOrVendor && getNextStatuses(order.status).length > 0
                              ? 'Click to change status'
                              : undefined
                          }
                        >
                          {getStatusIcon(order.status)}
                          {order.status}
                          {isAdminOrVendor && getNextStatuses(order.status).length > 0 && (
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          )}
                        </span>
                        
                        {/* Additional Return Status Indicators (if applicable) */}
                        {order.returnApprovedAt && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            <CheckCircle className="w-4 h-4" />
                            Return Approved
                          </span>
                        )}
                        {order.returnRejectedAt && (
                          <span className="px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                            <XCircle className="w-4 h-4" />
                            Return Rejected
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Total Amount</p>
                      <p className="text-2xl font-bold text-foreground">
                        {formatPrice(order.total || 0, 'INR')}
                      </p>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="border-t pt-4">
                    <div className="space-y-3">
                      {order.items?.slice(0, 2).map((item) => {
                        const productImage = item.productImage || item.product?.featuredImage;
                        const productSlug = item.product?.slug;
                        return (
                          <div key={item.id} className="flex items-center gap-4">
                            {productImage && (
                              <Link href={`/products/${productSlug}`} className="flex-shrink-0">
                                <img
                                  src={productImage.startsWith('http') ? productImage : `${process.env.NEXT_PUBLIC_API_URL}${productImage}`}
                                  alt={item.productName}
                                  className="w-16 h-16 object-cover rounded hover:opacity-80 transition-opacity"
                                />
                              </Link>
                            )}
                            <div className="flex-1 min-w-0">
                              <Link 
                                href={`/products/${productSlug}`}
                                className="font-medium text-foreground hover:text-primary line-clamp-1 block"
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
                      {order.items && order.items.length > 2 && (
                        <p className="text-sm text-muted-foreground">
                          +{order.items.length - 2} more items
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Order Actions */}
                  <div className="border-t border-border mt-4 pt-4 flex flex-wrap gap-3">
                    <button
                      onClick={async () => {
                        setSelectedOrder(order);
                        
                        console.log('Order status:', order.status);
                        
                        // Fetch return details if order is return_approved or returned
                        if (order.status === 'return_approved' || order.status === 'returned') {
                          console.log('Fetching return details for order:', order.id);
                          try {
                            const token = localStorage.getItem('token');
                            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders/${order.id}/return-details`, {
                              headers: {
                                'Authorization': `Bearer ${token}`,
                              },
                            });

                            console.log('Return details response status:', response.status);
                            if (response.ok) {
                              const details = await response.json();
                              console.log('Return details:', details);
                              setReturnDetails(details);
                            } else {
                              console.error('Failed to fetch return details:', await response.text());
                            }
                          } catch (error) {
                            console.error('Error fetching return details:', error);
                          }
                        } else {
                          console.log('Order not eligible for return details display');
                          setReturnDetails(null);
                        }
                      }}
                      className="px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors font-medium flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </button>
                    {order.invoice && (
                      <button
                        onClick={() => handleDownloadInvoice(order.id, order.orderNumber)}
                        className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors font-medium flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download Invoice
                      </button>
                    )}
                    {order.status.toLowerCase() === 'delivered' && canReturnOrder(order) && (
                      <button 
                        onClick={() => {
                          setOrderToAction(order);
                          setShowReturnConfirmation(true);
                        }}
                        className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors font-medium"
                        title={getReturnPolicyMessage(order)}
                      >
                        Return Order
                      </button>
                    )}
                    {/* Cancel order only allowed before shipping (allows cancellation even if paid - refund will be processed) */}
                    {['pending', 'confirmed', 'processing'].includes(order.status.toLowerCase()) &&
                     order.paymentStatus !== 'refunded' &&
                     order.paymentStatus !== 'refund_pending' && (
                      <button 
                        onClick={() => {
                          setOrderToAction(order);
                          setShowCancelModal(true);
                        }}
                        className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isAdmin={false}
          returnDetails={returnDetails}
          onClose={() => setSelectedOrder(null)}
          onPrintInvoice={handlePrintInvoice}
          getStatusColor={getStatusColor}
        />
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && orderToAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-md w-full border border-border">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">Cancel Order</h2>
            </div>
            <div className="p-6">
              <p className="text-muted-foreground mb-4">
                Are you sure you want to cancel order #{orderToAction.orderNumber}?
              </p>
              <label className="block mb-2 text-sm font-medium text-foreground">
                Cancellation Reason <span className="text-red-600">*</span>
              </label>
              <select
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  if (e.target.value !== 'other') setCancelReasonOther('');
                }}
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                required
              >
                <option value="">Select a reason</option>
                <option value="Changed my mind">Changed my mind</option>
                <option value="Found a better price elsewhere">Found a better price elsewhere</option>
                <option value="Ordered by mistake">Ordered by mistake</option>
                <option value="Delivery taking too long">Delivery taking too long</option>
                <option value="Need to change delivery address">Need to change delivery address</option>
                <option value="Financial reasons">Financial reasons</option>
                <option value="other">Other (please specify)</option>
              </select>
              {cancelReason === 'other' && (
                <textarea
                  value={cancelReasonOther}
                  onChange={(e) => setCancelReasonOther(e.target.value)}
                  placeholder="Please specify your reason..."
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground mt-3"
                  rows={3}
                  required
                />
              )}
            </div>
            <div className="p-6 border-t border-border flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setCancelReasonOther('');
                  setOrderToAction(null);
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={actionLoading || !cancelReason || (cancelReason === 'other' && !cancelReasonOther.trim())}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Request Modal - Item-based returns */}
      {showReturnModal && orderToAction && (
        <ReturnRequestModal
          isOpen={showReturnModal}
          onClose={() => {
            setShowReturnModal(false);
            setOrderToAction(null);
          }}
          orderId={orderToAction.id}
          orderNumber={orderToAction.orderNumber}
          items={orderToAction.items}
          onSubmit={handleReturnOrder}
        />
      )}

      {/* Return Confirmation Dialog */}
      {showReturnConfirmation && orderToAction && (
        <ConfirmDialog
          title="Confirm Return Request"
          message={`Are you sure you want to request a return for order #${orderToAction.orderNumber}? Returns are accepted within ${orderToAction.returnPolicy?.returnPolicyDays || 7} days of delivery. Items must be unused and in original packaging. You cannot cancel a return request once submitted.`}
          confirmText="Continue"
          cancelText="Cancel"
          confirmVariant="warning"
          onConfirm={() => {
            setShowReturnConfirmation(false);
            setShowReturnModal(true);
          }}
          onCancel={() => {
            setShowReturnConfirmation(false);
            setOrderToAction(null);
          }}
        />
      )}
      
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
      
      {/* Status Change Modal for Admin/Vendor */}
      {showStatusModal && selectedOrderForStatusChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Change Order Status
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Order #{selectedOrderForStatusChange.orderNumber}
              </p>
              
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-foreground">Current:</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrderForStatusChange.status)}`}>
                    {selectedOrderForStatusChange.status}
                  </span>
                </div>
                
                <p className="text-sm font-medium text-foreground mb-2">Select new status:</p>
                <div className="space-y-2">
                  {getNextStatuses(selectedOrderForStatusChange.status).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleUpdateOrderStatus(status)}
                      disabled={actionLoading}
                      className={`w-full px-4 py-3 rounded-lg border-2 text-left flex items-center justify-between transition-colors ${getStatusColor(status)} hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <span className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <span className="font-medium">{status}</span>
                      </span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  ))}
                </div>
                
                {getNextStatuses(selectedOrderForStatusChange.status).length === 0 && (
                  <p className="text-sm text-muted-foreground italic">
                    No status changes available for this order
                  </p>
                )}
              </div>
              
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedOrderForStatusChange(null);
                }}
                className="w-full px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirm && (
        <ConfirmDialog
          {...confirm}
          onCancel={hideConfirm}
        />
      )}
    </AccountShell>
  );
}
