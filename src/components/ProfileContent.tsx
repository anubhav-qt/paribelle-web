'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader } from '@/components/ui/Loader';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar,
  Edit2,
  Save,
  X,
  Shield,
  Lock,
  ShoppingBag,
  Ticket,
  Package
} from 'lucide-react';
import AddressManager from '@/components/AddressManager';

export default function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings' | 'orders'>('profile');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const getRoutePrefix = () => '';

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
      setFormData({
        firstName: parsedUser.firstName || '',
        lastName: parsedUser.lastName || '',
        email: parsedUser.email || '',
        phone: parsedUser.phone || '',
      });
      setLoading(false);
      
      // Check if tab parameter is set to bookings
      const tab = searchParams.get('tab');
      if (tab === 'bookings') {
        setActiveTab('bookings');
        fetchBookings(parsedUser.id, token);
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push(`${getRoutePrefix()}/login`);
    }
  }, [router, searchParams]);

  const fetchBookings = async (userId: string, token: string) => {
    setLoadingBookings(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/bookings/user/${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setBookings(data);
      } else {
        console.error('Failed to fetch bookings:', response.status);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoadingBookings(false);
    }
  };

  const fetchOrders = async (token: string) => {
    setLoadingOrders(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : data.orders || []);
      } else {
        console.error('Failed to fetch orders:', response.status);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleTabChange = (tab: 'profile' | 'bookings' | 'orders') => {
    setActiveTab(tab);
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    if (tab === 'bookings' && bookings.length === 0) {
      fetchBookings(user.id, token);
    } else if (tab === 'orders' && orders.length === 0) {
      fetchOrders(token);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.phone || !formData.phone.trim()) {
      alert('Phone number is required for bookings. Please provide your contact number.');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setEditing(false);
        alert('Profile updated successfully!');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to update profile' }));
        console.error('Error response:', response.status, errorData);
        throw new Error(errorData.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(error instanceof Error ? error.message : 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
    });
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader size="md" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2 text-foreground">My Profile</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      {/* Tabs */}
        <div className="mb-6 border-b border-border">
          <div className="flex gap-4">
            <button
              onClick={() => handleTabChange('profile')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Profile
              </div>
            </button>
            <button
              onClick={() => handleTabChange('bookings')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'bookings'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Ticket className="w-4 h-4" />
                Bookings
                {bookings.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                    {bookings.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => handleTabChange('orders')}
              className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                activeTab === 'orders'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4" />
                Orders
                {orders.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs">
                    {orders.length}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-primary" />
                </div>
                <h2 className="text-xl font-bold mb-1 text-foreground">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-muted-foreground text-sm mb-4">{user.email}</p>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Joined {new Date(user.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-border space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Account Type</span>
                  <span className="font-medium capitalize text-foreground">{user.role || 'Customer'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-card rounded-lg shadow-sm border border-border">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Personal Information</h3>
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancel}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      First Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                      />
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
                        <User className="w-5 h-5 text-muted-foreground" />
                        <span className="text-foreground">{user.firstName || '-'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Last Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                      />
                    ) : (
                      <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
                        <User className="w-5 h-5 text-muted-foreground" />
                        <span className="text-foreground">{user.lastName || '-'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <span className="text-foreground">{user.email}</span>
                    <span className="ml-auto text-xs text-muted-foreground">Cannot be changed</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  {editing ? (
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter phone number"
                      required
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                    />
                  ) : (
                    <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-lg">
                      <Phone className="w-5 h-5 text-muted-foreground" />
                      <span className="text-foreground">{user.phone || 'Not provided'}</span>
                    </div>
                  )}
                  {editing && !formData.phone && (
                    <p className="mt-1 text-sm text-red-500">Phone number is required for bookings</p>
                  )}
                </div>
              </div>
            </div>

            {/* Saved Addresses */}
            <AddressManager showSelection={false} compact={false} />

            {/* Security Section */}
            <div className="bg-card rounded-lg shadow-sm border border-border">
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                  <Shield className="w-5 h-5" />
                  Security
                </h3>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Password</p>
                      <p className="text-sm text-muted-foreground">Last changed 30 days ago</p>
                    </div>
                  </div>
                  <button className="px-4 py-2 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                    Change Password
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">Email Verification</p>
                      <p className="text-sm text-muted-foreground">
                        {user.emailVerified ? 'Email verified' : 'Email not verified'}
                      </p>
                    </div>
                  </div>
                  {!user.emailVerified && (
                    <button className="px-4 py-2 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                      Verify Email
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <h3 className="text-lg font-semibold mb-4 text-foreground">Quick Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => handleTabChange('orders')}
                  className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground block">My Orders</span>
                    {orders.length > 0 && (
                      <span className="text-xs text-muted-foreground">{orders.length} orders</span>
                    )}
                  </div>
                </button>

                <button
                  onClick={() => handleTabChange('bookings')}
                  className="flex items-center gap-3 p-4 border border-border rounded-lg hover:bg-muted transition-colors text-left"
                >
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Ticket className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <span className="font-medium text-foreground block">My Bookings</span>
                    {bookings.length > 0 && (
                      <span className="text-xs text-muted-foreground">{bookings.length} bookings</span>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-4">
            {loadingBookings ? (
              <div className="flex items-center justify-center py-12">
                <Loader size="md" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="bg-card rounded-lg shadow-sm border border-border p-12 text-center">
                <Ticket className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">No Bookings Yet</h3>
                <p className="text-muted-foreground mb-6">You haven't made any bookings yet.</p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Browse Products
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-card rounded-lg shadow-sm border border-border p-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          {booking.product?.images?.[0] && (
                            <img
                              src={booking.product.images[0]}
                              alt={booking.product.name}
                              className="w-20 h-20 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground mb-1">
                              {booking.product?.name || 'Booking'}
                            </h3>
                            <div className="space-y-1 text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  {new Date(booking.bookingDate).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                              </div>
                              {booking.startTime && (
                                <div className="flex items-center gap-2">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    {booking.startTime} - {booking.endTime || 'N/A'}
                                  </span>
                                </div>
                              )}
                              {booking.numberOfGuests && (
                                <div className="flex items-center gap-2">
                                  <User className="w-4 h-4" />
                                  <span>{booking.numberOfGuests} {booking.numberOfGuests === 1 ? 'guest' : 'guests'}</span>
                                </div>
                              )}
                              {booking.specialRequests && (
                                <div className="mt-2 p-2 bg-muted rounded text-xs">
                                  <strong>Special Requests:</strong> {booking.specialRequests}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Total Price</div>
                          <div className="text-xl font-bold text-foreground">
                            ₹{booking.totalPrice?.toLocaleString() || '0'}
                          </div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            booking.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : booking.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {booking.status?.toUpperCase() || 'PENDING'}
                        </span>
                      </div>
                    </div>
                    {booking.customerName && (
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Name:</span>{' '}
                            <span className="font-medium text-foreground">{booking.customerName}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Email:</span>{' '}
                            <span className="font-medium text-foreground">{booking.customerEmail}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Phone:</span>{' '}
                            <span className="font-medium text-foreground">{booking.customerPhone || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-4">
            {loadingOrders ? (
              <div className="flex items-center justify-center py-12">
                <Loader size="md" />
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-card rounded-lg shadow-sm border border-border p-12 text-center">
                <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2 text-foreground">No Orders Yet</h3>
                <p className="text-muted-foreground mb-6">You haven't placed any orders yet.</p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-card rounded-lg shadow-sm border border-border p-6"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              Order #{order.orderNumber || order.id.slice(0, 8)}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {new Date(order.createdAt).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              order.status === 'delivered' || order.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : order.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : order.status === 'processing' || order.status === 'shipped'
                                ? 'bg-blue-100 text-blue-800'
                                : order.status === 'cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {order.status?.toUpperCase() || 'PENDING'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Total Amount</div>
                        <div className="text-xl font-bold text-foreground">
                          ₹{order.totalAmount?.toLocaleString() || '0'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Order Items */}
                    {order.items && order.items.length > 0 && (
                      <div className="border-t border-border pt-4">
                        <h4 className="text-sm font-semibold text-foreground mb-3">Items ({order.items.length})</h4>
                        <div className="space-y-3">
                          {order.items.slice(0, 3).map((item: any, index: number) => (
                            <div key={index} className="flex items-center gap-3">
                              {item.product?.images?.[0] && (
                                <img
                                  src={item.product.images[0]}
                                  alt={item.product.name}
                                  className="w-12 h-12 rounded object-cover"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {item.product?.name || item.productName || 'Product'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Qty: {item.quantity} × ₹{item.price?.toLocaleString()}
                                </p>
                              </div>
                              <div className="text-sm font-medium text-foreground">
                                ₹{((item.quantity || 0) * (item.price || 0)).toLocaleString()}
                              </div>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <p className="text-xs text-muted-foreground text-center pt-2">
                              +{order.items.length - 3} more item(s)
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Shipping Address */}
                    {order.shippingAddress && (
                      <div className="border-t border-border pt-4 mt-4">
                        <h4 className="text-sm font-semibold text-foreground mb-2">Shipping Address</h4>
                        <p className="text-sm text-muted-foreground">
                          {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                        </p>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="border-t border-border pt-4 mt-4">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
                      >
                        View Details
                        <ShoppingBag className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
    </div>
  );
}
