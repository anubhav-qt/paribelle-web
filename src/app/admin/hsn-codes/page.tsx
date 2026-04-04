'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Receipt, Plus, Edit2, Trash2, Search, Upload, Download } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import ThemeRenderer from '@/components/ThemeRenderer';

interface HSNCode {
  id: string;
  code: string;
  description: string;
  gstRate: number;
  createdAt: string;
  updatedAt: string;
}

export default function HSNCodesPage() {
  const { isAuthenticated, loading } = useAdminAuth();
  const [hsnCodes, setHsnCodes] = useState<HSNCode[]>([]);
  const [filteredCodes, setFilteredCodes] = useState<HSNCode[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCode, setEditingCode] = useState<HSNCode | null>(null);
  const [importing, setImporting] = useState(false);
  const [seedMessage, setSeedMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    gstRate: 18,
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchHSNCodes();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = hsnCodes.filter(
        (hsn) =>
          hsn.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          hsn.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCodes(filtered);
    } else {
      setFilteredCodes(hsnCodes);
    }
  }, [searchQuery, hsnCodes]);

  const fetchHSNCodes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/hsn-codes`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHsnCodes(data);
        setFilteredCodes(data);
      }
    } catch (error) {
      console.error('Error fetching HSN codes:', error);
    } finally {
      setLoadingCodes(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const url = editingCode
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/hsn-codes/${editingCode.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/hsn-codes`;
      
      const response = await fetch(url, {
        method: editingCode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(`HSN Code ${editingCode ? 'updated' : 'created'} successfully!`);
        setShowAddModal(false);
        setEditingCode(null);
        setFormData({ code: '', description: '', gstRate: 18 });
        fetchHSNCodes();
      } else {
        const error = await response.json();
        alert(`Failed: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving HSN code:', error);
      alert('Failed to save HSN code');
    }
  };

  const handleEdit = (hsn: HSNCode) => {
    setEditingCode(hsn);
    setFormData({
      code: hsn.code,
      description: hsn.description,
      gstRate: hsn.gstRate,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this HSN code?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/hsn-codes/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('HSN Code deleted successfully!');
        fetchHSNCodes();
      } else {
        alert('Failed to delete HSN code');
      }
    } catch (error) {
      console.error('Error deleting HSN code:', error);
      alert('Failed to delete HSN code');
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingCode(null);
    setFormData({ code: '', description: '', gstRate: 18 });
  };

  const handleSeedCodes = async () => {
    if (!confirm('This will import all official CBIC HSN codes from the Indian government GST portal (cbic-gst.gov.in). Existing codes will be updated. Continue?')) return;
    setImporting(true);
    setSeedMessage(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/hsn-codes/import-preset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok) {
        setSeedMessage({ type: 'success', text: `${result.message} — ${result.imported} of ${result.total} codes imported. Source: ${result.source}` });
        fetchHSNCodes();
      } else {
        setSeedMessage({ type: 'error', text: result.message || 'Import failed' });
      }
    } catch (error) {
      console.error('Error importing HSN codes:', error);
      setSeedMessage({ type: 'error', text: 'Failed to import codes' });
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = 'HSN Code,Description,GST Rate\n6109,"T-shirts, singlets and other vests",12\n6203,"Men suits and jackets",12\n8517,"Mobile phones",18';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hsn-codes-template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <ThemeRenderer component="header" />
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div>
                <Link
                  href="/admin"
                  className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
                >
                  ← Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <Receipt className="w-8 h-8" />
                  HSN Code Management
                </h1>
                <p className="text-gray-600 mt-1">Manage HSN codes and GST rates for products</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadTemplate}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                  title="Download Excel Template"
                >
                  <Download className="w-5 h-5" />
                  Template
                </button>
                <button
                  onClick={handleSeedCodes}
                  disabled={importing}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Import all standard Indian HSN codes into the system"
                >
                  <Upload className="w-5 h-5" />
                  {importing ? 'Importing...' : 'Import Codes'}
                </button>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add HSN Code
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {seedMessage && (
            <div className={`mb-6 p-4 rounded-lg ${seedMessage.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {seedMessage.text}
              <button onClick={() => setSeedMessage(null)} className="ml-4 text-sm underline">Dismiss</button>
            </div>
          )}
          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by HSN code or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* HSN Codes Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {loadingCodes ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : filteredCodes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {searchQuery ? 'No HSN codes found matching your search.' : 'No HSN codes yet. Add your first one!'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        HSN Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GST Rate (%)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Updated
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCodes.map((hsn) => (
                      <tr key={hsn.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{hsn.code}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{hsn.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {hsn.gstRate}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(hsn.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEdit(hsn)}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4 inline" />
                          </button>
                          <button
                            onClick={() => handleDelete(hsn.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Common HSN Codes Reference */}
          <div className="mt-8 bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Common HSN Codes Reference</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-gray-700">Textiles & Clothing:</p>
                <ul className="ml-4 mt-1 text-gray-600 space-y-1">
                  <li>6109 - T-shirts (5-12% GST)</li>
                  <li>6203 - Men's suits, jackets (5-12% GST)</li>
                  <li>6204 - Women's suits, dresses (5-12% GST)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-700">Footwear:</p>
                <ul className="ml-4 mt-1 text-gray-600 space-y-1">
                  <li>6401-6405 - Footwear (5-18% GST)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-700">Electronics:</p>
                <ul className="ml-4 mt-1 text-gray-600 space-y-1">
                  <li>8517 - Mobile phones (12-18% GST)</li>
                  <li>8528 - TVs, monitors (18-28% GST)</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-700">Books & Stationery:</p>
                <ul className="ml-4 mt-1 text-gray-600 space-y-1">
                  <li>4901 - Books (0% GST)</li>
                  <li>4820 - Notebooks (12% GST)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingCode ? 'Edit HSN Code' : 'Add New HSN Code'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HSN Code *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 6109"
                    required
                    disabled={!!editingCode}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="e.g., T-shirts, singlets and other vests, knitted or crocheted"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST Rate (%) *
                  </label>
                  <select
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="0">0% (Essential goods)</option>
                    <option value="5">5% (Basic necessities)</option>
                    <option value="12">12% (Standard goods)</option>
                    <option value="18">18% (General goods)</option>
                    <option value="28">28% (Luxury goods)</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    {editingCode ? 'Update' : 'Add'} HSN Code
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
