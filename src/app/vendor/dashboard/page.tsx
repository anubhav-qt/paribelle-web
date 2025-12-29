'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import UnifiedHeader from '@/components/UnifiedHeader';
import CategorySidebar from '@/components/CategorySidebar';
import { useVendorDashboard } from '@/hooks/useVendorDashboard';

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
  kycStatus?: 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected';
  kycRejectedReason?: string;
}

export default function VendorDashboardPage() {
  const router = useRouter();
  const { data, isLoading, error: queryError } = useVendorDashboard();
  const [showHelp, setShowHelp] = useState(false);
  
  const vendor = data?.vendor || null;
  const adminUser = data?.adminUser || null;
  const error = queryError?.message || '';

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/vendor/register');
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <UnifiedHeader /> */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* <CategorySidebar /> */}
          <div className="flex-1">
      
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

        {/* KYC Verification Section - Dynamic based on status */}
        <div className="mb-6">
          {vendor?.kycStatus === 'approved' ? (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">✓ KYC Verified</h3>
                    <p className="text-green-100">Your account is verified and ready to sell</p>
                  </div>
                </div>
                <Link href="/vendor/kyc">
                  <span className="bg-white text-green-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-green-50 transition-colors">
                    View Details
                  </span>
                </Link>
              </div>
            </div>
          ) : vendor?.kycStatus === 'rejected' ? (
            <Link href="/vendor/kyc">
              <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">KYC Rejected</h3>
                      <p className="text-red-100">{vendor.kycRejectedReason || 'Please resubmit your documents'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-white text-red-600 px-4 py-2 rounded-full text-sm font-semibold">
                      Resubmit
                    </span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ) : vendor?.kycStatus === 'under_review' || vendor?.kycStatus === 'submitted' ? (
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <svg className="w-8 h-8 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-1">KYC Under Review</h3>
                    <p className="text-amber-100">Your documents are being verified. We'll notify you soon!</p>
                  </div>
                </div>
                <Link href="/vendor/kyc">
                  <span className="bg-white text-amber-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-amber-50 transition-colors">
                    View Status
                  </span>
                </Link>
              </div>
            </div>
          ) : (
            <Link href="/vendor/kyc">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg rounded-lg p-6 hover:shadow-xl transition-shadow cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">KYC Verification Required</h3>
                      <p className="text-indigo-100">Complete your KYC to start selling products</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-white text-indigo-600 px-4 py-2 rounded-full text-sm font-semibold">
                      Complete KYC
                    </span>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          )}
        </div>

        {/* Help Section */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Complete Beginner's Guide</h3>
                <p className="text-sm text-gray-600">Step-by-step guide to running a successful store on our platform</p>
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
              {/* Getting Started */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🚀</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Getting Started with Your Vendor Dashboard</h4>
                    <p className="text-gray-700 mb-3">
                      Welcome to your vendor dashboard! This is your command center for managing your online store. 
                      Everything you need to sell products, manage orders, and grow your business is right here.
                    </p>
                    <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded border border-blue-200">
                      <p className="text-sm font-medium text-blue-800 mb-2">🎯 Your First Steps:</p>
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                          <p className="text-sm text-blue-700"><strong>Complete Store Settings:</strong> Add your store name, logo, description, and contact information</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                          <p className="text-sm text-blue-700"><strong>Set Up Policies:</strong> Configure return, cancellation, and shipping policies</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                          <p className="text-sm text-blue-700"><strong>Create Categories:</strong> Organize how customers will browse your products</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                          <p className="text-sm text-blue-700"><strong>Add Your First Products:</strong> Start building your catalog with high-quality images and descriptions</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">5</span>
                          <p className="text-sm text-blue-700"><strong>Customize Your Store:</strong> Use Theme Builder and Hero Banners to make your store unique</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Understanding Dashboard Cards */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📊</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Understanding Your Dashboard</h4>
                    <p className="text-gray-700 mb-3">
                      The dashboard shows 8 main sections, each with a dedicated page for managing different aspects of your store. 
                      Hover over the help icon (ℹ️) on each card to see quick tips!
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">📦</span>
                          <p className="font-medium text-blue-800">Products Section</p>
                        </div>
                        <p className="text-sm text-blue-700">Your product catalog. Add new items, edit existing ones, manage inventory, set prices, upload images, and organize with categories. Supports both physical products (with stock) and booking products (with time slots).</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded border border-green-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">🏷️</span>
                          <p className="font-medium text-green-800">Categories</p>
                        </div>
                        <p className="text-sm text-green-700">Create custom categories and subcategories to organize your products. Define filter attributes (Size, Color, Brand, etc.) so customers can easily find what they want. Supports hierarchical structure up to 3 levels.</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded border border-purple-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">🎨</span>
                          <p className="font-medium text-purple-800">Hero Banners</p>
                        </div>
                        <p className="text-sm text-purple-700">Create rotating banner slides for your store's homepage. Promote sales, new arrivals, or featured products with eye-catching images, titles, and call-to-action buttons. Perfect for seasonal campaigns!</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded border border-orange-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">🖌️</span>
                          <p className="font-medium text-orange-800">Theme Builder</p>
                        </div>
                        <p className="text-sm text-orange-700">Customize your store's look and feel. Change colors, fonts, layout styles, and branding elements. Make your store match your brand identity without any coding required!</p>
                      </div>
                      <div className="p-3 bg-pink-50 rounded border border-pink-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">📄</span>
                          <p className="font-medium text-pink-800">Custom Pages</p>
                        </div>
                        <p className="text-sm text-pink-700">Create essential pages like About Us, Contact, FAQ, Shipping Info, and more. Use the rich text editor to format content, add images, and create professional informational pages.</p>
                      </div>
                      <div className="p-3 bg-yellow-50 rounded border border-yellow-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">📋</span>
                          <p className="font-medium text-yellow-800">Orders</p>
                        </div>
                        <p className="text-sm text-yellow-700">View and manage all customer orders. Update order status (Pending → Confirmed → Processing → Shipped → Delivered), view customer details, process refunds, and track sales performance.</p>
                      </div>
                      <div className="p-3 bg-red-50 rounded border border-red-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">📜</span>
                          <p className="font-medium text-red-800">Policies</p>
                        </div>
                        <p className="text-sm text-red-700">Set your return, cancellation, and shipping policies. Clear policies build customer trust and reduce disputes. Use marketplace defaults or create custom policies tailored to your business needs.</p>
                      </div>
                      <div className="p-3 bg-teal-50 rounded border border-teal-200">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">⚙️</span>
                          <p className="font-medium text-teal-800">Settings</p>
                        </div>
                        <p className="text-sm text-teal-700">Manage store information, business details, contact info, logo, location, and shipping costs. Keep this information up-to-date so customers can reach you and know shipping charges.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Management Detailed */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📦</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Product Management Deep Dive</h4>
                    <p className="text-gray-700 mb-3">
                      Products are the heart of your store. Here's everything you need to know about adding and managing them effectively.
                    </p>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-800 mb-2">🎯 Types of Products</p>
                        <ul className="text-sm text-gray-700 space-y-1">
                          <li><strong>• Physical Products:</strong> Regular items with inventory (clothing, electronics, food). Track stock quantity, set SKU, manage variations (sizes, colors).</li>
                          <li><strong>• Booking Products:</strong> Services or rentals with time slots (meeting rooms, sports courts, appointments). Set duration, available days, time slots.</li>
                          <li><strong>• Variable Products:</strong> Products with multiple options (e.g., T-shirt in S/M/L/XL and Red/Blue/Green = 12 variations). Each variation has its own price and stock.</li>
                        </ul>
                      </div>
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="font-medium text-blue-800 mb-2">📸 Product Images Best Practices</p>
                        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                          <li>Use high-resolution images (at least 1000x1000px)</li>
                          <li>Add a featured image + 4-5 gallery images showing different angles</li>
                          <li>Use white or clean backgrounds for professional look</li>
                          <li>Show product in use (lifestyle photos) when possible</li>
                          <li>Optimize file size (under 5MB each) for fast loading</li>
                          <li>Supported formats: JPG, PNG, WEBP, GIF</li>
                        </ul>
                      </div>
                      <div className="p-3 bg-green-50 rounded border border-green-200">
                        <p className="font-medium text-green-800 mb-2">💰 Pricing Strategies</p>
                        <ul className="text-sm text-green-700 space-y-1">
                          <li><strong>• Regular Price:</strong> Your selling price</li>
                          <li><strong>• Compare-at Price:</strong> Original price (shown crossed out) to display discounts</li>
                          <li><strong>• Bulk Pricing:</strong> Offer discounts for quantity purchases</li>
                          <li><strong>• Competitive Research:</strong> Check competitors' prices before setting yours</li>
                        </ul>
                      </div>
                      <div className="p-3 bg-purple-50 rounded border border-purple-200">
                        <p className="font-medium text-purple-800 mb-2">📦 Bulk Operations (Import/Export)</p>
                        <p className="text-sm text-purple-700 mb-2">Save time by managing products in Excel:</p>
                        <ul className="text-sm text-purple-700 space-y-1 list-disc list-inside">
                          <li><strong>Export:</strong> Download all products as Excel file + images in ZIP</li>
                          <li><strong>Edit in Excel:</strong> Update prices, descriptions, stock in bulk</li>
                          <li><strong>Import:</strong> Upload modified ZIP file to update many products at once</li>
                          <li>Perfect for: Price updates, stock adjustments, adding multiple products</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Fulfillment Workflow */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🔄</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Order Fulfillment Workflow</h4>
                    <p className="text-gray-700 mb-3">
                      Understanding the order lifecycle is crucial for customer satisfaction. Here's the complete workflow:
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded border border-yellow-200">
                        <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                        <div className="flex-1">
                          <p className="font-medium text-yellow-800">🟡 Pending</p>
                          <p className="text-sm text-yellow-700">New order just placed. <strong>Action:</strong> Review order details, check inventory availability. Confirm within 24 hours!</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded border border-blue-200">
                        <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                        <div className="flex-1">
                          <p className="font-medium text-blue-800">🔵 Confirmed</p>
                          <p className="text-sm text-blue-700">Order accepted by you. <strong>Action:</strong> Start preparing items for shipment. Print invoice and packing slip.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-purple-50 rounded border border-purple-200">
                        <span className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                        <div className="flex-1">
                          <p className="font-medium text-purple-800">🟣 Processing</p>
                          <p className="text-sm text-purple-700">Items being packed. <strong>Action:</strong> Pack items securely, attach shipping label, prepare for dispatch.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-orange-50 rounded border border-orange-200">
                        <span className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                        <div className="flex-1">
                          <p className="font-medium text-orange-800">🟠 Shipped</p>
                          <p className="text-sm text-orange-700">Order dispatched. <strong>Action:</strong> Update with tracking number. Customer gets notification with tracking link.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded border border-green-200">
                        <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">5</span>
                        <div className="flex-1">
                          <p className="font-medium text-green-800">🟢 Delivered</p>
                          <p className="text-sm text-green-700">Customer received order. <strong>Action:</strong> Mark as delivered. Follow up to request review!</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-amber-50 rounded border border-amber-200">
                      <p className="text-sm font-medium text-amber-800 mb-1">⚡ Pro Tips for Fast Fulfillment:</p>
                      <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                        <li>Check orders daily (morning and evening)</li>
                        <li>Keep packing materials and labels ready</li>
                        <li>Update status immediately after each step</li>
                        <li>Provide tracking numbers when available</li>
                        <li>Aim to ship within 24-48 hours for best reviews</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Store Branding & Customization */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🎨</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Creating a Professional Store Brand</h4>
                    <p className="text-gray-700 mb-3">
                      Your store's appearance and content create the first impression. Make it count!
                    </p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 rounded border border-blue-200">
                          <p className="font-medium text-blue-800 mb-2">🏪 Store Identity</p>
                          <ul className="text-sm text-blue-700 space-y-1">
                            <li>✓ Choose a memorable store name</li>
                            <li>✓ Create/upload a professional logo</li>
                            <li>✓ Write compelling store description</li>
                            <li>✓ Add high-quality store banner</li>
                            <li>✓ Complete contact information</li>
                          </ul>
                        </div>
                        <div className="p-3 bg-green-50 rounded border border-green-200">
                          <p className="font-medium text-green-800 mb-2">🎨 Visual Design</p>
                          <ul className="text-sm text-green-700 space-y-1">
                            <li>✓ Use Theme Builder for colors/fonts</li>
                            <li>✓ Match colors to your brand</li>
                            <li>✓ Choose readable fonts</li>
                            <li>✓ Maintain consistent style</li>
                            <li>✓ Test on mobile devices</li>
                          </ul>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="p-3 bg-purple-50 rounded border border-purple-200">
                          <p className="font-medium text-purple-800 mb-2">📄 Content Pages</p>
                          <ul className="text-sm text-purple-700 space-y-1">
                            <li>✓ About Us - Your story and mission</li>
                            <li>✓ Contact - Form, email, phone</li>
                            <li>✓ FAQ - Common questions answered</li>
                            <li>✓ Shipping Info - Delivery details</li>
                            <li>✓ Terms & Conditions - Legal terms</li>
                          </ul>
                        </div>
                        <div className="p-3 bg-orange-50 rounded border border-orange-200">
                          <p className="font-medium text-orange-800 mb-2">🎯 Marketing Elements</p>
                          <ul className="text-sm text-orange-700 space-y-1">
                            <li>✓ Create 3-5 hero banner slides</li>
                            <li>✓ Highlight sales and promotions</li>
                            <li>✓ Feature new arrivals</li>
                            <li>✓ Add clear call-to-actions</li>
                            <li>✓ Update seasonally</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Performance & Growth */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📈</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Growing Your Store</h4>
                    <p className="text-gray-700 mb-3">
                      Beyond the basics, here are strategies to increase sales and build customer loyalty:
                    </p>
                    <div className="space-y-3">
                      <div className="p-3 bg-green-50 rounded border border-green-200">
                        <p className="font-medium text-green-800 mb-2">🌟 Get More Sales</p>
                        <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                          <li><strong>Competitive Pricing:</strong> Research competitors, offer fair prices</li>
                          <li><strong>High-Quality Images:</strong> Professional photos increase conversion by 30%+</li>
                          <li><strong>Detailed Descriptions:</strong> Answer all customer questions in product description</li>
                          <li><strong>Fast Shipping:</strong> Offer quick delivery options</li>
                          <li><strong>Promotions:</strong> Run seasonal sales and limited-time offers</li>
                          <li><strong>Bundle Deals:</strong> "Buy 2 Get 10% Off" encourages larger purchases</li>
                        </ul>
                      </div>
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="font-medium text-blue-800 mb-2">⭐ Build Great Reputation</p>
                        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                          <li><strong>Fast Response:</strong> Reply to inquiries within hours, not days</li>
                          <li><strong>Accurate Descriptions:</strong> Products should match descriptions exactly</li>
                          <li><strong>Quality Packaging:</strong> Protect items well during shipping</li>
                          <li><strong>Request Reviews:</strong> Ask satisfied customers to leave feedback</li>
                          <li><strong>Handle Issues Professionally:</strong> Resolve problems quickly and fairly</li>
                          <li><strong>Clear Policies:</strong> Set expectations upfront to avoid misunderstandings</li>
                        </ul>
                      </div>
                      <div className="p-3 bg-purple-50 rounded border border-purple-200">
                        <p className="font-medium text-purple-800 mb-2">🔄 Customer Retention</p>
                        <ul className="text-sm text-purple-700 space-y-1 list-disc list-inside">
                          <li><strong>Email Follow-ups:</strong> Thank customers after purchase</li>
                          <li><strong>Loyalty Programs:</strong> Offer returning customer discounts</li>
                          <li><strong>Seasonal Updates:</strong> Notify about new arrivals and sales</li>
                          <li><strong>Personalization:</strong> Remember customer preferences</li>
                          <li><strong>Excellent Service:</strong> Go above and beyond expectations</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Common Mistakes */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-5 border border-red-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>⚠️</span> Common Mistakes New Vendors Make
                </h4>
                <div className="grid md:grid-cols-2 gap-3 text-sm text-gray-700">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">✗</span>
                      <span><strong>Incomplete product info:</strong> Missing details lose sales. Fill ALL fields!</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">✗</span>
                      <span><strong>Poor quality images:</strong> Blurry/small photos make products look cheap</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">✗</span>
                      <span><strong>Ignoring orders:</strong> Slow response = bad reviews and lost customers</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">✗</span>
                      <span><strong>No inventory management:</strong> Overselling creates angry customers</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">✗</span>
                      <span><strong>Unclear policies:</strong> Vague terms lead to disputes and refunds</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">✗</span>
                      <span><strong>Unrealistic pricing:</strong> Too high = no sales; too low = no profit</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">✗</span>
                      <span><strong>Generic store design:</strong> Default theme doesn't build brand identity</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">✗</span>
                      <span><strong>No custom pages:</strong> Missing About/Contact pages look unprofessional</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">✗</span>
                      <span><strong>Slow shipping:</strong> Customers expect fast delivery nowadays</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-red-600 font-bold">✗</span>
                      <span><strong>Not updating status:</strong> Keep customers informed about their orders!</span>
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
                    <span>Complete all 8 sections before launching</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Add at least 10 products to start</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Use high-quality photos for all products</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Respond to orders within 24 hours</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Update inventory regularly to avoid stockouts</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Create 3-5 hero banners for promotions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Set clear return and cancellation policies</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Customize theme to match your brand</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Add About Us and Contact pages</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Check dashboard daily for new orders</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Ask happy customers for reviews</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Monitor your store rating and improve</span>
                  </div>
                </div>
              </div>

              {/* Next Steps */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>🎯</span> Ready to Start? Here's Your Action Plan
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <p className="font-medium text-blue-900 mb-3">Complete these in order for the best results:</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 p-2 bg-white rounded">
                      <span className="text-blue-600 font-bold">1.</span>
                      <span><strong>Settings:</strong> Fill in store name, logo, description, contact info, and shipping costs</span>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-white rounded">
                      <span className="text-blue-600 font-bold">2.</span>
                      <span><strong>Policies:</strong> Set return/cancellation policies (or use marketplace defaults)</span>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-white rounded">
                      <span className="text-blue-600 font-bold">3.</span>
                      <span><strong>Categories:</strong> Create 3-5 main categories for your products</span>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-white rounded">
                      <span className="text-blue-600 font-bold">4.</span>
                      <span><strong>Products:</strong> Add your first 10-20 products with great photos and descriptions</span>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-white rounded">
                      <span className="text-blue-600 font-bold">5.</span>
                      <span><strong>Theme:</strong> Customize colors and fonts to match your brand</span>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-white rounded">
                      <span className="text-blue-600 font-bold">6.</span>
                      <span><strong>Hero Banners:</strong> Create 3 promotional banners for your homepage</span>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-white rounded">
                      <span className="text-blue-600 font-bold">7.</span>
                      <span><strong>Custom Pages:</strong> Add About Us and Contact pages</span>
                    </div>
                    <div className="flex items-start gap-2 p-2 bg-white rounded">
                      <span className="text-blue-600 font-bold">8.</span>
                      <span><strong>Test:</strong> Visit your store as a customer to check everything looks good!</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                    <p className="text-sm font-medium text-green-900">🎉 You're Ready to Sell!</p>
                    <p className="text-sm text-green-800">Once you complete these steps, your store will be live and customers can start ordering!</p>
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
            className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow group relative ${
              vendor?.status !== 'active' ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📦</span>
                <h3 className="text-lg font-medium text-gray-900">Products</h3>
              </div>
              <div className="relative">
                <HelpCircle className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <div className="absolute right-0 top-8 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
                  <p className="font-semibold mb-1">What you can do:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>Add products with images & details</li>
                    <li>Create variations (colors, sizes)</li>
                    <li>Bulk import/export via Excel</li>
                    <li>Manage inventory & pricing</li>
                  </ul>
                  <div className="absolute -top-2 right-2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">Manage your product catalog</p>
          </Link>

          <Link
            href="/vendor/categories"
            className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow group relative ${
              vendor?.status !== 'active' ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏷️</span>
                <h3 className="text-lg font-medium text-gray-900">Categories</h3>
              </div>
              <div className="relative">
                <HelpCircle className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <div className="absolute right-0 top-8 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
                  <p className="font-semibold mb-1">Organize your store:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>Create nested categories (3 levels)</li>
                    <li>Add custom filters (Size, Color, etc.)</li>
                    <li>Upload category images</li>
                    <li>Control navigation display</li>
                  </ul>
                  <div className="absolute -top-2 right-2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">Organize products with custom categories</p>
          </Link>

          <Link
            href="/vendor/hero-banners"
            className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow group relative ${
              vendor?.status !== 'active' ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                <h3 className="text-lg font-medium text-gray-900">Hero Banners</h3>
              </div>
              <div className="relative">
                <HelpCircle className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <div className="absolute right-0 top-8 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
                  <p className="font-semibold mb-1">Create engaging banners:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>Auto-rotating carousel slides</li>
                    <li>Add titles, descriptions & CTAs</li>
                    <li>Link to products or categories</li>
                    <li>Use 1920x600px images</li>
                  </ul>
                  <div className="absolute -top-2 right-2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">Customize your store's hero section</p>
          </Link>

          <Link
            href="/vendor/theme"
            className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow group relative ${
              vendor?.status !== 'active' ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🎨</span>
                <h3 className="text-lg font-medium text-gray-900">Theme Builder</h3>
              </div>
              <div className="relative">
                <HelpCircle className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <div className="absolute right-0 top-8 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
                  <p className="font-semibold mb-1">Customize your brand:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>Set colors & fonts</li>
                    <li>Upload logo & branding</li>
                    <li>Configure layout preferences</li>
                    <li>Live preview changes</li>
                  </ul>
                  <div className="absolute -top-2 right-2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">Customize your store's appearance</p>
          </Link>

          <Link
            href="/vendor/pages"
            className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow group relative ${
              vendor?.status !== 'active' ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📄</span>
                <h3 className="text-lg font-medium text-gray-900">Custom Pages</h3>
              </div>
              <div className="relative">
                <HelpCircle className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <div className="absolute right-0 top-8 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
                  <p className="font-semibold mb-1">Build content pages:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>Rich text WYSIWYG editor</li>
                    <li>About, Contact, FAQ templates</li>
                    <li>SEO-friendly meta settings</li>
                    <li>Add to navigation menus</li>
                  </ul>
                  <div className="absolute -top-2 right-2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">Create About, Contact, and custom pages</p>
          </Link>

          <Link
            href="/vendor/orders"
            className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow group relative ${
              vendor?.status !== 'active' ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📋</span>
                <h3 className="text-lg font-medium text-gray-900">Orders Received</h3>
              </div>
              <div className="relative">
                <HelpCircle className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <div className="absolute right-0 top-8 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
                  <p className="font-semibold mb-1">Manage orders:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>View all customer orders</li>
                    <li>Update order status</li>
                    <li>Process refunds & returns</li>
                    <li>Export order data</li>
                  </ul>
                  <div className="absolute -top-2 right-2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">View and manage customer orders</p>
          </Link>

          <Link
            href="/vendor/policies"
            className={`bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow group relative ${
              vendor?.status !== 'active' ? 'opacity-50 pointer-events-none' : ''
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📋</span>
                <h3 className="text-lg font-medium text-gray-900">Policies</h3>
              </div>
              <div className="relative">
                <HelpCircle className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <div className="absolute right-0 top-8 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
                  <p className="font-semibold mb-1">Set store rules:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>Return & refund policies</li>
                    <li>Cancellation timeframes</li>
                    <li>Shipping policies</li>
                    <li>Show on product pages</li>
                  </ul>
                  <div className="absolute -top-2 right-2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600">Configure return & cancellation policies</p>
          </Link>

          <Link
            href="/vendor/settings"
            className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow group relative"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚙️</span>
                <h3 className="text-lg font-medium text-gray-900">Settings</h3>
              </div>
              <div className="relative">
                <HelpCircle className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <div className="absolute right-0 top-8 w-72 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 shadow-xl">
                  <p className="font-semibold mb-1">Configure store:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>Business information</li>
                    <li>Payment gateway setup</li>
                    <li>Shipping zones & charges</li>
                    <li>Email notifications</li>
                  </ul>
                  <div className="absolute -top-2 right-2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
                </div>
              </div>
            </div>
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
        </div>
      </div>
    </div>
  );
}
