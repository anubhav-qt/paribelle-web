'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/currency';
import { formatDate as formatDateUtil } from '@/lib/utils/date';
import { useRouter } from 'next/navigation';
import { AccountShell } from '@/components/account/AccountShell';

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: 'customer' | 'vendor' | 'platform';
  status: 'draft' | 'sent' | 'paid' | 'cancelled' | 'overdue';
  invoiceDate: string;
  dueDate: string;
  total: number;
  commissionAmount: number;
  commissionRate: number;
  payoutAmount: number;
  order: {
    orderNumber: string;
  };
  emailSent: boolean;
}

export default function VendorDashboardInvoices() {
  const router = useRouter();
  const [vendorId, setVendorId] = useState<string>('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Summary stats
  const [stats, setStats] = useState({
    totalPayout: 0,
    totalCommission: 0,
    pendingPayout: 0,
    paidPayout: 0,
  });

  // Get vendorId from localStorage on mount
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user.vendorId) {
          setVendorId(user.vendorId);
        } else {
          setError('Vendor ID not found. Please log in again.');
          setLoading(false);
        }
      } catch (err) {
        setError('Failed to load user data. Please log in again.');
        setLoading(false);
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (vendorId) {
      fetchInvoices();
    }
  }, [vendorId, page]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/invoices/vendor/${vendorId}?page=${page}&limit=20`,
        {
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch invoices');
      }

      const data = await response.json();
      setInvoices(data.invoices);
      setTotalPages(data.pages);
      
      // Calculate stats
      calculateStats(data.invoices);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (invoicesList: Invoice[]) => {
    const totalPayout = invoicesList.reduce((sum, inv) => sum + (inv.payoutAmount || 0), 0);
    const totalCommission = invoicesList.reduce((sum, inv) => sum + (inv.commissionAmount || 0), 0);
    const pendingPayout = invoicesList
      .filter(inv => inv.status !== 'paid')
      .reduce((sum, inv) => sum + (inv.payoutAmount || 0), 0);
    const paidPayout = invoicesList
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + (inv.payoutAmount || 0), 0);

    setStats({ totalPayout, totalCommission, pendingPayout, paidPayout });
  };

  const handleDownload = (invoiceId: string) => {
    window.open(`/api/invoices/${invoiceId}/download`, '_blank');
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

  // Using centralized formatCurrency from @/lib/currency

  const formatDate = formatDateUtil; // Using centralized utility

  if (loading && invoices.length === 0) {
    return (
      <AccountShell>
        <div className="flex justify-center items-center py-12">
          <div className="text-xl">Loading invoices...</div>
        </div>
      </AccountShell>
    );
  }

  return (
    <AccountShell>
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payout Statements</h1>
        <p className="text-gray-600 mt-2">View your order payouts and commission details</p>
      </div>

      {/* Summary Cards. "Total Commission" removed — platform commission is 0
          (see plan Task 1), so this tile always read ₹0 for new orders. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-2">Total Payout</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(stats.totalPayout)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-2">Pending Payout</div>
          <div className="text-2xl font-bold text-yellow-600">
            {formatCurrency(stats.pendingPayout)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-sm text-gray-600 mb-2">Paid Payout</div>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.paidPayout)}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Invoice #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Order #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Total Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Commission
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Payout
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
                  {invoice.order?.orderNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {formatCurrency(invoice.total)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                  -{formatCurrency(invoice.commissionAmount)}
                  <span className="text-xs text-gray-500 ml-1">
                    ({invoice.commissionRate}%)
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                  {formatCurrency(invoice.payoutAmount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(invoice.status)}`}>
                    {invoice.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div>{formatDate(invoice.invoiceDate)}</div>
                  <div className="text-xs text-gray-500">
                    Due: {formatDate(invoice.dueDate)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <button
                    onClick={() => router.push(`/dashboard/invoices/${invoice.id}`)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDownload(invoice.id)}
                    className="text-green-600 hover:text-green-800"
                  >
                    Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {invoices.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <div className="text-6xl mb-4">📄</div>
            <div className="text-xl mb-2">No payout statements yet</div>
            <div className="text-sm">Statements will appear here once orders are completed</div>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="px-4 py-2">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-2">About Payout Statements</h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-700">
          <li>Payout statements are generated automatically when orders are delivered</li>
          <li>Platform commission is deducted from the order total</li>
          <li>Payouts are processed within 7 business days of order delivery</li>
          <li>You'll receive an email notification when each statement is generated</li>
          <li>Download PDF statements for your records</li>
        </ul>
      </div>
    </div>
    </AccountShell>
  );
}
