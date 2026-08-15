'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X, ChevronUp, ChevronDown } from 'lucide-react';
import { useExchangePicker, clearExchangePicker, removeExchangePick } from '@/lib/exchangePicker';

/**
 * Persistent bar shown across the storefront while a "browse for an exchange
 * replacement" session is active (started from ExchangeRequestModal's
 * "Browse Products" button). Only ever appears because that button was
 * clicked — `useExchangePicker` returns null otherwise, on every other page
 * and for every shopper not mid-exchange.
 *
 * It is the shopper's only anchor while they are off shopping, so it says
 * what they are exchanging, what it is worth, what they have selected so
 * far, and how to get back — rather than leaving "how do I finish this?" to
 * be guessed at.
 */
export function ExchangePickerBar() {
  const ctx = useExchangePicker();
  const router = useRouter();
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

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

  const picks = ctx.picks;

  return (
    <>
      {/* Keeps the bar from covering the bottom of the page it floats over —
          without this the last row of a product grid is unreachable. */}
      <div aria-hidden className={picks.length > 0 ? 'h-28' : 'h-20'} />

      <div className="fixed inset-x-0 bottom-0 z-[90] border-t border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-ivory)/0.97)] backdrop-blur-xl shadow-pb-lg">
        {expanded && picks.length > 0 && (
          <div className="mx-auto max-w-7xl px-4 pt-3 md:px-6">
            <ul className="max-h-52 divide-y divide-[hsl(var(--pb-linen))] overflow-y-auto rounded-sm border border-[hsl(var(--pb-linen))]">
              {picks.map((p) => (
                <li key={`${p.productId}:${p.variantId}`} className="flex items-center gap-3 p-2">
                  {p.image && <img src={p.image} alt="" className="h-10 w-10 rounded-sm object-cover" />}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-[hsl(var(--pb-ink))]">{p.name}</p>
                    <p className="truncate text-xs text-[hsl(var(--pb-ink-faint))]">{p.variantLabel}</p>
                  </div>
                  <span className="text-sm text-[hsl(var(--pb-ink-muted))]">₹{Number(p.price).toFixed(2)}</span>
                  <button
                    onClick={() => removeExchangePick(p.productId, p.variantId)}
                    aria-label={`Remove ${p.name}`}
                    className="rounded-full p-1 text-[hsl(var(--pb-ink-faint))] hover:bg-[hsl(var(--pb-blush-wash))] hover:text-[hsl(var(--pb-danger))]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
            <span className="text-[hsl(var(--pb-ink))]">
              Exchanging{' '}
              <strong className="font-medium">
                {ctx.quantity > 1 ? `${ctx.quantity} × ` : ''}
                {ctx.itemName}
              </strong>
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
            {picks.length > 0 ? (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 text-[hsl(var(--pb-rose-deep))] underline-offset-2 hover:underline"
              >
                {picks.length} selected
                {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
              </button>
            ) : (
              <span className="text-[hsl(var(--pb-ink-faint))]">
                Open any item and choose a size to select it
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/orders?resumeExchange=1')}
              className="flex items-center gap-2 whitespace-nowrap rounded-full bg-[hsl(var(--pb-rose-deep))] px-4 py-2 text-xs font-medium uppercase tracking-wide text-white transition-colors hover:opacity-90"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {picks.length > 0 ? 'Finish Exchange Request' : 'Back to Exchange Request'}
            </button>
            <button
              onClick={() => clearExchangePicker()}
              aria-label="Cancel exchange browsing"
              className="rounded-full p-2 text-[hsl(var(--pb-ink-faint))] hover:bg-[hsl(var(--pb-blush-wash))] hover:text-[hsl(var(--pb-ink))]"
              title="Cancel — stop browsing for a replacement"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
