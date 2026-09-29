'use client';

import { Copy, FileText, MessageCircle, MoreHorizontal, Phone, Printer, Repeat } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { DropdownMenu, type DropdownOption } from '@/components/admin/pom/dropdown-menu';
import { toast } from '@/components/admin/pom/dialogs';
import { dateTime, moneyExact, plural } from '@/components/admin/pom/format';
import { Modal } from '@/components/admin/pom/modal';
import { Badge, Notice } from '@/components/admin/pom/ui';
import {
  addressText,
  awaitingOnlinePayment,
  canCancel,
  exchangeMeta,
  isCod,
  itemCount,
  nextStep,
  openExchanges,
  paymentMeta,
  shipTo,
  statusMeta,
  whatsappLink,
  type AdminOrder,
} from '@/lib/admin/orders';
import { advanceOrder, cancelOrder, markCodCollected, openInvoice, printPackingSlips } from './actions';
import { ItemCard } from './ItemBits';

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copied.`);
  } catch {
    toast.error('Could not copy. Select the text and copy it instead.');
  }
}

function Block({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="label mb-0">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function MoneyRow({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: 'ok' }) {
  return (
    <div className={strong ? 'flex justify-between border-t pt-2 text-[15px] font-semibold' : 'flex justify-between text-sm'}>
      <span className={strong ? undefined : 'muted'}>{label}</span>
      <span className="tabular-nums" style={tone === 'ok' ? { color: '#0c7a5a' } : undefined}>
        {value}
      </span>
    </div>
  );
}

/**
 * One order, everything needed to pack and ship it on one screen: the pieces
 * with their photos, sizes and colours, where it goes, what was paid, and the
 * single next step pinned in the footer.
 */
export function OrderDetail({
  order,
  onClose,
  onChanged,
  onOpenExchanges,
  onCodRefused,
}: {
  order: AdminOrder;
  onClose: () => void;
  onChanged: () => void;
  onOpenExchanges: () => void;
  onCodRefused: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const status = statusMeta(order.status);
  const pay = paymentMeta(order);
  const step = nextStep(order);
  const unpaid = awaitingOnlinePayment(order);
  const to = shipTo(order);
  const wa = to.phone
    ? whatsappLink(to.phone, `Hi${to.name ? ` ${to.name.split(' ')[0]}` : ''}, this is PariBelle about your order ${order.orderNumber}.`)
    : null;
  const cod = isCod(order);
  const exchanges = order.returns ?? [];
  const open = openExchanges(order);

  async function run(action: () => Promise<boolean>) {
    setBusy(true);
    try {
      if (await action()) onChanged();
    } finally {
      setBusy(false);
    }
  }

  const more: DropdownOption[] = [
    { id: 'slip', label: 'Print packing slip', icon: <Printer className="h-4 w-4" /> },
    { id: 'copy', label: 'Copy address', icon: <Copy className="h-4 w-4" /> },
  ];
  if (cod && order.paymentStatus === 'pending' && (order.status === 'shipped' || order.status === 'delivered')) {
    more.push({ id: 'collected', label: 'Mark cash collected', dividerBefore: true });
  }
  if (cod && order.status === 'shipped' && order.paymentStatus === 'pending') {
    more.push({ id: 'refused', label: 'Customer refused delivery', tone: 'danger' });
  }
  if (canCancel(order)) {
    more.push({ id: 'cancel', label: 'Cancel order', tone: 'danger', dividerBefore: true });
  }

  function onMore(id: string) {
    if (id === 'slip') printPackingSlips([order]);
    else if (id === 'copy') copy(addressText(order), 'Address');
    else if (id === 'collected') run(() => markCodCollected(order));
    else if (id === 'refused') onCodRefused();
    else if (id === 'cancel') run(() => cancelOrder(order));
  }

  const subtotal = Number(order.subtotal ?? 0);
  const tax = Number(order.tax ?? 0);
  const shipping = Number(order.shippingCost ?? 0);
  const codFee = Number(order.codCharge ?? 0);
  const credit = Number(order.discount ?? 0);

  const timeline = [
    { label: 'Placed', at: order.createdAt },
    { label: 'Confirmed', at: order.confirmedAt },
    { label: 'Shipped', at: order.shippedAt },
    { label: 'Delivered', at: order.deliveredAt },
    { label: 'Cancelled', at: order.cancelledAt },
  ].filter((t) => t.at);

  return (
    <Modal
      title={
        <span className="flex items-center gap-2">
          <span className="font-mono">{order.orderNumber}</span>
        </span>
      }
      subtitle={`${dateTime(order.createdAt)} · ${plural(itemCount(order), 'piece')}`}
      onClose={onClose}
      width="46rem"
      footer={
        <>
          <button type="button" className="btn btn-white" onClick={() => openInvoice(order)} disabled={busy}>
            <FileText className="h-4 w-4" />
            Invoice
          </button>
          <DropdownMenu
            trigger={
              <span className="btn btn-white px-2.5" aria-hidden>
                <MoreHorizontal className="h-4 w-4" />
              </span>
            }
            label="More actions"
            options={more}
            onSelect={onMore}
            side="up"
            width="w-60"
          />
          <div className="flex-1" />
          {step && !unpaid ? (
            <button type="button" className="btn btn-blue min-w-[9rem]" disabled={busy} onClick={() => run(() => advanceOrder(order))}>
              {busy ? 'Saving...' : step.label}
            </button>
          ) : null}
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={status.tone}>{status.label}</Badge>
          <Badge tone={pay.tone} dot={false}>
            {pay.label}
          </Badge>
          {open.map((r) => {
            const m = exchangeMeta(r.status);
            return (
              <Badge key={r.id} tone={m.tone}>
                {m.label}
              </Badge>
            );
          })}
          {order.replacementForExchange ? (
            <Badge tone="violet" dot={false}>
              Replacement for {order.replacementForExchange.originalOrderNumber}
            </Badge>
          ) : null}
        </div>

        {unpaid ? (
          <Notice tone="danger">
            {order.paymentStatus === 'failed' ? 'The online payment failed.' : 'The online payment has not come through.'} Do not
            pack this order until it shows as paid. Cancel it if the customer does not pay.
          </Notice>
        ) : step ? (
          <p className="muted -mt-3 text-xs">
            Next: <span className="font-medium" style={{ color: 'var(--pom-text)' }}>{step.label}</span>. {step.hint}
          </p>
        ) : null}

        <Block title={plural(order.items.length, 'item')}>
          <div className="surface-2 divide-y" style={{ background: 'var(--pom-panel)' }}>
            {order.items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </Block>

        <div className="grid gap-6 sm:grid-cols-2">
          <Block
            title="Ship to"
            action={
              <button type="button" className="btn btn-primary -my-1 px-2 py-1 text-xs" onClick={() => copy(addressText(order), 'Address')}>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </button>
            }
          >
            <div className="text-sm leading-relaxed">
              <div className="font-semibold">{to.name || 'No name given'}</div>
              {to.line1 ? <div>{to.line1}</div> : null}
              <div>
                {[to.city, to.state].filter(Boolean).join(', ')}
                {to.pincode ? <span className="font-medium"> {to.pincode}</span> : null}
              </div>
              {to.email ? <div className="muted mt-1 break-all text-xs">{to.email}</div> : null}
            </div>
            {to.phone ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={`tel:${to.phone}`} className="btn btn-white px-3 py-1.5 text-[13px]">
                  <Phone className="h-3.5 w-3.5" />
                  {to.phone}
                </a>
                {wa ? (
                  <a href={wa} target="_blank" rel="noreferrer" className="btn btn-white px-3 py-1.5 text-[13px]">
                    <MessageCircle className="h-3.5 w-3.5" style={{ color: '#25a35a' }} />
                    WhatsApp
                  </a>
                ) : null}
              </div>
            ) : null}
          </Block>

          <Block title="Payment">
            <div className="space-y-1.5">
              <MoneyRow label="Items (before GST)" value={moneyExact(subtotal)} />
              <MoneyRow label="GST" value={moneyExact(tax)} />
              <MoneyRow label="Shipping" value={shipping > 0 ? moneyExact(shipping) : 'Free'} />
              {codFee > 0 ? <MoneyRow label="COD fee" value={moneyExact(codFee)} /> : null}
              {credit > 0 ? <MoneyRow label="Paid from store credit" value={`-${moneyExact(credit)}`} tone="ok" /> : null}
              <MoneyRow label="Total" value={moneyExact(order.total)} strong />
              <div className="muted pt-1 text-xs">
                {cod ? 'Cash on delivery' : 'Paid online'}
                {order.paymentMethod && !cod ? ` (${order.paymentMethod})` : ''} · {pay.label}
              </div>
            </div>
          </Block>
        </div>

        {order.trackingNumber || order.carrier || order.status === 'shipped' || order.status === 'delivered' ? (
          <Block title="Shipment">
            {order.trackingNumber ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {order.carrier ? <span className="font-medium">{order.carrier}</span> : null}
                <span className="font-mono">{order.trackingNumber}</span>
                <button
                  type="button"
                  className="btn btn-primary px-2 py-1 text-xs"
                  onClick={() => copy(order.trackingNumber!, 'Tracking number')}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </button>
              </div>
            ) : (
              <p className="muted text-sm">No tracking number was added{order.carrier ? ` (${order.carrier})` : ''}.</p>
            )}
          </Block>
        ) : null}

        {order.customerNotes ? (
          <Block title="Customer note">
            <p className="surface-2 px-3 py-2.5 text-sm">{order.customerNotes}</p>
          </Block>
        ) : null}

        {order.cancellationReason && order.status === 'cancelled' ? (
          <Block title="Why it was cancelled">
            <p className="text-sm">{order.cancellationReason}</p>
          </Block>
        ) : null}

        {exchanges.length > 0 ? (
          <Block
            title="Exchanges"
            action={
              <button type="button" className="btn btn-primary -my-1 px-2 py-1 text-xs" onClick={onOpenExchanges}>
                <Repeat className="h-3.5 w-3.5" />
                {open.length > 0 ? 'Handle' : 'View'}
              </button>
            }
          >
            <div className="surface-2 divide-y" style={{ background: 'var(--pom-panel)' }}>
              {exchanges.map((r) => {
                const m = exchangeMeta(r.status);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={onOpenExchanges}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm hover:bg-[var(--pom-accent-soft)]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{r.productName}</span>
                      <span className="muted block truncate text-xs">
                        <span className="font-mono">{r.returnNumber}</span>
                        {r.reason ? ` · ${r.reason}` : ''}
                      </span>
                    </span>
                    <Badge tone={m.tone}>{m.label.replace(/^Exchange /, '')}</Badge>
                  </button>
                );
              })}
            </div>
          </Block>
        ) : null}

        {order.replacementForExchange ? (
          <Block title="Replacement">
            <p className="text-sm">
              Sent in exchange for <span className="font-mono">{order.replacementForExchange.returnNumber}</span> on{' '}
              <Link
                href={`/admin/orders?orderId=${order.replacementForExchange.originalOrderId}`}
                className="font-medium"
                style={{ color: 'var(--pom-accent-ink)' }}
              >
                order {order.replacementForExchange.originalOrderNumber}
              </Link>
              .
            </p>
          </Block>
        ) : null}

        <Block title="Timeline">
          <ol className="space-y-2">
            {timeline.map((t, i) => (
              <li key={t.label} className="flex items-center gap-3 text-sm">
                <span
                  className="pom-round h-2 w-2 shrink-0 rounded-full"
                  style={{ background: i === timeline.length - 1 ? 'var(--pom-accent)' : 'var(--pom-muted-2)' }}
                />
                <span className="w-24 shrink-0 font-medium">{t.label}</span>
                <span className="muted">{dateTime(t.at)}</span>
              </li>
            ))}
          </ol>
        </Block>
      </div>
    </Modal>
  );
}
