'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save } from 'lucide-react';

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

interface ThemeBuilderProps {
  initialTheme: ThemeConfig;
  onSave: (theme: ThemeConfig) => Promise<void>;
  saving: boolean;
  title: string;
  subtitle: string;
  backLink: string;
  backLinkText: string;
  isAdmin?: boolean;
}

export default function ThemeBuilder({
  initialTheme,
  onSave,
  saving,
  title,
  subtitle,
  backLink,
  backLinkText,
  isAdmin = false,
}: ThemeBuilderProps) {
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'layout' | 'social' | 'advanced'>('colors');
  const [themeConfig, setThemeConfig] = useState<ThemeConfig>(initialTheme);

  // Sync internal state when initialTheme changes (e.g., after fetch completes)
  useEffect(() => {
    setThemeConfig(initialTheme);
  }, [initialTheme]);

  const updateTheme = (key: keyof ThemeConfig, value: any) => {
    setThemeConfig((prev) => ({ ...prev, [key]: value }));
  };

  const updateSocialLink = (platform: string, value: string) => {
    setThemeConfig((prev) => ({
      ...prev,
      socialLinks: { ...prev.socialLinks, [platform]: value },
    }));
  };

  const applyAmazonTheme = () => {
    setThemeConfig({
      primaryColor: '#232F3E',
      secondaryColor: '#37475A',
      accentColor: '#FF9900',
      backgroundColor: '#FFFFFF',
      textColor: '#0F1111',
      fontFamily: 'Inter',
      headingFont: 'Inter',
      layout: 'modern',
      customCss: '',
      showLogo: true,
      showSearchBar: true,
      footerText: 'Your trusted marketplace for quality products',
      socialLinks: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: '',
        linkedin: '',
      },
    });
  };

  const applyEbayTheme = () => {
    setThemeConfig({
      primaryColor: '#E53238',
      secondaryColor: '#0064D2',
      accentColor: '#F5AF02',
      backgroundColor: '#FFFFFF',
      textColor: '#191919',
      fontFamily: 'Inter',
      headingFont: 'Inter',
      layout: 'modern',
      customCss: '',
      showLogo: true,
      showSearchBar: true,
      footerText: 'Buy and sell with confidence',
      socialLinks: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: '',
        linkedin: '',
      },
    });
  };

  const applyEtsyTheme = () => {
    setThemeConfig({
      primaryColor: '#F1641E',
      secondaryColor: '#222222',
      accentColor: '#FFB4A2',
      backgroundColor: '#FFFFFF',
      textColor: '#222222',
      fontFamily: 'Roboto',
      headingFont: 'Roboto',
      layout: 'modern',
      customCss: '',
      showLogo: true,
      showSearchBar: true,
      footerText: 'Keep commerce human',
      socialLinks: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: '',
        linkedin: '',
      },
    });
  };

  const applyWalmartTheme = () => {
    setThemeConfig({
      primaryColor: '#0071CE',
      secondaryColor: '#FFC220',
      accentColor: '#004F9A',
      backgroundColor: '#FFFFFF',
      textColor: '#2E2F32',
      fontFamily: 'Inter',
      headingFont: 'Inter',
      layout: 'modern',
      customCss: '',
      showLogo: true,
      showSearchBar: true,
      footerText: 'Save money. Live better.',
      socialLinks: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: '',
        linkedin: '',
      },
    });
  };

  const applyTargetTheme = () => {
    setThemeConfig({
      primaryColor: '#CC0000',
      secondaryColor: '#CC0000',
      accentColor: '#666666',
      backgroundColor: '#FFFFFF',
      textColor: '#333333',
      fontFamily: 'Inter',
      headingFont: 'Inter',
      layout: 'modern',
      customCss: '',
      showLogo: true,
      showSearchBar: true,
      footerText: 'Expect more. Pay less.',
      socialLinks: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: '',
        linkedin: '',
      },
    });
  };

  const applyBestBuyTheme = () => {
    setThemeConfig({
      primaryColor: '#0046BE',
      secondaryColor: '#FFF200',
      accentColor: '#1D252C',
      backgroundColor: '#FFFFFF',
      textColor: '#1D252C',
      fontFamily: 'Inter',
      headingFont: 'Inter',
      layout: 'modern',
      customCss: '',
      showLogo: true,
      showSearchBar: true,
      footerText: 'Expert service. Unbeatable price.',
      socialLinks: {
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: '',
        linkedin: '',
      },
    });
  };

  const resetToDefault = () => {
    if (!confirm('Are you sure you want to reset to default theme? This will clear all your customizations.')) {
      return;
    }
    
    setThemeConfig(initialTheme);
  };

  const handleSave = async () => {
    await onSave(themeConfig);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Link
              href={backLink}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              <p className="text-gray-600 mt-1">{subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Help Section */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>💡</span> Theme Builder Guide
          </h2>
          
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🎨 How to Use</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Colors Tab:</strong> Set primary brand colors, background, and text colors</li>
                <li><strong>Typography Tab:</strong> Choose fonts for body text and headings</li>
                <li><strong>Layout Tab:</strong> Select a layout style and configure display options</li>
                <li><strong>Social Tab:</strong> Add your social media links</li>
                <li><strong>Advanced Tab:</strong> Add custom CSS for advanced styling</li>
              </ul>
            </div>



            <div className="border-t border-blue-300 pt-4">
              <h3 className="font-semibold text-gray-900 mb-2">🎯 Best Practices</h3>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li><strong>Color Contrast:</strong> Ensure text is readable against your background</li>
                <li><strong>Brand Consistency:</strong> Use your brand colors for primary/secondary</li>
                <li><strong>Font Readability:</strong> Choose clear, readable fonts (Inter, Roboto, Open Sans work well)</li>
                <li><strong>Mobile First:</strong> Your theme applies to all devices, so keep it clean</li>
                <li><strong>Test Changes:</strong> Preview your {isAdmin ? 'marketplace' : 'store'} after saving to see how it looks</li>
              </ul>
            </div>

            <div className="border-t border-blue-300 pt-4">
              <h3 className="font-semibold text-gray-900 mb-2">📚 More Examples</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded border border-gray-300">
                  <h4 className="font-semibold text-xs mb-1">Minimalist</h4>
                  <p className="text-xs text-gray-600">Black (#000000), White (#FFFFFF), Gray (#6B7280)</p>
                </div>
                <div className="bg-white p-3 rounded border border-gray-300">
                  <h4 className="font-semibold text-xs mb-1">Elegant</h4>
                  <p className="text-xs text-gray-600">Navy (#1E3A8A), Gold (#D97706), Cream (#FFF7ED)</p>
                </div>
                <div className="bg-white p-3 rounded border border-gray-300">
                  <h4 className="font-semibold text-xs mb-1">Vibrant</h4>
                  <p className="text-xs text-gray-600">Purple (#8B5CF6), Pink (#EC4899), White (#FFFFFF)</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Settings */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {/* Popular Themes Dropdown */}
              <div className="px-6 py-4 border-b border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🛒 Popular E-Commerce Themes
                </label>
                <select
                  onChange={(e) => {
                    const themeMap: { [key: string]: () => void } = {
                      'amazon': applyAmazonTheme,
                      'ebay': applyEbayTheme,
                      'etsy': applyEtsyTheme,
                      'walmart': applyWalmartTheme,
                      'target': applyTargetTheme,
                      'bestbuy': applyBestBuyTheme,
                    };
                    if (e.target.value && themeMap[e.target.value]) {
                      themeMap[e.target.value]();
                      e.target.value = ''; // Reset to placeholder
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  defaultValue=""
                >
                  <option value="" disabled>Choose a theme to get started...</option>
                  <option value="amazon">Amazon India Style - Dark Navy, Professional & Trustworthy</option>
                  <option value="ebay">eBay Style - Red, Blue & Yellow, Bold & Vibrant</option>
                  <option value="etsy">Etsy Style - Orange & Black, Creative & Artisan</option>
                  <option value="walmart">Walmart Style - Blue & Yellow, Trust & Value</option>
                  <option value="target">Target Style - Red, Minimalist & Bold</option>
                  <option value="bestbuy">Best Buy Style - Blue & Yellow, Tech-Forward</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  Select a popular e-commerce theme and customize it to match your brand
                </p>
              </div>

              {/* Action Buttons - Moved here */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between">
                <button
                  onClick={resetToDefault}
                  className="px-6 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                >
                  Reset to Default
                </button>
                <div className="flex gap-3">
                  <Link
                    href={backLink}
                    className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Link>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Theme'}
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px overflow-x-auto">
                  {['colors', 'typography', 'layout', 'social', 'advanced'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`px-6 py-4 text-sm font-medium border-b-2 whitespace-nowrap ${
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
              <div className="p-6">
                {/* Colors Tab */}
                {activeTab === 'colors' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Color Scheme</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={themeConfig.primaryColor}
                          onChange={(e) => updateTheme('primaryColor', e.target.value)}
                          className="w-16 h-16 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeConfig.primaryColor}
                          onChange={(e) => updateTheme('primaryColor', e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secondary Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={themeConfig.secondaryColor}
                          onChange={(e) => updateTheme('secondaryColor', e.target.value)}
                          className="w-16 h-16 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeConfig.secondaryColor}
                          onChange={(e) => updateTheme('secondaryColor', e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Accent Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={themeConfig.accentColor}
                          onChange={(e) => updateTheme('accentColor', e.target.value)}
                          className="w-16 h-16 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeConfig.accentColor}
                          onChange={(e) => updateTheme('accentColor', e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Background Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={themeConfig.backgroundColor}
                          onChange={(e) => updateTheme('backgroundColor', e.target.value)}
                          className="w-16 h-16 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeConfig.backgroundColor}
                          onChange={(e) => updateTheme('backgroundColor', e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Text Color
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={themeConfig.textColor}
                          onChange={(e) => updateTheme('textColor', e.target.value)}
                          className="w-16 h-16 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={themeConfig.textColor}
                          onChange={(e) => updateTheme('textColor', e.target.value)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-md font-mono"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Typography Tab */}
                {activeTab === 'typography' && (
                  <div className="space-y-6">
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
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Layout Style</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Choose Layout
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        {layoutOptions.map((layout) => (
                          <div
                            key={layout.value}
                            onClick={() => updateTheme('layout', layout.value)}
                            className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                              themeConfig.layout === layout.value
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <h4 className="font-semibold text-gray-900 mb-1">{layout.label}</h4>
                            <p className="text-xs text-gray-600">{layout.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={themeConfig.showLogo !== false}
                          onChange={(e) => updateTheme('showLogo', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Show Logo</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={themeConfig.showSearchBar !== false}
                          onChange={(e) => updateTheme('showSearchBar', e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded"
                        />
                        <span className="text-sm font-medium text-gray-700">Show Search Bar</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Footer Text
                      </label>
                      <input
                        type="text"
                        value={themeConfig.footerText || ''}
                        onChange={(e) => updateTheme('footerText', e.target.value)}
                        placeholder="e.g., Your trusted marketplace"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                )}

                {/* Social Tab */}
                {activeTab === 'social' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Social Media Links</h3>
                    <p className="text-sm text-gray-600">Add your social media links</p>
                    
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
                        Twitter / X
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
                        placeholder="https://youtube.com/@yourpage"
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
                        placeholder="https://linkedin.com/company/yourpage"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                )}

                {/* Advanced Tab */}
                {activeTab === 'advanced' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">Advanced Settings</h3>
                    <p className="text-sm text-gray-600">Add custom CSS for advanced styling</p>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom CSS
                      </label>
                      <textarea
                        value={themeConfig.customCss || ''}
                        onChange={(e) => updateTheme('customCss', e.target.value)}
                        placeholder=".custom-class { color: red; }"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md font-mono text-sm"
                        rows={12}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Add custom CSS to override default styles. Be careful as this can affect the entire {isAdmin ? 'marketplace' : 'store'}.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
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
                  className="p-4 text-white font-semibold"
                  style={{ 
                    backgroundColor: themeConfig.primaryColor,
                    fontFamily: themeConfig.headingFont 
                  }}
                >
                  {isAdmin ? 'Main Marketplace' : 'Your Store'}
                </div>

                {/* Preview Content */}
                <div className="p-4 space-y-3">
                  <h4 
                    className="font-bold text-lg"
                    style={{ 
                      fontFamily: themeConfig.headingFont,
                      color: themeConfig.textColor 
                    }}
                  >
                    Featured Products
                  </h4>
                  
                  <div 
                    className="p-3 border-2 rounded"
                    style={{ borderColor: `${themeConfig.primaryColor}40` }}
                  >
                    <p className="text-sm mb-2">Sample Product</p>
                    <p 
                      className="font-bold text-lg"
                      style={{ color: themeConfig.primaryColor }}
                    >
                      $99.99
                    </p>
                  </div>

                  <button
                    className="w-full py-2 text-white font-medium rounded"
                    style={{ backgroundColor: themeConfig.secondaryColor }}
                  >
                    Add to Cart
                  </button>

                  <p 
                    className="text-sm"
                    style={{ color: themeConfig.accentColor }}
                  >
                    ★★★★★ (24 reviews)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
