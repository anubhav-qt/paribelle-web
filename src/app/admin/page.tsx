'use client';

import Link from 'next/link';
import { Settings, Package, ShoppingBag, Users, BarChart3, Filter, ClipboardList, Palette, FileText, LayoutList, Shield } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import UnifiedHeader from '@/components/UnifiedHeader';

export default function AdminDashboard() {
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <UnifiedHeader />
      <AdminDashboardContent />
    </>
  );
}

function AdminDashboardContent() {
  const adminCards = [
    {
      title: 'Platform KYC',
      description: 'Complete platform KYC for GST filing',
      icon: Shield,
      href: '/admin/platform-kyc',
      color: 'bg-red-500',
    },
    {
      title: 'Vendor KYC Verification',
      description: 'Review and approve vendor KYC documents',
      icon: Users,
      href: '/admin/kyc-verification',
      color: 'bg-amber-500',
    },
    {
      title: 'Settings',
      description: 'Configure site-wide settings and features',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-gray-500',
    },
    {
      title: 'Categories',
      description: 'Manage categories and configure filters',
      icon: Package,
      href: '/admin/categories',
      color: 'bg-blue-500',
    },
    {
      title: 'Custom Pages',
      description: 'Create and manage marketplace pages',
      icon: FileText,
      href: '/admin/pages',
      color: 'bg-cyan-500',
    },
    {
      title: 'Footer Settings',
      description: 'Customize footer content and links',
      icon: LayoutList,
      href: '/admin/footer-settings',
      color: 'bg-slate-500',
    },
    {
      title: 'Common Filters',
      description: 'Manage reusable filter templates',
      icon: Filter,
      href: '/admin/common-filters',
      color: 'bg-indigo-500',
    },
    {
      title: 'Products',
      description: 'View and manage all products',
      icon: ShoppingBag,
      href: '/admin/products',
      color: 'bg-green-500',
    },
    {
      title: 'Orders',
      description: 'View and manage all orders',
      icon: ClipboardList,
      href: '/admin/orders',
      color: 'bg-teal-500',
    },
    {
      title: 'Vendors',
      description: 'Manage vendor accounts',
      icon: Users,
      href: '/admin/vendors',
      color: 'bg-purple-500',
    },
    {
      title: 'Themes',
      description: 'View and manage vendor store themes',
      icon: Palette,
      href: '/admin/themes',
      color: 'bg-pink-500',
    },
    {
      title: 'Analytics',
      description: 'View sales and performance metrics',
      icon: BarChart3,
      href: '/admin/analytics',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage your marketplace</p>
            </div>
            <Link
              href="/"
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Back to Store
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {adminCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-200"
              >
                <div className={`${card.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {card.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {card.description}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">~110</div>
              <div className="text-sm text-gray-600 mt-1">Total Products</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">17</div>
              <div className="text-sm text-gray-600 mt-1">Categories</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">1</div>
              <div className="text-sm text-gray-600 mt-1">Active Vendors</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-3xl font-bold text-orange-600">0</div>
              <div className="text-sm text-gray-600 mt-1">Orders Today</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
