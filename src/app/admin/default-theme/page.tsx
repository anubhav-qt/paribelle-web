'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import ThemeBuilder from '@/components/ThemeBuilder';
import UnifiedHeader from '@/components/UnifiedHeader';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  headingFont: string;
  layout?: 'modern' | 'classic' | 'minimal' | 'bold';
  customCss?: string;
  showLogo?: boolean;
  showSearchBar?: boolean;
  footerText?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    linkedin?: string;
  };
}

const defaultTheme: ThemeConfig = {
  primaryColor: '#3B82F6', // Matches Tailwind primary hsl(221.2 83.2% 53.3%)
  secondaryColor: '#F1F5F9', // Matches Tailwind secondary hsl(210 40% 96.1%)
  accentColor: '#F1F5F9', // Matches Tailwind accent hsl(210 40% 96.1%)
  backgroundColor: '#FFFFFF', // Matches Tailwind background hsl(0 0% 100%)
  textColor: '#0F172A', // Matches Tailwind foreground hsl(222.2 84% 4.9%)
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
          const savedTheme = JSON.parse(data.value);
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
          value: JSON.stringify(theme),
          type: 'json',
        }),
      });

      if (response.ok) {
        setThemeConfig(theme);
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
      <UnifiedHeader />
      <ThemeBuilder
      initialTheme={themeConfig}
      onSave={handleSave}
      saving={saving}
      title="Edit Default Theme"
      subtitle="Customize the main marketplace theme"
      backLink="/admin"
      backLinkText="Back to Dashboard"
      isAdmin={true}
    />
    </>
  );
}
