'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';
import RichTextEditor from '@/components/RichTextEditor';

export default function EditPagePage() {
  const router = useRouter();
  const params = useParams();
  const pageId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    fetchPage();
  }, [pageId]);

  const fetchPage = async () => {
    try {
      const user = localStorage.getItem('user');
      if (!user) return;

      const userData = JSON.parse(user);
      const vendorId = userData.vendor?.id;
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}/pages/${pageId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFormData({
          title: data.title,
          slug: data.slug,
          pageType: data.pageType,
          content: data.content,
          excerpt: data.excerpt || '',
          metaTitle: data.metaTitle || '',
          metaDescription: data.metaDescription || '',
          metaKeywords: data.metaKeywords || '',
          status: data.status,
          showInNavigation: data.showInNavigation,
        });
      }
    } catch (error) {
      console.error('Error fetching page:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent, publish = false) => {
    e.preventDefault();
    setSaving(true);

    try {
      const user = localStorage.getItem('user');
      if (!user) return;

      const userData = JSON.parse(user);
      const vendorId = userData.vendor?.id;
      const token = localStorage.getItem('token');

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}/pages/${pageId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...formData,
            status: publish ? 'published' : formData.status,
          }),
        }
      );

      if (response.ok) {
        router.push('/vendor/pages');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update page');
      }
    } catch (error) {
      console.error('Error updating page:', error);
      alert('Failed to update page');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-foreground">Edit Page</h1>
        </div>

        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Page Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              URL Slug *
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Page Type
            </label>
            <select
              value={formData.pageType}
              onChange={(e) => setFormData({ ...formData, pageType: e.target.value })}
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

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Page Content *
            </label>
            <RichTextEditor
              content={formData.content}
              onChange={(content) => setFormData({ ...formData, content })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Excerpt
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
            />
          </div>

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
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Meta Description
                </label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Meta Keywords
                </label>
                <input
                  type="text"
                  value={formData.metaKeywords}
                  onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-background text-foreground"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-border pt-6">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.showInNavigation}
                onChange={(e) => setFormData({ ...formData, showInNavigation: e.target.checked })}
                className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm text-foreground">Show in navigation menu</span>
            </label>
          </div>

          <div className="flex items-center gap-4 border-t border-border pt-6">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              Save Changes
            </button>
            {formData.status !== 'published' && (
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                Publish Page
              </button>
            )}
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
