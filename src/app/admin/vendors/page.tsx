'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import ThemeRenderer from '@/components/ThemeRenderer';
import CategorySidebar from '@/components/CategorySidebar';

interface Vendor {
  id: string;
  businessName: string;
  email: string;
  phone?: string;
  status: string;
  rating?: number;
  totalProducts?: number;
  totalSales?: number;
  createdAt: string;
  kycBusinessRegistration?: string;
  kycTaxDocument?: string;
  kycIdentityProof?: string;
}

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [newVendorFormData, setNewVendorFormData] = useState({
    storeName: '',
    businessName: '',
    contactEmail: '',
    contactPhone: '',
    description: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    vendorType: 'business',
    commissionRate: 10,
    logo: '',
  });

  useEffect(() => {
    fetchVendors();
  }, [statusFilter, searchTerm]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch vendors');
      }
      
      const data = await response.json();
      
      // Handle different API response formats
      let vendorsList: Vendor[] = [];
      if (Array.isArray(data)) {
        vendorsList = data;
      } else if (data.vendors && Array.isArray(data.vendors)) {
        vendorsList = data.vendors;
      } else if (data.data && Array.isArray(data.data)) {
        vendorsList = data.data;
      }
      
      setVendors(vendorsList);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      // Optimistic UI update
      setVendors(prevVendors =>
        prevVendors.map(v => v.id === id ? { ...v, status: newStatus } : v)
      );

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update vendor status');
      }

      // Refetch to ensure we have the latest data
      fetchVendors();
    } catch (error) {
      console.error('Error updating vendor status:', error);
      // Revert optimistic update on error
      fetchVendors();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor? This will also remove all their products.')) return;

    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${id}`, {
        method: 'DELETE',
      });
      fetchVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
    }
  };

  const handleDeleteKYCDocuments = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete all KYC documents from Cloudinary? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/kyc/${vendorId}/documents`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
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
    }
  };

  const handleOpenAddModal = () => {
    setShowAddModal(true);
    setNewVendorFormData({
      storeName: '',
      businessName: '',
      contactEmail: '',
      contactPhone: '',
      description: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      vendorType: 'business',
      commissionRate: 10,
      logo: '',
    });
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
  };

  const handleViewVendor = async (id: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${id}`);
      if (response.ok) {
        const vendor = await response.json();
        setSelectedVendor(vendor);
        setShowViewModal(true);
      }
    } catch (error) {
      console.error('Error fetching vendor details:', error);
    }
  };

  const handleEditVendor = async (id: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${id}`);
      if (response.ok) {
        const vendor = await response.json();
        setSelectedVendor(vendor);
        setNewVendorFormData({
          storeName: vendor.storeName || '',
          businessName: vendor.businessName || '',
          contactEmail: vendor.contactEmail || '',
          contactPhone: vendor.contactPhone || '',
          description: vendor.description || '',
          address: vendor.address || '',
          city: vendor.city || '',
          state: vendor.state || '',
          postalCode: vendor.postalCode || '',
          vendorType: vendor.vendorType || 'business',
          commissionRate: vendor.commissionRate || 10,
          logo: vendor.logo || '',
        });
        setShowEditModal(true);
      }
    } catch (error) {
      console.error('Error fetching vendor details:', error);
    }
  };

  const handleUpdateVendor = async () => {
    try {
      if (!selectedVendor) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${selectedVendor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVendorFormData),
      });

      if (!response.ok) {
        throw new Error('Failed to update vendor');
      }

      fetchVendors();
      setShowEditModal(false);
      setSelectedVendor(null);
      alert('Vendor updated successfully!');
    } catch (error) {
      console.error('Error updating vendor:', error);
      alert('Failed to update vendor. Please try again.');
    }
  };

  const handleCreateVendor = async () => {
    try {
      if (!newVendorFormData.storeName || !newVendorFormData.contactEmail) {
        alert('Please fill in required fields (Store Name, Contact Email)');
        return;
      }

      const slug = newVendorFormData.storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const vendorData = {
        ...newVendorFormData,
        slug,
        status: 'pending',
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorData),
      });

      if (!response.ok) {
        throw new Error('Failed to create vendor');
      }

      fetchVendors();
      handleCloseAddModal();
      alert('Vendor created successfully!');
    } catch (error) {
      console.error('Error creating vendor:', error);
      alert('Failed to create vendor. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      rejected: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-blue-100 text-blue-800';
  };

  const renderStars = (rating?: number) => {
    if (!rating || typeof rating !== 'number') return <span className="text-gray-400">No rating</span>;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? 'text-yellow-400' : 'text-gray-300'}>
            ★
          </span>
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  const calculateStats = () => {
    const total = vendors.length;
    const approved = vendors.filter((v) => v.status === 'active').length;
    const pending = vendors.filter((v) => v.status === 'pending').length;
    const suspended = vendors.filter((v) => v.status === 'suspended').length;
    return { total, approved, pending, suspended };
  };

  const stats = calculateStats();

  return (
    <>
      <ThemeRenderer component="header" />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex gap-6">
          {/* <CategorySidebar hideEmptyCategories={false} /> */}
          <div className="flex-1 max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <Link
              href="/admin"
              className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Vendors Management</h1>
            <p className="text-gray-600 mt-2">Manage marketplace vendors and their accounts</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Vendors</div>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Active</div>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Suspended</div>
            <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Vendors
              </label>
              <input
                type="text"
                placeholder="Search by name, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Vendors Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="text-gray-500">Loading vendors...</div>
            </div>
          ) : vendors.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-500">No vendors found</div>
              <p className="text-sm text-gray-400 mt-2">
                Try adjusting your filters or check back later
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Products
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Sales
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rating
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vendors.map((vendor) => (
                    <tr key={vendor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {(vendor as any).storeName || vendor.businessName || 'N/A'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Joined {new Date(vendor.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{(vendor as any).contactEmail || vendor.email || 'N/A'}</div>
                        {((vendor as any).contactPhone || vendor.phone) && (
                          <div className="text-xs text-gray-500">{(vendor as any).contactPhone || vendor.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {(vendor as any).products?.length || vendor.totalProducts || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {vendor.totalSales ? `₹${vendor.totalSales.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStars(vendor.rating)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={vendor.status}
                          onChange={(e) => handleStatusChange(vendor.id, e.target.value)}
                          className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusColor(
                            vendor.status
                          )} border-0 cursor-pointer`}
                        >
                          <option value="active">Active</option>
                          <option value="pending">Pending</option>
                          <option value="suspended">Suspended</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleViewVendor(vendor.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          <button 
                            onClick={() => handleEditVendor(vendor.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Edit
                          </button>
                          {((vendor as any).kycBusinessRegistration || (vendor as any).kycTaxDocument || (vendor as any).kycIdentityProof) && (
                            <button
                              onClick={() => handleDeleteKYCDocuments(vendor.id)}
                              className="text-orange-600 hover:text-orange-900"
                              title="Delete KYC Documents"
                            >
                              Del KYC
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(vendor.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Add New Vendor Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Vendor</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Name *
                    </label>
                    <input
                      type="text"
                      value={newVendorFormData.storeName}
                      onChange={(e) => setNewVendorFormData({ ...newVendorFormData, storeName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., TechStore India"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={newVendorFormData.businessName}
                      onChange={(e) => setNewVendorFormData({ ...newVendorFormData, businessName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., TechStore Pvt Ltd"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      value={newVendorFormData.contactEmail}
                      onChange={(e) => setNewVendorFormData({ ...newVendorFormData, contactEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="vendor@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={newVendorFormData.contactPhone}
                      onChange={(e) => setNewVendorFormData({ ...newVendorFormData, contactPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+91 1234567890"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newVendorFormData.description}
                    onChange={(e) => setNewVendorFormData({ ...newVendorFormData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Brief description of the vendor's business"
                  />
                </div>

                <ImageUpload
                  label="Store Logo"
                  value={newVendorFormData.logo}
                  onChange={(url) => setNewVendorFormData({ ...newVendorFormData, logo: url })}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor Type
                    </label>
                    <select
                      value={newVendorFormData.vendorType}
                      onChange={(e) => setNewVendorFormData({ ...newVendorFormData, vendorType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="business">Business</option>
                      <option value="individual">Individual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commission Rate (%)
                    </label>
                    <input
                      type="number"
                      value={newVendorFormData.commissionRate}
                      onChange={(e) => setNewVendorFormData({ ...newVendorFormData, commissionRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={newVendorFormData.address}
                    onChange={(e) => setNewVendorFormData({ ...newVendorFormData, address: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={2}
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      value={newVendorFormData.city}
                      onChange={(e) => setNewVendorFormData({ ...newVendorFormData, city: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      value={newVendorFormData.state}
                      onChange={(e) => setNewVendorFormData({ ...newVendorFormData, state: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      value={newVendorFormData.postalCode}
                      onChange={(e) => setNewVendorFormData({ ...newVendorFormData, postalCode: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateVendor}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Create Vendor
                </button>
                <button
                  onClick={handleCloseAddModal}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Vendor Modal */}
        {showViewModal && selectedVendor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Vendor Details</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Store Name</label>
                    <p className="text-gray-900 mt-1">{selectedVendor.storeName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Business Name</label>
                    <p className="text-gray-900 mt-1">{selectedVendor.businessName || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900 mt-1">{selectedVendor.contactEmail || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-900 mt-1">{selectedVendor.contactPhone || 'N/A'}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Description</label>
                  <p className="text-gray-900 mt-1">{selectedVendor.description || 'N/A'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <p className={`mt-1 inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedVendor.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedVendor.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      selectedVendor.status === 'suspended' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedVendor.status}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Commission Rate</label>
                    <p className="text-gray-900 mt-1">{selectedVendor.commissionRate}%</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Address</label>
                  <p className="text-gray-900 mt-1">
                    {selectedVendor.address || 'N/A'}
                    {selectedVendor.city && `, ${selectedVendor.city}`}
                    {selectedVendor.state && `, ${selectedVendor.state}`}
                    {selectedVendor.postalCode && ` - ${selectedVendor.postalCode}`}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Products</label>
                    <p className="text-gray-900 mt-1">{selectedVendor.products?.length || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Sales</label>
                    <p className="text-gray-900 mt-1">₹{selectedVendor.totalSales?.toLocaleString() || 0}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Joined Date</label>
                  <p className="text-gray-900 mt-1">{new Date(selectedVendor.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Vendor Modal */}
        {showEditModal && selectedVendor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Vendor</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Store Name *
                    </label>
                    <input
                      type="text"
                      value={newVendorFormData.storeName}
                      onChange={(e) => setNewVendorFormData({ ...newVendorFormData, storeName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={newVendorFormData.businessName}
                      onChange={(e) => setNewVendorFormData({ ...newVendorFormData, businessName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Email *
                    </label>
                    <input
                      type="email"
                      value={newVendorFormData.contactEmail}
                      onChange={(e) => setNewVendorFormData({ ...newVendorFormData, contactEmail: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={newVendorFormData.contactPhone}
                      onChange={(e) => setNewVendorFormData({ ...newVendorFormData, contactPhone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newVendorFormData.description}
                    onChange={(e) => setNewVendorFormData({ ...newVendorFormData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Commission Rate (%)
                    </label>
                    <input
                      type="number"
                      value={newVendorFormData.commissionRate}
                      onChange={(e) => setNewVendorFormData({ ...newVendorFormData, commissionRate: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleUpdateVendor}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Update Vendor
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </>
  );
}
