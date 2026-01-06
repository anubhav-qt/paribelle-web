'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ThemeRenderer from '@/components/ThemeRenderer';

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'customer' | 'vendor' | 'platform';
  status: 'draft' | 'sent' | 'paid' | 'cancelled' | 'overdue';
  invoiceDate: string;
  dueDate: string;
  total: number;
  billingName: string;
  billingEmail: string;
  order: {
    orderNumber: string;
  };
  vendor?: {
    businessName: string;
  };
  customer?: {
    name: string;
  };
  emailSent: boolean;
}

export default function AdminInvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Auto-generate dialog
  const [showAutoGenerate, setShowAutoGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [typeFilter, statusFilter, page]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (typeFilter) params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('page', page.toString());
      params.append('limit', '20');

      const token = localStorage.getItem('token');
      console.log('🔑 [Admin Page] Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      console.log('👤 [Admin Page] User from localStorage:', localStorage.getItem('user'));
      
      const fetchUrl = `/api/invoices?${params.toString()}`;
      console.log('📞 [Admin Page] Fetching:', fetchUrl);
      
      const response = await fetch(fetchUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('📬 [Admin Page] Response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      console.log('📊 [Admin Page] Data received:', data);
      setInvoices(data.invoices);
      setTotalPages(data.pages);
    } catch (err: any) {
      console.error('❌ [Admin Page] Error fetching invoices:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoGenerate = async () => {
    try {
      setGenerating(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/invoices/auto-generate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('🎯 Auto-generate response status:', response.status);

      if (!response.ok && response.status !== 204) {
        throw new Error('Failed to auto-generate invoices');
      }

      alert('Invoices generated successfully!');
      setShowAutoGenerate(false);
      console.log('🔄 Refreshing invoice list...');
      await fetchInvoices();
      console.log('✅ Invoice list refreshed');
    } catch (err: any) {
      console.error('❌ Auto-generate error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    if (!confirm('Send this invoice via email?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to send invoice');
      }

      alert('Invoice sent successfully!');
      fetchInvoices();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    if (!confirm('Mark this invoice as paid?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/invoices/${invoiceId}/mark-paid`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to mark invoice as paid');
      }

      alert('Invoice marked as paid!');
      fetchInvoices();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleDownloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      console.log('📥 Downloading invoice:', invoiceId, invoiceNumber);
      const token = localStorage.getItem('token');
      console.log('🔑 Token:', token ? 'present' : 'missing');
      
      const response = await fetch(`/api/invoices/${invoiceId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('📨 Download response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Download failed:', errorText);
        throw new Error('Failed to download invoice');
      }

      const blob = await response.blob();
      console.log('📦 Blob size:', blob.size, 'bytes');
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      console.log('✅ Download complete');
    } catch (err: any) {
      console.error('❌ Download error:', err);
      alert(`Error downloading invoice: ${err.message}`);
    }
  };

  const handleViewInvoice = async (invoiceId: string) => {
    try {
      console.log('👁️ Viewing invoice:', invoiceId);
      const token = localStorage.getItem('token');
      console.log('🔑 Token:', token ? 'present' : 'missing');
      
      const response = await fetch(`/api/invoices/${invoiceId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('📨 View response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ View failed:', errorText);
        throw new Error('Failed to view invoice');
      }

      const blob = await response.blob();
      console.log('📦 Blob size:', blob.size, 'bytes');
      
      const url = window.URL.createObjectURL(blob);
      console.log('🔗 Opening URL:', url);
      window.open(url, '_blank');
      // Clean up after a delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        console.log('🧹 Cleaned up URL');
      }, 1000);
    } catch (err: any) {
      console.error('❌ View error:', err);
      alert(`Error viewing invoice: ${err.message}`);
    }
  };

  const handleDownload = async (invoiceId: string) => {
    try {
      console.log('💾 Downloading invoice:', invoiceId);
      const token = localStorage.getItem('token');
      console.log('🔑 Token:', token ? 'present' : 'missing');
      
      const response = await fetch(`/api/invoices/${invoiceId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('📨 Download response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Download failed:', errorText);
        throw new Error('Failed to download invoice');
      }

      const blob = await response.blob();
      console.log('📦 Blob size:', blob.size, 'bytes');
      
      // Get filename from header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `invoice-${invoiceId}.pdf`;
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      console.log('✅ Download completed:', filename);
    } catch (err: any) {
      console.error('❌ Download error:', err);
      alert(`Error downloading invoice: ${err.message}`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'sent':
        return 'bg-blue-100 text-blue-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'customer':
        return 'Customer';
      case 'vendor':
        return 'Vendor Payout';
      case 'platform':
        return 'Commission';
      default:
        return type;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && invoices.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading invoices...</div>
      </div>
    );
  }

  return (
    <>
      <ThemeRenderer component="header" />
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/admin')}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Invoice Management</h1>
                <p className="text-sm text-gray-600">Manage customer invoices, vendor payouts, and commission statements</p>
              </div>
            </div>
            <button
              onClick={() => setShowAutoGenerate(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Auto-Generate Invoices</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">All Types</option>
              <option value="customer">Customer Invoices</option>
              <option value="vendor">Vendor Payouts</option>
              <option value="platform">Commission Invoices</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setTypeFilter('');
                setStatusFilter('');
                setPage(1);
              }}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Invoice #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Customer/Vendor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Order #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {invoice.invoiceNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {getTypeLabel(invoice.type)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div>{invoice.billingName}</div>
                  <div className="text-gray-500 text-xs">{invoice.billingEmail}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {invoice.order?.orderNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {formatCurrency(invoice.total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(invoice.status)}`}>
                    {invoice.status.toUpperCase()}
                  </span>
                  {invoice.emailSent && (
                    <span className="ml-2 text-xs text-green-600">✓ Sent</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {formatDate(invoice.invoiceDate)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <button
                    onClick={() => handleViewInvoice(invoice.id)}
                    className="text-blue-600 hover:text-blue-800"
                    title="View PDF in new tab"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDownload(invoice.id)}
                    className="text-green-600 hover:text-green-800"
                    title="Download PDF"
                  >
                    Download
                  </button>
                  {invoice.status !== 'sent' && invoice.status !== 'paid' && (
                    <button
                      onClick={() => handleSendInvoice(invoice.id)}
                      className="text-purple-600 hover:text-purple-800"
                      title="Send via email"
                    >
                      Send
                    </button>
                  )}
                  {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                    <button
                      onClick={() => handleMarkAsPaid(invoice.id)}
                      className="text-indigo-600 hover:text-indigo-800"
                      title="Mark as paid"
                    >
                      Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        {invoices.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No invoices found
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 space-x-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Auto-Generate Dialog */}
      {showAutoGenerate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md">
            <h2 className="text-2xl font-bold mb-4">Auto-Generate Invoices</h2>
            <p className="text-gray-600 mb-6">
              This will automatically generate invoices for all completed and paid orders that don't have invoices yet.
            </p>
            <div className="text-sm text-gray-500 mb-6">
              This includes:
              <ul className="list-disc list-inside mt-2">
                <li>Customer invoices</li>
                <li>Vendor payout statements</li>
              </ul>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowAutoGenerate(false)}
                disabled={generating}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAutoGenerate}
                disabled={generating}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate Invoices'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
    </>
  );
}
