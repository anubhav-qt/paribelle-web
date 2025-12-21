'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice } from '@/lib/currency';
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
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);

  const getRoutePrefix = () => vendorSlug ? `/vendor/${vendorSlug}` : '';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      router.push(`${getRoutePrefix()}/login`);
      return;
    }

    try {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      fetchDashboardData(token);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push(`${getRoutePrefix()}/login`);
    }
  }, [router, vendorSlug]);

  const fetchDashboardData = async (token: string) => {
    try {
      setLoading(true);
      
      // Fetch ALL orders for the logged-in user (not filtered by vendor)
      // This ensures the same user sees the same dashboard content regardless of domain
      const ordersResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (ordersResponse.ok) {
        const orders = await ordersResponse.json();
        const orderList = Array.isArray(orders) ? orders : orders.orders || [];
        
        // Get recent orders (last 5)
        setRecentOrders(orderList.slice(0, 5));
        
        // Calculate stats
        const totalOrders = orderList.length;
        const pendingOrders = orderList.filter((o: Order) => 
          ['pending', 'confirmed', 'processing'].includes(o.status.toLowerCase())
        ).length;
        const completedOrders = orderList.filter((o: Order) => 
          o.status.toLowerCase() === 'delivered'
        ).length;
        const totalSpent = orderList.reduce((sum: number, o: Order) => 
          sum + (Number(o.total) || 0), 0
        );
        
        setStats({
          totalOrders,
          pendingOrders,
          completedOrders,
          totalSpent,
        });
      }
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
