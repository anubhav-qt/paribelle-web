'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import UnifiedHeader from '@/components/UnifiedHeader';
import VendorLocationSelector from '@/components/VendorLocationSelector';
import ImageUpload from '@/components/ImageUpload';
import { getVendorId } from '@/lib/auth';

export default function VendorSettingsPage() {
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [formData, setFormData] = useState({
    storeName: '',
    businessName: '',
    contactEmail: '',
    contactPhone: '',
    description: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    cityId: '',
    subLocationId: '',
    pincode: '',
    shippingCost: '',
    freeShippingThreshold: '',
    logo: '',
  });

  useEffect(() => {
    fetchVendorData();
  }, []);

  const fetchVendorData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return;
      }

      const vendorId = getVendorId();
      if (!vendorId) {
        console.error('No vendorId found');
        return;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVendor(data);
        setFormData({
          storeName: data.storeName || '',
          businessName: data.businessName || '',
          contactEmail: data.contactEmail || '',
          contactPhone: data.contactPhone || '',
          description: data.description || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          postalCode: data.postalCode || '',
          cityId: data.cityId || '',
          subLocationId: data.subLocationId || '',
          pincode: data.pincode || '',
          shippingCost: data.shippingCost || '50',
          freeShippingThreshold: data.freeShippingThreshold || '',
          logo: data.logo || '',
        });
      }
    } catch (error) {
      console.error('Error fetching vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return;
      }

      const vendorId = getVendorId();
      if (!vendorId) {
        console.error('No vendorId found');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const responseData = await response.json();
      console.log('Update response:', responseData);

      if (response.ok) {
        if (responseData.statusCode && responseData.statusCode !== 200) {
          throw new Error(responseData.message || 'Failed to update settings');
        }
        alert('Settings updated successfully!');
        // Reload the page to refresh the vendor context and header
        window.location.reload();
      } else {
        throw new Error(responseData.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Failed to update settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UnifiedHeader showLocationFilter={false} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/vendor/dashboard"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Store Settings</h1>
          <p className="text-gray-600 mt-2">Update your store information</p>
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
                <p className="text-sm text-gray-600">Learn how to configure your store settings properly</p>
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
              {/* Store Identity */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🏪</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Store Identity & Branding</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="font-medium text-blue-700 mb-2">🏷️ Store Name (Required)</p>
                        <p className="text-sm text-blue-600">This is how customers see your store. Choose a memorable, descriptive name (e.g., "TechHub Electronics", "Bella's Boutique").</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-700 mb-2">🏢 Business Name</p>
                        <p className="text-sm text-gray-600">Your registered company name for invoices and legal documents (can be different from Store Name).</p>
                      </div>
                      <div className="p-3 bg-purple-50 rounded border border-purple-200">
                        <p className="font-medium text-purple-700 mb-2">🖼️ Store Logo</p>
                        <p className="text-sm text-purple-600">Upload a 200x200px square image. Shows on your store page and builds brand recognition. Use a clear, simple design.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📞</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="text-blue-600">📧</span>
                        <div>
                          <p className="font-medium text-gray-700">Contact Email (Required)</p>
                          <p className="text-sm text-gray-600">Customers use this to reach you. Check it regularly! Use a professional email.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-600">☎️</span>
                        <div>
                          <p className="font-medium text-gray-700">Contact Phone</p>
                          <p className="text-sm text-gray-600">Optional but recommended. Provides another way for customers to contact you.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-600">📝</span>
                        <div>
                          <p className="font-medium text-gray-700">Description</p>
                          <p className="text-sm text-gray-600">Tell customers about your store, what makes you unique, your story (e.g., "Family-owned since 1995, specializing in handcrafted leather goods").</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location & Shipping */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📍</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Location & Shipping Settings</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-700 mb-2">🏠 Address & Location</p>
                        <p className="text-sm text-gray-600 mb-2">Enter your business address, city, state, and pincode. Select City and Sub-Location to help customers find you.</p>
                        <p className="text-xs text-gray-500 italic">Note: Location helps with local delivery and customer trust.</p>
                      </div>
                      <div className="p-3 bg-green-50 rounded border border-green-200">
                        <p className="font-medium text-green-700 mb-2">🚚 Shipping Cost</p>
                        <p className="text-sm text-green-600">Set your default shipping fee (e.g., ₹50). This applies to all orders unless you set free shipping threshold.</p>
                      </div>
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="font-medium text-blue-700 mb-2">🎁 Free Shipping Threshold</p>
                        <p className="text-sm text-blue-600">Orders above this amount get free shipping (e.g., ₹500). Leave empty if you don't offer free shipping. This encourages larger orders!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Best Practices */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">⭐</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Setting Up Your Store - Best Practices</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                        <p className="text-gray-700"><strong>Fill everything:</strong> Complete all fields. More information = more customer trust.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                        <p className="text-gray-700"><strong>Professional branding:</strong> Use a quality logo and clear description. First impressions matter!</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                        <p className="text-gray-700"><strong>Competitive shipping:</strong> Research competitors' shipping costs. Too high scares buyers away.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                        <p className="text-gray-700"><strong>Update regularly:</strong> Keep contact info current. Nothing worse than customers unable to reach you!</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">5</span>
                        <p className="text-gray-700"><strong>Test everything:</strong> After saving, view your store as a customer to see how it looks.</p>
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
                    <span><strong>Generic names:</strong> "MyStore" or "Shop123" aren't memorable. Be unique!</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Personal email:</strong> Use business email, not "cooldude2000@email.com"</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Blurry logo:</strong> Low-quality images look unprofessional</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>No description:</strong> Customers want to know who you are!</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Unrealistic shipping:</strong> ₹10 shipping nationwide isn't sustainable</span>
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
                    <span>Save often while editing settings</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Use keywords in description for SEO</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Set free shipping threshold to boost sales</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Respond quickly to customer emails</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Update logo during rebranding</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Review settings quarterly for accuracy</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Store Name *
                </label>
                <input
                  type="text"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Store Logo
              </label>
              <ImageUpload
                value={formData.logo}
                onChange={(url) => setFormData({ ...formData, logo: url })}
                label="Upload Store Logo"
              />
              <p className="text-sm text-gray-500 mt-2">
                Recommended size: 200x200px (square). Your logo will be displayed on your store page.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email *
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell customers about your store..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <VendorLocationSelector
                initialCityId={formData.cityId}
                initialSubLocationId={formData.subLocationId}
                initialPincode={formData.pincode}
                onLocationChange={(data) => {
                  setFormData({
                    ...formData,
                    cityId: data.cityId || '',
                    subLocationId: data.subLocationId || '',
                    pincode: data.pincode || '',
                    city: data.cityName || formData.city,
                    state: data.state || formData.state,
                  });
                }}
              />
            </div>

            {/* Shipping Settings */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4">Shipping Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shipping Cost (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.shippingCost}
                    onChange={(e) => setFormData({ ...formData, shippingCost: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="50.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default shipping charge for orders
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Free Shipping Threshold (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.freeShippingThreshold}
                    onChange={(e) => setFormData({ ...formData, freeShippingThreshold: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="500.00"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Orders above this amount get free shipping (leave empty for no free shipping)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <Link
                href="/vendor/dashboard"
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
