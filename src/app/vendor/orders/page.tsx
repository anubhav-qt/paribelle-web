'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getVendorId } from '@/lib/auth';

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-gray-50">
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

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-2">No orders received yet</p>
            <p className="text-gray-400 text-sm">
              Orders placed by other customers will appear here. Orders you place yourself appear in "My Purchases".
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order: any) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{order.id.slice(0, 8)}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{order.customerName || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">${order.total}</td>
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
                      <button className="text-blue-600 hover:text-blue-900">View Details</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
