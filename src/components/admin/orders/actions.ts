'use client';

import { ApiError, api, downloadBlob, errorMessage } from '@/lib/api';
import { confirmDialog, promptDialog, toast } from '@/components/admin/pom/dialogs';
import { mediaUrl, moneyExact } from '@/components/admin/pom/format';
import {
  COURIERS,
  isCod,
  itemOptions,
  itemPhoto,
  itemSku,
  nextStep,
  shipTo,
  type AdminOrder,
} from '@/lib/admin/orders';

/**
 * Every write an admin makes to an order, each asking whatever it needs to
 * first and reporting back with a toast. Each resolves true when something
 * changed, so the caller knows to refetch.
 */

/** Move the order one step along: confirm, pack, ship (asks for tracking), deliver. */
export async function advanceOrder(order: AdminOrder): Promise<boolean> {
  const step = nextStep(order);
  if (!step) return false;

  try {
    if (step.status === 'shipped') {
      const values = await promptDialog({
        title: `Ship ${order.orderNumber}`,
        message: 'The customer gets these in their shipping update, so they can track the parcel.',
        confirmText: 'Mark shipped',
        fields: [
          { name: 'carrier', label: 'Courier', placeholder: 'e.g. Delhivery', suggestions: COURIERS, defaultValue: order.carrier ?? '' },
          { name: 'trackingNumber', label: 'Tracking number', placeholder: 'AWB / tracking number', defaultValue: order.trackingNumber ?? '' },
        ],
      });
      if (!values) return false;
      await api.patch(`/orders/${order.id}/status`, {
        status: 'shipped',
        carrier: values.carrier || undefined,
        trackingNumber: values.trackingNumber || undefined,
      });
      toast.success(`${order.orderNumber} marked shipped.`);
      return true;
    }

    if (step.status === 'delivered') {
      const collect = isCod(order) && order.paymentStatus === 'pending';
      const ok = await confirmDialog({
        title: `Mark ${order.orderNumber} delivered?`,
        message: collect
          ? `This also records the ${moneyExact(order.total)} cash on delivery as collected and issues the invoice. The customer's exchange window starts now.`
          : "The customer's exchange window starts now.",
        confirmText: 'Mark delivered',
      });
      if (!ok) return false;
      // Payment first: the invoice and exchange eligibility both key off PAID.
      if (collect) await api.patch(`/orders/${order.id}/payment-status`, { paymentStatus: 'paid' });
      await api.patch(`/orders/${order.id}/status`, { status: 'delivered' });
      toast.success(`${order.orderNumber} delivered.`);
      return true;
    }

    await api.patch(`/orders/${order.id}/status`, { status: step.status });
    toast.success(step.status === 'confirmed' ? `${order.orderNumber} confirmed.` : `${order.orderNumber} moved to Packing.`);
    return true;
  } catch (error) {
    toast.error(errorMessage(error, 'Could not update the order.'));
    return false;
  }
}

export async function cancelOrder(order: AdminOrder): Promise<boolean> {
  const values = await promptDialog({
    title: `Cancel ${order.orderNumber}?`,
    message: 'The stock goes back on sale and the customer is told. This cannot be undone.',
    confirmText: 'Cancel order',
    cancelText: 'Keep order',
    tone: 'danger',
    fields: [
      {
        name: 'reason',
        label: 'Reason',
        required: true,
        multiline: true,
        placeholder: 'The customer sees this',
        suggestions: ['Out of stock', 'Customer asked to cancel', 'Could not reach the customer', 'Pincode not serviceable'],
      },
    ],
  });
  if (!values) return false;
  try {
    await api.patch(`/orders/${order.id}/status`, { status: 'cancelled', reason: values.reason });
    toast.success(`${order.orderNumber} cancelled.`);
    return true;
  } catch (error) {
    toast.error(errorMessage(error, 'Could not cancel the order.'));
    return false;
  }
}

/** Record cash collected without changing where the parcel is (e.g. the courier remitted late). */
export async function markCodCollected(order: AdminOrder): Promise<boolean> {
  const ok = await confirmDialog({
    title: 'Mark cash collected?',
    message: `Records ${moneyExact(order.total)} as received for ${order.orderNumber} and issues the invoice.`,
    confirmText: 'Mark collected',
  });
  if (!ok) return false;
  try {
    await api.patch(`/orders/${order.id}/payment-status`, { paymentStatus: 'paid' });
    toast.success('Payment recorded.');
    return true;
  } catch (error) {
    toast.error(errorMessage(error, 'Could not record the payment.'));
    return false;
  }
}

/**
 * The customer invoice as a PDF. On a computer it opens in a new tab ready to
 * print; where the browser will not open one (phones, pop-up blockers) it
 * downloads instead. The tab is opened before the request so it counts as the
 * click's own window and is not blocked.
 */
export async function openInvoice(order: AdminOrder) {
  const phone = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
  const tab = phone ? null : window.open('', '_blank');
  try {
    const res = await api.raw('GET', `/orders/${order.id}/invoice/download`);
    if (tab) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      tab.location.href = url;
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } else {
      await downloadBlob(res, `invoice-${order.orderNumber}.pdf`);
    }
  } catch (error) {
    tab?.close();
    if (error instanceof ApiError && error.status === 404) {
      toast.info(
        isCod(order)
          ? 'The invoice is issued once the cash is collected.'
          : 'The invoice is issued once the payment goes through.',
      );
    } else {
      toast.error(errorMessage(error, 'Could not open the invoice.'));
    }
  }
}

function esc(s: unknown) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

/**
 * A packing slip per order, one page each: every piece with its photo, size
 * and colour in print large enough to check against the parcel, and the
 * address to write on it. Printed from a plain window, so it looks the same
 * whatever the admin theme does.
 */
export function printPackingSlips(orders: AdminOrder[]) {
  if (orders.length === 0) return;
  const w = window.open('', '_blank');
  if (!w) {
    toast.error('Allow pop-ups for this site to print packing slips.');
    return;
  }

  const pages = orders
    .map((o) => {
      const s = shipTo(o);
      const cod = isCod(o) && o.paymentStatus === 'pending';
      const rows = o.items
        .map((item) => {
          const { size, color, other } = itemOptions(item);
          const photo = mediaUrl(itemPhoto(item));
          const extras = other.map(([k, v]) => `${esc(k)}: ${esc(v)}`).join(' · ');
          return `<tr>
            <td class="ph">${photo ? `<img src="${esc(photo)}" alt="">` : ''}</td>
            <td><div class="nm">${esc(item.productName)}</div>
              <div class="op">${size ? `<b>Size ${esc(size)}</b>` : ''}${color ? `<span>${esc(color)}</span>` : ''}${extras ? `<span>${extras}</span>` : ''}</div>
              ${itemSku(item) ? `<div class="sku">${esc(itemSku(item))}</div>` : ''}</td>
            <td class="q">× ${esc(item.quantity)}</td>
            <td class="ck">&#9744;</td>
          </tr>`;
        })
        .join('');
      return `<section>
        <header><div><div class="brand">PariBelle</div><div class="muted">Packing slip</div></div>
          <div class="right"><div class="on">${esc(o.orderNumber)}</div><div class="muted">${esc(new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }))}</div></div></header>
        ${cod ? `<div class="cod">CASH ON DELIVERY: collect ${esc(moneyExact(o.total))}</div>` : ''}
        <div class="to"><div class="lbl">Ship to</div><div class="nm">${esc(s.name)}</div><div>${esc(s.line1)}</div>
          <div>${esc([s.city, s.state].filter(Boolean).join(', '))} ${esc(s.pincode)}</div><div>${esc(s.phone)}</div></div>
        <table><thead><tr><th></th><th>Item</th><th>Qty</th><th>Packed</th></tr></thead><tbody>${rows}</tbody></table>
        ${o.customerNotes ? `<div class="note"><b>Customer note:</b> ${esc(o.customerNotes)}</div>` : ''}
      </section>`;
    })
    .join('');

  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Packing slips</title><style>
    *{box-sizing:border-box} body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111;margin:0}
    section{padding:28px 32px;page-break-after:always} section:last-child{page-break-after:auto}
    header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #111;padding-bottom:10px}
    .brand{font-size:22px;font-weight:700;letter-spacing:.02em} .muted{color:#666;font-size:12px} .right{text-align:right} .on{font-size:18px;font-weight:700}
    .cod{margin-top:14px;padding:8px 12px;border:2px solid #111;font-weight:700;font-size:14px}
    .to{margin-top:16px;font-size:14px;line-height:1.45} .to .nm{font-weight:700;font-size:15px} .lbl{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#666;margin-bottom:2px}
    table{width:100%;border-collapse:collapse;margin-top:18px} th{text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#666;border-bottom:1px solid #ccc;padding:6px}
    td{border-bottom:1px solid #e3e3e3;padding:10px 6px;vertical-align:top;font-size:14px}
    td.ph{width:92px} td.ph img{width:80px;height:96px;object-fit:cover;border:1px solid #ddd}
    .nm{font-weight:600} .op{margin-top:6px;display:flex;gap:10px;flex-wrap:wrap;font-size:15px} .op b{border:1.5px solid #111;padding:1px 8px}
    .sku{margin-top:6px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;color:#555}
    td.q{font-size:18px;font-weight:700;white-space:nowrap;width:60px} td.ck{font-size:22px;width:60px;text-align:center}
    .note{margin-top:16px;font-size:13px;padding:8px 10px;background:#f4f4f4}
    @media print{section{padding:10mm 12mm}}
  </style></head><body>${pages}<script>
    Promise.all(Array.from(document.images).map(function(i){return i.complete?0:new Promise(function(r){i.onload=i.onerror=r})}))
      .then(function(){setTimeout(function(){window.print()},150)});
  </script></body></html>`);
  w.document.close();
}
