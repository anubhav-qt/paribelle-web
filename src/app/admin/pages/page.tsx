'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import UnifiedHeader from '@/components/UnifiedHeader';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';

interface MarketplacePage {
  id: string;
  title: string;
  slug: string;
  pageType: string;
  status: 'draft' | 'published' | 'archived';
  showInNavigation: boolean;
  updatedAt: string;
}

export default function AdminPagesPage() {
  const router = useRouter();
  const [pages, setPages] = useState<MarketplacePage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/marketplace/pages?includeUnpublished=true`;
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPages(data);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const deletePage = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/marketplace/pages/${pageId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        fetchPages();
      } else {
        alert('Failed to delete page');
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('Failed to delete page');
    }
  };

  const toggleStatus = async (pageId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published';
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/marketplace/pages/${pageId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        fetchPages();
      }
    } catch (error) {
      console.error('Error updating page status:', error);
    }
  };

  if (loading) {
    return (
      <>
        <UnifiedHeader />
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading pages...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <UnifiedHeader />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Marketplace Pages</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Create custom pages for your marketplace
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                >
                  ← Dashboard
                </Link>
                <Link
                  href="/admin/pages/new"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  New Page
                </Link>
              </div>
            </div>
          </div>

          {pages.length === 0 ? (
            <div className="bg-white rounded-lg border border-border p-12 text-center">
              <div className="max-w-md mx-auto">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No pages yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Create custom pages like About Us, Privacy Policy, Terms & Conditions, and more.
                </p>
                <Link
                  href="/admin/pages/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Page
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-foreground">
                      Page Title
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-foreground">
                      Type
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-foreground">
                      Status
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-foreground">
                      In Navigation
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-foreground">
                      Last Updated
                    </th>
                    <th className="text-right px-6 py-3 text-sm font-semibold text-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pages.map((page) => (
                    <tr key={page.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-foreground">{page.title}</div>
                          <div className="text-sm text-muted-foreground">/{page.slug}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-muted-foreground capitalize">
                          {page.pageType}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            page.status === 'published'
                              ? 'bg-green-100 text-green-800'
                              : page.status === 'draft'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {page.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {page.showInNavigation ? (
                          <Eye className="w-4 h-4 text-green-600" />
                        ) : (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(page.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => toggleStatus(page.id, page.status)}
                            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                            title={page.status === 'published' ? 'Unpublish' : 'Publish'}
                          >
                            {page.status === 'published' ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <Link
                            href={`/admin/pages/${page.id}/edit`}
                            className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => deletePage(page.id)}
                            className="p-2 text-destructive hover:text-destructive/80 transition-colors"
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
    </>
  );
}
