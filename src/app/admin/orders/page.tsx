'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpDown, Eye, Search, Filter, Download, Printer } from 'lucide-react';
import ThemeRenderer from '@/components/ThemeRenderer';
import { useToast, useConfirm } from '@/hooks/useDialogs';
import Toast from '@/components/Toast';
import ConfirmDialog from '@/components/ConfirmDialog';

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
  vendor?: {
    businessName: string;
    storeName: string;
  };
  user?: {
    email: string;
    name: string;
  };
  items?: Array<{
    productName: string;
    quantity: number;
    price: number;
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

  const handleApproveReturnRequest = async (orderId: string) => {
    showConfirm({
      title: 'Approve Return Request?',
      message: 'Customer will be notified to ship the item back. Refund will be processed after you receive and verify the item.',
      confirmText: 'Approve Return',
      cancelText: 'Cancel',
      confirmVariant: 'primary',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/orders/${orderId}/return/approve`, {
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

          showToast('Return request approved! Customer can now ship the item back.', 'success');
          fetchOrders();
        } catch (error) {
          console.error('Error approving return request:', error);
          showToast('Failed to approve return request', 'error');
        }
      }
    });
  };

  const handleConfirmItemReceived = async (orderId: string) => {
    showConfirm({
      title: 'Confirm Item Received?',
      message: 'Have you received and verified the returned item? This will process the refund and restock inventory.',
      confirmText: 'Confirm & Refund',
      cancelText: 'Cancel',
      confirmVariant: 'success',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/orders/${orderId}/return/confirm-received`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({}),
          });

          if (!response.ok) {
            throw new Error('Failed to confirm item received');
          }

          showToast('Item received confirmed! Refund processed and inventory restocked.', 'success');
          fetchOrders();
        } catch (error) {
          console.error('Error confirming item received:', error);
          showToast('Failed to confirm item received', 'error');
        }
      }
    });
  };

  const handleRejectReturn = async (orderId: string) => {
    // For now, use a default rejection reason - could be enhanced with a custom input dialog
    const reason = 'Return request does not meet return policy requirements';
    
    showConfirm({
      title: 'Reject Return Request?',
      message: `Are you sure you want to reject this return? The customer will be notified.`,
      confirmText: 'Reject Return',
      cancelText: 'Cancel',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/orders/${orderId}/return/reject`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ reason }),
          });

          if (!response.ok) {
            throw new Error('Failed to reject return');
          }

          showToast('Return rejected successfully!', 'success');
          fetchOrders();
        } catch (error) {
          console.error('Error rejecting return:', error);
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
                        Total
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
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${
                            order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
                            order.paymentStatus === 'refunded' ? 'bg-purple-100 text-purple-800' :
                            order.paymentStatus === 'failed' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{formatCurrency(order.total)}</div>
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
                                Approve Request
                              </button>
                              <button
                                onClick={() => handleRejectReturn(order.id)}
                                className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                              >
                                Reject Return
                              </button>
                            </>
                          ) : order.status === 'return_approved' ? (
                            <button
                              onClick={() => handleConfirmItemReceived(order.id)}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                            >
                              Confirm Received
                            </button>
                          ) : null}
                          
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b bg-white flex-shrink-0">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Order {selectedOrder.orderNumber}
                  </h2>
                  <p className="text-gray-600 mt-1">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
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
                <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {selectedOrder.status}
                </span>
              </div>

              {/* Return Reason (if return requested) */}
              {(selectedOrder.status === 'return_requested' || selectedOrder.status === 'return_approved' || selectedOrder.status === 'returned') && selectedOrder.returnReason && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Return Reason</h3>
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                    <p className="text-gray-900">{selectedOrder.returnReason}</p>
                  </div>
                  {selectedOrder.status === 'return_requested' && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          handleApproveReturnRequest(selectedOrder.id);
                          setShowDetailsModal(false);
                        }}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Approve Return Request
                      </button>
                      <button
                        onClick={() => {
                          handleRejectReturn(selectedOrder.id);
                          setShowDetailsModal(false);
                        }}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        Reject Return
                      </button>
                    </div>
                  )}
                  {selectedOrder.status === 'return_approved' && (
                    <div className="mt-3">
                      <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mb-3">
                        <p className="text-sm text-blue-800">⏳ Waiting for customer to ship the item back</p>
                      </div>
                      <button
                        onClick={() => {
                          handleConfirmItemReceived(selectedOrder.id);
                          setShowDetailsModal(false);
                        }}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Confirm Item Received & Process Refund
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Return QR Code and Instructions */}
              {returnDetails && (selectedOrder.status === 'return_approved' || selectedOrder.status === 'returned') && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">📦</span>
                    <h3 className="font-bold text-gray-900 text-lg">Return Shipping Information</h3>
                  </div>

                  <div className="bg-white rounded-lg p-6 mb-4 border-2 border-dashed border-gray-300">
                    <h4 className="font-semibold text-center text-gray-700 mb-3">📱 Return QR Code - Scan at Carrier</h4>
                    <p className="text-sm text-gray-600 text-center mb-4">Show this code at UPS, FedEx, or USPS - No printing required!</p>
                    
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
                      <p className="font-bold text-lg text-gray-900">RMA: {returnDetails.returnAuthNumber}</p>
                      <p className="text-sm text-gray-600">Order: {returnDetails.orderNumber}</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-2">Return To:</h4>
                    <div className="text-sm text-gray-700 space-y-1">
                      <p className="font-medium">{returnDetails.returnAddress.name}</p>
                      <p>{returnDetails.returnAddress.addressLine1}</p>
                      <p>{returnDetails.returnAddress.city}, {returnDetails.returnAddress.state} {returnDetails.returnAddress.postalCode}</p>
                      <p>{returnDetails.returnAddress.country}</p>
                      <p>Phone: {returnDetails.returnAddress.phone}</p>
                    </div>
                  </div>

                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                    <h4 className="font-semibold text-amber-900 mb-2">📋 Return Instructions</h4>
                    <ol className="text-sm text-amber-900 space-y-2 ml-4 list-decimal">
                      {returnDetails.instructions.map((instruction, idx) => (
                        <li key={idx}>{instruction}</li>
                      ))}
                    </ol>
                    <p className="text-sm text-amber-800 mt-3 font-medium">
                      ⚠️ Important: Refund will be processed within 3-5 business days after we receive and inspect the returned item.
                    </p>
                  </div>
                </div>
              )}

              {/* Customer Info */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                  <p><span className="font-medium">Name:</span> {selectedOrder.shippingName}</p>
                  <p><span className="font-medium">Email:</span> {selectedOrder.shippingEmail || 'N/A'}</p>
                  <p><span className="font-medium">Phone:</span> {selectedOrder.shippingPhone}</p>
                </div>
              </div>

              {/* Shipping Address */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {typeof selectedOrder.shippingAddress === 'string' ? (
                    <>
                      <p>{selectedOrder.shippingAddress}</p>
                      <p>{selectedOrder.shippingCity}, {selectedOrder.shippingState}</p>
                    </>
                  ) : typeof selectedOrder.shippingAddress === 'object' && selectedOrder.shippingAddress ? (
                    <>
                      <p>{selectedOrder.shippingAddress.addressLine1}</p>
                      {selectedOrder.shippingAddress.addressLine2 && <p>{selectedOrder.shippingAddress.addressLine2}</p>}
                      <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}</p>
                      {selectedOrder.shippingAddress.country && <p>{selectedOrder.shippingAddress.country}</p>}
                    </>
                  ) : (
                    <p>No address provided</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Order Items</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.productName} x {item.quantity}</span>
                      <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Order Summary</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping:</span>
                    <span>{formatCurrency(selectedOrder.shippingCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(selectedOrder.tax)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Vendor Info */}
              {selectedOrder.vendor && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Vendor</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium">{selectedOrder.vendor.businessName}</p>
                    <p className="text-sm text-gray-600">{selectedOrder.vendor.storeName}</p>
                  </div>
                </div>
              )}
            </div>
            </div>

            {/* Sticky Buttons */}
            <div className="p-6 border-t bg-gray-50 flex gap-3 flex-shrink-0">
              <button
                onClick={() => handlePrintInvoice(selectedOrder.id)}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Printer className="w-5 h-5" />
                Print Invoice
              </button>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
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
