'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { api, errorMessage } from '@/lib/api';
import { dayLabel, moneyExact } from '@/components/admin/pom/format';
import { Modal } from '@/components/admin/pom/modal';
import { promptDialog, toast } from '@/components/admin/pom/dialogs';
import { Badge, CenteredSpinner, Empty, Notice } from '@/components/admin/pom/ui';
import { exchangeMeta, type AdminOrder } from '@/lib/admin/orders';

interface ExchangeRequest {
  id: string;
  returnNumber: string;
  status: string;
  quantity: number;
  reason: string;
  productName: string;
  customerNotes: string | null;
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

/** What the admin is waiting on, in one line under the status. */
const NEXT: Record<string, string> = {
  requested: 'Watch the video, then approve or reject.',
  approved: 'Waiting for the customer to send it back.',
  in_transit: 'On its way back. Inspect it when it arrives.',
  received: 'Inspection passed.',
  replacement_shipped: 'Replacement is on its way to the customer.',
};

/**
 * The shop's side of an exchange, one card per request, each card carrying
 * only the step it is on: approve or reject, then inspect, then ship the
 * swap or place the replacement order. Ported from the old exchange panel;
 * the endpoints and the three routes (same product, different product,
 * credit only) are unchanged.
 */
export function ExchangesModal({
  order,
  onClose,
  onChanged,
  onBack,
}: {
  order: AdminOrder;
  onClose: () => void;
  onChanged: () => void;
  /** Return to the order's detail, when opened from it. */
  onBack?: () => void;
}) {
  const [items, setItems] = useState<ExchangeRequest[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      setItems(await api.get<ExchangeRequest[]>(`/orders/${order.id}/exchanges`));
    } catch (e) {
      setError(errorMessage(e, 'Could not load the exchange requests.'));
      setItems([]);
    }
  }, [order.id]);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, path: string, body?: unknown, done?: string) {
    setBusyId(id);
    setError('');
    try {
      await api.post(`/exchanges/${id}/${path}`, body);
      if (done) toast.success(done);
      await load();
      onChanged();
      return true;
    } catch (e) {
      setError(errorMessage(e, 'That did not go through.'));
      return false;
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Modal
      title={`Exchanges on ${order.orderNumber}`}
      subtitle={items ? `${items.length} ${items.length === 1 ? 'request' : 'requests'}` : undefined}
      onClose={onClose}
      width="40rem"
      footer={
        onBack ? (
          <button type="button" className="btn" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
            Back to order
          </button>
        ) : undefined
      }
    >
      {error ? <Notice tone="danger" className="mb-4">{error}</Notice> : null}

      {items === null ? (
        <CenteredSpinner />
      ) : items.length === 0 ? (
        <Empty title="No exchange requests on this order." />
      ) : (
        <div className="space-y-4">
          {items.map((x) => {
            const meta = exchangeMeta(x.status);
            const differentProduct = !!x.exchangeVariant && x.exchangeVariant.product.id !== x.orderItem?.productId;
            const creditOnly = !x.exchangeVariant;
            const passed = x.status === 'received' && x.inspectionResult === 'passed';
            const busy = busyId === x.id;
            const wantsOptions = x.exchangeVariant ? Object.values(x.exchangeVariant.variantAttributes || {}).join(' / ') : '';

            return (
              <div key={x.id} className="surface-2">
                <div className="flex items-start justify-between gap-3 border-b p-3.5" style={{ background: 'var(--pom-panel)' }}>
                  <div className="min-w-0">
                    <div className="font-semibold">{x.productName}</div>
                    <div className="muted mt-0.5 text-xs">
                      <span className="font-mono">{x.returnNumber}</span> · Qty {x.quantity} · {dayLabel(x.requestedAt)}
                    </div>
                  </div>
                  <Badge tone={meta.tone}>{meta.label.replace(/^Exchange /, '')}</Badge>
                </div>

                <div className="space-y-2.5 p-3.5 text-sm">
                  <div>
                    <span className="muted">Wants: </span>
                    {creditOnly ? (
                      <span className="font-medium">store credit only, no replacement</span>
                    ) : (
                      <>
                        <span className="font-medium">{x.exchangeVariant!.product.name}</span>
                        {wantsOptions ? <span className="font-medium"> ({wantsOptions})</span> : null}
                        <span className="muted"> · {moneyExact(x.exchangeVariant!.price)}</span>
                        {differentProduct ? <Badge tone="indigo" dot={false} className="ml-2 py-0.5">Different product</Badge> : null}
                      </>
                    )}
                  </div>
                  <div>
                    <span className="muted">Reason: </span>
                    {x.reason}
                  </div>
                  {x.customerNotes ? (
                    <div>
                      <span className="muted">Customer note: </span>
                      {x.customerNotes}
                    </div>
                  ) : null}
                  {Number(x.refundTotal) > 0 ? (
                    <div>
                      <span className="muted">Credit: </span>
                      <span className="font-medium">{moneyExact(x.refundTotal)}</span>
                    </div>
                  ) : null}
                  {Number(x.courierCharge) > 0 ? (
                    <div>
                      <span className="muted">Courier charge: </span>
                      <span className="font-medium">{moneyExact(x.courierCharge)}</span>
                      <span className="muted">
                        {' '}
                        ·{' '}
                        {x.courierChargePaymentMethod === 'cod'
                          ? 'collect on delivery'
                          : x.courierChargePaymentMethod === 'online'
                            ? x.completedOrder
                              ? 'payable online on the replacement order'
                              : 'paying online'
                            : x.courierChargePaidAt
                              ? 'paid from store credit'
                              : 'from store credit when it ships'}
                      </span>
                    </div>
                  ) : null}

                  {x.videoUrl ? (
                    <div className="pt-1">
                      <div className="label">Customer&apos;s video</div>
                      <video src={x.videoUrl} controls preload="metadata" playsInline className="max-h-72 w-full bg-black" />
                    </div>
                  ) : (
                    <p className="muted text-xs">No video: this request was made before videos were required.</p>
                  )}

                  <p className="text-[13px] font-medium" style={{ color: 'var(--pom-accent-ink)' }}>
                    {NEXT[x.status] ?? meta.label}
                  </p>
                  {x.customerTrackingNumber ? (
                    <p className="muted text-xs">
                      Customer&apos;s tracking: <span className="font-mono">{x.customerTrackingNumber}</span>
                    </p>
                  ) : null}
                  {x.inspectionNotes ? <p className="muted text-xs">Inspection notes: {x.inspectionNotes}</p> : null}
                  {x.rejectionReason ? (
                    <p className="text-xs" style={{ color: 'var(--pom-danger)' }}>
                      Rejected: {x.rejectionReason}
                    </p>
                  ) : null}
                  {x.replacementTrackingNumber ? (
                    <p className="muted text-xs">
                      Replacement tracking: <span className="font-mono">{x.replacementTrackingNumber}</span>
                    </p>
                  ) : null}
                  {x.completedOrder ? (
                    <p className="text-xs">
                      <span className="muted">Fulfilled by </span>
                      <Link
                        href={`/admin/orders?orderId=${x.completedOrder.id}`}
                        onClick={onClose}
                        className="font-medium"
                        style={{ color: 'var(--pom-accent-ink)' }}
                      >
                        order {x.completedOrder.orderNumber}
                      </Link>
                    </p>
                  ) : null}
                </div>

                {/* One step per state, right under the evidence it is decided on. */}
                {x.status === 'requested' ? (
                  <div className="border-t p-3.5">
                    {rejecting === x.id ? (
                      <div className="space-y-2">
                        <label className="label" htmlFor={`rej-${x.id}`}>
                          Why reject it? The customer sees this word for word.
                        </label>
                        <textarea
                          id={`rej-${x.id}`}
                          className="input min-h-[72px]"
                          value={rejectReason}
                          autoFocus
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="e.g. The video shows the kurti has been worn. Exchanges are for unused items only."
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn btn-white btn-danger"
                            disabled={busy || !rejectReason.trim()}
                            onClick={async () => {
                              if (await act(x.id, 'reject', { reason: rejectReason.trim() }, 'Exchange rejected.')) {
                                setRejecting(null);
                                setRejectReason('');
                              }
                            }}
                          >
                            Reject exchange
                          </button>
                          <button type="button" className="btn" onClick={() => setRejecting(null)}>
                            Back
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-blue"
                          disabled={busy}
                          onClick={() => act(x.id, 'approve', undefined, 'Exchange approved. The customer can send it back.')}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="btn btn-white btn-danger"
                          disabled={busy}
                          onClick={() => {
                            setRejecting(x.id);
                            setRejectReason('');
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}

                {x.status === 'in_transit' ? (
                  <div className="space-y-2 border-t p-3.5">
                    <label className="label" htmlFor={`insp-${x.id}`}>
                      Inspection notes
                    </label>
                    <textarea
                      id={`insp-${x.id}`}
                      className="input min-h-[64px]"
                      value={notes[x.id] ?? ''}
                      onChange={(e) => setNotes((n) => ({ ...n, [x.id]: e.target.value }))}
                      placeholder="What you found when you opened the parcel. Required if it fails."
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-blue"
                        disabled={busy}
                        onClick={() =>
                          act(x.id, 'inspection', { result: 'passed', notes: notes[x.id]?.trim() || undefined }, 'Inspection passed.')
                        }
                      >
                        Passed
                      </button>
                      <button
                        type="button"
                        className="btn btn-white btn-danger"
                        disabled={busy || !notes[x.id]?.trim()}
                        title={!notes[x.id]?.trim() ? 'Say why it failed. The customer sees this note.' : undefined}
                        onClick={() => act(x.id, 'inspection', { result: 'failed', notes: notes[x.id]!.trim() }, 'Marked as failed.')}
                      >
                        Failed
                      </button>
                    </div>
                  </div>
                ) : null}

                {passed && x.exchangeVariant && !differentProduct ? (
                  <div className="border-t p-3.5">
                    <button
                      type="button"
                      className="btn btn-blue"
                      disabled={busy}
                      onClick={async () => {
                        const v = await promptDialog({
                          title: 'Ship the replacement',
                          message: `${x.exchangeVariant!.product.name}${wantsOptions ? ` (${wantsOptions})` : ''}`,
                          confirmText: 'Mark shipped',
                          fields: [{ name: 'trackingNumber', label: 'Tracking number', placeholder: 'AWB / tracking number' }],
                        });
                        if (v) await act(x.id, 'ship-replacement', { trackingNumber: v.trackingNumber || undefined }, 'Replacement shipped.');
                      }}
                    >
                      Ship replacement
                    </button>
                  </div>
                ) : null}

                {passed && x.exchangeVariant && differentProduct && !x.completedOrderId ? (
                  <div className="space-y-2 border-t p-3.5">
                    <p className="text-xs" style={{ color: '#0c7a5a' }}>
                      The customer&apos;s credit is issued. Place their replacement order, or leave them with the credit if
                      that product is no longer available.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="btn btn-blue"
                        disabled={busy}
                        onClick={() => act(x.id, 'create-replacement-order', undefined, 'Replacement order placed.')}
                      >
                        Create replacement order
                      </button>
                      <button
                        type="button"
                        className="btn btn-white"
                        disabled={busy}
                        onClick={() => act(x.id, 'settle-as-credit', undefined, 'Settled as store credit.')}
                      >
                        Settle as credit
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
