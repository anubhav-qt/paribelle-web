'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Palette, Eye, Edit } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import ThemeRenderer from '@/components/ThemeRenderer';
import { Vendor } from '@/types/product';
import { ThemeConfig } from '@/types/common';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function AdminThemesPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAdminAuth();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultTheme, setDefaultTheme] = useState<ThemeConfig>({
    primaryColor: '#3B82F6', // Matches Tailwind primary
    secondaryColor: '#F1F5F9', // Matches Tailwind secondary
    accentColor: '#F1F5F9', // Matches Tailwind accent
    backgroundColor: '#FFFFFF',
    textColor: '#0F172A', // Matches Tailwind foreground
    fontFamily: 'Inter',
    headingFont: 'Inter',
    layout: 'modern',
    customCss: '',
    showLogo: true,
    showSearchBar: true,
    footerText: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: '',
      linkedin: '',
    },
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchVendors();
    }
  }, [isAuthenticated]);

  const fetchVendors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/v1/vendors`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const vendorsWithTheme = vendors.filter(v => v.themeConfig);
  const vendorsWithoutTheme = vendors.filter(v => !v.themeConfig);

  return (
    <>
      <ThemeRenderer component="header" />
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <Link
            href="/admin"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Store Themes</h1>
          <p className="text-gray-600 mt-1">View and manage vendor store themes</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Default Theme Section */}
        <section className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-blue-600" />
                  Default Theme
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  This is the default theme applied to vendors who haven't customized their store
                </p>
              </div>
              <Link
                href="/admin/default-theme"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Default Theme
              </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Primary Color</p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border border-gray-300"
                    style={{ backgroundColor: defaultTheme.primaryColor }}
                  />
                  <span className="text-sm font-mono">{defaultTheme.primaryColor}</span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Secondary Color</p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border border-gray-300"
                    style={{ backgroundColor: defaultTheme.secondaryColor }}
                  />
                  <span className="text-sm font-mono">{defaultTheme.secondaryColor}</span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Accent Color</p>
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded border border-gray-300"
                    style={{ backgroundColor: defaultTheme.accentColor }}
                  />
                  <span className="text-sm font-mono">{defaultTheme.accentColor}</span>
                </div>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600 mb-1">Font Family</p>
                <p className="text-sm font-medium">{defaultTheme.fontFamily}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Vendors with Custom Themes */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Vendors with Custom Themes ({vendorsWithTheme.length})
          </h2>
          {vendorsWithTheme.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vendorsWithTheme.map((vendor) => (
                <div
                  key={vendor.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{vendor.businessName}</h3>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: vendor.themeConfig?.primaryColor }}
                      />
                      <span className="text-xs text-gray-600">Primary</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: vendor.themeConfig?.secondaryColor }}
                      />
                      <span className="text-xs text-gray-600">Secondary</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border border-gray-300"
                        style={{ backgroundColor: vendor.themeConfig?.accentColor }}
                      />
                      <span className="text-xs text-gray-600">Accent</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`http://${vendor.slug}.localhost:3000`}
                      target="_blank"
                      className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      Preview
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <Palette className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No vendors have customized themes yet</p>
            </div>
          )}
        </section>

        {/* Vendors without Custom Themes */}
        {vendorsWithoutTheme.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Vendors Using Default Theme ({vendorsWithoutTheme.length})
            </h2>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {vendorsWithoutTheme.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
                  >
                    <span className="text-sm font-medium text-gray-900">{vendor.businessName}</span>
                    <Link
                      href={`http://${vendor.slug}.localhost:3000`}
                      target="_blank"
                      className="text-blue-600 hover:text-blue-700 text-xs"
                    >
                      Visit Store
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
    </>
  );
}
