'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Layout, FileText } from 'lucide-react';
import UnifiedHeader from '@/components/UnifiedHeader';
import PageBuilder from '@/components/PageBuilder';
import SectionLibrary from '@/components/SectionLibrary';
import { PageSection } from '@/lib/pageSections';
import { pageTemplates } from '@/lib/pageTemplates';

export default function NewMarketplacePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showSectionLibrary, setShowSectionLibrary] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  
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

  const handleTitleChange = (title: string) => {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormData({ ...formData, title, slug });
  };

  const handleTemplateSelect = (templateKey: string) => {
    if (templateKey === '') {
      setSelectedTemplate('');
      return;
    }

    const template = pageTemplates[templateKey];
    if (template) {
      setFormData({
        ...formData,
        title: template.title,
        slug: template.slug,
        sections: template.sections,
        excerpt: template.excerpt || '',
        metaTitle: template.metaTitle || '',
        metaDescription: template.metaDescription || '',
        showInNavigation: template.showInNavigation !== undefined ? template.showInNavigation : true,
      });
      setSelectedTemplate(templateKey);
    }
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
      if (!token) {
        alert('Please login again.');
        setLoading(false);
        return;
      }

      // Convert sections to JSON for storage
      const finalContent = JSON.stringify(formData.sections);

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/marketplace/pages`;

      const response = await fetch(apiUrl, {
        method: 'POST',
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
          status: publish ? 'published' : 'draft',
        }),
      });

      if (response.ok) {
        router.push('/admin/pages');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create page');
      }
    } catch (error) {
      console.error('Error creating page:', error);
      alert('Failed to create page');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <UnifiedHeader />
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
            
            <h1 className="text-3xl font-bold text-foreground mb-2">Create Marketplace Page</h1>
            <p className="text-muted-foreground text-sm">
              Build your page visually with drag-and-drop sections
            </p>
          </div>

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            {/* Template Selector */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-blue-900">Start with a Template</h2>
              </div>
              <p className="text-sm text-blue-700 mb-4">
                Choose a pre-built template to get started quickly, or create a blank page
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleTemplateSelect('')}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    selectedTemplate === ''
                      ? 'border-blue-500 bg-white shadow-md'
                      : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow'
                  }`}
                >
                  <div className="font-semibold text-gray-900 mb-1">Blank Page</div>
                  <div className="text-xs text-gray-600">Start from scratch</div>
                </button>

                {Object.entries(pageTemplates).map(([key, template]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleTemplateSelect(key)}
                    className={`text-left p-4 rounded-lg border-2 transition-all ${
                      selectedTemplate === key
                        ? 'border-blue-500 bg-white shadow-md'
                        : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{template.icon}</span>
                      <div className="font-semibold text-gray-900">{template.title}</div>
                    </div>
                    <div className="text-xs text-gray-600">{template.description}</div>
                  </button>
                ))}
              </div>
            </div>

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
                <p className="text-xs text-muted-foreground mt-1">
                  Auto-generated from title. Use lowercase and hyphens only.
                </p>
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
                {loading ? 'Saving...' : 'Save Draft'}
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Publishing...' : 'Save & Publish'}
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
