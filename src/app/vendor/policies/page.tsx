'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import UnifiedHeader from '@/components/UnifiedHeader';
import CategorySidebar from '@/components/CategorySidebar';
import { Package, XCircle } from 'lucide-react';
import { useVendorPolicies, useUpdateVendorPolicies } from '@/hooks/useVendorPolicies';

interface Policy {
  enabled: boolean;
  text: string;
  days?: number;
}

export default function VendorPoliciesPage() {
  const router = useRouter();
  const { data, isLoading: loading, error } = useVendorPolicies();
  const updatePoliciesMutation = useUpdateVendorPolicies();
  const [showHelp, setShowHelp] = useState(false);
  
  const vendor = data?.vendor;
  const marketplacePolicies = data?.marketplacePolicies || { returnPolicy: null, cancellationPolicy: null };
  
  const [formData, setFormData] = useState({
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

  // Update form data when vendor data loads
  useEffect(() => {
    if (data) {
      // Set return policy
      if (vendor?.returnPolicy) {
        setFormData(prev => ({ ...prev, returnPolicy: vendor.returnPolicy }));
        setUseMarketplaceDefaults(prev => ({ ...prev, return: false }));
      } else if (marketplacePolicies.returnPolicy) {
        setFormData(prev => ({ 
          ...prev, 
          returnPolicy: {
            enabled: marketplacePolicies.returnPolicy.enabled,
            days: marketplacePolicies.returnPolicy.days || 7,
            text: marketplacePolicies.returnPolicy.text,
          }
        }));
      }

      // Set cancellation policy
      if (vendor?.cancellationPolicy) {
        setFormData(prev => ({ ...prev, cancellationPolicy: vendor.cancellationPolicy }));
        setUseMarketplaceDefaults(prev => ({ ...prev, cancellation: false }));
      } else if (marketplacePolicies.cancellationPolicy) {
        setFormData(prev => ({ 
          ...prev, 
          cancellationPolicy: {
            enabled: marketplacePolicies.cancellationPolicy.enabled,
            text: marketplacePolicies.cancellationPolicy.text,
          }
        }));
      }
    }
  }, [data, vendor, marketplacePolicies]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const payload = {
        returnPolicy: useMarketplaceDefaults.return ? null : formData.returnPolicy,
        cancellationPolicy: useMarketplaceDefaults.cancellation ? null : formData.cancellationPolicy,
      };

      await updatePoliciesMutation.mutateAsync(payload);
      alert('Policies updated successfully!');
    } catch (error: any) {
      console.error('Error updating policies:', error);
      alert(`Failed to update policies: ${error.message || 'Unknown error'}`);
    }
  };

  // Handle authentication error
  if (error) {
    if (error.message === 'Authentication required') {
      router.push('/login');
      return null;
    }
  }

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
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* <CategorySidebar /> */}
          <div className="flex-1 max-w-4xl">
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
                <p className="text-sm text-gray-600">Learn how to create fair and effective return & cancellation policies</p>
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
              {/* Why Policies Matter */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📜</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Why Policies Matter</h4>
                    <p className="text-gray-700 mb-3">
                      Clear return and cancellation policies build customer trust and reduce disputes. They set expectations 
                      about what customers can do if they're not satisfied with their purchase. Good policies protect both 
                      you and your customers.
                    </p>
                    <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                      <p className="text-sm font-medium text-green-800 mb-2">✅ Benefits of Clear Policies:</p>
                      <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                        <li><strong>Build Trust:</strong> Customers feel safer buying when they know they can return items</li>
                        <li><strong>Reduce Disputes:</strong> Clear rules prevent misunderstandings and arguments</li>
                        <li><strong>Legal Protection:</strong> Well-defined policies protect you legally</li>
                        <li><strong>Better Reviews:</strong> Fair policies lead to happier customers and positive reviews</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Marketplace Defaults */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🌍</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Marketplace Default vs Custom Policies</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-700 mb-2">📋 Use Marketplace Default</p>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                          <li>Check the "Use marketplace default" box</li>
                          <li>Platform's standard policy applies</li>
                          <li>Good if you're new and unsure</li>
                          <li>Consistent with other vendors</li>
                          <li>Less work for you to maintain</li>
                        </ul>
                      </div>
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="font-medium text-blue-700 mb-2">✏️ Create Custom Policy</p>
                        <ul className="text-sm text-blue-600 space-y-1 list-disc list-inside">
                          <li>Uncheck the default box</li>
                          <li>Write your own policy text</li>
                          <li>Tailor to your business needs</li>
                          <li>Set your own return window</li>
                          <li>More control and flexibility</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Return Policy Guide */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📦</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Creating a Return Policy</h4>
                    <p className="text-gray-700 mb-3">
                      A return policy explains when and how customers can return products for refund or exchange.
                    </p>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-700 mb-2">⏰ Return Window</p>
                        <p className="text-sm text-gray-600 mb-2">Set number of days (typically 7-30 days) customers have to return items:</p>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-4">
                          <li><strong>7 days:</strong> Strict, for perishables or fast-moving items</li>
                          <li><strong>14 days:</strong> Standard for most products</li>
                          <li><strong>30 days:</strong> Generous, builds confidence (recommended for clothing, electronics)</li>
                        </ul>
                      </div>
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="font-medium text-blue-700 mb-2">📝 What to Include in Your Policy:</p>
                        <ul className="text-sm text-blue-600 space-y-1 list-disc list-inside">
                          <li><strong>Time limit:</strong> "Products can be returned within 14 days of delivery"</li>
                          <li><strong>Condition:</strong> "Items must be unused, with original tags and packaging"</li>
                          <li><strong>Process:</strong> "Contact us at [email] to initiate a return"</li>
                          <li><strong>Refund method:</strong> "Refund to original payment method within 5-7 business days"</li>
                          <li><strong>Shipping:</strong> "Customer pays return shipping unless item is defective"</li>
                          <li><strong>Exclusions:</strong> "Sale items, personalized products cannot be returned"</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cancellation Policy Guide */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">❌</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Creating a Cancellation Policy</h4>
                    <p className="text-gray-700 mb-3">
                      A cancellation policy explains when and how customers can cancel orders before shipping.
                    </p>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-700 mb-2">⏱️ Cancellation Window</p>
                        <p className="text-sm text-gray-600">Common approaches:</p>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside ml-4 mt-2">
                          <li><strong>Before Processing:</strong> "Orders can be cancelled before we start processing (usually 2-4 hours)"</li>
                          <li><strong>Before Shipping:</strong> "Cancel anytime before the item ships"</li>
                          <li><strong>Time-Based:</strong> "Cancel within 24 hours of ordering"</li>
                        </ul>
                      </div>
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="font-medium text-blue-700 mb-2">📝 What to Include in Your Policy:</p>
                        <ul className="text-sm text-blue-600 space-y-1 list-disc list-inside">
                          <li><strong>Deadline:</strong> "Orders can be cancelled before shipping"</li>
                          <li><strong>How to cancel:</strong> "Email us at [email] or call [phone]"</li>
                          <li><strong>Refund timeframe:</strong> "Full refund within 3-5 business days"</li>
                          <li><strong>After shipping:</strong> "Once shipped, you must use our return process instead"</li>
                          <li><strong>Booking products:</strong> "Cancellations 24 hours before booking: full refund; later: 50% fee"</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sample Policies */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📋</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Sample Policy Templates</h4>
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 rounded border border-green-200">
                        <p className="font-medium text-green-800 mb-2">✅ Sample Return Policy:</p>
                        <p className="text-sm text-green-700 italic">
                          "We accept returns within 14 days of delivery for a full refund or exchange. Items must be unused, 
                          unwashed, and with original tags attached. To initiate a return, email us at returns@yourstore.com 
                          with your order number and reason for return. Refunds are processed within 5-7 business days to your 
                          original payment method. Customers are responsible for return shipping costs unless the item is 
                          defective or we sent the wrong item. Sale items and personalized products cannot be returned."
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded border border-blue-200">
                        <p className="font-medium text-blue-800 mb-2">✅ Sample Cancellation Policy:</p>
                        <p className="text-sm text-blue-700 italic">
                          "Orders can be cancelled free of charge before they are shipped. To cancel, email support@yourstore.com 
                          or call us at [phone number] as soon as possible. Once an order has shipped, cancellation is no longer 
                          possible, but you may return the item per our return policy. Refunds for cancelled orders are processed 
                          within 3-5 business days to your original payment method."
                        </p>
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
                    <span><strong>Too strict:</strong> "No returns or exchanges" scares customers away</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Vague language:</strong> "Returns accepted in some cases" - be specific about conditions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Hidden fees:</strong> Mention ALL fees upfront (restocking, return shipping, etc.)</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>No contact info:</strong> Always provide email/phone for questions</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Ignoring local laws:</strong> Some countries require minimum return periods by law</span>
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
                    <span>Be clear and specific - no ambiguity</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Make policies easy to find on your store</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Balance fairness to customers and yourself</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Update policies if your business changes</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Honor your policies consistently</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Consider insurance for expensive items</span>
                  </div>
                </div>
              </div>
            </div>
          )}
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
              disabled={updatePoliciesMutation.isPending}
              className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {updatePoliciesMutation.isPending ? 'Saving...' : 'Save Policies'}
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
    </div>
  );
}
