'use client';

import { useState, useEffect } from 'react';
import { Upload, CheckCircle, XCircle, AlertCircle, FileText, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface KYCDocument {
  type: string;
  label: string;
  required: boolean;
  accepted: string;
  file: File | null;
  url: string | null;
  documentNumber?: string;
}

const DOCUMENT_TYPES: Omit<KYCDocument, 'file' | 'url' | 'documentNumber'>[] = [
  {
    type: 'pan',
    label: 'PAN Card',
    required: true,
    accepted: '.pdf,.jpg,.jpeg,.png',
  },
  {
    type: 'aadhar_front',
    label: 'Aadhar Card (Front)',
    required: true,
    accepted: '.pdf,.jpg,.jpeg,.png',
  },
  {
    type: 'aadhar_back',
    label: 'Aadhar Card (Back)',
    required: true,
    accepted: '.pdf,.jpg,.jpeg,.png',
  },
  {
    type: 'gst_certificate',
    label: 'GST Certificate',
    required: false,
    accepted: '.pdf,.jpg,.jpeg,.png',
  },
  {
    type: 'business_license',
    label: 'Business License/Registration',
    required: false,
    accepted: '.pdf,.jpg,.jpeg,.png',
  },
  {
    type: 'bank_details',
    label: 'Cancelled Cheque / Bank Statement',
    required: true,
    accepted: '.pdf,.jpg,.jpeg,.png',
  },
  {
    type: 'address_proof',
    label: 'Address Proof (Business Address)',
    required: true,
    accepted: '.pdf,.jpg,.jpeg,.png',
  },
];

export default function VendorKYCPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState<string>('pending');
  const [kycRejectedReason, setKycRejectedReason] = useState<string>('');
  const [documents, setDocuments] = useState<KYCDocument[]>([]);
  
  // Business/Tax Details
  const [formData, setFormData] = useState({
    businessName: '',
    panNumber: '',
    gstRegistrationType: 'unregistered',
    gstNumber: '',
    gstState: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    bankAccountNumber: '',
    bankIfscCode: '',
    bankAccountName: '',
  });

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No auth token found');
        alert('Please login to access this page');
        router.push('/login');
        return;
      }
      
      const response = await fetch(`${API_URL}/api/v1/vendors/kyc/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        console.error('Authentication failed - token expired or invalid');
        alert('Your session has expired. Please login again.');
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      if (response.ok) {
        const result = await response.json();
        const vendor = result.data;
        setKycStatus(vendor.kycStatus || 'pending');
        setKycRejectedReason(vendor.kycRejectedReason || '');
        
        // Populate form data
        setFormData({
          businessName: vendor.businessName || '',
          panNumber: vendor.panNumber || '',
          gstRegistrationType: vendor.gstRegistrationType || 'unregistered',
          gstNumber: vendor.gstNumber || '',
          gstState: vendor.gstState || '',
          address: vendor.address || '',
          city: vendor.city || '',
          state: vendor.state || '',
          pincode: vendor.pincode || '',
          bankAccountNumber: vendor.bankAccountNumber || '',
          bankIfscCode: vendor.bankIfscCode || '',
          bankAccountName: vendor.bankAccountName || '',
        });
        
        // Initialize documents
        const initialDocs = DOCUMENT_TYPES.map(docType => ({
          ...docType,
          file: null,
          url: null,
          documentNumber: '',
        }));

        // Populate existing documents
        if (vendor.kycDocuments && Array.isArray(vendor.kycDocuments)) {
          vendor.kycDocuments.forEach((existingDoc: any) => {
            const docIndex = initialDocs.findIndex(d => d.type === existingDoc.type);
            if (docIndex !== -1) {
              initialDocs[docIndex].url = existingDoc.documentUrl;
              initialDocs[docIndex].documentNumber = existingDoc.documentNumber || '';
            }
          });
        }

        setDocuments(initialDocs);
      } else {
        // Initialize empty documents if API fails
        const initialDocs = DOCUMENT_TYPES.map(docType => ({
          ...docType,
          file: null,
          url: null,
          documentNumber: '',
        }));
        setDocuments(initialDocs);
      }
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      // Initialize empty documents on error
      const initialDocs = DOCUMENT_TYPES.map(docType => ({
        ...docType,
        file: null,
        url: null,
        documentNumber: '',
      }));
      setDocuments(initialDocs);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (index: number, file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    const newDocuments = [...documents];
    newDocuments[index].file = file;
    setDocuments(newDocuments);
  };

  const handleDocumentNumberChange = (index: number, value: string) => {
    const newDocuments = [...documents];
    newDocuments[index].documentNumber = value;
    setDocuments(newDocuments);
  };

  const handleSubmit = async () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

    // Validate required fields
    if (!formData.businessName || !formData.panNumber) {
      alert('Please fill in Business Name and PAN Number');
      return;
    }

    if (formData.gstRegistrationType !== 'unregistered' && !formData.gstNumber) {
      alert('Please provide GST Number for registered businesses');
      return;
    }

    // Validate required documents
    const missingDocs = documents.filter(
      doc => doc.required && !doc.file && !doc.url
    );

    if (missingDocs.length > 0) {
      alert(`Please upload required documents: ${missingDocs.map(d => d.label).join(', ')}`);
      return;
    }

    setSubmitting(true);

    try {
      const uploadedDocuments = [];

      // Upload each file
      for (const doc of documents) {
        if (doc.file) {
          const formData = new FormData();
          formData.append('file', doc.file);

          const uploadResponse = await fetch(`${API_URL}/api/v1/upload/kyc-documents`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
            body: formData,
          });

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload ${doc.label}`);
          }

          const uploadResult = await uploadResponse.json();

          uploadedDocuments.push({
            type: doc.type,
            documentNumber: doc.documentNumber || '',
            documentUrl: uploadResult.url,
            uploadedAt: new Date(),
            fileName: doc.file.name,
            fileSize: doc.file.size,
          });
        } else if (doc.url) {
          // Keep existing documents
          uploadedDocuments.push({
            type: doc.type,
            documentNumber: doc.documentNumber || '',
            documentUrl: doc.url,
            uploadedAt: new Date(),
            fileName: 'existing',
            fileSize: 0,
          });
        }
      }

      // Submit KYC with business details
      const submitResponse = await fetch(`${API_URL}/api/v1/vendors/kyc/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ 
          documents: uploadedDocuments,
          businessName: formData.businessName,
          panNumber: formData.panNumber.toUpperCase(),
          gstRegistrationType: formData.gstRegistrationType,
          gstNumber: formData.gstNumber.toUpperCase(),
          gstState: formData.gstState,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          bankAccountNumber: formData.bankAccountNumber,
          bankIfscCode: formData.bankIfscCode.toUpperCase(),
          bankAccountName: formData.bankAccountName,
        }),
      });

      if (!submitResponse.ok) {
        const error = await submitResponse.json();
        throw new Error(error.message || 'Failed to submit KYC');
      }

      alert('KYC documents submitted successfully! You will be notified once verified.');
      router.push('/vendor/dashboard');
    } catch (error: any) {
      console.error('Error submitting KYC:', error);
      alert(`Failed to submit KYC: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    const badges: Record<string, any> = {
      pending: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, text: 'Pending' },
      submitted: { color: 'bg-blue-100 text-blue-800', icon: AlertCircle, text: 'Submitted' },
      under_review: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, text: 'Under Review' },
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Rejected' },
    };

    const badge = badges[kycStatus] || badges.pending;
    const Icon = badge.icon;

    return (
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${badge.color}`}>
        <Icon className="w-5 h-5" />
        <span className="font-medium">{badge.text}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/vendor/dashboard"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-3xl font-bold text-gray-900">KYC Verification</h1>
            </div>
            {getStatusBadge()}
          </div>

          <p className="text-gray-600 mb-8">
            Complete your Know Your Customer (KYC) verification by uploading the required documents.
            All information is kept secure and confidential.
          </p>

          {kycStatus === 'rejected' && kycRejectedReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">KYC Rejected</h3>
                  <p className="text-red-700 text-sm mt-1">{kycRejectedReason}</p>
                  <p className="text-red-600 text-sm mt-2">Please update your documents and resubmit.</p>
                </div>
              </div>
            </div>
          )}

          {kycStatus === 'approved' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900">KYC Approved</h3>
                  <p className="text-green-700 text-sm mt-1">Your account has been verified successfully!</p>
                </div>
              </div>
            </div>
          )}

          {/* Business & Tax Details Form */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Business & Tax Details</h2>
            <p className="text-sm text-gray-600 mb-6">This information will be used on invoices and for GST compliance</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Business Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business/Legal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Your Business Name (as per registration)"
                  required
                />
              </div>

              {/* PAN Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PAN Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.panNumber}
                  onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  required
                />
              </div>

              {/* GST Registration Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  GST Registration Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.gstRegistrationType}
                  onChange={(e) => setFormData({ ...formData, gstRegistrationType: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="unregistered">Unregistered</option>
                  <option value="regular">Regular</option>
                  <option value="composition">Composition</option>
                </select>
              </div>

              {/* GST Number (conditional) */}
              {formData.gstRegistrationType !== 'unregistered' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GSTIN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.gstNumber}
                      onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value.toUpperCase() })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST State
                    </label>
                    <input
                      type="text"
                      value={formData.gstState}
                      onChange={(e) => setFormData({ ...formData, gstState: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="e.g., Maharashtra"
                    />
                  </div>
                </>
              )}

              {/* Business Address */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  rows={2}
                  placeholder="Full business address"
                />
              </div>

              {/* City, State, Pincode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="City"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="State"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Pincode"
                  maxLength={6}
                />
              </div>
            </div>
          </div>

          {/* Bank Details Form */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Bank Account Details</h2>
            <p className="text-sm text-gray-600 mb-6">For receiving payments and payouts</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={formData.bankAccountName}
                  onChange={(e) => setFormData({ ...formData, bankAccountName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Name as per bank account"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.bankAccountNumber}
                  onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Bank account number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={formData.bankIfscCode}
                  onChange={(e) => setFormData({ ...formData, bankIfscCode: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 uppercase"
                  placeholder="ABCD0123456"
                  maxLength={11}
                />
              </div>
            </div>
          </div>

          {/* Documents Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload Documents</h2>
            <p className="text-sm text-gray-600 mb-6">Upload supporting documents to verify your information</p>
          </div>

          <div className="space-y-6">
            {documents.map((doc, index) => (
              <div key={doc.type} className="border rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {doc.label}
                      {doc.required && <span className="text-red-500 ml-1">*</span>}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Accepted formats: PDF, JPG, PNG (Max 5MB)
                    </p>
                  </div>
                  {doc.url && (
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  )}
                </div>

                {(doc.type === 'pan' || doc.type === 'aadhar_front' || doc.type === 'aadhar_back') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Document Number
                    </label>
                    <input
                      type="text"
                      value={doc.documentNumber}
                      onChange={(e) => handleDocumentNumberChange(index, e.target.value)}
                      placeholder={doc.type === 'pan' ? 'Enter PAN Number' : 'Enter Aadhar Number'}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      disabled={kycStatus === 'approved'}
                    />
                  </div>
                )}

                <div className="relative">
                  <input
                    type="file"
                    accept={doc.accepted}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(index, file);
                    }}
                    className="hidden"
                    id={`file-${doc.type}`}
                    disabled={kycStatus === 'approved'}
                  />
                  <label
                    htmlFor={`file-${doc.type}`}
                    className={`flex items-center justify-center gap-3 px-6 py-4 border-2 border-dashed rounded-lg ${
                      doc.file || doc.url
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                    } ${kycStatus === 'approved' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} transition`}
                  >
                    {doc.file || doc.url ? (
                      <>
                        <FileText className="w-6 h-6 text-green-600" />
                        <span className="text-green-700 font-medium">
                          {doc.file ? doc.file.name : 'Document Uploaded'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400" />
                        <span className="text-gray-600">
                          Click to upload or drag and drop
                        </span>
                      </>
                    )}
                  </label>
                </div>
              </div>
            ))}
          </div>

          {kycStatus !== 'approved' && (
            <div className="mt-8 flex gap-4">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {submitting ? 'Submitting...' : 'Submit for Verification'}
              </button>
              <button
                onClick={() => router.push('/vendor/dashboard')}
                className="px-6 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition font-medium"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
