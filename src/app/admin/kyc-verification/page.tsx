'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, Clock, FileText, ArrowLeft, Trash2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface Vendor {
  id: string;
  businessName: string;
  storeName: string;
  email: string;
  kycStatus: string;
  kycSubmittedAt: string;
  kycDocuments: Array<{
    type: string;
    documentUrl: string;
    documentNumber?: string;
    fileName: string;
  }>;
  panNumber?: string;
  gstNumber?: string;
  gstRegistrationType?: string;
}

export default function AdminKYCVerificationPage() {
  const searchParams = useSearchParams();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchPendingKYC();
  }, []);

  useEffect(() => {
    // If vendorId in query params, open that vendor's details
    const vendorId = searchParams?.get('vendorId');
    if (vendorId && vendors.length > 0) {
      const vendor = vendors.find(v => v.id === vendorId);
      if (vendor) {
        handleViewDetails(vendor);
      }
    }
  }, [searchParams, vendors]);

  const fetchPendingKYC = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/v1/vendors/kyc/pending`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setVendors(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching pending KYC:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowModal(true);
  };

  const handleApprove = async (vendorId: string) => {
    if (!confirm('Are you sure you want to approve this KYC?')) return;

    setActionLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/v1/vendors/kyc/${vendorId}/approve`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        alert('KYC approved successfully!');
        setShowModal(false);
        fetchPendingKYC();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve KYC');
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (vendorId: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/v1/vendors/kyc/${vendorId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (response.ok) {
        alert('KYC rejected successfully!');
        setShowModal(false);
        setRejectionReason('');
        fetchPendingKYC();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject KYC');
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDocuments = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete all KYC documents from Cloudinary? This action cannot be undone.')) {
      return;
    }

    setActionLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/v1/vendors/kyc/${vendorId}/documents`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message || 'Documents deleted successfully!');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete documents');
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getDocumentLabel = (type: string): string => {
    const labels: Record<string, string> = {
      pan: 'PAN Card',
      aadhar_front: 'Aadhar Front',
      aadhar_back: 'Aadhar Back',
      gst_certificate: 'GST Certificate',
      business_license: 'Business License',
      bank_details: 'Bank Details',
      address_proof: 'Address Proof',
    };
    return labels[type] || type;
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
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-3xl font-bold text-gray-900">KYC Verification</h1>
            </div>
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-medium">
              {vendors.length} Pending
            </div>
          </div>

          {vendors.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No pending KYC verifications</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Vendor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Documents
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {vendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {vendor.businessName || vendor.storeName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{vendor.email}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {new Date(vendor.kycSubmittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-sm text-gray-600">
                          <FileText className="w-4 h-4" />
                          {vendor.kycDocuments?.length || 0} files
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleViewDetails(vendor)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          <Eye className="w-4 h-4" />
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && selectedVendor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedVendor.businessName || selectedVendor.storeName}
              </h2>
              <p className="text-gray-600">{selectedVendor.email}</p>
              {selectedVendor.panNumber && (
                <p className="text-sm text-gray-500 mt-1">PAN: {selectedVendor.panNumber}</p>
              )}
              {selectedVendor.gstNumber && (
                <p className="text-sm text-gray-500">GST: {selectedVendor.gstNumber}</p>
              )}
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedVendor.kycDocuments?.map((doc, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2">{getDocumentLabel(doc.type)}</h3>
                    {doc.documentNumber && (
                      <p className="text-sm text-gray-600 mb-2">
                        Number: {doc.documentNumber}
                      </p>
                    )}
                    <a
                      href={doc.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View Document
                    </a>
                  </div>
                ))}
              </div>

              <div className="border-t pt-6">
                <h3 className="font-semibold mb-3">Rejection Reason (Optional)</h3>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter reason if rejecting KYC..."
                />
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 space-y-3">
              <div className="flex gap-4">
                <button
                  onClick={() => handleApprove(selectedVendor.id)}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                >
                  <CheckCircle className="w-5 h-5" />
                  Approve KYC
                </button>
                <button
                  onClick={() => handleReject(selectedVendor.id)}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  <XCircle className="w-5 h-5" />
                  Reject KYC
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setRejectionReason('');
                  }}
                  className="px-6 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition"
                >
                  Close
                </button>
              </div>
              
              <div className="flex gap-4 pt-2 border-t">
                <button
                  onClick={() => handleDeleteDocuments(selectedVendor.id)}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 bg-orange-600 text-white py-2.5 rounded-lg hover:bg-orange-700 transition disabled:opacity-50 text-sm"
                  title="Delete all KYC documents from Cloudinary storage"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Documents from Storage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
