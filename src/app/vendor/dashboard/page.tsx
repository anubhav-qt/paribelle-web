'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
      console.log('User data:', user);
      
      // Check if user is a vendor admin
      if (user.role !== 'vendor_admin') {
        setError('This account is not a vendor account. Please use a vendor login.');
        setIsLoading(false);
        return;
      }
      
      // Fetch vendor data using the vendorId from the user object
      if (!user.vendorId) {
        setError('No vendor account found for this user. Please contact support.');
        setIsLoading(false);
        return;
      }

      console.log('Fetching vendor:', user.vendorId);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${user.vendorId}`, {
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
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Vendor Dashboard</h1>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Orders</h3>
            <p className="text-sm text-gray-600">View and manage orders</p>
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
