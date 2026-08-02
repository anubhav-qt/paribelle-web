'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Settings, MapPin, Save, DollarSign, Upload, Trash2, AlertCircle } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Loader } from '@/components/ui/Loader';

interface Setting {
  id: string;
  key: string;
  value: any;
  description: string;
}

export default function AdminSettingsPage() {
  const { isAuthenticated, loading: authLoading } = useAdminAuth();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [locationFilterEnabled, setLocationFilterEnabled] = useState(true);
  const [currency, setCurrency] = useState('INR');
  const [categoryDisplayMode, setCategoryDisplayMode] = useState<'top' | 'sidebar'>('sidebar');
  const [thumbnailLayout, setThumbnailLayout] = useState<'vertical' | 'horizontal'>('vertical');
  const [heroHeight, setHeroHeight] = useState<'compact' | 'standard' | 'tall'>('compact');
  const [marketplaceLogo, setMarketplaceLogo] = useState('');
  const [marketplaceName, setMarketplaceName] = useState('PariBelle');
  const [heroBanners, setHeroBanners] = useState<Array<{
    id: string;
    imageUrl: string;
    title: string;
    subtitle: string;
    ctaText: string;
    ctaLink: string;
    order: number;
  }>>([]);
  const [returnPolicy, setReturnPolicy] = useState<{ enabled: boolean; days?: number; text: string }>({ enabled: false, text: '' });
  const [cancellationPolicy, setCancellationPolicy] = useState<{ enabled: boolean; text: string }>({ enabled: false, text: '' });
  const [commissionRate, setCommissionRate] = useState<number>(10);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(0);
  
  // Orphan cleanup state
  const [orphanImages, setOrphanImages] = useState<string[]>([]);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResults, setCleanupResults] = useState<{ total: number; orphans: string[]; deleted: number; errors: string[] } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchSettings();
    }
  }, [isAuthenticated]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/admin/all`);
      if (response.ok) {
            const data = await response.json();
            setSettings(data);
        
            // Set form values from loaded settings
            const locationSetting = data.find((s: Setting) => s.key === 'location_filter_enabled');
            if (locationSetting) {
          setLocationFilterEnabled(locationSetting.value === true || locationSetting.value === 'true');
            }
        
            const currencySetting = data.find((s: Setting) => s.key === 'currency');
            if (currencySetting) {
          setCurrency(currencySetting.value || 'INR');
            }
        
            const categoryModeSetting = data.find((s: Setting) => s.key === 'category_display_mode');
            if (categoryModeSetting) {
          setCategoryDisplayMode(categoryModeSetting.value === 'top' ? 'top' : 'sidebar');
            }
        
            const thumbnailLayoutSetting = data.find((s: Setting) => s.key === 'thumbnailLayout');
            if (thumbnailLayoutSetting) {
          setThumbnailLayout(thumbnailLayoutSetting.value === 'horizontal' ? 'horizontal' : 'vertical');
            }

            const heroHeightSetting = data.find((s: Setting) => s.key === 'hero_height');
            if (heroHeightSetting) {
              const value = String(heroHeightSetting.value || '').toLowerCase();
              if (value === 'compact' || value === 'standard' || value === 'tall') {
                setHeroHeight(value);
              }
            }
        
            const heroBannersSetting = data.find((s: Setting) => s.key === 'hero_banners');
            if (heroBannersSetting && Array.isArray(heroBannersSetting.value)) {
          setHeroBanners(heroBannersSetting.value);
            } else {
          setHeroBanners([]);
            }
        
            const logoSetting = data.find((s: Setting) => s.key === 'marketplace_logo');
            if (logoSetting) {
          setMarketplaceLogo(logoSetting.value || '');
            }
        
            const nameSetting = data.find((s: Setting) => s.key === 'marketplace_name');
            if (nameSetting) {
          setMarketplaceName(nameSetting.value || 'PariBelle');
            }

            const returnPolicySetting = data.find((s: Setting) => s.key === 'return_policy');
            if (returnPolicySetting?.value) {
          const parsed = typeof returnPolicySetting.value === 'string' ? JSON.parse(returnPolicySetting.value) : returnPolicySetting.value;
          setReturnPolicy(parsed);
            }

            const cancellationPolicySetting = data.find((s: Setting) => s.key === 'cancellation_policy');
            if (cancellationPolicySetting?.value) {
          const parsed = typeof cancellationPolicySetting.value === 'string' ? JSON.parse(cancellationPolicySetting.value) : cancellationPolicySetting.value;
          setCancellationPolicy(parsed);
            }

            const commissionRateSetting = data.find((s: Setting) => s.key === 'platform_commission_rate');
            if (commissionRateSetting) {
          setCommissionRate(parseFloat(commissionRateSetting.value) || 10);
            }

            const freeShippingThresholdSetting = data.find((s: Setting) => s.key === 'default_free_shipping_threshold');
            if (freeShippingThresholdSetting) {
          setFreeShippingThreshold(parseFloat(freeShippingThresholdSetting.value) || 0);
            }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showMessage('error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showMessage('error', 'Image size should be less than 2MB');
      return;
    }

    try {
      setUploadingLogo(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/upload/image`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      // Store the relative URL (will be prefixed with API URL when fetched)
      setMarketplaceLogo(data.url);
      showMessage('success', 'Logo uploaded successfully. Remember to save settings.');
    } catch (error) {
      console.error('Error uploading logo:', error);
      showMessage('error', 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const updateSetting = async (key: string, value: any, description?: string) => {
    try {
      const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/${key}`,
            {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value, description }),
            }
      );
      
      if (!response.ok) throw new Error('Failed to update setting');
      return true;
    } catch (error) {
      console.error('Error updating setting:', error);
      return false;
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const locationSuccess = await updateSetting(
            'location_filter_enabled',
            locationFilterEnabled,
            'Enable/disable location-based product filtering across the marketplace'
      );
      
      const currencySuccess = await updateSetting(
            'currency',
            currency,
            'Default currency for the marketplace'
      );
      
      const categoryModeSuccess = await updateSetting(
            'category_display_mode',
            categoryDisplayMode,
            'Display categories at the top toolbar or in the left sidebar tree. Values: "top" or "sidebar"'
      );
      
      const thumbnailLayoutSuccess = await updateSetting(
            'thumbnailLayout',
            thumbnailLayout,
            'Product image thumbnail layout orientation. Values: "vertical" (Amazon-style left sidebar) or "horizontal" (bottom strip)'
      );

      const heroHeightSuccess = await updateSetting(
        'hero_height',
        heroHeight,
        'Hero carousel height preset. Values: "compact", "standard", "tall".'
      );
      
      const heroBannersSuccess = await updateSetting(
            'hero_banners',
            heroBanners,
            'Hero carousel banners for homepage'
      );
      
      const logoSuccess = await updateSetting(
            'marketplace_logo',
            marketplaceLogo,
            'Marketplace logo URL'
      );
      
      const nameSuccess = await updateSetting(
            'marketplace_name',
            marketplaceName,
            'Marketplace name displayed in header'
      );

      const returnPolicySuccess = await updateSetting(
            'return_policy',
            JSON.stringify(returnPolicy),
            'Marketplace default return policy'
      );

      const cancellationPolicySuccess = await updateSetting(
            'cancellation_policy',
            JSON.stringify(cancellationPolicy),
            'Marketplace default cancellation policy'
      );

      const commissionRateSuccess = await updateSetting(
            'platform_commission_rate',
            commissionRate.toString(),
            'Default marketplace commission rate percentage for all vendors'
      );

      const freeShippingThresholdSuccess = await updateSetting(
            'default_free_shipping_threshold',
            freeShippingThreshold.toString(),
            'Default free shipping threshold amount. Orders above this amount get free shipping.'
      );

      if (locationSuccess && currencySuccess && categoryModeSuccess && thumbnailLayoutSuccess && heroHeightSuccess && heroBannersSuccess && logoSuccess && nameSuccess && returnPolicySuccess && cancellationPolicySuccess && commissionRateSuccess && freeShippingThresholdSuccess) {
            showMessage('success', 'Settings saved successfully!');
            await fetchSettings(); // Refresh settings
      } else {
            showMessage('error', 'Failed to save settings');
      }
    } catch (error) {
      showMessage('error', 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const scanOrphanImages = async () => {
    try {
      setCleanupLoading(true);
      setCleanupResults(null);
      setOrphanImages([]);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/admin/cleanup-orphan-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) throw new Error('Failed to scan orphan images');
      
      const data = await response.json();
      setCleanupResults(data);
      setOrphanImages(data.orphans || []);
      
      if (data.orphans.length === 0) {
        showMessage('success', 'No orphan images found!');
      } else {
        showMessage('success', `Found ${data.orphans.length} orphan images`);
      }
    } catch (error) {
      console.error('Error scanning orphan images:', error);
      showMessage('error', 'Failed to scan orphan images');
    } finally {
      setCleanupLoading(false);
    }
  };

  const deleteOrphanImages = async () => {
    if (!confirm(`Are you sure you want to delete ${orphanImages.length} orphan images? This action cannot be undone.`)) {
      return;
    }

    try {
      setCleanupLoading(true);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/admin/cleanup-orphan-images?delete=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) throw new Error('Failed to delete orphan images');
      
      const data = await response.json();
      setCleanupResults(data);
      
      if (data.deleted > 0) {
        showMessage('success', `Successfully deleted ${data.deleted} orphan images`);
        setOrphanImages([]);
      } else {
        showMessage('error', 'No images were deleted');
      }
    } catch (error) {
      console.error('Error deleting orphan images:', error);
      showMessage('error', 'Failed to delete orphan images');
    } finally {
      setCleanupLoading(false);
    }
  };

  if (authLoading || !isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Loader size="md" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <Link
              href="/admin"
              className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Site Settings</h1>
            </div>
          </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-8">
          <div className="flex-1 max-w-4xl">
            {/* Success/Error Message */}
            {message && (
              <div
                className={`mb-6 p-4 rounded-lg ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Marketplace Branding */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Settings className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Marketplace Branding</h2>
              </div>

              <div className="space-y-4">
            <div>
              <label htmlFor="marketplaceName" className="block font-medium text-gray-900 mb-2">
                Marketplace Name
              </label>
              <input
                type="text"
                id="marketplaceName"
                value={marketplaceName}
                onChange={(e) => setMarketplaceName(e.target.value)}
                placeholder="Marketplace"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-600 mt-2">
                This name will be displayed in the header and throughout the site.
              </p>
            </div>

            <div>
              <label htmlFor="marketplaceLogo" className="block font-medium text-gray-900 mb-2">
                Logo
              </label>
              <div className="space-y-3">
                {/* Upload Button */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="logoFileInput"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                  </button>
                  <p className="text-sm text-gray-600 mt-1">
                    Upload an image (max 2MB). Recommended size: 200x60px
                  </p>
                </div>

                {/* URL Input (Optional) */}
                <div>
                  <label htmlFor="marketplaceLogoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Or enter Logo URL
                  </label>
                  <input
                    type="url"
                    id="marketplaceLogoUrl"
                    value={marketplaceLogo}
                    onChange={(e) => setMarketplaceLogo(e.target.value)}
                    placeholder="https://example.com/logo.png or /logo.png"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {marketplaceLogo && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  <img 
                    src={marketplaceLogo.startsWith('http') ? marketplaceLogo : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${marketplaceLogo}`} 
                    alt="Logo preview" 
                    className="h-12 object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Changes to the logo and name will appear on all pages after saving.
              </p>
            </div>
          </div>
            </div>

            {/* Location Filter Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Location Filter</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <input
                type="checkbox"
                id="locationFilter"
                checked={locationFilterEnabled}
                onChange={(e) => setLocationFilterEnabled(e.target.checked)}
                className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div className="flex-1">
                <label htmlFor="locationFilter" className="block font-medium text-gray-900 cursor-pointer">
                  Enable Location-Based Filtering
                </label>
                <p className="text-sm text-gray-600 mt-1">
                  When enabled, users can filter products by city and area/locality on the homepage and category pages.
                  Products will be grouped into "Available in Selected Location" and "Other Locations" sections.
                </p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This setting controls the visibility of location filter dropdowns across the marketplace.
                When disabled, the location filter UI will be hidden from all pages.
              </p>
            </div>
          </div>
            </div>

            {/* Currency Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Currency & Commission</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="currency" className="block font-medium text-gray-900 mb-2">
                Default Currency
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="INR">₹ INR - Indian Rupee</option>
                <option value="USD">$ USD - US Dollar</option>
                <option value="EUR">€ EUR - Euro</option>
                <option value="GBP">£ GBP - British Pound</option>
                <option value="AUD">$ AUD - Australian Dollar</option>
                <option value="CAD">$ CAD - Canadian Dollar</option>
              </select>
              <p className="text-sm text-gray-600 mt-2">
                This currency will be used throughout the marketplace for all product prices and transactions.
              </p>
            </div>

            <div>
              <label htmlFor="commissionRate" className="block font-medium text-gray-900 mb-2">
                Platform Commission Rate (%)
              </label>
              <input
                type="number"
                id="commissionRate"
                value={commissionRate}
                onChange={(e) => setCommissionRate(parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.1"
                placeholder="10"
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-600 mt-2">
                Default commission rate charged on vendor sales. Can be overridden per vendor in vendor settings.
              </p>
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border text-sm text-gray-700">
                <p className="font-medium mb-2">💡 How Commission Works:</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li><strong>commission_amount</strong> = Order Subtotal × (Rate ÷ 100)</li>
                  <li><strong>vendor_payout</strong> = Order Total - Commission - Platform Fees</li>
                  <li>Set per-vendor rates in Admin → Vendors → Edit Vendor</li>
                  <li>Commission is calculated when order is placed and stored in order record</li>
                </ul>
              </div>
            </div>

            <div>
              <label htmlFor="freeShippingThreshold" className="block font-medium text-gray-900 mb-2">
                Default Free Shipping Threshold ({currency === 'INR' ? '₹' : currency === 'USD' ? '$' : currency})
              </label>
              <input
                type="number"
                id="freeShippingThreshold"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(parseFloat(e.target.value) || 0)}
                min="0"
                step="0.01"
                placeholder="500.00"
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-sm text-gray-600 mt-2">
                Orders above this amount automatically get free shipping. Set to 0 to disable platform-wide free shipping.
              </p>
              <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-sm text-yellow-800">
                <p className="font-medium mb-1">⚙️ Vendor Override:</p>
                <p>Individual vendors can set their own free shipping threshold in their settings, which will override this default value.</p>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Commission is calculated as: Order Total × Commission Rate. Individual vendors can have custom rates set in their vendor settings.
              </p>
            </div>
          </div>
            </div>

            {/* Category Display Mode Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Category Display</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="categoryMode" className="block font-medium text-gray-900 mb-2">
                Category Navigation Layout
              </label>
              <select
                id="categoryMode"
                value={categoryDisplayMode}
                onChange={(e) => setCategoryDisplayMode(e.target.value as 'top' | 'sidebar')}
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="sidebar">Left Sidebar Tree</option>
                <option value="top">Top Toolbar</option>
              </select>
              <p className="text-sm text-gray-600 mt-2">
                Choose how categories are displayed on the homepage.
              </p>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Left Sidebar Tree:</strong> Categories are displayed in a scrollable tree panel on the left side with expandable subcategories.</p>
              <p><strong>Top Toolbar:</strong> Categories are displayed horizontally in the header toolbar with dropdown menus for subcategories.</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This setting affects the category navigation on the homepage. Users can click categories to scroll to product sections.
              </p>
            </div>
          </div>
            </div>

            {/* Product Image Gallery Settings */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Product Image Gallery</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="thumbnailLayout" className="block font-medium text-gray-900 mb-2">
                Thumbnail Layout
              </label>
              <select
                id="thumbnailLayout"
                value={thumbnailLayout}
                onChange={(e) => setThumbnailLayout(e.target.value as 'vertical' | 'horizontal')}
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="vertical">Vertical (Left Sidebar)</option>
                <option value="horizontal">Horizontal (Bottom Strip)</option>
              </select>
              <p className="text-sm text-gray-600 mt-2">
                Choose how product image thumbnails are displayed on product detail pages.
              </p>
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <p><strong>Vertical (Amazon-style):</strong> Thumbnails appear in a vertical strip on the left side of the main image. Hovering changes the main image instantly.</p>
              <p><strong>Horizontal:</strong> Thumbnails appear in a horizontal strip below the main image, similar to traditional e-commerce layouts.</p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This setting applies to all product detail pages across the marketplace.
              </p>
            </div>
          </div>
            </div>

            {/* Hero Banners Management */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Hero Carousel Banners</h2>
            </div>
            <button
              onClick={() => {
                const newBanner = {
                  id: `banner-${Date.now()}`,
                  imageUrl: '',
                  title: 'New Banner',
                  subtitle: 'Add your subtitle here',
                  ctaText: '',
                  ctaLink: '',
                  order: heroBanners.length
                };
                setHeroBanners([...heroBanners, newBanner]);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              + Add Banner
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="heroHeight" className="block font-medium text-gray-900 mb-2">
                Hero Height
              </label>
              <select
                id="heroHeight"
                value={heroHeight}
                onChange={(e) => setHeroHeight(e.target.value as 'compact' | 'standard' | 'tall')}
                className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="compact">Compact (smallest)</option>
                <option value="standard">Standard</option>
                <option value="tall">Tall (largest)</option>
              </select>
              <p className="text-sm text-gray-600 mt-2">
                Controls the hero/banner height on homepage and vendor storefront pages.
              </p>
            </div>

            {heroBanners.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No banners configured. Click "Add Banner" to create your first hero banner.</p>
                <p className="text-sm mt-2">Default gradient banner will be shown when no banners are configured.</p>
              </div>
            ) : (
              heroBanners.map((banner, index) => (
                <div key={banner.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-gray-900">Banner #{index + 1}</h3>
                    <button
                      onClick={() => {
                        setHeroBanners(heroBanners.filter(b => b.id !== banner.id));
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Image URL
                      </label>
                      <input
                        type="url"
                        value={banner.imageUrl}
                        onChange={(e) => {
                          const updated = [...heroBanners];
                          updated[index].imageUrl = e.target.value;
                          setHeroBanners(updated);
                        }}
                        placeholder="https://example.com/banner.jpg"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Leave empty to use gradient background. Recommended size: 1920x600px
                      </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Title
                        </label>
                        <input
                          type="text"
                          value={banner.title}
                          onChange={(e) => {
                            const updated = [...heroBanners];
                            updated[index].title = e.target.value;
                            setHeroBanners(updated);
                          }}
                          placeholder="Discover Amazing Products"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Subtitle
                        </label>
                        <input
                          type="text"
                          value={banner.subtitle}
                          onChange={(e) => {
                            const updated = [...heroBanners];
                            updated[index].subtitle = e.target.value;
                            setHeroBanners(updated);
                          }}
                          placeholder="Shop from thousands of products"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CTA Button Text (Optional)
                        </label>
                        <input
                          type="text"
                          value={banner.ctaText}
                          onChange={(e) => {
                            const updated = [...heroBanners];
                            updated[index].ctaText = e.target.value;
                            setHeroBanners(updated);
                          }}
                          placeholder="Shop Now"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          CTA Link (Optional)
                        </label>
                        <input
                          type="url"
                          value={banner.ctaLink}
                          onChange={(e) => {
                            const updated = [...heroBanners];
                            updated[index].ctaLink = e.target.value;
                            setHeroBanners(updated);
                          }}
                          placeholder="/products"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">Display Order:</label>
                      <input
                        type="number"
                        value={banner.order}
                        onChange={(e) => {
                          const updated = [...heroBanners];
                          updated[index].order = parseInt(e.target.value) || 0;
                          setHeroBanners(updated);
                        }}
                        className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-semibold mb-3">
                <strong>📸 How to Add Images from Unsplash:</strong>
              </p>
              <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                <li>Go to <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">unsplash.com</a> and search for your desired image (e.g., "fashion", "marketplace", "products")</li>
                <li>Click on the image you like to open it in full view</li>
                <li>Right-click on the image and select "Copy Image Address" or "Copy Image Link"</li>
                <li>Paste the URL in the "Image URL" field above</li>
                <li><strong>Optimize for hero banner:</strong> Add <code className="bg-blue-100 px-1 py-0.5 rounded">?w=1920&h=600&fit=crop</code> at the end of the URL for perfect sizing</li>
                <li className="font-medium">Example: <code className="bg-blue-100 px-1 py-0.5 rounded text-xs break-all">https://images.unsplash.com/photo-xxxxx?w=1920&h=600&fit=crop</code></li>
              </ol>
              <p className="text-sm text-blue-800 mt-3">
                <strong>💡 Additional Tips:</strong>
              </p>
              <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside ml-4">
                <li>Banners auto-rotate every 5 seconds</li>
                <li>Users can manually navigate using arrows or dots</li>
                <li>Recommended dimensions: 1920x600px or 16:9 aspect ratio</li>
                <li>Leave image URL empty to use gradient background</li>
                <li>Display order determines the sequence (lower numbers appear first)</li>
                <li>Use high-quality, relevant images that match your brand</li>
                <li>Ensure images are properly licensed (Unsplash images are free to use)</li>
              </ul>
            </div>
          </div>
            </div>

            {/* Cloudinary Image Cleanup */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Trash2 className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-semibold text-gray-900">Cloudinary Image Cleanup</h2>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Scan and remove orphan images from Cloudinary that are no longer referenced by any products.
              </p>

              <div className="space-y-4">
                {/* Scan Button */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={scanOrphanImages}
                    disabled={cleanupLoading}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {cleanupLoading ? 'Scanning...' : 'Scan for Orphan Images'}
                  </button>

                  {cleanupResults && (
                    <div className="text-sm text-gray-600">
                      Found <span className="font-semibold text-gray-900">{cleanupResults.orphans.length}</span> orphan images out of <span className="font-semibold text-gray-900">{cleanupResults.total}</span> total images
                    </div>
                  )}
                </div>

                {/* Orphan Images List */}
                {orphanImages.length > 0 && (
                  <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900 mb-1">Orphan Images ({orphanImages.length})</h3>
                        <p className="text-sm text-gray-600">These images are not referenced by any products and can be safely deleted.</p>
                      </div>
                      <button
                        onClick={deleteOrphanImages}
                        disabled={cleanupLoading}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete All Orphans
                      </button>
                    </div>

                    {/* Image List */}
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {orphanImages.slice(0, 20).map((url, idx) => (
                        <div key={idx} className="text-xs text-gray-700 bg-white p-2 rounded border border-gray-200 break-all">
                          {url}
                        </div>
                      ))}
                      {orphanImages.length > 20 && (
                        <div className="text-sm text-gray-600 italic">
                          ... and {orphanImages.length - 20} more images
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Cleanup Results */}
                {cleanupResults && cleanupResults.deleted > 0 && (
                  <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                    <h3 className="font-medium text-green-900 mb-2">Cleanup Complete</h3>
                    <div className="space-y-1 text-sm text-green-800">
                      <p>✓ Deleted {cleanupResults.deleted} orphan images</p>
                      {cleanupResults.errors && cleanupResults.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-red-800 font-medium">Errors:</p>
                          {cleanupResults.errors.map((err, idx) => (
                            <p key={idx} className="text-xs text-red-700">{err}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">How it works:</h3>
                  <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                    <li>Scans all images in the Cloudinary marketplace folder</li>
                    <li>Compares them against all product and variant images in the database</li>
                    <li>Identifies images that are not referenced anywhere</li>
                    <li>Allows you to permanently delete orphan images to free up storage</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Marketplace Policies */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Marketplace Default Policies</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            These are the default policies that vendors can use. Vendors can override these with their own custom policies.
          </p>

          <div className="space-y-6">
            {/* Return Policy */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Return Policy</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={returnPolicy.enabled}
                    onChange={(e) => setReturnPolicy({ ...returnPolicy, enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Enable return policy</span>
                </label>
              </div>

              {returnPolicy.enabled && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Return Window (days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={returnPolicy.days || 0}
                      onChange={(e) => setReturnPolicy({ ...returnPolicy, days: parseInt(e.target.value) || 0 })}
                      className="w-full md:w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Number of days customers have to return items</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Policy Details
                    </label>
                    <textarea
                      value={returnPolicy.text}
                      onChange={(e) => setReturnPolicy({ ...returnPolicy, text: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Describe your return policy in detail..."
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Cancellation Policy */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900">Cancellation Policy</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cancellationPolicy.enabled}
                    onChange={(e) => setCancellationPolicy({ ...cancellationPolicy, enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Enable cancellation policy</span>
                </label>
              </div>

              {cancellationPolicy.enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Policy Details
                  </label>
                  <textarea
                    value={cancellationPolicy.text}
                    onChange={(e) => setCancellationPolicy({ ...cancellationPolicy, text: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Describe your cancellation policy in detail..."
                  />
                </div>
              )}
            </div>
          </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-4">
          <button
            onClick={fetchSettings}
            disabled={saving}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
            </div>
          </div>
            </div>
      </div>

      {/* Sticky Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-end gap-4 max-w-4xl ml-auto">
            <button
              onClick={fetchSettings}
              disabled={saving}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Reset
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
