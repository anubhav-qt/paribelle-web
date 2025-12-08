'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';

export default function NewPagePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    pageType: 'custom',
    content: '',
    excerpt: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    status: 'draft',
    showInNavigation: true,
  });

  const handleTitleChange = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormData({ ...formData, title, slug });
  };

  const handleSubmit = async (e: React.FormEvent, publish = false) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = localStorage.getItem('user');
      console.log('🔵 User from localStorage:', user);
      
      if (!user) {
        alert('User not found. Please login again.');
        setLoading(false);
        return;
      }

      const userData = JSON.parse(user);
      console.log('🔵 Parsed user data:', userData);
      
      const vendorId = userData.vendorId || userData.vendor?.id;
      console.log('🔵 Vendor ID:', vendorId);
      
      if (!vendorId) {
        alert('Vendor ID not found. Please ensure you are logged in as a vendor.');
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      console.log('🔵 Token exists:', !!token);

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}/pages`;
      console.log('🔵 POST to:', apiUrl);
      console.log('🔵 Body:', { ...formData, status: publish ? 'published' : 'draft' });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          status: publish ? 'published' : 'draft',
        }),
      });

      console.log('🔵 Response status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('🔵 Success:', result);
        router.push('/vendor/pages');
      } else {
        const error = await response.json();
        console.log('❌ Error response:', error);
        alert(error.message || 'Failed to create page');
      }
    } catch (error) {
      console.error('❌ Error creating page:', error);
      alert('Failed to create page');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link
            href="/vendor/pages"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pages
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Create New Page</h1>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Page Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              placeholder="About Us"
              required
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              URL Slug *
            </label>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">/vendor/your-store/</span>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) =>
                  setFormData({ ...formData, slug: e.target.value })
                }
                className="flex-1 px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                placeholder="about-us"
                required
              />
            </div>
          </div>

          {/* Page Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Page Type
            </label>
            <select
              value={formData.pageType}
              onChange={(e) =>
                setFormData({ ...formData, pageType: e.target.value })
              }
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            >
              <option value="custom">Custom</option>
              <option value="about">About</option>
              <option value="contact">Contact</option>
              <option value="faq">FAQ</option>
              <option value="terms">Terms & Conditions</option>
              <option value="privacy">Privacy Policy</option>
            </select>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Page Content *
            </label>
            <RichTextEditor
              content={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
              placeholder="Start writing your page content..."
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Excerpt
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) =>
                setFormData({ ...formData, excerpt: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              placeholder="Short description for previews and SEO"
            />
          </div>

          {/* SEO Section */}
          <div className="border-t border-border pt-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">SEO Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Meta Title
                </label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, metaTitle: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  placeholder="Leave empty to use page title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Meta Description
                </label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) =>
                    setFormData({ ...formData, metaDescription: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  placeholder="Description for search engines"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Meta Keywords
                </label>
                <input
                  type="text"
                  value={formData.metaKeywords}
                  onChange={(e) =>
                    setFormData({ ...formData, metaKeywords: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="border-t border-border pt-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Display Options</h2>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.showInNavigation}
                onChange={(e) =>
                  setFormData({ ...formData, showInNavigation: e.target.checked })
                }
                className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm text-foreground">
                Show in navigation menu
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 border-t border-border pt-6">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              Save as Draft
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Publish Page
            </button>
            <Link
              href="/vendor/pages"
              className="px-6 py-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
