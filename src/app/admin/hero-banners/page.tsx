'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save, MoveUp, MoveDown, Image as ImageIcon } from 'lucide-react';
import { Loader } from '@/components/ui/Loader';

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
  const [showHelp, setShowHelp] = useState(false);

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
        router.push('/admin');
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
        <Loader size="md" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* null */}
          <div className="flex-1 max-w-6xl">
            <div className="mb-6">
              <Link
                href="/admin"
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

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg mb-6">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Beginner's Guide</h3>
                <p className="text-sm text-gray-600">Learn how to create eye-catching hero banners for your store</p>
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
              {/* What are Hero Banners */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🎨</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">What are Hero Banners?</h4>
                    <p className="text-gray-700 mb-3">
                      Hero banners are the large, eye-catching images that appear at the top of your store page in a rotating carousel. 
                      They're the first thing customers see when visiting your store - use them to showcase featured products, 
                      promotions, new arrivals, or your brand story.
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm font-medium text-blue-800 mb-2">✨ Best Uses for Hero Banners:</p>
                      <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                        <li><strong>Sales & Promotions</strong> - "50% Off Summer Collection"</li>
                        <li><strong>New Product Launches</strong> - "Introducing Our New Smartwatch"</li>
                        <li><strong>Seasonal Campaigns</strong> - "Holiday Gift Guide 2024"</li>
                        <li><strong>Brand Storytelling</strong> - "Handcrafted with Love Since 1990"</li>
                        <li><strong>Feature Highlights</strong> - "Free Shipping on Orders Above ₹500"</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Creating Banners */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">➕</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Creating a Hero Banner</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                        <p className="text-gray-700">Click the <strong>"+ Add Banner"</strong> button to create a new slide</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                        <p className="text-gray-700"><strong>Image URL:</strong> Enter the full URL of your banner image (e.g., https://your-site.com/banner.jpg)</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                        <p className="text-gray-700"><strong>Title:</strong> Main heading shown on the banner (e.g., "Summer Sale")</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                        <p className="text-gray-700"><strong>Subtitle:</strong> Supporting text below the title (e.g., "Up to 50% off on selected items")</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">5</span>
                        <p className="text-gray-700"><strong>CTA Text:</strong> Button text (e.g., "Shop Now", "Learn More", "Get Started")</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">6</span>
                        <p className="text-gray-700"><strong>CTA Link:</strong> Where the button takes customers (e.g., /category/summer-collection)</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">7</span>
                        <p className="text-gray-700">Click <strong>"Save Changes"</strong> at the top to publish your banners</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Image Guidelines */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📐</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Image Size & Quality Guidelines</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-3 bg-green-50 rounded border border-green-200">
                        <p className="font-medium text-green-800 mb-2">✅ Recommended Specs</p>
                        <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                          <li><strong>Dimensions:</strong> 1920x600 pixels</li>
                          <li><strong>Aspect Ratio:</strong> 16:5 (widescreen)</li>
                          <li><strong>Format:</strong> JPG, PNG, or WEBP</li>
                          <li><strong>File Size:</strong> Under 500KB for fast loading</li>
                          <li><strong>Resolution:</strong> 72 DPI for web</li>
                        </ul>
                      </div>
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="font-medium text-blue-800 mb-2">💡 Design Tips</p>
                        <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                          <li>Use high-contrast colors for text</li>
                          <li>Keep main content in center 60%</li>
                          <li>Avoid text on busy backgrounds</li>
                          <li>Use bold, readable fonts</li>
                          <li>Optimize images before uploading</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Reordering & Managing */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🔄</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Reordering & Managing Banners</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-700 mb-2">⬆️⬇️ Change Order</p>
                        <p className="text-sm text-gray-600">Use the up/down arrow buttons to reorder slides. The top banner shows first in the carousel rotation.</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-700 mb-2">🗑️ Delete Banner</p>
                        <p className="text-sm text-gray-600">Click the trash icon to remove a banner. You'll be asked to confirm before deletion.</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-700 mb-2">💾 Save Changes</p>
                        <p className="text-sm text-gray-600">Always click "Save Changes" at the top after editing. Changes won't appear until you save.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA Best Practices */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🎯</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Effective Call-to-Action (CTA)</h4>
                    <p className="text-gray-700 mb-3">
                      A good CTA button drives customer action. Make it clear, compelling, and relevant to your banner's message.
                    </p>
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="p-3 bg-green-50 rounded border border-green-200">
                        <p className="text-sm font-medium text-green-800 mb-2">✅ Good CTAs</p>
                        <ul className="text-sm text-green-700 space-y-1">
                          <li>"Shop Summer Sale" → clear and specific</li>
                          <li>"Explore Collection" → invites browsing</li>
                          <li>"Get 50% Off" → highlights benefit</li>
                          <li>"Learn More" → for information pages</li>
                        </ul>
                      </div>
                      <div className="p-3 bg-red-50 rounded border border-red-200">
                        <p className="text-sm font-medium text-red-800 mb-2">❌ Weak CTAs</p>
                        <ul className="text-sm text-red-700 space-y-1">
                          <li>"Click Here" → too generic</li>
                          <li>"Submit" → not action-oriented</li>
                          <li>"Go" → lacks context</li>
                          <li>"OK" → not compelling</li>
                        </ul>
                      </div>
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
                    <span><strong>Too many banners:</strong> 3-5 banners max. More causes slow loading and banner blindness.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Low-quality images:</strong> Blurry or pixelated images look unprofessional and hurt credibility.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Too much text:</strong> Keep copy short and punchy. Long paragraphs don't work on banners.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Broken links:</strong> Always test CTA links before saving. Broken links frustrate customers.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Outdated content:</strong> Update banners regularly. Don't keep "Summer Sale" in winter!</span>
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
                    <span>Update banners for seasons and holidays</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Use action-oriented language in titles</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Test on mobile devices after publishing</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Compress images to improve page speed</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Maintain consistent brand colors and style</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Track which banners drive the most clicks</span>
                  </div>
                </div>
              </div>
            </div>
          )}
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
            href="/admin"
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
      </div>
    </div>
  );
}
