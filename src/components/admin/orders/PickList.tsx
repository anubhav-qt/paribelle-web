'use client';

import { Printer } from 'lucide-react';
import { useMemo } from 'react';

import { Modal } from '@/components/admin/pom/modal';
import { Thumb } from '@/components/admin/pom/image-lightbox';
import { colorSwatch, sortSizes } from '@/components/admin/pom/swatch';
import { ColorDot, Empty } from '@/components/admin/pom/ui';
import { itemOptions, itemPhoto, type AdminOrder } from '@/lib/admin/orders';
import { printPackingSlips } from './actions';

interface Pick {
  key: string;
  name: string;
  color: string | null;
  photo: string | null;
  sizes: Map<string, number>;
  total: number;
  orders: Set<string>;
}

/**
 * Everything waiting to go out, added up: one row per product and colour,
 * with how many of each size to pull. Walk the shelves once instead of once
 * per order.
 */
export function PickList({ orders, onClose }: { orders: AdminOrder[]; onClose: () => void }) {
  const picks = useMemo(() => {
    const map = new Map<string, Pick>();
    for (const o of orders) {
      for (const item of o.items) {
        const { size, color } = itemOptions(item);
        const key = `${item.productId}|${(color ?? '').toLowerCase()}`;
        let p = map.get(key);
        if (!p) {
          p = { key, name: item.productName, color, photo: itemPhoto(item), sizes: new Map(), total: 0, orders: new Set() };
          map.set(key, p);
        }
        const qty = Number(item.quantity) || 0;
        const s = size ?? 'One size';
        p.sizes.set(s, (p.sizes.get(s) ?? 0) + qty);
        p.total += qty;
        p.orders.add(o.orderNumber);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name) || (a.color ?? '').localeCompare(b.color ?? ''));
  }, [orders]);

  const pieces = picks.reduce((n, p) => n + p.total, 0);

  return (
    <Modal
      title="Pick list"
      subtitle={`${pieces} ${pieces === 1 ? 'piece' : 'pieces'} across ${orders.length} ${orders.length === 1 ? 'order' : 'orders'}`}
      onClose={onClose}
      width="40rem"
      footer={
        <div className="flex w-full justify-between gap-2">
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
          <button type="button" className="btn btn-white" disabled={orders.length === 0} onClick={() => printPackingSlips(orders)}>
            <Printer className="h-4 w-4" />
            Print packing slips
          </button>
        </div>
      }
    >
      {picks.length === 0 ? (
        <Empty title="Nothing to pick." hint="Orders waiting to ship show up here." />
      ) : (
        <div className="surface-2 divide-y" style={{ background: 'var(--pom-panel)' }}>
          {picks.map((p) => {
            const sw = colorSwatch(p.color);
            return (
              <div key={p.key} className="flex gap-3 p-3">
                <Thumb src={p.photo} alt={p.name} className="h-20 w-16" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{p.name}</div>
                      {p.color ? (
                        <div className="mt-0.5 flex items-center gap-1.5 text-[13px]">
                          {sw ? <ColorDot css={sw.css} multi={sw.multi} /> : null}
                          {p.color}
                        </div>
                      ) : null}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-lg font-semibold leading-none tabular-nums">{p.total}</div>
                      <div className="muted text-[11px]">pieces</div>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {sortSizes(Array.from(p.sizes.keys())).map((s) => (
                      <span
                        key={s}
                        className="pom-round inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[12.5px]"
                        style={{ borderColor: 'var(--pom-border-strong)' }}
                      >
                        <span className="font-semibold">{s}</span>
                        <span className="muted">× {p.sizes.get(s)}</span>
                      </span>
                    ))}
                  </div>
                  <div className="muted mt-1.5 truncate font-mono text-[11px]">{Array.from(p.orders).join(', ')}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
