'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet as WalletIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { AccountShell } from '@/components/account/AccountShell';
import { Loader } from '@/components/ui/Loader';

interface LedgerEntry {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  balanceAfter: number;
  createdAt: string;
  order?: { orderNumber: string } | null;
}

const LEDGER_LABELS: Record<string, string> = {
  opening_balance: 'Opening balance',
  referral_credit: 'Referral bonus',
  exchange_credit: 'Exchange credit',
  cod_refusal_credit: 'COD refusal credit',
  admin_cancel_credit: 'Order cancelled (by admin)',
  customer_cancel_credit: 'Order cancelled',
  checkout_spend: 'Used at checkout',
  admin_adjustment: 'Admin adjustment',
};

export default function WalletPage() {
  const router = useRouter();
  const [balance, setBalance] = useState<number>(0);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/wallet/balance`, { headers }).then((r) => (r.ok ? r.json() : { balance: 0 })),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/wallet/ledger`, { headers }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([balanceData, ledgerData]) => {
        setBalance(Number(balanceData?.balance) || 0);
        setLedger(Array.isArray(ledgerData) ? ledgerData : []);
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="md" />
      </div>
    );
  }

  return (
    <AccountShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Wallet</h1>
          <p className="text-sm text-muted-foreground">
            Store credit from cancellations and exchanges. Applied automatically at checkout.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <WalletIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Available balance</p>
              <p className="text-3xl font-bold text-foreground">{formatPrice(balance, 'INR')}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <div className="border-b border-border p-4">
            <h2 className="font-semibold text-foreground">Transaction History</h2>
          </div>
          {ledger.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">No wallet activity yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {ledger.map((entry) => {
                const isCredit = Number(entry.amount) > 0;
                return (
                  <div key={entry.id} className="flex items-center justify-between gap-4 p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          isCredit
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-red-100 dark:bg-red-900/30'
                        }`}
                      >
                        {isCredit ? (
                          <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {LEDGER_LABELS[entry.type] || entry.type}
                        </p>
                        {entry.description && (
                          <p className="text-xs text-muted-foreground">{entry.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`font-semibold ${isCredit ? 'text-green-600' : 'text-red-600'}`}>
                        {isCredit ? '+' : ''}
                        {formatPrice(entry.amount, 'INR')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Balance: {formatPrice(entry.balanceAfter, 'INR')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AccountShell>
  );
}
