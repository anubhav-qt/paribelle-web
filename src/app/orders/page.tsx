'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice } from '@/lib/currency';
import { Package, Clock, CheckCircle, XCircle, Truck, Eye, Download } from 'lucide-react';
import ThemeRenderer from '@/components/ThemeRenderer';
import CategoryNav from '@/components/CategoryNav';
import CategorySidebar from '@/components/CategorySidebar';
import { useThemeClasses } from '@/hooks/useThemeClasses';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  productImage?: string;
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
  total: number;  // Backend uses 'total' not 'totalAmount'
  subtotal?: number;
  tax?: number;
  shippingCost?: number;
  createdAt: string;
  deliveredAt?: string;
  items: OrderItem[];
  shippingAddress?: {
    fullName: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  paymentMethod?: string;
  invoice?: {
    id: string;
    invoiceNumber: string;
    status: string;
  };
}

export default function OrdersPage() {
  const router = useRouter();
  const theme = useThemeClasses();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [orderToAction, setOrderToAction] = useState<Order | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Please login to view your orders');
      router.push('/login');
      return;
    }

    fetchOrders();
  }, [router]);

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

  const handleCancelOrder = async () => {
    if (!orderToAction || !cancelReason.trim()) {
      alert('Please provide a cancellation reason');
      return;
    }

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
          body: JSON.stringify({ reason: cancelReason }),
        }
      );

      if (response.ok) {
        alert('Order cancelled successfully');
        setShowCancelModal(false);
        setCancelReason('');
        setOrderToAction(null);
        fetchOrders();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to cancel order');
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
      alert('Failed to cancel order. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Check if order can be returned (within 7 days of delivery)
  const canReturnOrder = (order: Order): boolean => {
    if (!order.deliveredAt) return false;
    const deliveryDate = new Date(order.deliveredAt);
    const currentDate = new Date();
    const daysSinceDelivery = Math.floor((currentDate.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceDelivery <= 7;
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
      alert('Failed to download invoice. Please try again.');
    }
  };

  const handleReturnOrder = async () => {
    if (!orderToAction || !returnReason.trim()) {
      alert('Please provide a return reason');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders/${orderToAction.id}/return`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: returnReason }),
        }
      );

      if (response.ok) {
        alert('Return request submitted successfully');
        setShowReturnModal(false);
        setReturnReason('');
        setOrderToAction(null);
        fetchOrders();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit return request');
      }
    } catch (error) {
      console.error('Error requesting return:', error);
      alert('Failed to submit return request. Please try again.');
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
          comparison = a.total - b.total;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: 'date' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <ThemeRenderer component="header" showLocationFilter={false} showBookingsLink={true} />
        <CategoryNav mode="navigation" />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ThemeRenderer component="header" showLocationFilter={false} showBookingsLink={true} />
      <CategoryNav mode="navigation" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          <CategorySidebar />
          <div className="flex-1 max-w-7xl">
            <div className="mb-6">
              <Link
                href="/dashboard"
                className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-foreground">My Orders</h1>
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
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusIcon(order.status)}
                          {order.status}
                        </span>
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
                        {formatPrice(order.total, 'INR')}
                      </p>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="border-t pt-4">
                    <div className="space-y-3">
                      {order.items?.slice(0, 2).map((item) => {
                        const productImage = item.productImage || item.product?.featuredImage;
                        const productSlug = item.product?.slug;
                        const vendorSlug = item.product?.vendor?.slug;
                        const vendorName = item.product?.vendor?.businessName;
                        
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
                              {vendorName && (
                                <Link 
                                  href={`/vendors/${vendorSlug}`}
                                  className="text-xs text-primary hover:underline"
                                >
                                  by {vendorName}
                                </Link>
                              )}
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
                      onClick={() => setSelectedOrder(order)}
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
                    {order.status.toLowerCase() === 'delivered' && (
                      <button 
                        onClick={() => {
                          setOrderToAction(order);
                          setShowReturnModal(true);
                        }}
                        disabled={!canReturnOrder(order)}
                        className={`px-4 py-2 border rounded-lg transition-colors font-medium ${
                          canReturnOrder(order)
                            ? 'border-border text-foreground hover:bg-muted cursor-pointer'
                            : 'border-gray-300 text-gray-400 cursor-not-allowed opacity-50'
                        }`}
                        title={!canReturnOrder(order) ? 'Return period has expired (7 days from delivery)' : 'Request return'}
                      >
                        Return Order
                      </button>
                    )}
                    {['pending', 'confirmed', 'processing'].includes(order.status.toLowerCase()) && (
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
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-border">
            <div className="p-6 border-b border-border sticky top-0 bg-card">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-foreground">Order Details</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div>
                <h3 className="font-semibold mb-3 text-foreground">Order Information</h3>
                <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Number:</span>
                    <span className="font-medium text-foreground">
                      {selectedOrder.orderNumber || selectedOrder.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <span className={`px-2 py-1 rounded ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Date:</span>
                    <span className="font-medium text-foreground">
                      {new Date(selectedOrder.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Method:</span>
                    <span className="font-medium text-foreground">
                      {selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div>
                  <h3 className="font-semibold mb-3 text-foreground">Shipping Address</h3>
                  <div className="bg-muted rounded-lg p-4 text-sm">
                    <p className="font-medium text-foreground">{selectedOrder.shippingAddress.fullName}</p>
                    <p className="text-muted-foreground">{selectedOrder.shippingAddress.addressLine1}</p>
                    <p className="text-muted-foreground">
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}{' '}
                      {selectedOrder.shippingAddress.postalCode}
                    </p>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3 text-foreground">Items Ordered</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item) => {
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
              </div>

              {/* Order Total */}
              <div className="border-t border-border pt-4">
                <div className="space-y-2 mb-3">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>{formatPrice(selectedOrder.subtotal || 0, 'INR')}</span>
                  </div>
                  {selectedOrder.shippingCost ? (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Shipping</span>
                      <span>{formatPrice(selectedOrder.shippingCost, 'INR')}</span>
                    </div>
                  ) : null}
                  {selectedOrder.tax ? (
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Tax</span>
                      <span>{formatPrice(selectedOrder.tax, 'INR')}</span>
                    </div>
                  ) : null}
                </div>
                <div className="flex justify-between text-lg font-bold text-foreground border-t border-border pt-2">
                  <span>Total Amount</span>
                  <span>{formatPrice(selectedOrder.total, 'INR')}</span>
                </div>
              </div>

              {/* Invoice Download */}
              {selectedOrder.invoice && (
                <div className="border-t border-border pt-4">
                  <button
                    onClick={() => handleDownloadInvoice(selectedOrder.id, selectedOrder.orderNumber)}
                    className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2"
                  >
                    <Download className="w-5 h-5" />
                    Download Invoice
                  </button>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border bg-muted">
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
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
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancellation..."
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                rows={4}
                required
              />
            </div>
            <div className="p-6 border-t border-border flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                  setOrderToAction(null);
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={actionLoading || !cancelReason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Cancelling...' : 'Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Return Order Modal */}
      {showReturnModal && orderToAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg shadow-xl max-w-md w-full border border-border">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-bold text-foreground">Return Order</h2>
            </div>
            <div className="p-6">
              <p className="text-muted-foreground mb-2">
                Request return for order #{orderToAction.orderNumber}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Returns are accepted within 7 days of delivery.
              </p>
              <label className="block mb-2 text-sm font-medium text-foreground">
                Return Reason <span className="text-red-600">*</span>
              </label>
              <textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Please describe the reason for return..."
                className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
                rows={4}
                required
              />
            </div>
            <div className="p-6 border-t border-border flex gap-3">
              <button
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnReason('');
                  setOrderToAction(null);
                }}
                disabled={actionLoading}
                className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReturnOrder}
                disabled={actionLoading || !returnReason.trim()}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? 'Submitting...' : 'Submit Return'}
              </button>
            </div>
          </div>
        </div>
      )}
          </div>
        </div>
      </div>
  );
}
