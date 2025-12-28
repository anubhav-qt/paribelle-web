'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import UnifiedHeader from '@/components/UnifiedHeader';
import { getVendorId } from '@/lib/auth';
import { useSettings } from '@/hooks/useSettings';
import { getCurrencySymbol } from '@/lib/currency';

export default function VendorOrdersPage() {
  const { data: settings } = useSettings();
  const currency = settings?.currency || 'INR';
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        return;
      }

      const currentUser = JSON.parse(userStr);
      const vendorId = getVendorId();
      
      if (!vendorId) {
        console.error('No vendorId found');
        return;
      }
      
      console.log('Fetching orders for vendor:', vendorId);
      console.log('Current user ID:', currentUser.id);
      
      // Fetch orders for this vendor (orders containing vendor's products)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders?vendorId=${vendorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const allOrders = Array.isArray(data) ? data : data.orders || [];
        
        if (allOrders.length > 0) {
          console.log('Sample order structure:', allOrders[0]);
          console.log('Sample order items:', allOrders[0]?.items);
        }
        console.log('Current user:', currentUser);
        
        // Filter out orders placed by the vendor themselves (those are their purchases, not orders received)
        // Check multiple possible field names for userId
        const ordersReceived = allOrders.filter((order: any) => {
          const orderUserId = order.userId || order.user_id || order.customerId || order.customer_id;
          const isOwnOrder = orderUserId === currentUser.id;
          
          if (allOrders.length <= 5) {
            console.log(`Order ${order.orderNumber || order.id}: orderUserId=${orderUserId}, currentUserId=${currentUser.id}, isOwn=${isOwnOrder}`);
          }
          
          return !isOwnOrder;
        });
        
        console.log('Total orders with vendor products:', allOrders.length);
        console.log('Orders received from customers (other people):', ordersReceived.length);
        console.log('Orders filtered out (your own purchases):', allOrders.length - ordersReceived.length);
        
        if (ordersReceived.length === 0 && allOrders.length > 0) {
          console.log('ℹ All orders containing your products were placed by you (they are your purchases from your own or other stores)');
        }
        
        setOrders(ordersReceived);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort orders
  const filteredAndSortedOrders = orders
    .filter((order: any) => {
      // Status filter
      if (statusFilter !== 'all' && order.status !== statusFilter) {
        return false;
      }
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          order.id.toLowerCase().includes(query) ||
          order.orderNumber?.toLowerCase().includes(query) ||
          order.customerName?.toLowerCase().includes(query) ||
          order.user?.email?.toLowerCase().includes(query)
        );
      }
      return true;
    })
    .sort((a: any, b: any) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'amount':
          comparison = parseFloat(a.total) - parseFloat(b.total);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: 'date' | 'amount' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const viewOrderDetails = (order: any) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const formatCurrency = (amount: number) => {
    const symbol = getCurrencySymbol(currency);
    return `${symbol}${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedHeader showLocationFilter={false} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/vendor/dashboard"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Orders Received</h1>
          <p className="text-gray-600 mt-2">Orders from your customers (excluding your own purchases)</p>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg mb-6">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Beginner's Guide</h3>
                <p className="text-sm text-gray-600">Learn how to manage and fulfill customer orders</p>
              </div>
            </div>
            <svg
              className={`w-6 h-6 text-gray-600 transition-transform ${showHelp ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showHelp && (
            <div className="px-6 pb-6 space-y-6">
              {/* Understanding Orders */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📦</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Understanding Your Orders</h4>
                    <p className="text-gray-700 mb-3">
                      This page shows <strong>orders received from your customers</strong> - not orders you placed yourself. 
                      When someone buys your products, their order appears here for you to process and fulfill.
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm font-medium text-blue-800 mb-2">ℹ️ Important Note:</p>
                      <p className="text-sm text-blue-700">
                        Orders YOU place (your own purchases) appear in <strong>"My Purchases"</strong> section, not here. 
                        This separation helps you distinguish between orders to fulfill vs. orders you've made.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Statuses */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🔄</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Order Status Workflow</h4>
                    <p className="text-gray-700 mb-3">
                      Each order goes through several stages. Update the status as you process the order to keep customers informed.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                        <span className="text-xl">🟡</span>
                        <div>
                          <p className="font-medium text-yellow-800">Pending</p>
                          <p className="text-sm text-yellow-700">New order, awaiting your confirmation. Review and confirm within 24 hours.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded border border-blue-200">
                        <span className="text-xl">🔵</span>
                        <div>
                          <p className="font-medium text-blue-800">Confirmed</p>
                          <p className="text-sm text-blue-700">Order accepted. Start preparing the items for shipment.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-purple-50 rounded border border-purple-200">
                        <span className="text-xl">🟣</span>
                        <div>
                          <p className="font-medium text-purple-800">Processing</p>
                          <p className="text-sm text-purple-700">Actively packing or preparing the order for dispatch.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-orange-50 rounded border border-orange-200">
                        <span className="text-xl">🟠</span>
                        <div>
                          <p className="font-medium text-orange-800">Shipped</p>
                          <p className="text-sm text-orange-700">Order dispatched. Provide tracking number if available.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded border border-green-200">
                        <span className="text-xl">🟢</span>
                        <div>
                          <p className="font-medium text-green-800">Delivered</p>
                          <p className="text-sm text-green-700">Successfully delivered to customer. Order complete!</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-red-50 rounded border border-red-200">
                        <span className="text-xl">🔴</span>
                        <div>
                          <p className="font-medium text-red-800">Cancelled</p>
                          <p className="text-sm text-red-700">Order cancelled by you or the customer. Refund may be required.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Processing Orders */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">✅</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">How to Process an Order</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                        <p className="text-gray-700"><strong>Review the order:</strong> Click "View Details" to see all items, quantities, shipping address, and customer information</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                        <p className="text-gray-700"><strong>Check inventory:</strong> Verify you have all items in stock before confirming</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                        <p className="text-gray-700"><strong>Update status:</strong> Change from "Pending" to "Confirmed" once you accept the order</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                        <p className="text-gray-700"><strong>Pack the items:</strong> Prepare the products for shipment. Update status to "Processing"</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">5</span>
                        <p className="text-gray-700"><strong>Ship the order:</strong> Send via courier. Update status to "Shipped" and add tracking number</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">6</span>
                        <p className="text-gray-700"><strong>Confirm delivery:</strong> Once customer receives, mark as "Delivered"</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Handling Special Cases */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🛠️</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Handling Special Situations</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-amber-50 rounded border border-amber-200">
                        <p className="font-medium text-amber-800 mb-2">📋 Out of Stock Items</p>
                        <p className="text-sm text-amber-700">Contact customer immediately via email/phone. Offer alternatives or partial fulfillment. If cancelled, issue refund promptly.</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded border border-red-200">
                        <p className="font-medium text-red-800 mb-2">❌ Cancellation Requests</p>
                        <p className="text-sm text-red-700">If order is not yet shipped, accept cancellation and process refund. If already shipped, explain return process per your return policy.</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded border border-purple-200">
                        <p className="font-medium text-purple-800 mb-2">🔄 Returns & Refunds</p>
                        <p className="text-sm text-purple-700">Follow your store's return policy. Inspect returned items. Issue refund after verifying condition. Update order status accordingly.</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="font-medium text-blue-800 mb-2">📞 Customer Queries</p>
                        <p className="text-sm text-blue-700">Respond within 24 hours. Check order details before replying. Provide tracking info if asked. Be professional and helpful.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Using Filters */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🔍</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Using Search and Filters</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-700 mb-2">🔎 Search</p>
                        <p className="text-sm text-gray-600">Find orders by Order ID, customer name, email, or phone number</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-700 mb-2">📊 Status Filter</p>
                        <p className="text-sm text-gray-600">View only Pending, Confirmed, Processing, Shipped, Delivered, or Cancelled orders</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-700 mb-2">⬆️ Sort</p>
                        <p className="text-sm text-gray-600">Sort by Date (newest/oldest), Amount (high/low), or Status</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Common Mistakes */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-5 border border-red-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>⚠️</span> Common Mistakes to Avoid
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Delayed confirmations:</strong> Always confirm orders within 24 hours to build customer trust</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Not updating status:</strong> Keep status current so customers know where their order is</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Ignoring customer messages:</strong> Respond promptly to build good reputation</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Poor packaging:</strong> Protect items well during shipping to avoid damage and returns</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>No tracking info:</strong> Provide tracking numbers when available - customers appreciate it</span>
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-5 border border-purple-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>💡</span> Quick Tips
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Check orders daily to avoid delays</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Use filters to prioritize pending orders</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Double-check shipping address before dispatching</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Keep packing materials and labels ready</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Include invoice and thank you note in package</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Maintain good inventory to avoid stock issues</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Order ID, customer name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'amount' | 'status')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="status">Status</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Results count */}
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredAndSortedOrders.length} of {orders.length} orders
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredAndSortedOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-2">
              {orders.length === 0 ? 'No orders received yet' : 'No orders match your filters'}
            </p>
            <p className="text-gray-400 text-sm">
              {orders.length === 0 
                ? 'Orders placed by other customers will appear here. Orders you place yourself appear in "My Purchases".'
                : 'Try adjusting your search or filter criteria'
              }
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('date')}
                  >
                    Order ID {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('amount')}
                  >
                    Amount {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('status')}
                  >
                    Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedOrders.map((order: any) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{order.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.customerName || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{getCurrencySymbol(currency)}{order.total}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        order.status === 'completed' ? 'bg-green-100 text-green-800' :
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button 
                        onClick={() => viewOrderDetails(order)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Order Details Modal */}
        {showDetailsModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b sticky top-0 bg-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      Order #{selectedOrder.id.slice(0, 8)}
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

              <div className="p-6 space-y-6">
                {/* Status */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                    selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    selectedOrder.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </div>

                {/* Customer Info */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-1">
                    <p><span className="font-medium">Name:</span> {selectedOrder.customerName || selectedOrder.shippingName || (typeof selectedOrder.shippingAddress === 'object' ? selectedOrder.shippingAddress?.fullName : null) || 'N/A'}</p>
                    <p><span className="font-medium">Email:</span> {selectedOrder.customerEmail || selectedOrder.shippingEmail || 'N/A'}</p>
                    <p><span className="font-medium">Phone:</span> {selectedOrder.customerPhone || selectedOrder.shippingPhone || (typeof selectedOrder.shippingAddress === 'object' ? selectedOrder.shippingAddress?.phone : null) || 'N/A'}</p>
                  </div>
                </div>

                {/* Shipping Address */}
                {selectedOrder.shippingAddress && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Shipping Address</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {typeof selectedOrder.shippingAddress === 'string' ? (
                        <>
                          <p>{selectedOrder.shippingAddress}</p>
                          {(selectedOrder.shippingCity || selectedOrder.shippingState) && (
                            <p>{selectedOrder.shippingCity}{selectedOrder.shippingCity && selectedOrder.shippingState && ', '}{selectedOrder.shippingState}</p>
                          )}
                        </>
                      ) : (
                        <>
                          <p>{selectedOrder.shippingAddress.addressLine1}</p>
                          {selectedOrder.shippingAddress.addressLine2 && <p>{selectedOrder.shippingAddress.addressLine2}</p>}
                          <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.postalCode}</p>
                          {selectedOrder.shippingAddress.country && <p>{selectedOrder.shippingAddress.country}</p>}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Order Items */}
                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Order Items</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      {selectedOrder.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between">
                          <span>{item.productName || item.name} x {item.quantity}</span>
                          <span className="font-medium">{formatCurrency((item.price || 0) * (item.quantity || 1))}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Order Summary */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Order Summary</h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    {selectedOrder.subtotal && (
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(selectedOrder.subtotal)}</span>
                      </div>
                    )}
                    {selectedOrder.shippingCost !== undefined && (
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>{formatCurrency(selectedOrder.shippingCost)}</span>
                      </div>
                    )}
                    {selectedOrder.tax !== undefined && (
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>{formatCurrency(selectedOrder.tax)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
