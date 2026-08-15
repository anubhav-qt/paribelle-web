'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useNotifications } from '@/contexts/NotificationsContext';
import { formatCurrencyWhole } from '@/lib/currency';
import { getStatusColor } from '@/lib/utils/status';
import { formatDateTime } from '@/lib/utils/date';
import { toggleSort } from '@/lib/utils/sort';
import { paymentStatusClass } from '@/lib/utils/payment-status';
import { ArrowUpDown, Eye, Search, Filter, Download, Printer } from 'lucide-react';
import { useToast, useConfirm } from '@/hooks/useDialogs';
import { showPrompt } from '@/lib/dialog';
import Toast from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import OrderDetailsModal from '@/components/OrderDetailsModal';
import AdminExchangePanel from '@/components/AdminExchangePanel';
import CodRefusalModal from '@/components/CodRefusalModal';
import { Order } from '@/types/common';
import { Loader } from '@/components/ui/Loader';

type SortField = 'createdAt' | 'orderNumber' | 'total' | 'status';
type SortDirection = 'asc' | 'desc';

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

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader size="md" /></div>}>
      <AdminOrdersPageInner />
    </Suspense>
  );
}

function AdminOrdersPageInner() {
  const { toast, showToast, hideToast } = useToast();
  const { confirm, showConfirm, hideConfirm } = useConfirm();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [returnDetails, setReturnDetails] = useState<ReturnDetails | null>(null);
  const [exchangeOrder, setExchangeOrder] = useState<Order | null>(null);
  const [codRefusalOrder, setCodRefusalOrder] = useState<Order | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const deepLinkOrderId = searchParams.get('orderId');
  // Which view the notification wants: `exchanges` opens the exchange
  // decision panel (approve/reject/inspect), anything else the order details.
  const deepLinkView = searchParams.get('view');
  // Distinct per notification click — see the comment in NotificationBell.
  const deepLinkNonce = searchParams.get('n');
  const { notifications } = useNotifications();

  useEffect(() => {
    fetchOrders();
  }, []);

  // A notification deep-links here (see NotificationBell) — open what it is
  // about as soon as the list has loaded. One-shot: the params are consumed
  // and the URL cleaned immediately, so a background refetch re-running this
  // effect can't reopen a modal the admin already closed.
  const consumedDeepLinkRef = useRef<string | null>(null);
  useEffect(() => {
    // Cleared as soon as the URL is clean again, so clicking the same
    // notification a second time opens its panel a second time — see the
    // matching comment on the storefront orders page.
    if (!deepLinkOrderId) {
      consumedDeepLinkRef.current = null;
      return;
    }
    if (orders.length === 0) return;
    const key = `${deepLinkNonce || ''}:${deepLinkOrderId}:${deepLinkView || ''}`;
    if (consumedDeepLinkRef.current === key) return;
    const target = orders.find((o) => o.id === deepLinkOrderId);
    if (!target) return;
    consumedDeepLinkRef.current = key;
    if (deepLinkView === 'exchanges') {
      setExchangeOrder(target);
    } else {
      viewOrderDetails(target);
    }
    router.replace('/admin/orders', { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkOrderId, deepLinkView, deepLinkNonce, orders]);

  // Refetch when a notification arrives while already on this page — the
  // socket event reaches the right room, this just makes the page react to it.
  const latestNotificationId = notifications[0]?.id;
  useEffect(() => {
    if (latestNotificationId) fetchOrders(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestNotificationId]);

  // `silent` skips the full-table loading spinner — used for every refetch
  // that follows an action on an already-visible list (a status change, an
  // approval, …), where replacing the whole table with a spinner reads as
  // "everything reloaded" even though only one row actually changed. Only
  // the very first load and the notification-triggered refetch show it.
  const fetchOrders = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/orders/admin/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data);
      // Keep an open details modal in sync with a background refetch —
      // otherwise it briefly unmounts (while loading) and remounts with the
      // stale order it was opened with.
      setSelectedOrder((prev) => (prev ? data.find((o: Order) => o.id === prev.id) || prev : prev));
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (!silent) setOrders([]);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    const result = toggleSort(sortField, field, sortDirection);
    setSortField(result.field);
    setSortDirection(result.order);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      fetchOrders(true);
    } catch (error) {
      console.error('Error updating order status:', error);
      showToast('Failed to update order status', 'error');
    }
  };

  const handlePaymentStatusChange = async (orderId: string, newPaymentStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/orders/${orderId}/payment-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentStatus: newPaymentStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update payment status');
      }

      showToast('Payment status updated successfully', 'success');
      fetchOrders(true);
    } catch (error) {
      console.error('Error updating payment status:', error);
      showToast('Failed to update payment status', 'error');
    }
  };

  const handleApproveReturnRequest = async (orderId: string) => {
    showConfirm({
      title: 'Approve All Return Requests?',
      message: 'Approve all pending return requests for this order? Customer will be able to ship items back.',
      confirmText: 'Approve All',
      cancelText: 'Cancel',
      confirmVariant: 'primary',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/orders/${orderId}/returns/approve-all`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({}),
          });

          if (!response.ok) {
            throw new Error('Failed to approve return requests');
          }
          
          hideConfirm();
          showToast('All return requests approved! Customer can now ship items back.', 'success');

          // Refresh orders list
          await fetchOrders(true);
          
          // Refresh selected order details
          if (selectedOrder) {
            const token = localStorage.getItem('token');
            const orderResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/orders/admin`, {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            if (orderResponse.ok) {
              const allOrders = await orderResponse.json();
              const updated = allOrders.find((o: any) => o.id === selectedOrder.id);
              if (updated) setSelectedOrder(updated);
            }
          }
        } catch (error) {
          console.error('Error approving return requests:', error);
          hideConfirm();
          showToast('Failed to approve return requests', 'error');
        }
      }
    });
  };

  const handleConfirmItemReceived = async (orderId: string) => {
    showConfirm({
      title: 'Confirm All Items Received?',
      message: 'Have you received and verified all returned items? This will process the refund and restock inventory.',
      confirmText: 'Confirm All & Refund',
      cancelText: 'Cancel',
      confirmVariant: 'success',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/orders/${orderId}/returns/confirm-all`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({}),
          });

          if (!response.ok) {
            throw new Error('Failed to confirm items received');
          }

          hideConfirm();
          showToast('All items received confirmed! Refund processed and inventory restocked.', 'success');

          // Refresh orders
          await fetchOrders(true);
          
          // Refresh selected order details
          if (selectedOrder) {
            const token = localStorage.getItem('token');
            const orderResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/orders/admin`, {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            if (orderResponse.ok) {
              const allOrders = await orderResponse.json();
              const updated = allOrders.find((o: any) => o.id === selectedOrder.id);
              if (updated) setSelectedOrder(updated);
            }
          }
        } catch (error) {
          console.error('Error confirming items received:', error);
          hideConfirm();
          showToast('Failed to confirm items received', 'error');
        }
      }
    });
  };

  const handleRejectReturn = async (orderId: string) => {
    const reason = await showPrompt({
      title: 'Reject All Return Requests',
      message: 'Please provide a reason for rejecting all return requests:',
    });

    if (!reason || !reason.trim()) {
      if (reason !== null) showToast('Rejection reason is required', 'error');
      return;
    }
    
    showConfirm({
      title: 'Reject All Return Requests?',
      message: 'Are you sure you want to reject all return requests for this order? The customer will be notified.',
      confirmText: 'Reject All',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/orders/${orderId}/returns/reject-all`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ reason: reason.trim() }),
          });

          if (!response.ok) {
            throw new Error('Failed to reject returns');
          }
          
          hideConfirm();
          showToast('All return requests rejected!', 'success');

          // Refresh orders
          await fetchOrders(true);
          
          // Refresh selected order details
          if (selectedOrder) {
            const token = localStorage.getItem('token');
            const orderResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/orders/admin`, {
              headers: { 'Authorization': `Bearer ${token}` },
            });
            if (orderResponse.ok) {
              const allOrders = await orderResponse.json();
              const updated = allOrders.find((o: any) => o.id === selectedOrder.id);
              if (updated) setSelectedOrder(updated);
            }
          }
        } catch (error) {
          console.error('Error rejecting return:', error);
          hideConfirm();
          showToast('Failed to reject return', 'error');
        }
      }
    });
  };

  const viewOrderDetails = async (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
    
    console.log('Admin - Order status:', order.status);
    
    // Fetch return details if order is return_approved or returned
    if (order.status === 'return_approved' || order.status === 'returned') {
      console.log('Admin - Fetching return details for order:', order.id);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/orders/${order.id}/return-details`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log('Admin - Return details response status:', response.status);
        if (response.ok) {
          const details = await response.json();
          console.log('Admin - Return details:', details);
          setReturnDetails(details);
        } else {
          console.error('Admin - Failed to fetch return details:', await response.text());
        }
      } catch (error) {
        console.error('Error fetching return details:', error);
      }
    } else {
      console.log('Admin - Order not eligible for return details display');
      setReturnDetails(null);
    }
  };

  const handlePrintInvoice = async (orderId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/orders/${orderId}/invoice/download`, {
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

  const getFilteredAndSortedOrders = () => {
    let filtered = orders.filter(order => {
      const matchesSearch = 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.vendor?.businessName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter.startsWith('exchange_')
          // The store has no returns/refunds, only exchanges — these live on
          // the order's `returns` rows (still the DB table name), not on
          // `order.status`, which never actually takes these old return-flow
          // values any more (that flow is retired at the API level). Filtering
          // by `order.status === 'return_requested'` etc. always matched
          // nothing; this is what the dropdown options below now drive.
          ? order.returns?.some((r: any) => r.status === statusFilter.replace('exchange_', ''))
          : order.status === statusFilter);

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];

      if (sortField === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredOrders = getFilteredAndSortedOrders();

  // Using centralized getStatusColor from @/lib/utils/status

  // Get valid next statuses based on current status
  const getValidNextStatuses = (currentStatus: string): string[] => {
    const statusFlow: Record<string, string[]> = {
      pending: ['pending', 'confirmed', 'cancelled'],
      confirmed: ['confirmed', 'processing', 'cancelled'],
      processing: ['processing', 'shipped', 'cancelled'],
      // Once dispatched the order can no longer be cancelled from here — the
      // backend rejects it. A refused COD delivery goes through the "COD
      // Refused" action instead, which decides credit/exchange/nothing.
      shipped: ['shipped', 'delivered'],
      delivered: ['delivered'], // Only return requests via button, no dropdown change
      cancelled: ['cancelled'], // Final state
      return_requested: ['return_requested'], // Controlled by approve/reject buttons
      return_approved: ['return_approved'], // Controlled by confirm received button
      returned: ['returned'], // Final state
      refunded: ['refunded'], // Final state
    };
    return statusFlow[currentStatus] || [currentStatus];
  };

  const formatCurrency = formatCurrencyWhole; // Using centralized utility

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const exportToCSV = () => {
    const headers = ['Order Number', 'Customer', 'Vendor', 'Status', 'Total', 'Date'];
    const rows = filteredOrders.map(order => [
      order.orderNumber,
      order.shippingName,
      order.vendor?.businessName || 'N/A',
      order.status,
      order.total,
      formatDate(order.createdAt),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <Link
              href="/admin"
              className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
            <p className="text-gray-600 mt-1">View and manage all orders</p>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
            <div className="text-sm text-gray-600 mt-1">Total Orders</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-yellow-600">
              {orders.filter(o => o.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Pending</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-green-600">
              {orders.filter(o => o.status === 'delivered').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Delivered</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-amber-600">
              {orders.filter(o => o.status === 'confirmed').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Confirmed</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-orange-600">
              {orders.filter(o => o.status === 'cancelled').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Cancelled</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(
                orders
                  .filter(o => o.status !== 'cancelled' && (o.paymentStatus === 'paid' || o.paymentStatus === 'credited'))
                  .reduce((sum, o) => sum + (Number(o.total) || 0), 0)
              )}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Revenue</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 inline mr-1" />
                Search
              </label>
              <input
                type="text"
                placeholder="Order number, customer, vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Filter className="w-4 h-4 inline mr-1" />
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                {/* The store has no returns/refunds — only exchanges. These
                    filter on the order's linked exchange request(s), not on
                    `order.status` (see matchesStatus above). */}
                <option value="exchange_requested">Exchange Requested</option>
                <option value="exchange_approved">Exchange Approved</option>
                <option value="exchange_in_transit">Exchange In Transit</option>
                <option value="exchange_received">Exchange Received</option>
                <option value="exchange_completed">Exchange Completed</option>
                <option value="exchange_rejected">Exchange Rejected</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Results
              </label>
              <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-300">
                <span className="font-semibold">{filteredOrders.length}</span> orders found
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <Loader size="md" className="mx-auto" />
              <p className="mt-4 text-gray-600">Loading orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No orders found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('orderNumber')}
                        className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
                      >
                        Order Number
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="font-medium text-gray-700">Customer</span>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="font-medium text-gray-700">Vendor</span>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
                        title="Where the order is in fulfilment"
                      >
                        Order Status
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="font-medium text-gray-700" title="Whether payment has been received">
                        Payment Status
                      </span>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('total')}
                        className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
                      >
                        Vendor Payout
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900"
                      >
                        Date
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="font-medium text-gray-700">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{order.orderNumber}</div>
                        <div className="mt-1 flex flex-col items-start gap-1">
                          {order.returns && order.returns.length > 0 && (
                            <button
                              onClick={() => viewOrderDetails(order)}
                              title="This order has an exchange request"
                              className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700 hover:bg-purple-200"
                            >
                              Exchange: {order.returns[0].status.replace(/_/g, ' ')}
                            </button>
                          )}
                          {order.replacementForExchange && (
                            <button
                              onClick={() => router.push(`/admin/orders?orderId=${order.replacementForExchange!.originalOrderId}`)}
                              title="This order was created as a replacement for an exchange"
                              className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-200"
                            >
                              Replacement for #{order.replacementForExchange.originalOrderNumber}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{order.shippingName}</div>
                          <div className="text-gray-500">{order.shippingEmail}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.vendor?.businessName || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          disabled={
                            order.status === 'delivered' || 
                            order.status === 'cancelled' || 
                            order.status === 'returned' || 
                            order.status === 'refunded' ||
                            order.status === 'return_requested' ||
                            order.status === 'return_approved'
                          }
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status, 'order')} border-0 ${
                            ['delivered', 'cancelled', 'returned', 'refunded', 'return_requested', 'return_approved'].includes(order.status) 
                              ? 'cursor-not-allowed opacity-75' 
                              : 'cursor-pointer'
                          }`}
                        >
                          {getValidNextStatuses(order.status).map(status => (
                            <option key={status} value={status}>
                              {status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={order.paymentStatus}
                          onChange={(e) => handlePaymentStatusChange(order.id, e.target.value)}
                          disabled={order.status === 'refunded' || order.paymentStatus === 'paid' || order.paymentStatus === 'credited'}
                          title={
                            order.paymentStatus === 'paid' ? 'Online payments cannot be changed' :
                            order.paymentStatus === 'credited' ? 'Store credit was already issued for this order' : ''
                          }
                          className={`px-3 py-1 rounded-full text-xs font-medium border-0 ${paymentStatusClass(order.paymentStatus)} ${
                            order.status === 'refunded' || order.paymentStatus === 'paid' || order.paymentStatus === 'credited'
                              ? 'cursor-not-allowed opacity-75'
                              : 'cursor-pointer'
                          }`}
                        >
                          <option value="pending">Pending (COD)</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                          {/* Refund pending is set by the system when a paid
                              order is cancelled; only the gateway webhook
                              promotes it to Refunded. */}
                          <option value="refund_pending">Refund pending</option>
                          <option value="refunded">Refunded</option>
                          {/* Set automatically when an admin cancels a paid
                              order or resolves a COD refusal with a credit —
                              never manually chosen. */}
                          <option value="credited">Store Credit Issued</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          const originalPayout = order.vendorPayout || 0;
                          // Find vendor credit note (payout reversal)
                          const vendorCreditNote = order.invoices?.find(
                            inv => inv.type === 'vendor' && inv.invoiceNumber?.startsWith('CN-')
                          );
                          const payoutReversal = vendorCreditNote?.payoutAmount || 0;
                          const netPayout = originalPayout + payoutReversal; // payoutReversal is negative
                          
                          return (
                            <>
                              <div className="font-medium text-gray-900">
                                {formatCurrency(netPayout)}
                              </div>
                              {order.commissionAmount && order.commissionAmount > 0 && (
                                <div className="text-xs text-gray-500">
                                  Commission: {formatCurrency(order.commissionAmount)}
                                </div>
                              )}
                              {payoutReversal !== 0 && (
                                <div className="text-xs text-red-600">
                                  Reversal: {formatCurrency(Math.abs(payoutReversal))}
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          {order.status === 'return_requested' ? (
                            <>
                              <button
                                onClick={() => handleApproveReturnRequest(order.id)}
                                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                              >
                                Approve Returns
                              </button>
                              <button
                                onClick={() => handleRejectReturn(order.id)}
                                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                              >
                                Reject Returns
                              </button>
                            </>
                          ) : order.status === 'return_approved' ? (
                            <button
                              onClick={() => handleConfirmItemReceived(order.id)}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                            >
                              Confirm All Received
                            </button>
                          ) : null}

                          {order.status === 'delivered' && (
                            <button
                              onClick={() => setExchangeOrder(order)}
                              className="px-3 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                            >
                              Exchange Requests
                            </button>
                          )}

                          {order.status === 'shipped' && order.paymentMethod === 'cod' && order.paymentStatus === 'pending' && (
                            <button
                              onClick={() => setCodRefusalOrder(order)}
                              className="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors"
                              title="Customer refused this COD delivery at the door"
                            >
                              COD Refused
                            </button>
                          )}

                          <button
                            onClick={() => viewOrderDetails(order)}
                            className="text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 px-3 py-1"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {exchangeOrder && (
            <AdminExchangePanel
              isOpen={!!exchangeOrder}
              onClose={() => setExchangeOrder(null)}
              orderId={exchangeOrder.id}
              orderNumber={exchangeOrder.orderNumber}
            />
          )}

          {codRefusalOrder && (
            <CodRefusalModal
              isOpen={!!codRefusalOrder}
              onClose={() => setCodRefusalOrder(null)}
              order={codRefusalOrder}
              onResolved={() => {
                showToast('COD refusal resolved', 'success');
                fetchOrders(true);
              }}
            />
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isAdmin={true}
          returnDetails={returnDetails}
          onClose={() => setShowDetailsModal(false)}
          onPrintInvoice={handlePrintInvoice}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
          onExchangeUpdated={() => fetchOrders(true)}
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
      
      {/* Confirmation Dialog */}
      {confirm && (
        <ConfirmDialog
          {...confirm}
          onCancel={hideConfirm}
        />
      )}
    </div>
    </>
  );
}
