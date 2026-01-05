'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ThemeRenderer from '@/components/ThemeRenderer';
import CategorySidebar from '@/components/CategorySidebar';
import ThemeBuilder from '@/components/ThemeBuilder';
import ThemeTemplateSelector from '@/components/ThemeTemplateSelector';

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
  templateId?: string;
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
  const [showHelp, setShowHelp] = useState(false);

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
      <ThemeRenderer component="header" showLocationFilter={false} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* <CategorySidebar /> */}
          <div className="flex-1 max-w-7xl">
            <div className="mb-6">
              <a
                href="/vendor/dashboard"
                className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
              >
                ← Back to Dashboard
              </a>
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
                <p className="text-sm text-gray-600">Learn how to customize your store's appearance and branding</p>
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
              {/* What is Theme Builder */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🎨</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">What is the Theme Builder?</h4>
                    <p className="text-gray-700 mb-3">
                      The Theme Builder lets you customize how your store looks to match your brand identity. Change colors, 
                      fonts, layout, and more - no coding required! Create a unique, professional storefront that stands out 
                      from competitors.
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm font-medium text-blue-800 mb-2">✨ What You Can Customize:</p>
                      <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                        <li><strong>Colors:</strong> Primary, secondary, accent, background, and text colors</li>
                        <li><strong>Typography:</strong> Font families for headings and body text</li>
                        <li><strong>Layout:</strong> Modern, Classic, Minimal, or Bold layout styles</li>
                        <li><strong>Branding:</strong> Logo visibility and positioning</li>
                        <li><strong>Features:</strong> Search bar, footer text, social media links</li>
                        <li><strong>Custom CSS:</strong> Advanced users can add custom styles</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Color Selection */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🌈</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Choosing Colors</h4>
                    <p className="text-gray-700 mb-3">
                      Colors are crucial for brand recognition and user experience. Choose colors that reflect your brand 
                      personality and ensure good readability.
                    </p>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-700 mb-2">🎯 Primary Color</p>
                        <p className="text-sm text-gray-600">Main brand color. Used for buttons, links, and key elements. Should be bold and eye-catching.</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-700 mb-2">🎨 Secondary Color</p>
                        <p className="text-sm text-gray-600">Supporting color for backgrounds, cards, and subtle elements. Often a lighter/muted tone.</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-700 mb-2">✨ Accent Color</p>
                        <p className="text-sm text-gray-600">For highlights, badges, and call-outs. Should complement primary color.</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-700 mb-2">📄 Background & Text</p>
                        <p className="text-sm text-gray-600">Ensure good contrast. Dark text on light background (or vice versa) for readability.</p>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                      <p className="text-sm font-medium text-green-800 mb-2">💡 Color Tips:</p>
                      <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                        <li>Use brand colors you already have (logo, packaging)</li>
                        <li>Test color combinations for accessibility (WCAG standards)</li>
                        <li>Limit to 2-3 main colors for consistency</li>
                        <li>Preview changes before saving</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Typography */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🔤</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Selecting Fonts</h4>
                    <p className="text-gray-700 mb-3">
                      Typography affects readability and brand perception. Choose fonts that are clear, professional, 
                      and match your brand personality.
                    </p>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="font-medium text-blue-700 mb-2">📖 Body Font</p>
                        <p className="text-sm text-blue-600">Used for paragraphs and general text. Should be highly readable (e.g., Inter, Roboto, Open Sans).</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded border border-purple-200">
                        <p className="font-medium text-purple-700 mb-2">🎯 Heading Font</p>
                        <p className="text-sm text-purple-600">For titles and headings. Can be more decorative than body font (e.g., Montserrat, Poppins, Playfair Display).</p>
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-amber-50 rounded border border-amber-200">
                      <p className="text-sm font-medium text-amber-800 mb-2">⚠️ Font Best Practices:</p>
                      <p className="text-sm text-amber-700">Use max 2 different fonts (one for headings, one for body). Too many fonts look unprofessional.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Layout Styles */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📐</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Layout Styles</h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="font-medium text-blue-700 mb-2">🏢 Modern</p>
                        <p className="text-sm text-blue-600">Clean, spacious design with rounded corners and subtle shadows. Best for tech, fashion, lifestyle stores.</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded border border-green-200">
                        <p className="font-medium text-green-700 mb-2">🎩 Classic</p>
                        <p className="text-sm text-green-600">Traditional, timeless design with sharp corners. Good for professional services, formal products.</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded border border-purple-200">
                        <p className="font-medium text-purple-700 mb-2">✨ Minimal</p>
                        <p className="text-sm text-purple-600">Simple, clean with lots of white space. Perfect for luxury brands, art, photography.</p>
                      </div>
                      <div className="p-3 bg-orange-50 rounded border border-orange-200">
                        <p className="font-medium text-orange-700 mb-2">💥 Bold</p>
                        <p className="text-sm text-orange-600">Eye-catching with strong contrasts and large elements. Great for youth-focused, energetic brands.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Custom CSS */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">💻</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Advanced: Custom CSS</h4>
                    <p className="text-gray-700 mb-3">
                      For advanced users who know CSS, you can add custom styles to fine-tune your store's appearance 
                      beyond the standard options.
                    </p>
                    <div className="p-3 bg-amber-50 rounded border border-amber-200">
                      <p className="text-sm font-medium text-amber-800 mb-2">⚠️ Important:</p>
                      <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                        <li>Only use if you understand CSS - incorrect code can break your store</li>
                        <li>Test thoroughly after adding custom CSS</li>
                        <li>Keep a backup of working CSS before making changes</li>
                        <li>Use browser developer tools to test styles first</li>
                      </ul>
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
                    <span><strong>Too many colors:</strong> Stick to 2-3 main colors. More looks chaotic</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Poor contrast:</strong> Light text on light background is unreadable</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Decorative fonts everywhere:</strong> Use fancy fonts sparingly (headings only)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Ignoring mobile:</strong> Always preview on mobile devices</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Frequent changes:</strong> Constant rebranding confuses customers</span>
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
                    <span>Preview changes before saving</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Match colors to your existing brand</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Test on different devices and screens</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Keep it simple and consistent</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Get feedback from others before finalizing</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Save theme changes regularly</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      {/* Theme Template Selector */}
      <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <ThemeTemplateSelector
          currentThemeId={themeConfig.templateId}
          onThemeSelect={async (templateId) => {
            const updatedTheme = { ...themeConfig, templateId };
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
          backLink="/vendor/dashboard"
          backLinkText="Back to Dashboard"
          isAdmin={false}
        />
      </div>
          </div>
        </div>
      </div>
    </>
  );
}
