'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import ThemeBuilder from '@/components/ThemeBuilder';
import ThemeRenderer from '@/components/ThemeRenderer';
import ThemeTemplateSelector from '@/components/ThemeTemplateSelector';
import CategoryNav from '@/components/CategoryNav';
import { ThemeConfig } from '@/types/common';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const defaultTheme: ThemeConfig = {
  templateId: 'modern-minimal',
  primaryColor: '#FF9900', // Amazon orange
  secondaryColor: '#232F3E', // Amazon dark blue
  accentColor: '#FF9900', // Amazon orange
  backgroundColor: '#FFFFFF',
  textColor: '#0F1111', // Amazon text color
  fontFamily: 'Amazon Ember, Arial, sans-serif',
  headingFont: 'Amazon Ember, Arial, sans-serif',
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
};

export default function AdminDefaultThemePage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAdminAuth();
  const [saving, setSaving] = useState(false);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(defaultTheme);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDefaultTheme();
    }
  }, [isAuthenticated]);

  const fetchDefaultTheme = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/v1/settings/default-theme`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.value) {
          const savedTheme =
            typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
          setThemeConfig({ ...defaultTheme, ...savedTheme });
        }
      }
    } catch (error) {
      console.error('Error fetching default theme:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (theme: ThemeConfig) => {
    setSaving(true);
    const normalizedTheme = {
      ...theme,
      templateId: theme.templateId || themeConfig.templateId || 'modern-minimal',
    };
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/v1/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          key: 'default-theme',
          value: JSON.stringify(normalizedTheme),
          type: 'json',
        }),
      });

      if (response.ok) {
        setThemeConfig(normalizedTheme);
        alert('Theme saved successfully! Navigate to the homepage to see the changes.');
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Save failed:', response.status, errorData);
        throw new Error(errorData.message || `Failed to save theme: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving theme:', error);
      alert(`Failed to save default theme: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
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

  return (
    <>
      <ThemeRenderer component="header" />
      <ThemeRenderer component="nav" fallback={<CategoryNav mode="navigation" />} />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <a href="/admin" className="text-blue-600 hover:text-blue-800 mb-2 inline-block">
              ← Back to Dashboard
            </a>
            <h1 className="text-3xl font-bold text-gray-900">Default Marketplace Theme</h1>
            <p className="text-gray-600 mt-2">Choose a theme template for your marketplace</p>
          </div>

          {/* Theme Template Selector */}
          <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <ThemeTemplateSelector
              currentThemeId={themeConfig.templateId}
              onThemeSelect={async (templateId) => {
                const updatedTheme = { ...themeConfig, templateId };
                setThemeConfig(updatedTheme);
                await handleSave(updatedTheme);
              }}
            />
          </div>

          {/* Divider */}
          <div className="my-8 border-t border-gray-300"></div>

          {/* Advanced Customization */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">Advanced Customization</h3>
              <p className="text-sm text-gray-600 mt-1">Fine-tune colors, fonts, and styling</p>
            </div>
            
            <ThemeBuilder
              initialTheme={themeConfig}
              onSave={handleSave}
              saving={saving}
              title=""
              subtitle=""
              backLink="/admin"
              backLinkText="Back to Dashboard"
              isAdmin={true}
            />
          </div>
        </div>
      </div>
    </>
  );
}
