'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { OrderItem } from '@/types/common';

interface Variant {
  id: string;
  sku: string;
  variantAttributes: Record<string, string>;
  stockQuantity: number;
  isActive: boolean;
}

interface ExchangeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  item: OrderItem;
  onSubmit: (data: {
    quantity: number;
    reason: string;
    exchangeVariantId: string;
    customerNotes?: string;
  }) => Promise<void>;
}

const EXCHANGE_REASONS = [
  { value: 'size_fit', label: 'Wrong size or fit' },
  { value: 'wrong_variant', label: 'Ordered the wrong option' },
  { value: 'other', label: 'Other reason' },
];

/**
 * Requests an exchange for one order item — same product, a different
 * variant only (decided; see the implementation plan's Task 8). There is no
 * product picker here on purpose: the backend rejects a request naming a
 * different product, so offering one would just be a control that fails on
 * submit.
 */
export default function ExchangeRequestModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  item,
  onSubmit,
}: ExchangeRequestModalProps) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setSelectedVariantId('');
    setQuantity(1);
    setReason('');
    setOtherReason('');
    setCustomerNotes('');
    setError('');

    setLoadingVariants(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${item.productId}/variants`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Variant[]) => {
        // The variant already on the order is not a valid exchange target.
        setVariants((data || []).filter((v) => v.id !== item.variantId && v.isActive && v.stockQuantity > 0));
      })
      .catch(() => setVariants([]))
      .finally(() => setLoadingVariants(false));
  }, [isOpen, item.productId, item.variantId]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!selectedVariantId) {
      setError('Choose which option you want instead.');
      return;
    }
    const finalReason = reason === 'other' ? otherReason.trim() : reason;
    if (!finalReason) {
      setError('Let us know why you want to exchange this item.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        quantity,
        reason: finalReason,
        exchangeVariantId: selectedVariantId,
        customerNotes: customerNotes.trim() || undefined,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to submit exchange request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatAttributes = (attrs: Record<string, string>) =>
    Object.entries(attrs || {}).map(([k, v]) => `${k}: ${v}`).join(', ');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-card shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-bold text-foreground">Request Exchange</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <p className="text-sm text-muted-foreground">
            Order #{orderNumber} — {item.productName}
          </p>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Exchange for
            </label>
            {loadingVariants ? (
              <p className="text-sm text-muted-foreground">Loading options…</p>
            ) : variants.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No other option of this item is currently available for exchange.
              </p>
            ) : (
              <div className="space-y-2">
                {variants.map((v) => (
                  <label
                    key={v.id}
                    className="flex items-center gap-2 rounded-lg border border-border p-2 hover:bg-muted"
                  >
                    <input
                      type="radio"
                      name="exchangeVariant"
                      checked={selectedVariantId === v.id}
                      onChange={() => setSelectedVariantId(v.id)}
                    />
                    <span className="text-sm text-foreground">{formatAttributes(v.variantAttributes)}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Quantity</label>
            <input
              type="number"
              min={1}
              max={item.quantity}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(item.quantity, Number(e.target.value) || 1)))}
              className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            />
            <p className="mt-1 text-xs text-muted-foreground">Up to {item.quantity} ordered</p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            >
              <option value="">Select a reason</option>
              {EXCHANGE_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {reason === 'other' && (
              <input
                type="text"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder="Tell us more"
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              />
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Notes (optional)
            </label>
            <textarea
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border p-4">
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-border px-4 py-2 font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || variants.length === 0}
            className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
