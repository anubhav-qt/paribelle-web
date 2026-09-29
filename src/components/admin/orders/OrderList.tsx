'use client';

import { useState } from 'react';

import { dayLabel, money, timeOfDay } from '@/components/admin/pom/format';
import { Thumb } from '@/components/admin/pom/image-lightbox';
import { Badge, Tag } from '@/components/admin/pom/ui';
import {
  awaitingOnlinePayment,
  exchangeMeta,
  isCod,
  itemCount,
  itemPhoto,
  nextStep,
  openExchanges,
  paymentMeta,
  shipTo,
  statusMeta,
  type AdminOrder,
  type OrderStatus,
} from '@/lib/admin/orders';
import { advanceOrder } from './actions';
import { ItemLine, OptionChips } from './ItemBits';

const SHORT_STEP: Partial<Record<OrderStatus, string>> = {
  confirmed: 'Confirm',
  processing: 'Pack',
  shipped: 'Ship',
  delivered: 'Delivered',
};

/** The one-tap step on a row, so a queue can be worked without opening each order. */
function StepButton({ order, onChanged, className }: { order: AdminOrder; onChanged: () => void; className?: string }) {
  const [busy, setBusy] = useState(false);
  const step = nextStep(order);
  if (!step || awaitingOnlinePayment(order)) return null;
  return (
    <button
      type="button"
      className={`btn btn-white px-3 py-1.5 text-[13px] ${className ?? ''}`}
      disabled={busy}
      title={step.label}
      onClick={async (e) => {
        e.stopPropagation();
        setBusy(true);
        try {
          if (await advanceOrder(order)) onChanged();
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? '...' : SHORT_STEP[step.status] ?? step.label}
    </button>
  );
}

function Flags({ order }: { order: AdminOrder }) {
  const pay = paymentMeta(order);
  const open = openExchanges(order);
  return (
    <>
      {isCod(order) ? <Tag tone={order.paymentStatus === 'paid' ? 'ok' : 'warn'}>COD</Tag> : null}
      {awaitingOnlinePayment(order) ? <Tag tone="danger">{pay.label}</Tag> : null}
      {open.length > 0 ? <Tag tone={exchangeMeta(open[0].status).tone}>Exchange</Tag> : null}
      {order.replacementForExchange ? <Tag tone="violet">Replacement</Tag> : null}
    </>
  );
}

/** Photos of an order's pieces, overlapped, with a count when there are more. */
function PhotoStack({ order }: { order: AdminOrder }) {
  const shown = order.items.slice(0, 2);
  const extra = order.items.length - shown.length;
  return (
    <div className="relative flex shrink-0">
      {shown.map((item, i) => (
        <div key={item.id} style={{ marginLeft: i === 0 ? 0 : -18, zIndex: 2 - i }} className="relative">
          <Thumb src={itemPhoto(item)} alt={item.productName} className="h-14 w-12 shadow-[0_0_0_2px_var(--pom-panel)]" />
        </div>
      ))}
      {extra > 0 ? (
        <span
          className="pom-round absolute -bottom-1 -right-1 z-10 rounded-full px-1.5 text-[10px] font-semibold text-white"
          style={{ background: 'var(--pom-text)' }}
        >
          +{extra}
        </span>
      ) : null}
    </div>
  );
}

/**
 * The order queue: a table on a computer, a stack of cards on a phone. Both
 * lead with what was bought (photo, size, colour) since that is what the
 * person packing needs, and both carry the next step as a button.
 */
export function OrderList({
  orders,
  onOpen,
  onChanged,
}: {
  orders: AdminOrder[];
  onOpen: (order: AdminOrder) => void;
  onChanged: () => void;
}) {
  return (
    <>
      {/* Computer */}
      <div className="panel hidden overflow-hidden md:block">
        <table className="grid-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Items</th>
              <th>Customer</th>
              <th className="text-right">Total</th>
              <th>Status</th>
              <th className="w-px" />
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const s = statusMeta(o.status);
              const to = shipTo(o);
              const first = o.items[0];
              const others = o.items.length - 1;
              return (
                <tr key={o.id} className="cursor-pointer" onClick={() => onOpen(o)}>
                  <td className="w-[1%] whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <PhotoStack order={o} />
                      <div>
                        <div className="font-mono text-[13px] font-medium">{o.orderNumber}</div>
                        <div className="muted text-xs">
                          {dayLabel(o.createdAt)}, {timeOfDay(o.createdAt)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="min-w-[16rem]">
                    {first ? (
                      <>
                        <div className="line-clamp-1 text-[13px] font-medium">{first.productName}</div>
                        <OptionChips item={first} className="mt-1" />
                        {others > 0 ? (
                          <div className="muted mt-1 text-xs">
                            + {others} more {others === 1 ? 'item' : 'items'} ({itemCount(o)} pieces in all)
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </td>
                  <td>
                    <div className="max-w-[12rem] truncate text-[13px] font-medium">{to.name || '-'}</div>
                    <div className="muted max-w-[12rem] truncate text-xs">
                      {[to.city, to.pincode].filter(Boolean).join(' · ')}
                    </div>
                  </td>
                  <td className="whitespace-nowrap text-right">
                    <div className="font-semibold tabular-nums">{money(o.total)}</div>
                    <div className="mt-1 flex justify-end gap-1">
                      <Flags order={o} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    <Badge tone={s.tone}>{s.label}</Badge>
                  </td>
                  <td className="whitespace-nowrap text-right">
                    <StepButton order={o} onChanged={onChanged} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Phone */}
      <div className="space-y-3 md:hidden">
        {orders.map((o) => {
          const s = statusMeta(o.status);
          const to = shipTo(o);
          const shown = o.items.slice(0, 3);
          const extra = o.items.length - shown.length;
          return (
            <div
              key={o.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpen(o)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onOpen(o);
              }}
              className="panel block w-full text-left active:bg-[var(--pom-panel-2)]"
            >
              <div className="flex items-center justify-between gap-3 border-b px-3.5 py-2.5">
                <div className="min-w-0">
                  <span className="font-mono text-[13px] font-semibold">{o.orderNumber}</span>
                  <span className="muted text-xs">
                    {' '}
                    · {dayLabel(o.createdAt)}, {timeOfDay(o.createdAt)}
                  </span>
                </div>
                <span className="shrink-0 font-semibold tabular-nums">{money(o.total)}</span>
              </div>
              <div className="space-y-2.5 px-3.5 py-3">
                {shown.map((item) => (
                  <ItemLine key={item.id} item={item} photo="h-16 w-14" />
                ))}
                {extra > 0 ? <div className="muted text-xs">+ {extra} more</div> : null}
              </div>
              <div className="flex items-center gap-2 border-t px-3.5 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone={s.tone} className="py-0.5">
                      {s.label}
                    </Badge>
                    <Flags order={o} />
                  </div>
                  <div className="muted mt-1 truncate text-xs">
                    {[to.name, to.city].filter(Boolean).join(' · ')}
                  </div>
                </div>
                <StepButton order={o} onChanged={onChanged} className="shrink-0" />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
