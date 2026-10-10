'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatCurrency } from '@/lib/currency';
import { getStatusColor } from '@/lib/utils/status';
import { formatDate as formatDateUtil } from '@/lib/utils/date';
import { showAlert, showConfirm } from '@/lib/dialog';
import { api, errorMessage } from '@/lib/api';

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: 'draft' | 'pending' | 'sent' | 'paid' | 'cancelled' | 'overdue';
  invoiceDate: string;
  dueDate: string;
  total: number;
  billingName: string;
  billingEmail: string;
  order: {
    orderNumber: string;
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
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Auto-generate dialog
  const [showAutoGenerate, setShowAutoGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, [statusFilter, page]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await api.get<{ invoices: Invoice[]; pages: number }>('/invoices', {
        params: { status: statusFilter, page, limit: 20 },
      });
      setInvoices(data.invoices);
      setTotalPages(data.pages);
    } catch (err) {
      setError(errorMessage(err, 'Failed to fetch invoices'));
    } finally {
      setLoading(false);
    }
  };

  const handleAutoGenerate = async () => {
    try {
      setGenerating(true);
      await api.post('/invoices/auto-generate');
      showAlert('Invoices generated successfully!', 'success');
      setShowAutoGenerate(false);
      await fetchInvoices();
    } catch (err) {
      showAlert(errorMessage(err, 'Failed to auto-generate invoices'), 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
    const ok = await showConfirm({ message: 'Send this invoice via email?', confirmText: 'Send' });
    if (!ok) return;

    try {
      await api.post(`/invoices/${invoiceId}/send`);
      showAlert('Invoice sent successfully!', 'success');
      fetchInvoices();
    } catch (err) {
      showAlert(errorMessage(err, 'Failed to send invoice'), 'error');
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    const ok = await showConfirm({ message: 'Mark this invoice as paid?', confirmText: 'Mark as Paid' });
    if (!ok) return;

    try {
      await api.patch(`/invoices/${invoiceId}/mark-paid`);
      showAlert('Invoice marked as paid!', 'success');
      fetchInvoices();
    } catch (err) {
      showAlert(errorMessage(err, 'Failed to mark invoice as paid'), 'error');
    }
  };

  const fetchPdf = async (invoiceId: string) => {
    const response = await api.raw('GET', `/invoices/${invoiceId}/download`);
    const disposition = response.headers.get('Content-Disposition') || '';
    const match = /filename="?([^";]+)"?/.exec(disposition);
    const filename = match?.[1] || `invoice-${invoiceId}.pdf`;
    return { url: window.URL.createObjectURL(await response.blob()), filename };
  };

  const handleViewInvoice = async (invoiceId: string) => {
    try {
      const { url } = await fetchPdf(invoiceId);
      window.open(url, '_blank');
      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      showAlert(errorMessage(err, 'Failed to open invoice'), 'error');
    }
  };

  const handleDownload = async (invoiceId: string) => {
    try {
      const { url, filename } = await fetchPdf(invoiceId);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showAlert(errorMessage(err, 'Failed to download invoice'), 'error');
    }
  };

  // Credit notes share the invoice table, numbered CN-.
  const getTypeLabel = (invoice: Invoice) =>
    invoice.invoiceNumber?.startsWith('CN-') ? 'Credit note' : 'Invoice';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = formatDateUtil; // Using centralized utility

  if (loading && invoices.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading invoices...</div>
      </div>
    );
  }

  return (
    <>
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
                <p className="text-sm text-gray-600">Tax invoices and credit notes for customer orders</p>
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
              <option value="pending">Pending</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
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
                Customer
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
                  {getTypeLabel(invoice)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div>{invoice.billingName}</div>
                  <div className="text-gray-500 text-xs">{invoice.billingEmail}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {invoice.order?.orderNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="font-medium text-gray-900">{formatCurrency(invoice.total)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-sm ${getStatusColor(invoice.status, 'invoice')}`}>
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
              Creates a tax invoice for every paid order that doesn&apos;t have one yet.
            </p>
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
