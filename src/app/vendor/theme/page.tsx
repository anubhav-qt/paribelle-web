'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import UnifiedHeader from '@/components/UnifiedHeader';
import ThemeBuilder from '@/components/ThemeBuilder';

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
};

export default function VendorThemePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(defaultTheme);

  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        router.push('/login');
        return;
      }

      // Get vendor ID from localStorage user data
      const userData = JSON.parse(userStr);
      const vId = userData.vendorId || userData.vendor?.id;
      
      if (!vId) {
        alert('You must be a vendor to access this page');
        router.push('/vendor/register');
        return;
      }

      setVendorId(vId);

      // Fetch theme config
      const themeResponse = await fetch(
        `${BACKEND_URL}/api/v1/vendors/${vId}/theme`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (themeResponse.ok) {
        const data = await themeResponse.json();
        if (data.themeConfig) {
          setThemeConfig({ ...defaultTheme, ...data.themeConfig });
        }
      }
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      alert('Failed to load theme settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (theme: ThemeConfig) => {
    if (!vendorId) return;

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${BACKEND_URL}/api/v1/vendors/${vendorId}/theme`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ themeConfig: theme }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save theme');
      }

      alert('Theme saved successfully!');
      setThemeConfig(theme);
    } catch (error) {
      console.error('Error saving theme:', error);
      alert('Failed to save theme');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading theme settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <UnifiedHeader showLocationFilter={false} />
      <ThemeBuilder
        initialTheme={themeConfig}
        onSave={handleSave}
        saving={saving}
        title="Theme Builder"
        subtitle="Customize your store's appearance"
        backLink="/vendor/dashboard"
        backLinkText="Back to Dashboard"
        isAdmin={false}
      />
    </>
  );
}
