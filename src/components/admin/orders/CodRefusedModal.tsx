'use client';

import { useEffect, useState } from 'react';

import { api, errorMessage } from '@/lib/api';
import { toast } from '@/components/admin/pom/dialogs';
import { moneyExact } from '@/components/admin/pom/format';
import { Thumb } from '@/components/admin/pom/image-lightbox';
import { Modal } from '@/components/admin/pom/modal';
import { Segmented } from '@/components/admin/pom/segmented';
import { FormField, Notice, SearchBox, Spinner } from '@/components/admin/pom/ui';
import type { AdminOrder } from '@/lib/admin/orders';

interface ProductHit {
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

type Decision = 'credit' | 'exchange' | 'nothing';

const EXPLAIN: Record<Decision, string> = {
  credit:
    'The parcel came back fine and goes back into stock. Nothing was ever charged, so any amount here is a goodwill credit, not a refund.',
  exchange:
    'The parcel came back fine and goes back into stock. This order is cancelled and a new one is placed for the piece they want instead.',
  nothing: "The parcel came back damaged or tampered with. It won't be restocked and no credit is issued.",
};

/**
 * A COD parcel the customer refused at the door. The admin picks one of three
 * outcomes; only the exchange needs a replacement product, which is why it
 * posts to its own endpoint.
 */
export function CodRefusedModal({
  order,
  onClose,
  onResolved,
}: {
  order: AdminOrder;
  onClose: () => void;
  onResolved: () => void;
}) {
  const [decision, setDecision] = useState<Decision>('credit');
  const [reason, setReason] = useState('');
  const [credit, setCredit] = useState('0');
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<ProductHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [product, setProduct] = useState<ProductHit | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [variantId, setVariantId] = useState('');
  const [qty, setQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (decision !== 'exchange' || !query.trim() || product) {
      setHits([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await api.get<{ products?: ProductHit[] } | ProductHit[]>('/products', {
          params: { search: query.trim(), limit: 8, status: 'active' },
        });
        setHits(Array.isArray(data) ? data : data?.products ?? []);
      } catch {
        setHits([]);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query, decision, product]);

  useEffect(() => {
    setVariantId('');
    if (!product) {
      setVariants([]);
      return;
    }
    api
      .get<Variant[]>(`/products/${product.id}/variants`)
      .then((data) => setVariants((data || []).filter((v) => v.isActive && v.stockQuantity > 0)))
      .catch(() => setVariants([]));
  }, [product]);

  async function submit() {
    setError('');
    if (decision !== 'exchange' && !reason.trim()) {
      setError('Add a short note on why, for the order history.');
      return;
    }
    if (decision === 'exchange' && (!product || !variantId)) {
      setError('Pick the replacement product and its size or colour.');
      return;
    }
    setSubmitting(true);
    try {
      if (decision === 'exchange') {
        await api.post(`/orders/${order.id}/cod-refused-exchange`, {
          productId: product!.id,
          variantId,
          quantity: qty,
          reason: reason.trim() || 'COD delivery refused, customer asked for a different piece',
        });
        toast.success('Replacement order placed.');
      } else {
        await api.post(`/orders/${order.id}/cod-refused`, {
          decision,
          creditAmount: decision === 'credit' ? Number(credit) || 0 : undefined,
          reason: reason.trim(),
        });
        toast.success('Refused delivery recorded.');
      }
      onResolved();
      onClose();
    } catch (e) {
      setError(errorMessage(e, 'Could not record the refused delivery.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      title={`COD refused: ${order.orderNumber}`}
      subtitle={`${moneyExact(order.total)} was due on delivery`}
      onClose={onClose}
      width="32rem"
      footer={
        <div className="flex w-full justify-end gap-2">
          <button type="button" className="btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-blue" disabled={submitting} onClick={submit}>
            {submitting ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {error ? <Notice tone="danger">{error}</Notice> : null}

        <div>
          <div className="label">What happened to the parcel?</div>
          <Segmented<Decision>
            label="Outcome"
            size="md"
            value={decision}
            onChange={setDecision}
            items={[
              { key: 'credit', label: 'Back fine, credit' },
              { key: 'exchange', label: 'Exchange' },
              { key: 'nothing', label: 'Damaged' },
            ]}
          />
          <p className="muted mt-2 text-xs leading-relaxed">{EXPLAIN[decision]}</p>
        </div>

        {decision === 'credit' ? (
          <FormField label="Goodwill credit (optional)" htmlFor="cod-credit" hint="In rupees. Leave at 0 for none.">
            <input
              id="cod-credit"
              type="number"
              min={0}
              step="1"
              inputMode="decimal"
              className="input max-w-[10rem]"
              value={credit}
              onChange={(e) => setCredit(e.target.value)}
            />
          </FormField>
        ) : null}

        {decision === 'exchange' ? (
          product ? (
            <div className="surface-2 space-y-3 p-3">
              <div className="flex items-center gap-3">
                <Thumb src={product.featuredImage} alt={product.name} className="h-12 w-12" />
                <div className="min-w-0 flex-1 truncate text-sm font-medium">{product.name}</div>
                <button type="button" className="btn btn-primary px-2 py-1 text-xs" onClick={() => setProduct(null)}>
                  Change
                </button>
              </div>
              <FormField label="Size / colour" htmlFor="cod-variant">
                <select id="cod-variant" className="input" value={variantId} onChange={(e) => setVariantId(e.target.value)}>
                  <option value="">{variants.length ? 'Choose one' : 'Nothing in stock'}</option>
                  {variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {Object.values(v.variantAttributes || {}).join(' / ') || v.sku} · {moneyExact(v.price)} · {v.stockQuantity} in stock
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Quantity" htmlFor="cod-qty">
                <input
                  id="cod-qty"
                  type="number"
                  min={1}
                  className="input max-w-[6rem]"
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                />
              </FormField>
            </div>
          ) : (
            <div>
              <div className="label">Replacement product</div>
              <SearchBox value={query} onChange={setQuery} placeholder="Search products" autoFocus />
              {searching ? (
                <div className="mt-3 flex justify-center">
                  <Spinner size="1.6rem" />
                </div>
              ) : hits.length > 0 ? (
                <div className="surface-2 mt-2 max-h-60 divide-y overflow-y-auto">
                  {hits.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProduct(p)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-[var(--pom-accent-soft)]"
                    >
                      <Thumb src={p.featuredImage} alt="" className="h-9 w-9" zoom={false} />
                      <span className="min-w-0 truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          )
        ) : null}

        <FormField label={decision === 'exchange' ? 'Note (optional)' : 'Note'} htmlFor="cod-reason">
          <textarea
            id="cod-reason"
            className="input min-h-[72px]"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why, for the order history"
          />
        </FormField>
      </div>
    </Modal>
  );
}
