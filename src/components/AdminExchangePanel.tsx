'use client';

import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import Link from 'next/link';
import { showPrompt } from '@/lib/dialog';

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

              return (
                <div key={exc.id} className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium text-gray-900">{exc.returnNumber}</span>
                    <span className="text-xs text-gray-500">{new Date(exc.requestedAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-gray-700">{exc.productName} — Qty {exc.quantity}</p>

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
                          onClick={async () => {
                            const reason = await showPrompt({ title: 'Reject Exchange Request', message: 'Reason for rejecting this exchange request:', required: true });
                            if (reason) withBusy(exc.id, () => call(`exchanges/${exc.id}/reject`, { reason }));
                          }}
                          className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {exc.status === 'in_transit' && (
                      <>
                        <button
                          disabled={busyId === exc.id}
                          onClick={async () => {
                            const notes = (await showPrompt({ title: 'Passed Inspection', message: 'Inspection notes (optional):' })) || undefined;
                            withBusy(exc.id, () => call(`exchanges/${exc.id}/inspection`, { result: 'passed', notes }));
                          }}
                          className="rounded bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          Passed Inspection
                        </button>
                        <button
                          disabled={busyId === exc.id}
                          onClick={async () => {
                            const notes = (await showPrompt({ title: 'Failed Inspection', message: 'Why did it fail inspection?' })) || undefined;
                            withBusy(exc.id, () => call(`exchanges/${exc.id}/inspection`, { result: 'failed', notes }));
                          }}
                          className="rounded bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          Failed Inspection
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
                    {/* Route 2: different product — the credit was already issued; place the actual replacement order, or bail to credit-only. */}
                    {awaitingReplacementDecision && isDifferentProduct && (
                      <>
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
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
