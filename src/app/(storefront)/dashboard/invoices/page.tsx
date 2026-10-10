'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, FileText } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { formatDate } from '@/lib/utils/date';
import { api, ApiError, errorMessage } from '@/lib/api';
import { handleAuthError } from '@/lib/auth';
import { showAlert } from '@/lib/dialog';
import { AccountShell } from '@/components/account/AccountShell';
import { Loader } from '@/components/ui/Loader';

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  total: number;
  order?: { orderNumber: string } | null;
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    let userId: string | null = null;
    try {
      userId = JSON.parse(localStorage.getItem('user') || 'null')?.id ?? null;
    } catch {
      userId = null;
    }
    if (!userId) {
      router.push('/login?returnUrl=/dashboard/invoices');
      return;
    }

    setLoading(true);
    api
      .get<{ invoices: Invoice[]; pages: number }>(`/invoices/customer/${userId}`, { params: { page, limit: 20 } })
      .then((data) => {
        setInvoices(data.invoices || []);
        setTotalPages(data.pages || 1);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) return handleAuthError();
        setError(errorMessage(err, 'Could not load your invoices.'));
      })
      .finally(() => setLoading(false));
  }, [page, router]);

  const handleDownload = async (invoice: Invoice) => {
    setDownloading(invoice.id);
    try {
      const response = await api.raw('GET', `/invoices/${invoice.id}/download`);
      const url = window.URL.createObjectURL(await response.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoice.invoiceNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      showAlert(errorMessage(err, 'Could not download the invoice.'), 'error');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <AccountShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground">Tax invoices for your paid orders.</p>
        </div>

        {error && (
          <div className="rounded-sm border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        <div className="rounded-lg border border-border bg-card">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader size="md" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No invoices yet. Each paid order gets one here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {invoice.order?.orderNumber ? `Order #${invoice.order.orderNumber} · ` : ''}
                      {formatDate(invoice.invoiceDate)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <span className="text-sm font-semibold text-foreground">
                      {formatPrice(Number(invoice.total), 'INR')}
                    </span>
                    <button
                      onClick={() => handleDownload(invoice)}
                      disabled={downloading === invoice.id}
                      className="flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-sm text-[hsl(var(--pb-rose-deep))] hover:bg-[hsl(var(--pb-blush-wash))] disabled:opacity-50"
                    >
                      <Download className="h-4 w-4" />
                      {downloading === invoice.id ? 'Downloading…' : 'PDF'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="rounded-sm border border-border px-4 py-2 text-sm disabled:opacity-50 hover:bg-muted"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="rounded-sm border border-border px-4 py-2 text-sm disabled:opacity-50 hover:bg-muted"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </AccountShell>
  );
}
