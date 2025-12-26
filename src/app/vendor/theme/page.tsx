'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  headingFont?: string;
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

const fontOptions = [
  { value: 'Inter', label: 'Inter (Default)' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Raleway', label: 'Raleway' },
  { value: 'Playfair Display', label: 'Playfair Display' },
];

const layoutOptions = [
  { value: 'modern', label: 'Modern', description: 'Clean and contemporary design' },
  { value: 'classic', label: 'Classic', description: 'Traditional and elegant' },
  { value: 'minimal', label: 'Minimal', description: 'Simple and focused' },
  { value: 'bold', label: 'Bold', description: 'Eye-catching and dynamic' },
];

export default function ThemeBuilderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'layout' | 'social' | 'advanced'>('colors');
  
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>({
    primaryColor: '#3B82F6',
    secondaryColor: '#10B981',
    accentColor: '#F59E0B',
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
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
  });

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
          setThemeConfig({ ...themeConfig, ...data.themeConfig });
        }
      }
    } catch (error) {
      console.error('Error fetching vendor data:', error);
      alert('Failed to load theme settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
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
          body: JSON.stringify({ themeConfig }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save theme');
      }

      alert('Theme saved successfully!');
    } catch (error) {
      console.error('Error saving theme:', error);
      alert('Failed to save theme');
    } finally {
      setSaving(false);
    }
  };

  const updateTheme = (key: keyof ThemeConfig, value: any) => {
    setThemeConfig((prev) => ({ ...prev, [key]: value }));
  };

  const updateSocialLink = (platform: string, value: string) => {
    setThemeConfig((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value },
    }));
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/vendor/dashboard"
            className="text-blue-600 hover:text-blue-800 text-sm inline-block mb-2"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Theme Builder</h1>
          <p className="text-gray-600 mt-2">Customize your store's appearance</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Settings */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  {['colors', 'typography', 'layout', 'social', 'advanced'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`px-6 py-4 text-sm font-medium border-b-2 ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6 space-y-6">
                {/* Colors Tab */}
                {activeTab === 'colors' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Color Scheme</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Color
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="color"
                          value={themeConfig.primaryColor}
                          onChange={(e) => updateTheme('primaryColor', e.target.value)}
                          className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeConfig.primaryColor}
                          onChange={(e) => updateTheme('primaryColor', e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secondary Color
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="color"
                          value={themeConfig.secondaryColor}
                          onChange={(e) => updateTheme('secondaryColor', e.target.value)}
                          className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeConfig.secondaryColor}
                          onChange={(e) => updateTheme('secondaryColor', e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Accent Color
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="color"
                          value={themeConfig.accentColor}
                          onChange={(e) => updateTheme('accentColor', e.target.value)}
                          className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeConfig.accentColor}
                          onChange={(e) => updateTheme('accentColor', e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Background Color
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="color"
                          value={themeConfig.backgroundColor}
                          onChange={(e) => updateTheme('backgroundColor', e.target.value)}
                          className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeConfig.backgroundColor}
                          onChange={(e) => updateTheme('backgroundColor', e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Text Color
                      </label>
                      <div className="flex items-center gap-4">
                        <input
                          type="color"
                          value={themeConfig.textColor}
                          onChange={(e) => updateTheme('textColor', e.target.value)}
                          className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeConfig.textColor}
                          onChange={(e) => updateTheme('textColor', e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Typography Tab */}
                {activeTab === 'typography' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Typography</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Body Font
                      </label>
                      <select
                        value={themeConfig.fontFamily}
                        onChange={(e) => updateTheme('fontFamily', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      >
                        {fontOptions.map((font) => (
                          <option key={font.value} value={font.value}>
                            {font.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Heading Font
                      </label>
                      <select
                        value={themeConfig.headingFont}
                        onChange={(e) => updateTheme('headingFont', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      >
                        {fontOptions.map((font) => (
                          <option key={font.value} value={font.value}>
                            {font.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Layout Tab */}
                {activeTab === 'layout' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Layout Style</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {layoutOptions.map((layout) => (
                        <div
                          key={layout.value}
                          onClick={() => updateTheme('layout', layout.value)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition ${
                            themeConfig.layout === layout.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <h4 className="font-semibold text-gray-900">{layout.label}</h4>
                          <p className="text-sm text-gray-600 mt-1">{layout.description}</p>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-3 pt-4 border-t">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={themeConfig.showLogo}
                          onChange={(e) => updateTheme('showLogo', e.target.checked)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">Show Logo in Header</span>
                      </label>

                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={themeConfig.showSearchBar}
                          onChange={(e) => updateTheme('showSearchBar', e.target.checked)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-sm text-gray-700">Show Search Bar</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Footer Text
                      </label>
                      <input
                        type="text"
                        value={themeConfig.footerText}
                        onChange={(e) => updateTheme('footerText', e.target.value)}
                        placeholder="© 2025 Your Store. All rights reserved."
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                )}

                {/* Social Tab */}
                {activeTab === 'social' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Social Media Links</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Facebook
                      </label>
                      <input
                        type="url"
                        value={themeConfig.socialLinks?.facebook || ''}
                        onChange={(e) => updateSocialLink('facebook', e.target.value)}
                        placeholder="https://facebook.com/yourpage"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Instagram
                      </label>
                      <input
                        type="url"
                        value={themeConfig.socialLinks?.instagram || ''}
                        onChange={(e) => updateSocialLink('instagram', e.target.value)}
                        placeholder="https://instagram.com/yourpage"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Twitter
                      </label>
                      <input
                        type="url"
                        value={themeConfig.socialLinks?.twitter || ''}
                        onChange={(e) => updateSocialLink('twitter', e.target.value)}
                        placeholder="https://twitter.com/yourpage"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        YouTube
                      </label>
                      <input
                        type="url"
                        value={themeConfig.socialLinks?.youtube || ''}
                        onChange={(e) => updateSocialLink('youtube', e.target.value)}
                        placeholder="https://youtube.com/yourchannel"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        LinkedIn
                      </label>
                      <input
                        type="url"
                        value={themeConfig.socialLinks?.linkedin || ''}
                        onChange={(e) => updateSocialLink('linkedin', e.target.value)}
                        placeholder="https://linkedin.com/company/yourcompany"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                )}

                {/* Advanced Tab */}
                {activeTab === 'advanced' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Custom CSS</h3>
                    <p className="text-sm text-gray-600">
                      Add custom CSS to further customize your store's appearance. Use with caution.
                    </p>
                    
                    <div>
                      <textarea
                        value={themeConfig.customCss}
                        onChange={(e) => updateTheme('customCss', e.target.value)}
                        placeholder=".custom-class { color: red; }"
                        rows={12}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md font-mono text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Save Button */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => router.push('/vendor/dashboard')}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Theme'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
              
              <div 
                className="border-2 border-gray-200 rounded-lg overflow-hidden"
                style={{
                  backgroundColor: themeConfig.backgroundColor,
                  color: themeConfig.textColor,
                  fontFamily: themeConfig.fontFamily,
                }}
              >
                {/* Preview Header */}
                <div 
                  className="p-4 border-b"
                  style={{ backgroundColor: themeConfig.primaryColor }}
                >
                  <div className="text-white font-semibold" style={{ fontFamily: themeConfig.headingFont }}>
                    Your Store
                  </div>
                </div>

                {/* Preview Content */}
                <div className="p-4 space-y-3">
                  <div>
                    <h4 
                      className="font-bold text-lg mb-2"
                      style={{ 
                        color: themeConfig.primaryColor,
                        fontFamily: themeConfig.headingFont 
                      }}
                    >
                      Sample Heading
                    </h4>
                    <p className="text-sm">This is how your text will appear on your store.</p>
                  </div>

                  <button
                    className="w-full py-2 px-4 rounded font-medium text-white"
                    style={{ backgroundColor: themeConfig.secondaryColor }}
                  >
                    Sample Button
                  </button>

                  <div 
                    className="p-3 rounded text-sm"
                    style={{ backgroundColor: themeConfig.accentColor, color: 'white' }}
                  >
                    Accent Element
                  </div>
                </div>

                {/* Preview Footer */}
                <div className="p-3 bg-gray-100 text-xs text-center border-t">
                  {themeConfig.footerText || 'Footer text will appear here'}
                </div>
              </div>

              <div className="mt-4 text-xs text-gray-500">
                <p>💡 Changes will be reflected in your live store after saving.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
