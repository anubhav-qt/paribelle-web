'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';
import { useExchangePicker, clearExchangePicker } from '@/lib/exchangePicker';

/**
 * Persistent bar shown across the storefront while a "browse for an exchange
 * replacement" session is active (started from ExchangeRequestModal's
 * "Browse Products" button). Only ever appears because that button was
 * clicked — `useExchangePicker` returns null otherwise, on every other page
 * and for every shopper not mid-exchange.
 */
export function ExchangePickerBar() {
  const ctx = useExchangePicker();
  const router = useRouter();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!ctx) return;
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders/wallet-balance`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setWalletBalance(data ? Number(data.balance) || 0 : 0))
      .catch(() => setWalletBalance(0));
    // Re-checked per picker session, not per navigation — the balance doesn't
    // change while browsing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ctx?.orderItemId]);

  if (!ctx) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] border-t border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-ivory)/0.97)] backdrop-blur-xl shadow-pb-lg">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <span className="text-[hsl(var(--pb-ink))]">
            Exchanging <strong className="font-medium">{ctx.itemName}</strong>
          </span>
          <span className="text-[hsl(var(--pb-ink-muted))]">
            Credit <strong className="text-[hsl(var(--pb-rose-deep))]">₹{ctx.itemCredit.toFixed(2)}</strong>
          </span>
          <span className="text-[hsl(var(--pb-ink-muted))]">
            Wallet{' '}
            <strong className="text-[hsl(var(--pb-rose-deep))]">
              {walletBalance === null ? '…' : `₹${walletBalance.toFixed(2)}`}
            </strong>
          </span>
          {ctx.picks.length > 0 && (
            <span className="text-[hsl(var(--pb-ink-muted))]">
              {ctx.picks.length} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => clearExchangePicker()}
            aria-label="Cancel exchange browsing"
            className="rounded-full p-2 text-[hsl(var(--pb-ink-faint))] hover:bg-[hsl(var(--pb-blush-wash))] hover:text-[hsl(var(--pb-ink))]"
            title="Cancel — stop browsing for a replacement"
          >
            <X className="h-4 w-4" />
          </button>
          <button
            onClick={() => router.push('/orders?resumeExchange=1')}
            className="flex items-center gap-2 whitespace-nowrap rounded-full bg-[hsl(var(--pb-rose-deep))] px-4 py-2 text-xs font-medium uppercase tracking-wide text-white transition-colors hover:opacity-90"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to Exchange Request
          </button>
        </div>
      </div>
    </div>
  );
}
