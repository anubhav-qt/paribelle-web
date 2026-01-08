'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpDown, Eye, Search, Filter, Download, Printer } from 'lucide-react';
import ThemeRenderer from '@/components/ThemeRenderer';
import { useToast, useConfirm } from '@/hooks/useDialogs';
import Toast from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';
import OrderDetailsModal from '@/components/OrderDetailsModal';

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  vendorId: string;
  status: string;
  paymentStatus: string;
  total: number;
  subtotal: number;
  tax: number;
  shippingCost: number;
  vendorPayout?: number;
  commissionAmount?: number;
  commissionRate?: number;
  shippingName: string;
  shippingEmail: string;
  shippingPhone: string;
  shippingAddress: string | {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
  };
  shippingCity: string;
  shippingState: string;
  createdAt: string;
  returnReason?: string;
  returnApprovedAt?: string;
  returnRejectedAt?: string;
  returnRejectionReason?: string;
  vendor?: {
    businessName: string;
    storeName: string;
  };
  user?: {
    email: string;
    name: string;
  };
  returns?: any[];
  items?: Array<{
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }>;
  invoices?: Array<{
    id: string;
    invoiceNumber: string;
    type: string;
    payoutAmount?: number;
  }>;
}

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

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
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
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
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

      fetchOrders();
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
      fetchOrders();
    } catch (error) {
      console.error('Error updating payment status:', error);
      showToast('Failed to update payment status', 'error');
    }
  };

  const handleApproveReturnRequest = async (returnId: string, productName: string, quantity: number) => {
    showConfirm({
      title: 'Approve Return Request?',
      message: `Approve return of ${quantity} unit(s) of "${productName}"? Customer will be able to ship the item back.`,
      confirmText: 'Approve',
      cancelText: 'Cancel',
      confirmVariant: 'primary',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/orders/returns/${returnId}/approve`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({}),
          });

          if (!response.ok) {
            throw new Error('Failed to approve return request');
          }
          
          hideConfirm();
          showToast('Return request approved! Customer can now ship the item back.', 'success');
          
          // Refresh orders list
          await fetchOrders();
          
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
          console.error('Error approving return request:', error);
          hideConfirm();
          showToast('Failed to approve return request', 'error');
        }
      }
    });
  };

  const handleConfirmItemReceived = async (returnId: string, productName: string, quantity: number) => {
    showConfirm({
      title: 'Confirm Item Received?',
      message: `Have you received and verified ${quantity} unit(s) of "${productName}"? This will process the refund and restock inventory.`,
      confirmText: 'Confirm & Refund',
      cancelText: 'Cancel',
      confirmVariant: 'success',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/orders/returns/${returnId}/received`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ refundNow: true }),
          });

          if (!response.ok) {
            throw new Error('Failed to confirm item received');
          }

          hideConfirm();
          showToast('Item received confirmed! Refund processed and inventory restocked.', 'success');
          
          // Refresh orders
          await fetchOrders();
          
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
          console.error('Error confirming item received:', error);
          hideConfirm();
          showToast('Failed to confirm item received', 'error');
        }
      }
    });
  };

  const handleRejectReturn = async (returnId: string, productName: string) => {
    const reason = prompt(`Please provide a reason for rejecting the return of "${productName}":`);
    
    if (!reason || !reason.trim()) {
      showToast('Rejection reason is required', 'error');
      return;
    }
    
    showConfirm({
      title: 'Reject Return Request?',
      message: `Are you sure you want to reject this return? The customer will be notified with your reason.`,
      confirmText: 'Reject Return',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/orders/returns/${returnId}/reject`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ reason: reason.trim() }),
          });

          if (!response.ok) {
            throw new Error('Failed to reject return');
          }
          
          hideConfirm();
          showToast('Return rejected successfully!', 'success');
          
          // Refresh orders
          await fetchOrders();
          
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
        order.shippingName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.shippingEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.vendor?.businessName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      return_requested: 'bg-amber-100 text-amber-800',
      return_approved: 'bg-orange-100 text-orange-700',
      returned: 'bg-orange-100 text-orange-800',
      refunded: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get valid next statuses based on current status
  const getValidNextStatuses = (currentStatus: string): string[] => {
    const statusFlow: Record<string, string[]> = {
      pending: ['pending', 'confirmed', 'cancelled'],
      confirmed: ['confirmed', 'processing', 'cancelled'],
      processing: ['processing', 'shipped', 'cancelled'],
      shipped: ['shipped', 'delivered', 'cancelled'],
      delivered: ['delivered'], // Only return requests via button, no dropdown change
      cancelled: ['cancelled'], // Final state
      return_requested: ['return_requested'], // Controlled by approve/reject buttons
      return_approved: ['return_approved'], // Controlled by confirm received button
      returned: ['returned'], // Final state
      refunded: ['refunded'], // Final state
    };
    return statusFlow[currentStatus] || [currentStatus];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
      <ThemeRenderer component="header" />
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
            <p className="text-gray-600 mt-1">View and manage all marketplace orders</p>
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
              {orders.filter(o => o.status === 'return_requested').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Return Requests</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-orange-600">
              {orders.filter(o => o.status === 'returned').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Returned</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0))}
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
                <option value="return_requested">Return Requested</option>
                <option value="return_approved">Return Approved</option>
                <option value="returned">Returned</option>
                <option value="refunded">Refunded</option>
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
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
                      >
                        Status
                        <ArrowUpDown className="w-4 h-4" />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="font-medium text-gray-700">Payment</span>
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
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)} border-0 ${
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
                          disabled={order.status === 'refunded' || order.paymentStatus === 'paid'}
                          title={order.paymentStatus === 'paid' ? 'Online payments cannot be changed' : ''}
                          className={`px-3 py-1 rounded-full text-xs font-medium border-0 ${
                            order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                            order.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-800' :
                            order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          } ${
                            order.status === 'refunded' || order.paymentStatus === 'paid'
                              ? 'cursor-not-allowed opacity-75' 
                              : 'cursor-pointer'
                          }`}
                        >
                          <option value="pending">Pending (COD)</option>
                          <option value="paid">Paid</option>
                          <option value="failed">Failed</option>
                          <option value="refunded">Refunded</option>
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
                          {/* Quick actions for first pending return item */}
                          {order.returns && order.returns.length > 0 && (() => {
                            const firstRequestedReturn = order.returns.find((r: any) => r.status === 'requested');
                            const firstApprovedReturn = order.returns.find((r: any) => r.status === 'approved');
                            
                            if (firstRequestedReturn) {
                              return (
                                <>
                                  <button
                                    onClick={() => handleApproveReturnRequest(
                                      String(firstRequestedReturn.id), 
                                      firstRequestedReturn.product_name, 
                                      firstRequestedReturn.quantity
                                    )}
                                    className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                                  >
                                    Approve Request
                                  </button>
                                  <button
                                    onClick={() => handleRejectReturn(
                                      String(firstRequestedReturn.id), 
                                      firstRequestedReturn.product_name
                                    )}
                                    className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                                  >
                                    Reject
                                  </button>
                                </>
                              );
                            } else if (firstApprovedReturn) {
                              return (
                                <button
                                  onClick={() => handleConfirmItemReceived(
                                    String(firstApprovedReturn.id), 
                                    firstApprovedReturn.product_name, 
                                    firstApprovedReturn.quantity
                                  )}
                                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                                >
                                  Confirm Received
                                </button>
                              );
                            }
                            return null;
                          })()}
                          
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
        </div>
      </div>

      {/* Order Details Modal */}
      {showDetailsModal && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          isAdmin={true}
          returnDetails={returnDetails}
          onClose={() => setShowDetailsModal(false)}
          onApproveReturn={handleApproveReturnRequest}
          onRejectReturn={handleRejectReturn}
          onConfirmReceived={handleConfirmItemReceived}
          onPrintInvoice={handlePrintInvoice}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          getStatusColor={getStatusColor}
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
