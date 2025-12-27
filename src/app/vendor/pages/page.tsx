'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import UnifiedHeader from '@/components/UnifiedHeader';
import { Plus, Edit, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react';

interface VendorPage {
  id: string;
  title: string;
  slug: string;
  pageType: string;
  status: 'draft' | 'published' | 'archived';
  showInNavigation: boolean;
  isHomePage: boolean;
  order: number;
  updatedAt: string;
}

export default function VendorPagesPage() {
  console.log('🔵 VendorPagesPage component loaded');
  const router = useRouter();
  const [pages, setPages] = useState<VendorPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [vendorId, setVendorId] = useState<string>('');

  useEffect(() => {
    console.log('🔵 useEffect running');
    const user = localStorage.getItem('user');
    console.log('🔵 User from localStorage:', user);
    if (user) {
      const userData = JSON.parse(user);
      console.log('🔵 Parsed user data:', userData);
      const vId = userData.vendorId || userData.vendor?.id;
      console.log('🔵 Vendor ID:', vId);
      if (vId) {
        setVendorId(vId);
        fetchPages(vId);
      } else {
        console.log('❌ No vendor ID found in user data');
        setLoading(false);
      }
    } else {
      console.log('❌ No user found in localStorage');
      setLoading(false);
    }
  }, []);

  const fetchPages = async (vId: string) => {
    console.log('🔵 fetchPages called with vendorId:', vId);
    try {
      const token = localStorage.getItem('token');
      console.log('🔵 Token exists:', !!token);
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vId}/pages?includeUnpublished=true`;
      console.log('🔵 Fetching from:', apiUrl);
      const response = await fetch(
        apiUrl,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('🔵 Response status:', response.status);
      console.log('🔵 Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log('🔵 Pages data received:', data);
        console.log('🔵 Number of pages:', data.length);
        setPages(data);
      } else {
        console.log('❌ Response not ok:', await response.text());
      }
    } catch (error) {
      console.error('❌ Error fetching pages:', error);
    } finally {
      console.log('🔵 Setting loading to false');
      setLoading(false);
    }
  };

  const deletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}/pages/${pageId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        setPages(pages.filter((p) => p.id !== pageId));
      }
    } catch (error) {
      console.error('Error deleting page:', error);
    }
  };

  const togglePublish = async (pageId: string, currentStatus: string) => {
    const endpoint = currentStatus === 'published' ? 'unpublish' : 'publish';

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}/pages/${pageId}/${endpoint}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const updated = await response.json();
        setPages(pages.map((p) => (p.id === pageId ? updated : p)));
      }
    } catch (error) {
      console.error('Error toggling publish status:', error);
    }
  };

  console.log('🔵 Render - loading:', loading);
  console.log('🔵 Render - pages count:', pages.length);
  console.log('🔵 Render - vendorId:', vendorId);

  if (loading) {
    console.log('🔵 Showing loading spinner');
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  console.log('🔵 Rendering main content');
  return (
    <div className="min-h-screen bg-background">
      <UnifiedHeader showLocationFilter={false} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Link
              href="/vendor/dashboard"
              className="text-blue-600 hover:text-blue-800 text-sm inline-block mb-2"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Custom Pages</h1>
            <p className="text-muted-foreground mt-2">
              Manage your store's custom pages (About, Contact, etc.)
            </p>
          </div>
          <Link
            href="/vendor/pages/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Page
          </Link>
        </div>

        {pages.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No pages yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Create your first custom page to get started
            </p>
            <Link
              href="/vendor/pages/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Page
            </Link>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pages.map((page) => (
                  <tr key={page.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {page.title}
                        </span>
                        {page.isHomePage && (
                          <span className="text-xs text-primary">Homepage</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      /{page.slug}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground capitalize">
                        {page.pageType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          page.status === 'published'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : page.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}
                      >
                        {page.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => togglePublish(page.id, page.status)}
                          className="p-2 hover:bg-muted rounded transition-colors"
                          title={
                            page.status === 'published' ? 'Unpublish' : 'Publish'
                          }
                        >
                          {page.status === 'published' ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                        <Link
                          href={`/vendor/pages/${page.id}/edit`}
                          className="p-2 hover:bg-muted rounded transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => deletePage(page.id)}
                          className="p-2 hover:bg-destructive/10 text-destructive rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
