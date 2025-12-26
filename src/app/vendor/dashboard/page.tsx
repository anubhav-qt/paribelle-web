'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import UnifiedHeader from '@/components/UnifiedHeader';

interface Vendor {
  id: string;
  storeName: string;
  status: string;
  description?: string;
  city?: string;
  state?: string;
  totalSales: number;
  totalOrders: number;
  rating: number;
}

export default function VendorDashboardPage() {
  const router = useRouter();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminUser, setAdminUser] = useState<any>(null);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        router.push('/login');
        return;
      }

      const user = JSON.parse(userStr);
      setAdminUser(user);
      
      // Extract vendorId from JWT token if not in user object or localStorage
      let vendorId = user.vendorId || localStorage.getItem('vendorId');
      
      if (!vendorId && token) {
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const base64Url = tokenParts[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            const decodedToken = JSON.parse(jsonPayload);
            
            if (decodedToken.vendorId) {
              vendorId = decodedToken.vendorId;
              localStorage.setItem('vendorId', vendorId);
              console.log('VendorId extracted from JWT:', vendorId);
            }
          }
        } catch (decodeError) {
          console.error('Error decoding JWT token:', decodeError);
        }
      }
      
      console.log('User data:', user);
      console.log('Final vendorId:', vendorId);
      
      // Check if user is a vendor admin
      if (user.role !== 'vendor_admin') {
        setError('This account is not a vendor account. Please use a vendor login.');
        setIsLoading(false);
        return;
      }
      
      // Fetch vendor data using the vendorId
      if (!vendorId) {
        setError('No vendor account found for this user. Please contact support.');
        setIsLoading(false);
        return;
      }

      console.log('Fetching vendor:', vendorId);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Check if response is ok
      if (!response.ok) {
        // Try to parse error message
        let errorMessage = `Failed to fetch vendor data (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          // Response wasn't JSON, use status text
          errorMessage = `Failed to fetch vendor data: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Check if response has content
      const contentType = response.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response');
      }

      const text = await response.text();
      console.log('Response text:', text);
      
      if (!text) {
        throw new Error('Server returned empty response');
      }

      const vendorData = JSON.parse(text);
      console.log('Vendor data:', vendorData);
      setVendor(vendorData);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Vendor fetch error:', err);
      setError(err.message || 'Failed to load vendor data');
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/vendor/register');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md">
          <div className="text-red-600 mb-4">Error: {error}</div>
          <button
            onClick={() => router.push('/vendor/register')}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700"
          >
            Back to Registration
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      rejected: 'bg-gray-100 text-gray-800',
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles] || styles.pending}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedHeader />
      
      {/* Dashboard Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {vendor?.status === 'pending' && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Your vendor account is pending approval. Our team will review your application
                  and notify you via email once approved. This usually takes 1-2 business days.
                </p>
              </div>
            </div>
          </div>
        )}

        {vendor?.status === 'rejected' && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Your vendor application has been rejected. Please contact support for more
                  information.
                </p>
              </div>
            </div>
          </div>
        )}

        {vendor?.status === 'suspended' && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  Your vendor account has been suspended. Please contact support for assistance.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Store Overview */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{vendor?.storeName}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {vendor?.city && vendor?.state
                  ? `${vendor.city}, ${vendor.state}`
                  : 'Location not set'}
              </p>
              {adminUser && (
                <p className="text-xs text-gray-400 mt-1">
                  Admin: {adminUser.firstName} {adminUser.lastName} ({adminUser.email})
                </p>
              )}
            </div>
            {getStatusBadge(vendor?.status || 'pending')}
          </div>

          {vendor?.description && (
            <p className="text-gray-600 mb-4">{vendor.description}</p>
          )}

          <div className="border-t pt-4">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Sales</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  ${typeof vendor?.totalSales === 'number' ? vendor.totalSales.toFixed(2) : '0.00'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Orders</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {vendor?.totalOrders || 0}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Rating</dt>
                <dd className="mt-1 text-2xl font-semibold text-gray-900">
                  {typeof vendor?.rating === 'number' ? vendor.rating.toFixed(1) : '0.0'} / 5.0
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Help Section */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Vendor Dashboard Help</h3>
                <p className="text-sm text-gray-600">Learn how to use each feature of your vendor dashboard</p>
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
            <div className="px-6 pb-6 space-y-4">
              {/* Products Help */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📦</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Products</h4>
                    <p className="text-gray-700 mb-3">
                      Manage all your product listings in one place. Add, edit, delete, and organize your catalog.
                    </p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>What you can do:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong>Add Products:</strong> Create new product listings with images, prices, descriptions, and attributes</li>
                        <li><strong>Product Types:</strong> Physical products (with inventory) or Booking products (with time slots)</li>
                        <li><strong>Bulk Operations:</strong> Import/Export products using Excel files with images in ZIP format</li>
                        <li><strong>Search & Filter:</strong> Find products by name, SKU, category, type, or status</li>
                        <li><strong>Quick Edit:</strong> Update product details, prices, and stock directly from the list</li>
                        <li><strong>Categories:</strong> Assign products to categories for better organization</li>
                        <li><strong>Multiple Images:</strong> Add featured image + gallery images (up to 5MB each)</li>
                      </ul>
                    </div>
                    <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm font-medium text-blue-900">💡 Pro Tip:</p>
                      <p className="text-sm text-blue-800">Use the Export feature to backup your products, edit them in Excel, and re-import for bulk updates!</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Categories Help */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🏷️</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Categories</h4>
                    <p className="text-gray-700 mb-3">
                      Create custom categories to organize your products. Support for nested subcategories up to 3 levels deep.
                    </p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Features:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong>Hierarchical Structure:</strong> Create parent categories and subcategories (e.g., Electronics → Phones → Smartphones)</li>
                        <li><strong>Custom Filters:</strong> Define filter attributes for each category (Size, Color, Brand, Material, etc.)</li>
                        <li><strong>Visual Management:</strong> Upload category images and set display order</li>
                        <li><strong>Navigation Control:</strong> Show/hide categories in main navigation menu</li>
                        <li><strong>SEO-Friendly:</strong> Auto-generated slugs for clean URLs</li>
                      </ul>
                    </div>
                    <div className="mt-3 p-3 bg-amber-50 rounded border border-amber-200">
                      <p className="text-sm font-medium text-amber-900">📋 Example Use Case:</p>
                      <p className="text-sm text-amber-800">Create "Clothing" category with filters: Size (S, M, L, XL), Color, Brand. Products in this category automatically show these filter options!</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hero Banners Help */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🎨</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Hero Banners</h4>
                    <p className="text-gray-700 mb-3">
                      Create eye-catching carousel banners for your store's homepage to promote products, sales, or announcements.
                    </p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Capabilities:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong>Auto-Rotating Carousel:</strong> Multiple slides that automatically transition</li>
                        <li><strong>Custom Images:</strong> Upload high-quality banner images (recommended: 1920x600px)</li>
                        <li><strong>Call-to-Action:</strong> Add titles, descriptions, and button text with custom links</li>
                        <li><strong>Display Control:</strong> Set which banners are active and control their order</li>
                        <li><strong>Responsive Design:</strong> Banners automatically adapt to mobile, tablet, and desktop</li>
                        <li><strong>Link Destinations:</strong> Link to products, categories, or custom pages</li>
                      </ul>
                    </div>
                    <div className="mt-3 p-3 bg-purple-50 rounded border border-purple-200">
                      <p className="text-sm font-medium text-purple-900">🎯 Best Practice:</p>
                      <p className="text-sm text-purple-800">Use 3-5 banners max. Feature seasonal sales, new arrivals, and bestsellers. Keep text concise and CTAs clear!</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Theme Builder Help */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🎨</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Theme Builder</h4>
                    <p className="text-gray-700 mb-3">
                      Customize your store's visual appearance with colors, fonts, and layout options - no coding required!
                    </p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Customization Options:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong>Color Scheme:</strong> Set primary, secondary, and accent colors for buttons, links, and highlights</li>
                        <li><strong>Typography:</strong> Choose fonts for headings and body text from Google Fonts library</li>
                        <li><strong>Logo & Branding:</strong> Upload your store logo and set brand colors</li>
                        <li><strong>Layout Options:</strong> Grid vs List view, card styles, spacing preferences</li>
                        <li><strong>Dark Mode:</strong> Enable/disable dark mode support for your store</li>
                        <li><strong>Live Preview:</strong> See changes in real-time before publishing</li>
                      </ul>
                    </div>
                    <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                      <p className="text-sm font-medium text-green-900">✨ Design Tip:</p>
                      <p className="text-sm text-green-800">Match your theme colors with your logo. Use high contrast for buttons to improve click rates!</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom Pages Help */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📄</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Custom Pages</h4>
                    <p className="text-gray-700 mb-3">
                      Create custom content pages like About Us, Contact, FAQs, or any informational page for your store.
                    </p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Features:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong>Rich Text Editor:</strong> Format text, add images, lists, and links with WYSIWYG editor</li>
                        <li><strong>Page Templates:</strong> Pre-built templates for common pages (About, Contact, Terms, Privacy)</li>
                        <li><strong>SEO Settings:</strong> Set meta titles, descriptions, and keywords for each page</li>
                        <li><strong>Navigation Menu:</strong> Add pages to header/footer navigation automatically</li>
                        <li><strong>Custom Slugs:</strong> Create clean, readable URLs (e.g., /about-us, /shipping-info)</li>
                        <li><strong>Draft Mode:</strong> Work on pages privately before publishing</li>
                      </ul>
                    </div>
                    <div className="mt-3 p-3 bg-indigo-50 rounded border border-indigo-200">
                      <p className="text-sm font-medium text-indigo-900">📝 Essential Pages:</p>
                      <p className="text-sm text-indigo-800">Create: About Us, Contact, Shipping Info, Returns Policy, FAQs, and Terms & Conditions for customer trust!</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Orders Help */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📋</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Orders Received</h4>
                    <p className="text-gray-700 mb-3">
                      View and manage all customer orders. Update order status, process refunds, and communicate with customers.
                    </p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Order Management:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong>Order Tracking:</strong> See all orders with status (Pending, Confirmed, Processing, Shipped, Delivered)</li>
                        <li><strong>Status Updates:</strong> Change order status to keep customers informed</li>
                        <li><strong>Order Details:</strong> View customer info, items ordered, shipping address, payment details</li>
                        <li><strong>Filter & Search:</strong> Find orders by order number, customer name, date, or status</li>
                        <li><strong>Notifications:</strong> Get alerts for new orders via email</li>
                        <li><strong>Export Orders:</strong> Download order data for accounting or reporting</li>
                        <li><strong>Refund Processing:</strong> Handle returns and refunds directly from order page</li>
                      </ul>
                    </div>
                    <div className="mt-3 p-3 bg-orange-50 rounded border border-orange-200">
                      <p className="text-sm font-medium text-orange-900">⚡ Quick Actions:</p>
                      <p className="text-sm text-orange-800">Update order status promptly! Customers appreciate being kept in the loop about their order progress.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Policies Help */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📋</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Policies</h4>
                    <p className="text-gray-700 mb-3">
                      Configure your store's return, refund, and cancellation policies. Define rules that customers must follow.
                    </p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Policy Types:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong>Return Policy:</strong> Set timeframe for returns (e.g., 7, 15, 30 days), conditions, and process</li>
                        <li><strong>Refund Policy:</strong> Define how refunds work (full/partial, method, processing time)</li>
                        <li><strong>Cancellation Policy:</strong> Set rules for order cancellation (timeframe, conditions, fees)</li>
                        <li><strong>Shipping Policy:</strong> Delivery times, shipping costs, and coverage areas</li>
                        <li><strong>Custom Policies:</strong> Add store-specific policies (warranty, exchanges, etc.)</li>
                        <li><strong>Display Options:</strong> Show policies on product pages, checkout, and footer</li>
                      </ul>
                    </div>
                    <div className="mt-3 p-3 bg-red-50 rounded border border-red-200">
                      <p className="text-sm font-medium text-red-900">⚠️ Important:</p>
                      <p className="text-sm text-red-800">Clear policies reduce disputes and build trust. Make them easy to find and understand!</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Settings Help */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">⚙️</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Settings</h4>
                    <p className="text-gray-700 mb-3">
                      Manage your store's core settings including business information, payment methods, and account preferences.
                    </p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Configuration Options:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong>Store Information:</strong> Update store name, description, contact details, and address</li>
                        <li><strong>Business Details:</strong> Set business hours, contact phone, support email</li>
                        <li><strong>Payment Gateway:</strong> Configure Razorpay, Stripe, or other payment methods</li>
                        <li><strong>Shipping Zones:</strong> Define delivery areas and shipping charges</li>
                        <li><strong>Tax Settings:</strong> Set GST/tax rates for different product categories</li>
                        <li><strong>Email Notifications:</strong> Configure automated emails for orders, shipping, etc.</li>
                        <li><strong>Account Security:</strong> Update password, enable 2FA, manage login sessions</li>
                      </ul>
                    </div>
                    <div className="mt-3 p-3 bg-teal-50 rounded border border-teal-200">
                      <p className="text-sm font-medium text-teal-900">🔒 Security:</p>
                      <p className="text-sm text-teal-800">Keep your store information up-to-date and enable two-factor authentication for extra security!</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Stats Help */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📊</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Store Statistics</h4>
                    <p className="text-gray-700 mb-3">
                      Track your store's performance with key metrics displayed at the top of your dashboard.
                    </p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Key Metrics:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li><strong>Total Sales:</strong> Total revenue generated from all completed orders</li>
                        <li><strong>Total Orders:</strong> Number of orders received (all statuses)</li>
                        <li><strong>Rating:</strong> Average customer rating (1-5 stars) based on reviews</li>
                        <li><strong>Status:</strong> Your vendor account status (Active, Pending, Suspended)</li>
                      </ul>
                    </div>
                    <div className="mt-3 p-3 bg-pink-50 rounded border border-pink-200">
                      <p className="text-sm font-medium text-pink-900">📈 Growth Tip:</p>
                      <p className="text-sm text-pink-800">Monitor your rating closely! Encourage satisfied customers to leave reviews to boost your store's credibility.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-5 border border-purple-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>💡</span> Quick Success Tips
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span><strong>Complete Your Profile:</strong> Add logo, banner, and store description</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span><strong>Add Quality Images:</strong> Use high-resolution product photos</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span><strong>Set Competitive Prices:</strong> Research market prices before listing</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span><strong>Organize with Categories:</strong> Makes shopping easier for customers</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span><strong>Update Stock Regularly:</strong> Prevent overselling by keeping inventory current</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span><strong>Respond to Orders Quickly:</strong> Fast processing improves customer satisfaction</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span><strong>Use Hero Banners:</strong> Promote sales and new products on homepage</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span><strong>Create Essential Pages:</strong> About, Contact, Shipping, and Return policies</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/vendor/products"
            className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow ${
              vendor?.status !== 'active' ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-2">Products</h3>
            <p className="text-sm text-gray-600">Manage your product catalog</p>
          </Link>

          <Link
            href="/vendor/categories"
            className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow ${
              vendor?.status !== 'active' ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-2">Categories</h3>
            <p className="text-sm text-gray-600">Organize products with custom categories</p>
          </Link>

          <Link
            href="/vendor/hero-banners"
            className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow ${
              vendor?.status !== 'active' ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-2">Hero Banners</h3>
            <p className="text-sm text-gray-600">Customize your store's hero section</p>
          </Link>

          <Link
            href="/vendor/theme"
            className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow ${
              vendor?.status !== 'active' ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-2">🎨 Theme Builder</h3>
            <p className="text-sm text-gray-600">Customize your store's appearance</p>
          </Link>

          <Link
            href="/vendor/pages"
            className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow ${
              vendor?.status !== 'active' ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-2">📄 Custom Pages</h3>
            <p className="text-sm text-gray-600">Create About, Contact, and custom pages</p>
          </Link>

          <Link
            href="/vendor/orders"
            className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow ${
              vendor?.status !== 'active' ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-2">Orders Received</h3>
            <p className="text-sm text-gray-600">View and manage customer orders</p>
          </Link>

          <Link
            href="/vendor/policies"
            className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow ${
              vendor?.status !== 'active' ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <h3 className="text-lg font-medium text-gray-900 mb-2">📋 Policies</h3>
            <p className="text-sm text-gray-600">Configure return & cancellation policies</p>
          </Link>

          <Link
            href="/vendor/settings"
            className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-2">Settings</h3>
            <p className="text-sm text-gray-600">Update store information</p>
          </Link>
        </div>

        {vendor?.status === 'pending' && (
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              While You Wait
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Complete your store profile with a logo and banner
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Prepare product listings and descriptions
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Set up your bank account details for payouts
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Review our vendor guidelines and policies
              </li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
