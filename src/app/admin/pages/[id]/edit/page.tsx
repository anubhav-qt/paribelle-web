'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Layout } from 'lucide-react';
import PageBuilder from '@/components/PageBuilder';
import SectionLibrary from '@/components/SectionLibrary';
import { PageSection } from '@/lib/pageSections';
import { Loader } from '@/components/ui/Loader';
import { showAlert } from '@/lib/dialog';

export default function EditMarketplacePage() {
  const router = useRouter();
  const params = useParams();
  const pageId = params.id as string;
  
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showSectionLibrary, setShowSectionLibrary] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    pageType: 'custom',
    sections: [] as PageSection[],
    excerpt: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
    status: 'draft',
    showInNavigation: true,
  });

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const token = localStorage.getItem('token');
        const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/marketplace/pages/${pageId}`;

        const response = await fetch(apiUrl, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const page = await response.json();
          
          // Parse sections from content
          let sections: PageSection[] = [];
          try {
            const parsed = JSON.parse(page.content);
            if (Array.isArray(parsed)) {
              sections = parsed;
            }
          } catch {
            sections = [];
          }

          setFormData({
            title: page.title || '',
            slug: page.slug || '',
            pageType: page.pageType || 'custom',
            sections: sections,
            excerpt: page.excerpt || '',
            metaTitle: page.metaTitle || '',
            metaDescription: page.metaDescription || '',
            metaKeywords: page.metaKeywords || '',
            status: page.status || 'draft',
            showInNavigation: page.showInNavigation ?? true,
          });
        } else {
          showAlert('Failed to load page', 'error');
          router.push('/admin/pages');
        }
      } catch (error) {
        console.error('Error loading page:', error);
        showAlert('Failed to load page', 'error');
        router.push('/admin/pages');
      } finally {
        setPageLoading(false);
      }
    };

    if (pageId) {
      fetchPage();
    }
  }, [pageId, router]);

  const handleTitleChange = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormData({ ...formData, title, slug });
  };

  const handleAddSection = (section: PageSection) => {
    setFormData({
      ...formData,
      sections: [...formData.sections, { ...section, order: formData.sections.length }],
    });
  };

  const handleSubmit = async (e: React.FormEvent, publish = false) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      // Convert sections to JSON for storage
      const finalContent = JSON.stringify(formData.sections);

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/marketplace/pages/${pageId}`;

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug,
          pageType: formData.pageType,
          content: finalContent,
          excerpt: formData.excerpt,
          metaTitle: formData.metaTitle,
          metaDescription: formData.metaDescription,
          metaKeywords: formData.metaKeywords,
          showInNavigation: formData.showInNavigation,
          status: publish ? 'published' : formData.status,
        }),
      });

      if (response.ok) {
        router.push('/admin/pages');
      } else {
        const error = await response.json();
        showAlert(error.message || 'Failed to update page', 'error');
      }
    } catch (error) {
      console.error('Error updating page:', error);
      showAlert('Failed to update page', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <Loader size="md" className="mx-auto mb-4" />
            <p className="text-muted-foreground">Loading page...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        {showSectionLibrary && (
          <SectionLibrary
            onSelectSection={handleAddSection}
            onClose={() => setShowSectionLibrary(false)}
          />
        )}

        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link
                href="/admin/pages"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Pages
              </Link>
            </div>
            
            <h1 className="text-3xl font-bold text-foreground mb-2">Edit Page</h1>
            <p className="text-muted-foreground text-sm">
              Modify your page using the visual builder
            </p>
          </div>

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg border border-border p-6 space-y-4">
              <h2 className="text-xl font-semibold">Page Information</h2>
              
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  URL Slug *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">/</span>
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
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg border border-border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Page Content</h2>
                <button
                  type="button"
                  onClick={() => setShowSectionLibrary(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Layout className="w-4 h-4" />
                  Add Section
                </button>
              </div>
              
              <PageBuilder
                sections={formData.sections}
                onChange={(sections) => setFormData({ ...formData, sections })}
                onAddSection={() => setShowSectionLibrary(true)}
              />
            </div>

            {/* SEO */}
            <div className="bg-white rounded-lg border border-border p-6 space-y-4">
              <h2 className="text-xl font-semibold">SEO & Settings</h2>

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
            <div className="sticky bottom-0 bg-background border-t-2 border-border shadow-lg z-10 flex items-center gap-4 py-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Publishing...' : 'Update & Publish'}
              </button>
              <Link
                href="/admin/pages"
                className="px-6 py-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
