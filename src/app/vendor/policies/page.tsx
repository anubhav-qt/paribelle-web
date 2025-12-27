'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UnifiedHeader from '@/components/UnifiedHeader';
import { Package, XCircle } from 'lucide-react';
import { getVendorId } from '@/lib/auth';

interface Policy {
  enabled: boolean;
  text: string;
  days?: number;
}

export default function VendorPoliciesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendor, setVendor] = useState<any>(null);
  const [marketplacePolicies, setMarketplacePolicies] = useState<{
    returnPolicy: Policy | null;
    cancellationPolicy: Policy | null;
  }>({ returnPolicy: null, cancellationPolicy: null });
  
  const [formData, setFormData] = useState<{
    returnPolicy: {
      enabled: boolean;
      days?: number;
      text: string;
    };
    cancellationPolicy: {
      enabled: boolean;
      text: string;
    };
  }>({
    returnPolicy: {
      enabled: true,
      days: 7,
      text: '',
    },
    cancellationPolicy: {
      enabled: true,
      text: '',
    },
  });

  const [useMarketplaceDefaults, setUseMarketplaceDefaults] = useState({
    return: true,
    cancellation: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        router.push('/login');
        return;
      }

      const vendorId = getVendorId();
      if (!vendorId) {
        console.error('No vendorId found');
        router.push('/login');
        return;
      }

      // Fetch marketplace default policies
      const [returnRes, cancellationRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/return_policy`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/cancellation_policy`),
      ]);

      if (returnRes.ok) {
        const data = await returnRes.json();
        const policy = data.value ? JSON.parse(data.value) : null;
        setMarketplacePolicies(prev => ({ ...prev, returnPolicy: policy }));
      }

      if (cancellationRes.ok) {
        const data = await cancellationRes.json();
        const policy = data.value ? JSON.parse(data.value) : null;
        setMarketplacePolicies(prev => ({ ...prev, cancellationPolicy: policy }));
      }

      // Fetch vendor data
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVendor(data);
        
        // If vendor has custom policies, use them; otherwise use marketplace defaults
        if (data.returnPolicy) {
          setFormData(prev => ({ ...prev, returnPolicy: data.returnPolicy }));
          setUseMarketplaceDefaults(prev => ({ ...prev, return: false }));
        } else if (marketplacePolicies.returnPolicy) {
          const mp = marketplacePolicies.returnPolicy;
          setFormData(prev => ({ 
            ...prev, 
            returnPolicy: { 
              enabled: mp.enabled,
              days: mp.days || 7,
              text: mp.text 
            } 
          }));
        }

        if (data.cancellationPolicy) {
          setFormData(prev => ({ ...prev, cancellationPolicy: data.cancellationPolicy }));
          setUseMarketplaceDefaults(prev => ({ ...prev, cancellation: false }));
        } else if (marketplacePolicies.cancellationPolicy) {
          const mc = marketplacePolicies.cancellationPolicy;
          setFormData(prev => ({ 
            ...prev, 
            cancellationPolicy: { 
              enabled: mc.enabled,
              text: mc.text 
            } 
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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

      // If using marketplace defaults, send null to clear custom policies
      const payload = {
        returnPolicy: useMarketplaceDefaults.return ? null : formData.returnPolicy,
        cancellationPolicy: useMarketplaceDefaults.cancellation ? null : formData.cancellationPolicy,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}/policies`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Policies updated successfully!');
        
        // Clear cache for this vendor's policies
        const cacheKey = `vendor_${vendorId}_policies`;
        const timestampKey = `vendor_${vendorId}_policies_timestamp`;
        localStorage.removeItem(cacheKey);
        localStorage.removeItem(timestampKey);
        
        fetchData();
      } else {
        throw new Error('Failed to update policies');
      }
    } catch (error) {
      console.error('Error updating policies:', error);
      alert('Failed to update policies. Please try again.');
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
          <h1 className="text-3xl font-bold text-gray-900">Return & Cancellation Policies</h1>
          <p className="text-gray-600 mt-2">
            Configure your store's return and cancellation policies. Leave empty to use marketplace defaults.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Return Policy Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b">
              <Package className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Return Policy</h2>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useMarketplaceReturn"
                checked={useMarketplaceDefaults.return}
                onChange={(e) => {
                  setUseMarketplaceDefaults(prev => ({ ...prev, return: e.target.checked }));
                  if (e.target.checked && marketplacePolicies.returnPolicy) {
                    setFormData(prev => ({ 
                      ...prev, 
                      returnPolicy: { 
                        enabled: marketplacePolicies.returnPolicy!.enabled,
                        days: marketplacePolicies.returnPolicy!.days || 7,
                        text: marketplacePolicies.returnPolicy!.text 
                      } 
                    }));
                  }
                }}
                className="w-4 h-4 text-blue-600"
              />
              <label htmlFor="useMarketplaceReturn" className="text-sm text-gray-700">
                Use marketplace default return policy
              </label>
            </div>

            {marketplacePolicies.returnPolicy && useMarketplaceDefaults.return && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Marketplace Default:</strong> {marketplacePolicies.returnPolicy.text}
                </p>
              </div>
            )}

            {!useMarketplaceDefaults.return && (
              <>
                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={formData.returnPolicy.enabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        returnPolicy: { ...formData.returnPolicy, enabled: e.target.checked }
                      })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Return Policy</span>
                  </label>
                </div>

                {formData.returnPolicy.enabled && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Return Window (Days)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={formData.returnPolicy.days || 7}
                        onChange={(e) => setFormData({
                          ...formData,
                          returnPolicy: { ...formData.returnPolicy, days: parseInt(e.target.value) }
                        })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Number of days customers have to return items
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Return Policy Text
                      </label>
                      <textarea
                        value={formData.returnPolicy.text}
                        onChange={(e) => setFormData({
                          ...formData,
                          returnPolicy: { ...formData.returnPolicy, text: e.target.value }
                        })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Describe your return policy conditions..."
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Cancellation Policy Section */}
          <div className="space-y-4 pt-6 border-t">
            <div className="flex items-center gap-3 pb-4 border-b">
              <XCircle className="w-6 h-6 text-orange-600" />
              <h2 className="text-xl font-semibold text-gray-900">Cancellation Policy</h2>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="useMarketplaceCancellation"
                checked={useMarketplaceDefaults.cancellation}
                onChange={(e) => {
                  setUseMarketplaceDefaults(prev => ({ ...prev, cancellation: e.target.checked }));
                  if (e.target.checked && marketplacePolicies.cancellationPolicy) {
                    setFormData(prev => ({ 
                      ...prev, 
                      cancellationPolicy: { 
                        enabled: marketplacePolicies.cancellationPolicy!.enabled,
                        text: marketplacePolicies.cancellationPolicy!.text 
                      } 
                    }));
                  }
                }}
                className="w-4 h-4 text-blue-600"
              />
              <label htmlFor="useMarketplaceCancellation" className="text-sm text-gray-700">
                Use marketplace default cancellation policy
              </label>
            </div>

            {marketplacePolicies.cancellationPolicy && useMarketplaceDefaults.cancellation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Marketplace Default:</strong> {marketplacePolicies.cancellationPolicy.text}
                </p>
              </div>
            )}

            {!useMarketplaceDefaults.cancellation && (
              <>
                <div>
                  <label className="flex items-center gap-2 mb-2">
                    <input
                      type="checkbox"
                      checked={formData.cancellationPolicy.enabled}
                      onChange={(e) => setFormData({
                        ...formData,
                        cancellationPolicy: { ...formData.cancellationPolicy, enabled: e.target.checked }
                      })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span className="text-sm font-medium text-gray-700">Enable Cancellation Policy</span>
                  </label>
                </div>

                {formData.cancellationPolicy.enabled && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cancellation Policy Text
                    </label>
                    <textarea
                      value={formData.cancellationPolicy.text}
                      onChange={(e) => setFormData({
                        ...formData,
                        cancellationPolicy: { ...formData.cancellationPolicy, text: e.target.value }
                      })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Describe your cancellation policy conditions..."
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Policies'}
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
  );
}
