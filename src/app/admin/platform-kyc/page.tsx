'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ThemeRenderer from '@/components/ThemeRenderer';

interface KYCDocument {
  type: 'pan' | 'tan' | 'gst_certificate' | 'incorporation_certificate' | 'bank_statement' | 'address_proof' | 'cancelled_cheque' | 'moa' | 'aoa';
  documentNumber?: string;
  fileUrl: string;
  uploadedAt: string;
}

interface PlatformSettings {
  id: string;
  businessName: string;
  businessLegalName: string;
  businessType: string;
  businessEmail: string;
  businessPhone: string;
  panNumber?: string;
  tanNumber?: string;
  gstRegistrationType?: string;
  gstin?: string;
  gstState?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankAccountHolderName?: string;
  kycDocuments: KYCDocument[];
  kycStatus: 'pending' | 'incomplete' | 'complete' | 'needs_update';
  defaultCommissionPercentage: number;
}

const documentTypes = [
  { type: 'pan', label: 'PAN Card', required: true },
  { type: 'tan', label: 'TAN Document', required: false },
  { type: 'gst_certificate', label: 'GST Certificate', required: true },
  { type: 'incorporation_certificate', label: 'Certificate of Incorporation', required: true },
  { type: 'bank_statement', label: 'Bank Statement (Last 3 months)', required: true },
  { type: 'cancelled_cheque', label: 'Cancelled Cheque', required: true },
  { type: 'address_proof', label: 'Business Address Proof', required: false },
  { type: 'moa', label: 'Memorandum of Association (MOA)', required: false },
  { type: 'aoa', label: 'Articles of Association (AOA)', required: false },
];

export default function PlatformKYCPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [formData, setFormData] = useState({
    // Business Info
    businessName: '',
    businessLegalName: '',
    businessType: 'private_limited',
    businessEmail: '',
    businessPhone: '',
    // Address
    registeredAddressLine1: '',
    registeredAddressLine2: '',
    registeredCity: '',
    registeredState: '',
    registeredPincode: '',
    // Tax Info
    panNumber: '',
    tanNumber: '',
    gstRegistrationType: 'regular',
    gstin: '',
    gstState: '',
    // Bank Info
    bankName: '',
    bankAccountNumber: '',
    bankIfscCode: '',
    bankAccountHolderName: '',
    bankBranch: '',
    // Commission
    defaultCommissionPercentage: 10,
  });
  const [documents, setDocuments] = useState<{ [key: string]: File | null }>({});
  const [documentNumbers, setDocumentNumbers] = useState<{ [key: string]: string }>({});
  const [uploadedDocs, setUploadedDocs] = useState<KYCDocument[]>([]);

  useEffect(() => {
    fetchPlatformSettings();
  }, []);

  const fetchPlatformSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/platform/settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setFormData({
          businessName: data.businessName || '',
          businessLegalName: data.businessLegalName || '',
          businessType: data.businessType || 'private_limited',
          businessEmail: data.businessEmail || '',
          businessPhone: data.businessPhone || '',
          registeredAddressLine1: data.registeredAddressLine1 || '',
          registeredAddressLine2: data.registeredAddressLine2 || '',
          registeredCity: data.registeredCity || '',
          registeredState: data.registeredState || '',
          registeredPincode: data.registeredPincode || '',
          panNumber: data.panNumber || '',
          tanNumber: data.tanNumber || '',
          gstRegistrationType: data.gstRegistrationType || 'regular',
          gstin: data.gstin || '',
          gstState: data.gstState || '',
          bankName: data.bankName || '',
          bankAccountNumber: data.bankAccountNumber || '',
          bankIfscCode: data.bankIfscCode || '',
          bankAccountHolderName: data.bankAccountHolderName || '',
          bankBranch: data.bankBranch || '',
          defaultCommissionPercentage: data.defaultCommissionPercentage || 10,
        });
        setUploadedDocs(data.kycDocuments || []);
      }
    } catch (error) {
      console.error('Error fetching platform settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (type: string, file: File | null) => {
    setDocuments({ ...documents, [type]: file });
  };

  const uploadDocument = async (type: string, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:4000/upload/kyc', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload ${type}`);
    }

    const data = await response.json();
    return data.url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const token = localStorage.getItem('token');

      // Step 1: Update basic platform settings
      const settingsResponse = await fetch('http://localhost:4000/platform/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!settingsResponse.ok) {
        throw new Error('Failed to update platform settings');
      }

      // Step 2: Upload new documents
      const newDocs: KYCDocument[] = [...uploadedDocs];
      for (const [type, file] of Object.entries(documents)) {
        if (file) {
          const fileUrl = await uploadDocument(type, file);
          newDocs.push({
            type: type as any,
            documentNumber: documentNumbers[type],
            fileUrl,
            uploadedAt: new Date().toISOString(),
          });
        }
      }

      // Step 3: Complete KYC if all required fields are filled
      if (formData.panNumber && formData.gstin && formData.bankAccountNumber) {
        const kycResponse = await fetch('http://localhost:4000/platform/kyc/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            panNumber: formData.panNumber,
            tanNumber: formData.tanNumber,
            gstRegistrationType: formData.gstRegistrationType,
            gstin: formData.gstin,
            gstState: formData.gstState,
            bankName: formData.bankName,
            bankAccountNumber: formData.bankAccountNumber,
            bankIfscCode: formData.bankIfscCode,
            bankAccountHolderName: formData.bankAccountHolderName,
            kycDocuments: newDocs,
          }),
        });

        if (!kycResponse.ok) {
          const error = await kycResponse.json();
          throw new Error(error.message || 'Failed to complete KYC');
        }
      }

      alert('Platform settings and KYC updated successfully!');
      fetchPlatformSettings();
      setDocuments({});
    } catch (error: any) {
      console.error('Error updating platform settings:', error);
      alert(error.message || 'Failed to update platform settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading platform settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ThemeRenderer component="header" />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-3xl font-bold text-gray-900">Platform KYC & Settings</h1>
          </div>
          <p className="text-gray-600">Complete platform KYC to enable GST filing and invoice generation</p>
          
          {/* KYC Status Badge */}
          <div className="mt-4">
            {settings?.kycStatus === 'complete' && (
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                KYC Complete
              </span>
            )}
            {settings?.kycStatus === 'incomplete' && (
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                KYC Incomplete
              </span>
            )}
            {settings?.kycStatus === 'pending' && (
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                KYC Pending
              </span>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Business Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Legal Business Name *</label>
                <input
                  type="text"
                  value={formData.businessLegalName}
                  onChange={(e) => setFormData({ ...formData, businessLegalName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Type *</label>
                <select
                  value={formData.businessType}
                  onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="proprietorship">Proprietorship</option>
                  <option value="partnership">Partnership</option>
                  <option value="private_limited">Private Limited</option>
                  <option value="llp">LLP</option>
                  <option value="public_limited">Public Limited</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Email *</label>
                <input
                  type="email"
                  value={formData.businessEmail}
                  onChange={(e) => setFormData({ ...formData, businessEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone *</label>
                <input
                  type="tel"
                  value={formData.businessPhone}
                  onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Registered Address */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Registered Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
                <input
                  type="text"
                  value={formData.registeredAddressLine1}
                  onChange={(e) => setFormData({ ...formData, registeredAddressLine1: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address Line 2</label>
                <input
                  type="text"
                  value={formData.registeredAddressLine2}
                  onChange={(e) => setFormData({ ...formData, registeredAddressLine2: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  value={formData.registeredCity}
                  onChange={(e) => setFormData({ ...formData, registeredCity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <input
                  type="text"
                  value={formData.registeredState}
                  onChange={(e) => setFormData({ ...formData, registeredState: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pincode *</label>
                <input
                  type="text"
                  value={formData.registeredPincode}
                  onChange={(e) => setFormData({ ...formData, registeredPincode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                  maxLength={6}
                />
              </div>
            </div>
          </div>

          {/* Tax Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Tax Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number *</label>
                <input
                  type="text"
                  value={formData.panNumber}
                  onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  maxLength={10}
                  placeholder="ABCDE1234F"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TAN Number</label>
                <input
                  type="text"
                  value={formData.tanNumber}
                  onChange={(e) => setFormData({ ...formData, tanNumber: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  maxLength={10}
                  placeholder="ABCD12345E"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">GST Registration Type *</label>
                <select
                  value={formData.gstRegistrationType}
                  onChange={(e) => setFormData({ ...formData, gstRegistrationType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="unregistered">Unregistered</option>
                  <option value="regular">Regular</option>
                  <option value="composition">Composition</option>
                </select>
              </div>
              {formData.gstRegistrationType !== 'unregistered' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN *</label>
                    <input
                      type="text"
                      value={formData.gstin}
                      onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                      maxLength={15}
                      placeholder="22AAAAA0000A1Z5"
                      required={formData.gstRegistrationType !== 'unregistered'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">GST State</label>
                    <input
                      type="text"
                      value={formData.gstState}
                      onChange={(e) => setFormData({ ...formData, gstState: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Bank Details */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Bank Details for Commission Collection</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name *</label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
                <input
                  type="text"
                  value={formData.bankAccountNumber}
                  onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code *</label>
                <input
                  type="text"
                  value={formData.bankIfscCode}
                  onChange={(e) => setFormData({ ...formData, bankIfscCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  maxLength={11}
                  placeholder="ABCD0123456"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name *</label>
                <input
                  type="text"
                  value={formData.bankAccountHolderName}
                  onChange={(e) => setFormData({ ...formData, bankAccountHolderName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                <input
                  type="text"
                  value={formData.bankBranch}
                  onChange={(e) => setFormData({ ...formData, bankBranch: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Platform Commission */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Platform Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Default Commission (%) *</label>
                <input
                  type="number"
                  value={formData.defaultCommissionPercentage}
                  onChange={(e) => setFormData({ ...formData, defaultCommissionPercentage: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  min="0"
                  max="100"
                  step="0.01"
                  required
                />
                <p className="mt-1 text-sm text-gray-500">Commission percentage charged from vendors</p>
              </div>
            </div>
          </div>

          {/* KYC Documents */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">KYC Documents</h2>
            <div className="space-y-4">
              {documentTypes.map(({ type, label, required }) => {
                const existingDoc = uploadedDocs.find(doc => doc.type === type);
                return (
                  <div key={type} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">
                        {label} {required && <span className="text-red-500">*</span>}
                      </label>
                      {existingDoc && (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                          ✓ Uploaded
                        </span>
                      )}
                    </div>
                    
                    {type !== 'gst_certificate' && type !== 'cancelled_cheque' && (
                      <input
                        type="text"
                        placeholder="Document Number (if applicable)"
                        value={documentNumbers[type] || ''}
                        onChange={(e) => setDocumentNumbers({ ...documentNumbers, [type]: e.target.value })}
                        className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    )}

                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleFileChange(type, e.target.files?.[0] || null)}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    
                    {existingDoc && (
                      <a
                        href={existingDoc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center text-sm text-indigo-600 hover:text-indigo-500"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Uploaded Document
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Platform Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
