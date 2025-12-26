'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save, MoveUp, MoveDown, Image as ImageIcon } from 'lucide-react';

interface HeroBanner {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  order: number;
}

export default function VendorHeroBannersPage() {
  const router = useRouter();
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendorId, setVendorId] = useState<string>('');

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        router.push('/login');
        return;
      }
      
      const userData = JSON.parse(userStr);
      const vId = userData.vendorId;
      
      if (!vId) {
        alert('No vendor account found');
        router.push('/vendor/dashboard');
        return;
      }
      
      setVendorId(vId);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vId}/hero-banners`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setBanners(data.heroBanners || []);
      }
    } catch (error) {
      console.error('Error fetching hero banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}/hero-banners`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ heroBanners: banners }),
        }
      );
      
      if (response.ok) {
        alert('Hero banners saved successfully!');
      } else {
        alert('Failed to save hero banners');
      }
    } catch (error) {
      console.error('Error saving hero banners:', error);
      alert('Error saving hero banners');
    } finally {
      setSaving(false);
    }
  };

  const addBanner = () => {
    const newBanner: HeroBanner = {
      id: `banner_${Date.now()}`,
      imageUrl: '',
      title: '',
      subtitle: '',
      ctaText: '',
      ctaLink: '',
      order: banners.length,
    };
    setBanners([...banners, newBanner]);
  };

  const updateBanner = (index: number, updates: Partial<HeroBanner>) => {
    const newBanners = [...banners];
    newBanners[index] = { ...newBanners[index], ...updates };
    setBanners(newBanners);
  };

  const removeBanner = (index: number) => {
    if (!confirm('Are you sure you want to remove this banner?')) return;
    const newBanners = banners.filter((_, i) => i !== index);
    // Update order
    newBanners.forEach((banner, i) => {
      banner.order = i;
    });
    setBanners(newBanners);
  };

  const moveBanner = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === banners.length - 1)
    ) {
      return;
    }

    const newBanners = [...banners];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newBanners[index], newBanners[newIndex]] = [newBanners[newIndex], newBanners[index]];
    
    // Update order
    newBanners.forEach((banner, i) => {
      banner.order = i;
    });
    
    setBanners(newBanners);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/vendor/dashboard"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Hero Banners</h1>
              <p className="text-gray-600 mt-1">
                Customize the hero carousel on your store page
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {banners.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <ImageIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Hero Banners</h3>
              <p className="text-gray-600 mb-4">
                Create your first hero banner to showcase on your store
              </p>
              <button
                onClick={addBanner}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add First Banner
              </button>
            </div>
          ) : (
            <>
              {banners.map((banner, index) => (
                <div key={banner.id} className="bg-white rounded-lg border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">Banner #{index + 1}</h3>
                      <span className="text-sm text-gray-500">(Order: {banner.order})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => moveBanner(index, 'up')}
                        disabled={index === 0}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-30"
                        title="Move up"
                      >
                        <MoveUp className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => moveBanner(index, 'down')}
                        disabled={index === banners.length - 1}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-30"
                        title="Move down"
                      >
                        <MoveDown className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => removeBanner(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remove banner"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Image URL *
                      </label>
                      <input
                        type="url"
                        value={banner.imageUrl}
                        onChange={(e) => updateBanner(index, { imageUrl: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Recommended size: 1920x600px
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input
                          type="text"
                          value={banner.title || ''}
                          onChange={(e) => updateBanner(index, { title: e.target.value })}
                          placeholder="Welcome to Our Store"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Subtitle</label>
                        <input
                          type="text"
                          value={banner.subtitle || ''}
                          onChange={(e) => updateBanner(index, { subtitle: e.target.value })}
                          placeholder="Discover amazing products"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">CTA Button Text</label>
                        <input
                          type="text"
                          value={banner.ctaText || ''}
                          onChange={(e) => updateBanner(index, { ctaText: e.target.value })}
                          placeholder="Shop Now"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">CTA Button Link</label>
                        <input
                          type="url"
                          value={banner.ctaLink || ''}
                          onChange={(e) => updateBanner(index, { ctaLink: e.target.value })}
                          placeholder="/products"
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Preview */}
                    {banner.imageUrl && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-2">Preview</label>
                        <div className="relative h-48 rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={banner.imageUrl}
                            alt={banner.title || 'Banner preview'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '';
                              (e.target as HTMLImageElement).alt = 'Invalid image URL';
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center">
                            <div className="px-6 text-white">
                              {banner.title && (
                                <h3 className="text-2xl font-bold mb-2">{banner.title}</h3>
                              )}
                              {banner.subtitle && (
                                <p className="text-sm mb-3">{banner.subtitle}</p>
                              )}
                              {banner.ctaText && (
                                <span className="inline-block bg-white text-blue-600 px-4 py-2 rounded text-sm font-semibold">
                                  {banner.ctaText}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              <button
                onClick={addBanner}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Another Banner
              </button>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Link
            href="/vendor/dashboard"
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
