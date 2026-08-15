'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X, ChevronUp, ChevronDown, Wallet } from 'lucide-react';
import {
  useExchangePicker,
  clearExchangePicker,
  removeExchangePick,
  useExchangeModalOpen,
} from '@/lib/exchangePicker';

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
 * be guessed at. Built as a scaled-down version of the same card language
 * the rest of the storefront uses (ivory ground, hairline linen borders, a
 * gold thread at the seam) rather than a plain grey utility toolbar, since
 * it sits over every page a shopper visits while mid-exchange.
 */
export function ExchangePickerBar() {
  const ctx = useExchangePicker();
  const modalOpen = useExchangeModalOpen();
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

  // Once the shopper is back in the request modal the bar has done its job —
  // and staying up would only cover the modal's Submit button.
  if (!ctx || modalOpen) return null;

  const picks = ctx.picks;

  return (
    <>
      {/* Keeps the bar from covering the bottom of the page it floats over —
          without this the last row of a product grid is unreachable. */}
      <div aria-hidden className={picks.length > 0 ? 'h-32' : 'h-24'} />

      <div className="fixed inset-x-0 bottom-0 z-[90] border-t border-[hsl(var(--pb-gold-soft))] bg-[hsl(var(--pb-ivory)/0.98)] shadow-pb-lg backdrop-blur-xl">
        {/* A hairline of the brand gold at the very seam — the one flourish
            that separates this from a generic system toolbar. */}
        <div className="h-px bg-gradient-to-r from-transparent via-[hsl(var(--pb-gold))] to-transparent" />

        {expanded && picks.length > 0 && (
          <div className="mx-auto max-w-7xl px-4 pt-3 md:px-6">
            <ul className="max-h-52 divide-y divide-[hsl(var(--pb-linen))] overflow-y-auto rounded-sm border border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-shell))]">
              {picks.map((p) => (
                <li key={`${p.productId}:${p.variantId}`} className="flex items-center gap-3 p-2">
                  {p.image ? (
                    <img src={p.image} alt="" className="h-10 w-10 shrink-0 rounded-sm object-cover" />
                  ) : (
                    <div className="h-10 w-10 shrink-0 rounded-sm bg-[hsl(var(--pb-blush-wash))]" />
                  )}
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

        {/* Two halves: everything *about* the exchange on the left, the two
            things you can *do* on the right. `items-start` so the actions sit
            on the same line as the product name rather than drifting to the
            vertical middle of a left column that is two rows tall. */}
        <div className="mx-auto flex max-w-7xl items-start justify-between gap-4 px-4 py-3 md:px-6">
          <div className="min-w-0 flex-1">
            {/* Row 1: the item — a face to the bar, not just a line of text. */}
            <div className="flex min-w-0 items-center gap-3">
              {ctx.itemImage ? (
                <img
                  src={ctx.itemImage}
                  alt=""
                  className="h-11 w-11 shrink-0 rounded-sm border border-[hsl(var(--pb-linen))] object-cover"
                />
              ) : (
                <div className="h-11 w-11 shrink-0 rounded-sm border border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-blush-wash))]" />
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[hsl(var(--pb-ink-faint))]">
                  Exchanging
                </p>
                <p className="truncate font-display text-base italic leading-tight text-[hsl(var(--pb-ink))]">
                  {ctx.quantity > 1 ? `${ctx.quantity} × ` : ''}
                  {ctx.itemName}
                </p>
              </div>
            </div>

            {/* Row 2: the figures and the hint, indented to line up under the
                product name (image 2.75rem + gap 0.75rem) rather than under
                the thumbnail. Quiet stat chips instead of run-on inline text,
                so each reads on its own. */}
            <div className="mt-2 flex flex-wrap items-center gap-2 sm:pl-14">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-shell))] px-3 py-1 text-xs text-[hsl(var(--pb-ink-muted))]">
                Credit <strong className="font-medium text-[hsl(var(--pb-rose-deep))]">₹{ctx.itemCredit.toFixed(2)}</strong>
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-shell))] px-3 py-1 text-xs text-[hsl(var(--pb-ink-muted))]">
                <Wallet className="h-3 w-3" />
                {walletBalance === null ? '…' : `₹${walletBalance.toFixed(2)}`}
              </span>
              {picks.length > 0 ? (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="inline-flex items-center gap-1 rounded-full border border-[hsl(var(--pb-rose))] bg-[hsl(var(--pb-blush-wash))] px-3 py-1 text-xs font-medium text-[hsl(var(--pb-rose-deep))] hover:bg-[hsl(var(--pb-blush))]"
                >
                  {picks.length} selected
                  {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                </button>
              ) : (
                <p className="text-xs italic text-[hsl(var(--pb-ink-faint))]">
                  Open any item and choose a size to select it
                </p>
              )}
            </div>
          </div>

          {/* Right half: just the two actions, centred against the item row so
              they sit level with the product name. */}
          <div className="flex h-11 shrink-0 items-center gap-2">
            <button
              onClick={() => router.push('/orders?resumeExchange=1')}
              className="flex items-center gap-2 whitespace-nowrap rounded-full bg-[hsl(var(--pb-rose-deep))] px-5 py-2.5 text-xs font-medium uppercase tracking-wide text-white shadow-pb-sm transition-colors hover:bg-[hsl(var(--pb-rose-ink))]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {picks.length > 0 ? 'Finish Exchange Request' : 'Back to Exchange Request'}
            </button>
            <button
              onClick={() => clearExchangePicker()}
              aria-label="Cancel exchange browsing"
              className="rounded-full p-2.5 text-[hsl(var(--pb-ink-faint))] hover:bg-[hsl(var(--pb-blush-wash))] hover:text-[hsl(var(--pb-ink))]"
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
