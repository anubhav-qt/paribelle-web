'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, Search } from 'lucide-react';
import { Order } from '@/types/common';

interface ProductResult {
  id: string;
  name: string;
  featuredImage?: string | null;
}

interface Variant {
  id: string;
  sku: string;
  variantAttributes: Record<string, string>;
  stockQuantity: number;
  isActive: boolean;
  price: number;
}

interface CodRefusalModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onResolved: () => void;
}

type Decision = 'credit' | 'exchange' | 'nothing';

const authHeaders = (): Record<string, string> => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * A COD order was dispatched and the customer refused it at the door — see
 * the order flow in the implementation plan. Admin picks exactly one of
 * three outcomes here; each maps to a different backend endpoint since only
 * "exchange" needs a replacement product.
 */
export default function CodRefusalModal({ isOpen, onClose, order, onResolved }: CodRefusalModalProps) {
  const [decision, setDecision] = useState<Decision>('credit');
  const [reason, setReason] = useState('');
  const [creditAmount, setCreditAmount] = useState('0');
  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState<ProductResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductResult | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setDecision('credit');
    setReason('');
    setCreditAmount('0');
    setProductQuery('');
    setProductResults([]);
    setSelectedProduct(null);
    setVariants([]);
    setSelectedVariantId('');
    setQuantity(1);
    setError('');
  }, [isOpen]);

  useEffect(() => {
    if (decision !== 'exchange' || !productQuery.trim() || selectedProduct) {
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
        setProductResults(data.products || data || []);
      } catch {
        setProductResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [productQuery, decision, selectedProduct]);

  useEffect(() => {
    if (!selectedProduct) {
      setVariants([]);
      setSelectedVariantId('');
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${selectedProduct.id}/variants`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Variant[]) => setVariants((data || []).filter((v) => v.isActive && v.stockQuantity > 0)))
      .catch(() => setVariants([]));
  }, [selectedProduct]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setError('');
    if (decision !== 'exchange' && !reason.trim()) {
      setError('A reason helps future you (and support) understand this decision.');
      return;
    }
    if (decision === 'exchange' && (!selectedProduct || !selectedVariantId)) {
      setError('Pick the replacement product and option.');
      return;
    }

    setSubmitting(true);
    try {
      let res: Response;
      if (decision === 'exchange') {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders/${order.id}/cod-refused-exchange`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({
            productId: selectedProduct!.id,
            variantId: selectedVariantId,
            quantity,
            reason: reason.trim() || 'COD delivery refused — customer requested a different item',
          }),
        });
      } else {
        res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders/${order.id}/cod-refused`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders() },
          body: JSON.stringify({
            decision,
            creditAmount: decision === 'credit' ? Number(creditAmount) || 0 : undefined,
            reason: reason.trim(),
          }),
        });
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to resolve the refused delivery');
      }
      onResolved();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to resolve the refused delivery');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-bold text-gray-900">COD Refused — Order #{order.orderNumber}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">What happened to the goods?</label>
            <div className="grid grid-cols-3 gap-2">
              {(['credit', 'exchange', 'nothing'] as Decision[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDecision(d)}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                    decision === d ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {d === 'credit' ? 'Issue credit' : d === 'exchange' ? 'Exchange' : 'Nothing (tampered)'}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {decision === 'credit' && 'Goods are fine and back in stock. This order never charged the customer — any amount here is a goodwill gesture, not a refund.'}
              {decision === 'exchange' && 'Goods are fine and back in stock. This order is cancelled and a new one is placed for the replacement — no payment was ever collected, so nothing to credit.'}
              {decision === 'nothing' && "Goods came back damaged or tampered — they won't be restocked, and no credit is issued."}
            </p>
          </div>

          {decision === 'credit' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Goodwill credit amount (₹, optional)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {decision === 'exchange' && (
            <div className="space-y-3">
              {!selectedProduct ? (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">Replacement product</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                      placeholder="Search products…"
                      className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {searching && <p className="mt-1 text-xs text-gray-400">Searching…</p>}
                  {productResults.length > 0 && (
                    <div className="mt-2 max-h-48 divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-200">
                      {productResults.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSelectedProduct(p);
                            setProductResults([]);
                          }}
                          className="flex w-full items-center gap-2 p-2 text-left text-sm hover:bg-gray-50"
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">{selectedProduct.name}</span>
                    <button
                      onClick={() => setSelectedProduct(null)}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      Change
                    </button>
                  </div>

                  <div className="mt-3">
                    <label className="mb-1 block text-xs font-medium text-gray-700">Option</label>
                    <select
                      value={selectedVariantId}
                      onChange={(e) => setSelectedVariantId(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select an option…</option>
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {Object.values(v.variantAttributes || {}).join(' / ') || v.sku} — ₹{v.price} ({v.stockQuantity} in stock)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-3">
                    <label className="mb-1 block text-xs font-medium text-gray-700">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Notes {decision === 'exchange' ? '(optional)' : ''}
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Why this decision — useful for the order history"
            />
          </div>
        </div>

        <div className="flex gap-3 border-t p-4">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
