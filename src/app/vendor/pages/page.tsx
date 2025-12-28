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
  const [showHelp, setShowHelp] = useState(false);

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

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg mb-6">
          <button
            onClick={() => setShowHelp(!showHelp)}
            type="button"
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Beginner's Guide</h3>
                <p className="text-sm text-gray-600">Learn how to create and manage custom pages for your store</p>
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
              {/* What are Custom Pages */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📄</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">What are Custom Pages?</h4>
                    <p className="text-gray-700 mb-3">
                      Custom pages are additional pages on your store beyond product listings. They provide essential information 
                      about your business, policies, and how to contact you. Every professional store needs these pages!
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm font-medium text-blue-800 mb-2">📝 Essential Pages Every Store Should Have:</p>
                      <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                        <li><strong>About Us:</strong> Your story, mission, and what makes you unique</li>
                        <li><strong>Contact:</strong> How customers can reach you (form, email, phone, address)</li>
                        <li><strong>FAQ:</strong> Answers to common customer questions</li>
                        <li><strong>Shipping & Delivery:</strong> Shipping methods, costs, and delivery times</li>
                        <li><strong>Terms & Conditions:</strong> Legal terms for using your store</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Creating Pages */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">✏️</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Creating a Custom Page</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                        <p className="text-gray-700">Click <strong>"+ New Page"</strong> button in the top right</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                        <p className="text-gray-700">Enter a descriptive <strong>Title</strong> (e.g., "About Our Store", "Contact Us")</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                        <p className="text-gray-700">Choose <strong>Page Type</strong> - Standard (any content), Contact (with form), FAQ (Q&A format)</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                        <p className="text-gray-700">Write your content using the <strong>rich text editor</strong> - format text, add images, create lists</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">5</span>
                        <p className="text-gray-700">Set <strong>Status:</strong> Draft (work in progress), Published (visible to customers), Archived (hidden)</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">6</span>
                        <p className="text-gray-700">Check <strong>"Show in Navigation"</strong> to add page to your store's menu</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">7</span>
                        <p className="text-gray-700">Click <strong>"Save Page"</strong> to publish</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Managing Pages */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">⚙️</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Managing Your Pages</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-700 mb-2">📊 View/Edit</p>
                        <p className="text-sm text-gray-600">Click the Edit icon to modify page content, title, or settings anytime.</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-700 mb-2">🔄 Reorder</p>
                        <p className="text-sm text-gray-600">Use Order column to control how pages appear in navigation menu (1, 2, 3...).</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-700 mb-2">👁️ Toggle Visibility</p>
                        <p className="text-sm text-gray-600">Click eye icon to publish/unpublish pages. Draft pages aren't visible to customers.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Page Types */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📑</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Understanding Page Types</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="font-medium text-blue-700 mb-2">📄 Standard Page</p>
                        <p className="text-sm text-blue-600">General-purpose page. Use for About Us, Shipping Info, etc. Full control over content with rich text editor.</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded border border-green-200">
                        <p className="font-medium text-green-700 mb-2">✉️ Contact Page</p>
                        <p className="text-sm text-green-600">Includes a contact form with Name, Email, Message fields. Customers can send you messages directly.</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded border border-purple-200">
                        <p className="font-medium text-purple-700 mb-2">❓ FAQ Page</p>
                        <p className="text-sm text-purple-600">Question-and-Answer format with collapsible sections. Perfect for addressing common customer queries.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Common Mistakes */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-5 border border-red-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>⚠️</span> Common Mistakes to Avoid
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Missing essential pages:</strong> No Contact or About page makes you look unprofessional</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Outdated info:</strong> Old phone numbers or addresses hurt credibility</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Too much text:</strong> Break content with headings, bullets, and images</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Hidden in navigation:</strong> Important pages should be easy to find</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Generic content:</strong> Copy-pasted text doesn't build trust - be authentic!</span>
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-5 border border-purple-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>💡</span> Quick Tips
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Create About, Contact, and FAQ first</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Use clear, friendly language</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Add images to make pages engaging</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Keep contact info up-to-date</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Preview before publishing</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Update pages as business evolves</span>
                  </div>
                </div>
              </div>
            </div>
          )}
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
