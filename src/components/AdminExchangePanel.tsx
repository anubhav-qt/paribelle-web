'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import Link from 'next/link';
import { showPrompt } from '@/lib/dialog';
import { exchangeStatusStyle, exchangeStatusLabel } from '@/lib/utils/exchange';

interface ExchangeRequest {
  id: string;
  returnNumber: string;
  status: string;
  quantity: number;
  reason: string;
  productName: string;
  customerNotes: string | null;
  /** Null only for requests made before the video became mandatory. */
  videoUrl: string | null;
  customerTrackingNumber: string | null;
  inspectionResult: string | null;
  inspectionNotes: string | null;
  rejectionReason: string | null;
  replacementTrackingNumber: string | null;
  requestedAt: string;
  refundTotal: number | string;
  exchangeVariantId: string | null;
  exchangeVariant: {
    id: string;
    variantAttributes: Record<string, string>;
    price: number;
    product: { id: string; name: string };
  } | null;
  completedOrderId: string | null;
  completedOrder: { id: string; orderNumber: string } | null;
  orderItem: { productId: string } | null;
  courierCharge: number | string | null;
  courierChargePaymentMethod: 'wallet' | 'cod' | 'online' | null;
  courierChargePaidAt: string | null;
}

interface AdminExchangePanelProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  originalProductId?: string;
}

const STATUS_LABEL: Record<string, string> = {
  requested: 'Requested — awaiting your decision',
  approved: 'Approved — waiting for the customer to ship it back',
  in_transit: 'Customer has shipped it back',
  received: 'Received — inspection passed',
  replacement_shipped: 'Replacement shipped',
  completed: 'Completed',
  rejected: 'Rejected',
};

const money = (n: number | string) => `₹${Number(n).toFixed(2)}`;

/**
 * The admin side of the exchange sub-machine — see Task 8 in the
 * implementation plan for the full diagram, and the "three routes" section
 * for what distinguishes them. Every action here calls an `@AdminOnly()`
 * endpoint.
 */
export default function AdminExchangePanel({ isOpen, onClose, orderId, orderNumber }: AdminExchangePanelProps) {
  const [exchanges, setExchanges] = useState<ExchangeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  // Inline inspection notes, keyed by exchange id — typed directly into the
  // card rather than a separate prompt dialog stacked on top of this one.
  const [inspectionNotes, setInspectionNotes] = useState<Record<string, string>>({});
  // Same treatment for the rejection reason: it used to be a `showPrompt`
  // dialog stacked over this panel, which is exactly the sort of overlay
  // that ends up underneath the thing that opened it. Typed on the card, it
  // can't land behind anything — and the admin can see the customer's video
  // while writing the reason, which they couldn't through a modal.
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders/${orderId}/exchanges`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load exchange requests');
      setExchanges(await res.json());
    } catch (err: any) {
      setError(err?.message || 'Failed to load exchange requests');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (isOpen) load();
  }, [isOpen, load]);

  if (!isOpen) return null;

  const call = async (path: string, body?: any) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Action failed');
    }
    await load();
  };

  const withBusy = async (id: string, action: () => Promise<void>) => {
    setBusyId(id);
    setError('');
    try {
      await action();
    } catch (err: any) {
      setError(err?.message || 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-bold text-gray-900">Exchange Requests — Order #{orderNumber}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {error && (
            <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          {loading ? (
            <p className="text-sm text-gray-500">Loading…</p>
          ) : exchanges.length === 0 ? (
            <p className="text-sm text-gray-500">No exchange requests on this order.</p>
          ) : (
            exchanges.map((exc) => {
              // Route classification mirrors the backend: no exchangeVariant
              // at all is route 3 (credit only). An exchangeVariant on a
              // *different* product is route 2 (replacement order). Same
              // product is route 1 (direct swap, ships off this row).
              const isDifferentProduct =
                !!exc.exchangeVariant && exc.exchangeVariant.product.id !== exc.orderItem?.productId;
              const isRoute3 = !exc.exchangeVariant;
              const awaitingReplacementDecision =
                exc.status === 'received' && exc.inspectionResult === 'passed' && !!exc.exchangeVariant && !exc.completedOrderId;

              const style = exchangeStatusStyle(exc.status);

              return (
                // Colour-coded by status, and with the product being
                // exchanged called out as the card's headline: an order with
                // several exchange requests on it used to be a stack of
                // identical white cards, where working out which product each
                // one was about meant reading down to the third line.
                <div key={exc.id} className={`rounded-lg border-2 ${style.border} ${style.row} p-4`}>
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900">{exc.productName}</p>
                      <span className="text-xs text-gray-500">
                        {exc.returnNumber} · Qty {exc.quantity} · {new Date(exc.requestedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${style.chip}`}>
                      {exchangeStatusLabel(exc.status)}
                    </span>
                  </div>

                  {exc.exchangeVariant && (
                    <p className="text-sm text-gray-700">
                      Wants: <span className="font-medium">{exc.exchangeVariant.product.name}</span>
                      {Object.keys(exc.exchangeVariant.variantAttributes || {}).length > 0 &&
                        ` (${Object.values(exc.exchangeVariant.variantAttributes).join(' / ')})`}
                      {' — '}{money(exc.exchangeVariant.price)}
                      {isDifferentProduct && (
                        <span className="ml-1 rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-medium text-indigo-700">
                          different product
                        </span>
                      )}
                    </p>
                  )}
                  {isRoute3 && (
                    <p className="text-sm text-gray-700">
                      Wants: <span className="font-medium">store credit only</span>, no replacement
                    </p>
                  )}
                  {Number(exc.refundTotal) > 0 && (
                    <p className="text-sm text-gray-700">Credit: <span className="font-medium">{money(exc.refundTotal)}</span></p>
                  )}
                  {Number(exc.courierCharge) > 0 && (
                    <p className="text-sm text-gray-700">
                      Courier charge: <span className="font-medium">{money(exc.courierCharge!)}</span>{' '}
                      {exc.courierChargePaymentMethod === 'cod' ? (
                        <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs font-medium text-orange-800">
                          collect on delivery
                        </span>
                      ) : exc.courierChargePaymentMethod === 'online' ? (
                        <span
                          className="rounded bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800"
                          title="Left owing on the replacement order — the customer pays it from their orders page"
                        >
                          {exc.completedOrder ? 'payable online on the replacement order' : 'paying online'}
                        </span>
                      ) : exc.courierChargePaidAt ? (
                        <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-800">
                          paid from store credit
                        </span>
                      ) : (
                        <span className="rounded bg-gray-200 px-1.5 py-0.5 text-xs font-medium text-gray-700">
                          from store credit when it ships
                        </span>
                      )}
                    </p>
                  )}

                  <p className="text-sm text-gray-600">Reason: {exc.reason}</p>
                  {exc.customerNotes && <p className="text-sm text-gray-500">Notes: {exc.customerNotes}</p>}

                  {/* The customer's evidence — the thing an approve/reject
                      decision is actually supposed to be based on, so it sits
                      above the buttons rather than behind a link. */}
                  {exc.videoUrl ? (
                    <div className="mt-3">
                      <p className="mb-1 text-xs font-medium text-gray-700">Customer&apos;s video</p>
                      <video
                        src={exc.videoUrl}
                        controls
                        preload="metadata"
                        className="max-h-64 w-full rounded bg-black"
                      />
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-gray-400">
                      No video — this request predates the video requirement.
                    </p>
                  )}
                  <p className="mt-2 text-sm font-medium text-blue-700">
                    {STATUS_LABEL[exc.status] || exc.status}
                  </p>
                  {exc.customerTrackingNumber && (
                    <p className="text-xs text-gray-500">Customer tracking: {exc.customerTrackingNumber}</p>
                  )}
                  {exc.inspectionNotes && (
                    <p className="text-xs text-gray-500">Inspection notes: {exc.inspectionNotes}</p>
                  )}
                  {exc.rejectionReason && (
                    <p className="text-xs text-red-600">Rejected: {exc.rejectionReason}</p>
                  )}
                  {exc.replacementTrackingNumber && (
                    <p className="text-xs text-gray-500">Replacement tracking: {exc.replacementTrackingNumber}</p>
                  )}
                  {exc.completedOrder && (
                    <p className="text-xs text-gray-500">
                      Fulfilled by{' '}
                      <Link href={`/admin/orders?orderId=${exc.completedOrder.id}`} className="text-blue-600 hover:underline">
                        order #{exc.completedOrder.orderNumber}
                      </Link>
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    {exc.status === 'requested' && (
                      <>
                        <button
                          disabled={busyId === exc.id}
                          onClick={() => withBusy(exc.id, () => call(`exchanges/${exc.id}/approve`))}
                          className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          disabled={busyId === exc.id}
                          onClick={() => {
                            setRejectingId(rejectingId === exc.id ? null : exc.id);
                            setRejectReason('');
                          }}
                          className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {/* Route 1: same product, different variant — ships directly off this row. */}
                    {exc.status === 'received' && exc.inspectionResult === 'passed' && exc.exchangeVariant && !isDifferentProduct && (
                      <button
                        disabled={busyId === exc.id}
                        onClick={async () => {
                          const trackingNumber = (await showPrompt({ title: 'Ship Replacement', message: 'Replacement tracking number (optional):' })) || undefined;
                          withBusy(exc.id, () => call(`exchanges/${exc.id}/ship-replacement`, { trackingNumber }));
                        }}
                        className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        Ship Replacement
                      </button>
                    )}
                  </div>

                  {/* Rejection reason, inline. The customer is shown this
                      verbatim, so it's required. */}
                  {rejectingId === exc.id && exc.status === 'requested' && (
                    <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Why are you rejecting this? The customer sees this word for word.
                      </label>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        rows={2}
                        autoFocus
                        placeholder="e.g. The video shows the item has been worn — exchanges are for unused items only."
                        className="w-full rounded border border-gray-300 bg-white p-2 text-sm text-gray-900 placeholder:text-gray-400"
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          disabled={busyId === exc.id || !rejectReason.trim()}
                          title={!rejectReason.trim() ? 'A reason is required' : undefined}
                          onClick={() =>
                            withBusy(exc.id, async () => {
                              await call(`exchanges/${exc.id}/reject`, { reason: rejectReason.trim() });
                              setRejectingId(null);
                              setRejectReason('');
                            })
                          }
                          className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Confirm Rejection
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(null);
                            setRejectReason('');
                          }}
                          className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-700 hover:bg-gray-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Inline inspection, in place of a stacked "notes" prompt
                      dialog — the whole point is that typing notes and
                      recording the result happen in one place, on this card,
                      not behind a second modal on top of this one. */}
                  {exc.status === 'in_transit' && (
                    <div className="mt-3 rounded-lg border border-indigo-200 bg-indigo-50 p-3">
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        Inspection notes
                      </label>
                      <textarea
                        value={inspectionNotes[exc.id] || ''}
                        onChange={(e) => setInspectionNotes((prev) => ({ ...prev, [exc.id]: e.target.value }))}
                        rows={2}
                        placeholder="What did you find when you opened the parcel?"
                        className="w-full rounded border border-gray-300 bg-white p-2 text-sm text-gray-900 placeholder:text-gray-400"
                      />
                      <div className="mt-2 flex gap-2">
                        <button
                          disabled={busyId === exc.id}
                          onClick={() =>
                            withBusy(exc.id, () =>
                              call(`exchanges/${exc.id}/inspection`, {
                                result: 'passed',
                                notes: inspectionNotes[exc.id]?.trim() || undefined,
                              }),
                            )
                          }
                          className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          Passed Inspection
                        </button>
                        <button
                          disabled={busyId === exc.id || !inspectionNotes[exc.id]?.trim()}
                          title={!inspectionNotes[exc.id]?.trim() ? 'Say why it failed — the customer sees this note' : undefined}
                          onClick={() =>
                            withBusy(exc.id, () =>
                              call(`exchanges/${exc.id}/inspection`, {
                                result: 'failed',
                                notes: inspectionNotes[exc.id]!.trim(),
                              }),
                            )
                          }
                          className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Failed Inspection
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Route 2: different product — the credit was already
                      issued; place the actual replacement order, or bail to
                      credit-only. Directly below where Passed Inspection was
                      just clicked, in the same card — the next step to take,
                      not something to go find via a notification. */}
                  {awaitingReplacementDecision && isDifferentProduct && (
                    <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3">
                      <p className="mb-2 text-xs font-medium text-green-800">
                        ✓ Inspection passed — the customer&apos;s credit is issued. Next: place their replacement,
                        or settle as credit only.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          disabled={busyId === exc.id}
                          onClick={() => withBusy(exc.id, () => call(`exchanges/${exc.id}/create-replacement-order`))}
                          className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Create Replacement Order
                        </button>
                        <button
                          disabled={busyId === exc.id}
                          onClick={() => withBusy(exc.id, () => call(`exchanges/${exc.id}/settle-as-credit`))}
                          className="rounded bg-gray-600 px-3 py-1 text-xs text-white hover:bg-gray-700 disabled:opacity-50"
                          title="Product no longer available — leave the customer with store credit instead"
                        >
                          Settle as Credit Instead
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
