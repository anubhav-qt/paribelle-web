'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, Search } from 'lucide-react';
import { OrderItem } from '@/types/common';

interface Variant {
  id: string;
  sku: string;
  variantAttributes: Record<string, string>;
  stockQuantity: number;
  isActive: boolean;
  price: number;
}

interface ProductResult {
  id: string;
  name: string;
  price: number;
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
    exchangeVariantId?: string;
    customerNotes?: string;
  }) => Promise<void>;
}

const EXCHANGE_REASONS = [
  { value: 'size_fit', label: 'Wrong size or fit' },
  { value: 'wrong_variant', label: 'Ordered the wrong option' },
  { value: 'changed_mind', label: "Changed my mind, don't want a replacement" },
  { value: 'other', label: 'Other reason' },
];

type Mode = 'same_product' | 'different_product' | 'credit_only';

/**
 * Requests an exchange for one order item — three routes (see the
 * implementation plan): a different variant of the same product (free, no
 * money moves), a different product of equal or lower price (the gap is
 * credited to your wallet), or no replacement at all (the full value is
 * credited). The backend enforces "no more expensive than the original" on
 * route 2 regardless of what's selected here.
 */
export default function ExchangeRequestModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  item,
  onSubmit,
}: ExchangeRequestModalProps) {
  const [mode, setMode] = useState<Mode>('same_product');
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState('');

  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState<ProductResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductResult | null>(null);
  const [otherVariants, setOtherVariants] = useState<Variant[]>([]);
  const [selectedOtherVariantId, setSelectedOtherVariantId] = useState('');

  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setMode('same_product');
    setSelectedVariantId('');
    setProductQuery('');
    setProductResults([]);
    setSelectedProduct(null);
    setOtherVariants([]);
    setSelectedOtherVariantId('');
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

  useEffect(() => {
    if (mode !== 'different_product' || !productQuery.trim() || selectedProduct) {
      setProductResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?search=${encodeURIComponent(productQuery)}&limit=8&status=active`,
        );
        const data = await res.json();
        const results: ProductResult[] = (data.products || data || []).filter((p: ProductResult) => p.id !== item.productId);
        setProductResults(results);
      } catch {
        setProductResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [productQuery, mode, selectedProduct, item.productId]);

  useEffect(() => {
    if (!selectedProduct) {
      setOtherVariants([]);
      setSelectedOtherVariantId('');
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${selectedProduct.id}/variants`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Variant[]) => setOtherVariants((data || []).filter((v) => v.isActive && v.stockQuantity > 0)))
      .catch(() => setOtherVariants([]));
  }, [selectedProduct]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (mode === 'same_product' && !selectedVariantId) {
      setError('Choose which option you want instead.');
      return;
    }
    if (mode === 'different_product' && (!selectedProduct || !selectedOtherVariantId)) {
      setError('Choose the product and option you want instead.');
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
        exchangeVariantId:
          mode === 'same_product' ? selectedVariantId :
          mode === 'different_product' ? selectedOtherVariantId :
          undefined,
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
            <label className="mb-2 block text-sm font-medium text-foreground">What would you like?</label>
            <div className="grid grid-cols-1 gap-2">
              {([
                { value: 'same_product', label: 'A different size/option of this item' },
                { value: 'different_product', label: 'A different product (of equal or lower price)' },
                { value: 'credit_only', label: 'Nothing — just credit my account' },
              ] as { value: Mode; label: string }[]).map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 rounded-lg border p-2 cursor-pointer ${
                    mode === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="exchangeMode"
                    checked={mode === opt.value}
                    onChange={() => setMode(opt.value)}
                  />
                  <span className="text-sm text-foreground">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {mode === 'same_product' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Exchange for</label>
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
          )}

          {mode === 'different_product' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Only a product priced at or below what you paid can be exchanged this way — anything cheaper is
                credited to your account.
              </p>
              {!selectedProduct ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">Search products</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                      placeholder="Search…"
                      className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-foreground"
                    />
                  </div>
                  {searching && <p className="mt-1 text-xs text-muted-foreground">Searching…</p>}
                  {productResults.length > 0 && (
                    <div className="mt-2 max-h-48 divide-y divide-border overflow-y-auto rounded-lg border border-border">
                      {productResults.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedProduct(p);
                            setProductResults([]);
                          }}
                          className="flex w-full items-center justify-between p-2 text-left text-sm hover:bg-muted"
                        >
                          <span>{p.name}</span>
                          <span className="text-muted-foreground">₹{p.price}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{selectedProduct.name}</span>
                    <button onClick={() => setSelectedProduct(null)} className="text-xs text-primary hover:underline">
                      Change
                    </button>
                  </div>
                  <div className="mt-3">
                    <label className="mb-1 block text-xs font-medium text-foreground">Option</label>
                    <select
                      value={selectedOtherVariantId}
                      onChange={(e) => setSelectedOtherVariantId(e.target.value)}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    >
                      <option value="">Select an option…</option>
                      {otherVariants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {formatAttributes(v.variantAttributes) || v.sku} — ₹{v.price}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {mode === 'credit_only' && (
            <p className="text-sm text-muted-foreground">
              Once we receive and inspect the returned item, the full amount you paid for it will be added to your
              store credit, which you can use on any future order.
            </p>
          )}

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
            disabled={submitting || (mode === 'same_product' && variants.length === 0)}
            className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}
