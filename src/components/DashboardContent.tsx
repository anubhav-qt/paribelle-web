'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice } from '@/lib/currency';
import { useOrders } from '@/hooks/useOrders';
import { 
  Package, 
  ShoppingBag, 
  User, 
  CreditCard, 
  Clock,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  items: any[];
}

interface DashboardContentProps {
  vendorSlug?: string;
}

export default function DashboardContent({ vendorSlug }: DashboardContentProps) {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  
  const { data: orders = [], isLoading } = useOrders(token || undefined);
  
  const recentOrders = useMemo(() => orders.slice(0, 5), [orders]);
  const stats = useMemo(() => {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => 
      ['pending', 'confirmed', 'processing'].includes(o.status.toLowerCase())
    ).length;
    const completedOrders = orders.filter((o) => 
      o.status.toLowerCase() === 'delivered'
    ).length;
    const totalSpent = orders.reduce((sum, o) => 
      sum + (Number(o.total) || 0), 0
    );
    
    return { totalOrders, pendingOrders, completedOrders, totalSpent };
  }, [orders]);
  
  const loading = isLoading;

  const getRoutePrefix = () => vendorSlug ? `/vendor/${vendorSlug}` : '';

  useEffect(() => {
    const authToken = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!authToken || !userStr) {
      router.push(`${getRoutePrefix()}/login`);
      return;
    }

    try {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      setToken(authToken);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push(`${getRoutePrefix()}/login`);
    }
  }, [router, vendorSlug]);

  const oldFetchDashboardData = async (token: string) => {
    try {
      // This function is no longer needed - useOrders hook handles this
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-foreground">
          Welcome back, {user?.firstName || 'Customer'}!
        </h1>
        <p className="text-muted-foreground">Here's what's happening with your orders</p>
      </div>

      {/* Help Section */}
      <div className="mb-8 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors rounded-lg"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Dashboard Help</h3>
              <p className="text-sm text-muted-foreground">Learn how to use your customer dashboard</p>
            </div>
          </div>
          <svg
            className={`w-6 h-6 text-muted-foreground transition-transform ${showHelp ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showHelp && (
          <div className="px-6 pb-6 space-y-4">
            {/* Total Orders Help */}
            <div className="bg-card rounded-lg p-5 shadow-sm border border-border">
              <div className="flex items-start gap-3">
                <span className="text-3xl">🛍️</span>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-foreground mb-3">Total Orders</h4>
                  <p className="text-muted-foreground mb-3">
                    Shows the total number of orders you've placed since creating your account.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong className="text-foreground">Includes:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>All orders regardless of status (Pending, Confirmed, Processing, Shipped, Delivered, Cancelled)</li>
                      <li>Both completed and ongoing orders</li>
                      <li>Orders from all vendors in the marketplace</li>
                    </ul>
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">💡 Tip:</p>
                    <p className="text-sm text-blue-800 dark:text-blue-200">Click "My Orders" to view complete order history with tracking information!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Orders Help */}
            <div className="bg-card rounded-lg p-5 shadow-sm border border-border">
              <div className="flex items-start gap-3">
                <span className="text-3xl">⏰</span>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-foreground mb-3">Pending Orders</h4>
                  <p className="text-muted-foreground mb-3">
                    Orders that are currently being processed or awaiting action from the vendor.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong className="text-foreground">Status Meanings:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Pending:</strong> Order placed, awaiting vendor confirmation</li>
                      <li><strong>Confirmed:</strong> Vendor accepted, preparing items</li>
                      <li><strong>Processing:</strong> Order is being packed and prepared for shipment</li>
                    </ul>
                  </div>
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950 rounded border border-yellow-200 dark:border-yellow-800">
                    <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">⚠️ Note:</p>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">You can usually cancel orders while they're in Pending or Confirmed status. Contact vendor if urgent!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Completed Orders Help */}
            <div className="bg-card rounded-lg p-5 shadow-sm border border-border">
              <div className="flex items-start gap-3">
                <span className="text-3xl">✅</span>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-foreground mb-3">Completed Orders</h4>
                  <p className="text-muted-foreground mb-3">
                    Orders that have been successfully delivered to you.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong className="text-foreground">What you can do:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Leave Reviews:</strong> Rate products and share your experience with other shoppers</li>
                      <li><strong>Request Returns:</strong> Initiate returns if eligible under vendor's return policy</li>
                      <li><strong>Download Invoice:</strong> Get order invoices for your records</li>
                      <li><strong>Reorder:</strong> Quickly add the same items to cart again</li>
                      <li><strong>Contact Support:</strong> Report issues or ask questions about delivered orders</li>
                    </ul>
                  </div>
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 rounded border border-green-200 dark:border-green-800">
                    <p className="text-sm font-medium text-green-900 dark:text-green-100">⭐ Help Others:</p>
                    <p className="text-sm text-green-800 dark:text-green-200">Leave honest reviews! Your feedback helps other customers make informed decisions.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Total Spent Help */}
            <div className="bg-card rounded-lg p-5 shadow-sm border border-border">
              <div className="flex items-start gap-3">
                <span className="text-3xl">💰</span>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-foreground mb-3">Total Spent</h4>
                  <p className="text-muted-foreground mb-3">
                    The total amount you've spent on all orders across the marketplace.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong className="text-foreground">Includes:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Product costs from all completed and ongoing orders</li>
                      <li>Shipping charges and taxes</li>
                      <li>All payment methods (Card, UPI, Net Banking, COD)</li>
                    </ul>
                    <p className="mt-2"><strong className="text-foreground">Excludes:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Cancelled orders</li>
                      <li>Refunded amounts (reflected after refund processing)</li>
                    </ul>
                  </div>
                  <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-950 rounded border border-purple-200 dark:border-purple-800">
                    <p className="text-sm font-medium text-purple-900 dark:text-purple-100">📊 Track Spending:</p>
                    <p className="text-sm text-purple-800 dark:text-purple-200">Use this to monitor your shopping budget and identify spending patterns!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* My Orders Help */}
            <div className="bg-card rounded-lg p-5 shadow-sm border border-border">
              <div className="flex items-start gap-3">
                <span className="text-3xl">📦</span>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-foreground mb-3">My Orders</h4>
                  <p className="text-muted-foreground mb-3">
                    View complete order history with detailed tracking and management options.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong className="text-foreground">Features:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Order Tracking:</strong> Real-time status updates from placement to delivery</li>
                      <li><strong>Order Details:</strong> View items, quantities, prices, shipping address, and payment info</li>
                      <li><strong>Filter & Search:</strong> Find orders by date, status, vendor, or order number</li>
                      <li><strong>Download Invoices:</strong> Get PDF invoices for completed orders</li>
                      <li><strong>Cancel Orders:</strong> Request cancellation for eligible orders</li>
                      <li><strong>Track Shipments:</strong> Follow your package with tracking numbers</li>
                      <li><strong>Contact Vendor:</strong> Send messages directly to sellers about orders</li>
                    </ul>
                  </div>
                  <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-950 rounded border border-indigo-200 dark:border-indigo-800">
                    <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">🔔 Stay Updated:</p>
                    <p className="text-sm text-indigo-800 dark:text-indigo-200">Enable email notifications in profile settings to get updates about your orders!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* My Profile Help */}
            <div className="bg-card rounded-lg p-5 shadow-sm border border-border">
              <div className="flex items-start gap-3">
                <span className="text-3xl">👤</span>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-foreground mb-3">My Profile</h4>
                  <p className="text-muted-foreground mb-3">
                    Manage your account information, addresses, payment methods, and preferences.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong className="text-foreground">What you can manage:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Personal Info:</strong> Update name, email, phone number, and profile picture</li>
                      <li><strong>Addresses:</strong> Save multiple shipping addresses for quick checkout</li>
                      <li><strong>Payment Methods:</strong> Store cards and payment preferences securely</li>
                      <li><strong>Security:</strong> Change password, enable two-factor authentication</li>
                      <li><strong>Notifications:</strong> Control email and SMS alerts for orders, offers, updates</li>
                      <li><strong>Preferences:</strong> Set language, currency, and display preferences</li>
                      <li><strong>Privacy:</strong> Manage data sharing and privacy settings</li>
                    </ul>
                  </div>
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-950 rounded border border-red-200 dark:border-red-800">
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">🔒 Security:</p>
                    <p className="text-sm text-red-800 dark:text-red-200">Keep your contact info current and use a strong password. Never share your password with anyone!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Continue Shopping Help */}
            <div className="bg-card rounded-lg p-5 shadow-sm border border-border">
              <div className="flex items-start gap-3">
                <span className="text-3xl">🛒</span>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-foreground mb-3">Continue Shopping</h4>
                  <p className="text-muted-foreground mb-3">
                    Returns you to the marketplace homepage to browse and discover more products.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong className="text-foreground">Shopping Features:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Browse Categories:</strong> Explore products organized by type</li>
                      <li><strong>Search Products:</strong> Find specific items using search bar</li>
                      <li><strong>Filter Results:</strong> Narrow down by price, brand, ratings, features</li>
                      <li><strong>View Details:</strong> See product descriptions, images, reviews, specs</li>
                      <li><strong>Compare Products:</strong> Compare features and prices side-by-side</li>
                      <li><strong>Wishlist:</strong> Save items to buy later</li>
                      <li><strong>Special Offers:</strong> Find deals, discounts, and promotional items</li>
                    </ul>
                  </div>
                  <div className="mt-3 p-3 bg-teal-50 dark:bg-teal-950 rounded border border-teal-200 dark:border-teal-800">
                    <p className="text-sm font-medium text-teal-900 dark:text-teal-100">🎁 Deals:</p>
                    <p className="text-sm text-teal-800 dark:text-teal-200">Check the homepage regularly for seasonal sales, flash deals, and new product launches!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders Section Help */}
            <div className="bg-card rounded-lg p-5 shadow-sm border border-border">
              <div className="flex items-start gap-3">
                <span className="text-3xl">📋</span>
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-foreground mb-3">Recent Orders Section</h4>
                  <p className="text-muted-foreground mb-3">
                    Quick view of your last 5 orders with key information and quick actions.
                  </p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p><strong className="text-foreground">Information Displayed:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Order Number:</strong> Unique identifier for tracking and reference</li>
                      <li><strong>Status Badge:</strong> Current order status with color coding</li>
                      <li><strong>Order Date:</strong> When the order was placed</li>
                      <li><strong>Item Count:</strong> Number of products in the order</li>
                      <li><strong>Total Amount:</strong> Order value including all charges</li>
                      <li><strong>View Details Link:</strong> Access complete order information</li>
                    </ul>
                  </div>
                  <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-950 rounded border border-orange-200 dark:border-orange-800">
                    <p className="text-sm font-medium text-orange-900 dark:text-orange-100">⚡ Quick Access:</p>
                    <p className="text-sm text-orange-800 dark:text-orange-200">Click "View All" to see your complete order history with advanced filtering options!</p>
                  </div>
                </div>
              </div>
            </div>

            {/* General Tips */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg p-5 border border-blue-200 dark:border-blue-800">
              <h4 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                <span>💡</span> Shopping Tips
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Check product reviews before purchasing</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Save addresses for faster checkout</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Track orders regularly for delivery updates</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Read return policies before buying</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Use wishlist to compare products later</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Enable notifications for order updates</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Contact vendor for product questions</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>
                  <span>Keep your profile information current</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-1 text-foreground">{stats.totalOrders}</h3>
          <p className="text-muted-foreground text-sm">Total Orders</p>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-1 text-foreground">{stats.pendingOrders}</h3>
          <p className="text-muted-foreground text-sm">Pending Orders</p>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-1 text-foreground">{stats.completedOrders}</h3>
          <p className="text-muted-foreground text-sm">Completed Orders</p>
        </div>

        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500/10 rounded-lg">
              <CreditCard className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <h3 className="text-2xl font-bold mb-1 text-foreground">{formatPrice(stats.totalSpent, 'INR')}</h3>
          <p className="text-muted-foreground text-sm">Total Spent</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link
          href={`${getRoutePrefix()}/orders`}
          className="bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <h3 className="font-semibold text-lg mb-1 text-foreground">My Orders</h3>
          <p className="text-muted-foreground text-sm">View and track your orders</p>
        </Link>

        <Link
          href={`${getRoutePrefix()}/profile`}
          className="bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
              <User className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
          </div>
          <h3 className="font-semibold text-lg mb-1 text-foreground">My Profile</h3>
          <p className="text-muted-foreground text-sm">Manage your account details</p>
        </Link>

        <Link
          href={vendorSlug ? `/vendor/${vendorSlug}` : '/'}
          className="bg-card rounded-lg shadow-sm border border-border p-6 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
              <ShoppingBag className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
          </div>
          <h3 className="font-semibold text-lg mb-1 text-foreground">Continue Shopping</h3>
          <p className="text-muted-foreground text-sm">Browse our products</p>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-card rounded-lg shadow-sm border border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-foreground">Recent Orders</h2>
            <Link
              href={`${getRoutePrefix()}/orders`}
              className="text-primary hover:underline text-sm font-medium"
            >
              View All
            </Link>
          </div>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-6">Start shopping to see your orders here</p>
            <Link
              href={vendorSlug ? `/vendor/${vendorSlug}` : '/'}
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentOrders.map((order) => (
              <div key={order.id} className="p-6 hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">
                        Order #{order.orderNumber || order.id.slice(0, 8)}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {order.items?.length || 0} item(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold mb-2 text-foreground">
                      {formatPrice(order.total, 'INR')}
                    </p>
                    <Link
                      href={`${getRoutePrefix()}/orders`}
                      className="text-sm text-primary hover:underline"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
