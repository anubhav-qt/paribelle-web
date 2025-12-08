'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { formatPrice } from '@/lib/currency';
import { Package, Clock, CheckCircle, XCircle, Truck, Eye } from 'lucide-react';
import VendorHeader from '@/components/VendorHeader';
import CategoryNav from '@/components/CategoryNav';

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
  createdAt: string;
  items: OrderItem[];
  shippingAddress?: {
    fullName: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  paymentMethod?: string;
}

export default function VendorOrdersPage() {
  const router = useRouter();
  const params = useParams();
  const vendorSlug = params.vendorSlug as string;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [vendor, setVendor] = useState<any>(null);

  useEffect(() => {
    // Fetch vendor data for logo
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/vendors/slug/${vendorSlug}`)
      .then(res => res.json())
      .then(data => setVendor(data))
      .catch(err => console.error('Error fetching vendor:', err));

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

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
      case 'processing':
        return <Clock className="w-5 h-5 text-primary" />;
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
        return 'bg-primary/10 text-primary';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <VendorHeader 
          vendorSlug={vendorSlug}
          vendorId={vendor?.id}
          searchPlaceholder="Search in this store..."
        />
        <CategoryNav vendorId={vendor?.id} vendorSlug={vendorSlug} mode="scroll" />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <VendorHeader 
        vendorSlug={vendorSlug}
        vendorId={vendor?.id}
        searchPlaceholder="Search in this store..."
      />
      <CategoryNav vendorId={vendor?.id} vendorSlug={vendorSlug} mode="scroll" />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-foreground">My Orders</h1>

        {orders.length === 0 ? (
          <div className="bg-card rounded-lg shadow-sm border border-border p-12 text-center">
            <Package className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              You haven't placed any orders. Start shopping now!
            </p>
            <Link
              href={`/vendor/${vendorSlug}`}
              className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-card rounded-lg shadow-sm border border-border hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Order Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
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
                            <p className="font-semibold flex-shrink-0">
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
                    {order.status.toLowerCase() === 'delivered' && (
                      <button className="px-4 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors font-medium">
                        Review Products
                      </button>
                    )}
                    {['confirmed', 'processing'].includes(order.status.toLowerCase()) && (
                      <button className="px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium">
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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Order Details</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div>
                <h3 className="font-semibold mb-3">Order Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Number:</span>
                    <span className="font-medium">
                      {selectedOrder.orderNumber || selectedOrder.id.slice(0, 8)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 rounded ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-medium">
                      {new Date(selectedOrder.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium">
                      {selectedOrder.paymentMethod === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div>
                  <h3 className="font-semibold mb-3">Shipping Address</h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm">
                    <p className="font-medium">{selectedOrder.shippingAddress.fullName}</p>
                    <p className="text-gray-600">{selectedOrder.shippingAddress.addressLine1}</p>
                    <p className="text-gray-600">
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}{' '}
                      {selectedOrder.shippingAddress.postalCode}
                    </p>
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3">Items Ordered</h3>
                <div className="space-y-3">
                  {selectedOrder.items?.map((item) => {
                    const productImage = item.productImage || item.product?.featuredImage;
                    const productSlug = item.product?.slug;
                    const vendorSlug = item.product?.vendor?.slug;
                    const vendorName = item.product?.vendor?.businessName;
                    
                    return (
                      <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
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
                            className="font-medium text-gray-900 hover:text-blue-600 block mb-1"
                          >
                            {item.productName}
                          </Link>
                          <p className="text-sm text-gray-600">
                            Qty: {item.quantity} × {formatPrice(item.price, 'INR')}
                          </p>
                          {vendorName && (
                            <Link 
                              href={`/vendors/${vendorSlug}`}
                              className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                            >
                              Sold by {vendorName}
                            </Link>
                          )}
                        </div>
                        <p className="font-semibold flex-shrink-0">
                          {formatPrice(item.price * item.quantity, 'INR')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Total */}
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total Amount</span>
                  <span>{formatPrice(selectedOrder.total, 'INR')}</span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50">
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
