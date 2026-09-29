/**
 * The admin's view of an order: status names and colours, which queue an
 * order sits in, and what a line item actually is (photo, size, colour).
 *
 * The item helpers are the point of this file. An order line snapshots the
 * product it was placed for, but older orders snapshotted the product's cover
 * photo rather than the colour bought, and the size and colour live in
 * `variantDetails.attributes` where nothing used to read them. Everything that
 * shows an order line in the admin goes through `itemPhoto` and `itemOptions`
 * so a packer never has to guess which kurti to pull.
 */

import type { Tone } from '@/components/admin/pom/ui';

/* -------------------------------------------------------------------------- */
/* Types: what GET /orders/admin/all returns                                   */
/* -------------------------------------------------------------------------- */

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'return_approved'
  | 'returned'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refund_pending' | 'refunded' | 'credited';

export interface AdminVariantRef {
  id: string;
  sku?: string;
  images?: string[] | null;
  variantAttributes?: Record<string, string> | null;
}

export interface AdminOrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku?: string;
  productImage?: string | null;
  quantity: number;
  price: number | string;
  subtotal?: number | string;
  total?: number | string;
  variantId?: string | null;
  variantDetails?: { sku?: string | null; attributes?: Record<string, string> | null } | null;
  product?: {
    id: string;
    slug?: string;
    name?: string;
    featuredImage?: string | null;
    images?: string[] | null;
    productVariants?: AdminVariantRef[];
  } | null;
}

export interface OrderExchange {
  id: string;
  returnNumber: string;
  orderItemId?: string;
  productName?: string;
  quantity?: number;
  reason?: string;
  status: string;
  requestedAt?: string;
  inspectionResult?: string | null;
  exchangeVariantId?: string | null;
  courierCharge?: number;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string | null;
  subtotal?: number | string;
  discount?: number | string;
  tax?: number | string;
  shippingCost?: number | string;
  codCharge?: number | string;
  total?: number | string;
  shippingName?: string;
  shippingEmail?: string;
  shippingPhone?: string;
  shippingAddress?:
    | string
    | {
        fullName?: string;
        phone?: string;
        addressLine1?: string;
        city?: string;
        state?: string;
        postalCode?: string;
        country?: string;
      };
  shippingCity?: string;
  shippingState?: string;
  shippingPostalCode?: string;
  trackingNumber?: string | null;
  carrier?: string | null;
  customerNotes?: string | null;
  cancellationReason?: string | null;
  confirmedAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  items: AdminOrderItem[];
  returns?: OrderExchange[];
  replacementForExchange?: {
    returnNumber: string;
    exchangeStatus: string;
    originalOrderId: string;
    originalOrderNumber: string;
  } | null;
  invoice?: { id: string; invoiceNumber: string } | null;
  user?: { email?: string; firstName?: string; lastName?: string } | null;
}

/* -------------------------------------------------------------------------- */
/* Status vocabulary                                                           */
/* -------------------------------------------------------------------------- */

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  pending: { label: 'New', tone: 'indigo' },
  confirmed: { label: 'Confirmed', tone: 'accent' },
  processing: { label: 'Packing', tone: 'warn' },
  shipped: { label: 'Shipped', tone: 'teal' },
  delivered: { label: 'Delivered', tone: 'ok' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
  return_requested: { label: 'Return requested', tone: 'violet' },
  return_approved: { label: 'Return approved', tone: 'violet' },
  returned: { label: 'Returned', tone: 'danger' },
  refunded: { label: 'Refunded', tone: 'neutral' },
};

export function statusMeta(status: string) {
  return ORDER_STATUS[status as OrderStatus] ?? { label: status.replace(/_/g, ' '), tone: 'neutral' as Tone };
}

export function isCod(order: Pick<AdminOrder, 'paymentMethod'>) {
  return (order.paymentMethod || '').toLowerCase() === 'cod';
}

/** What the money side of an order looks like, in words a shop owner uses. */
export function paymentMeta(order: Pick<AdminOrder, 'paymentStatus' | 'paymentMethod' | 'status'>): {
  label: string;
  tone: Tone;
} {
  const cod = isCod(order);
  switch (order.paymentStatus) {
    case 'paid':
      return { label: cod ? 'COD collected' : 'Paid online', tone: 'ok' };
    case 'pending':
      if (order.status === 'cancelled') return { label: 'Not paid', tone: 'neutral' };
      return cod ? { label: 'COD to collect', tone: 'warn' } : { label: 'Awaiting payment', tone: 'danger' };
    case 'failed':
      return { label: 'Payment failed', tone: 'danger' };
    case 'refund_pending':
      return { label: 'Refund pending', tone: 'warn' };
    case 'refunded':
      return { label: 'Refunded', tone: 'neutral' };
    case 'credited':
      return { label: 'Store credit issued', tone: 'violet' };
    default:
      return { label: String(order.paymentStatus || 'Unknown'), tone: 'neutral' };
  }
}

/** An online order the customer has not paid for yet. Nothing should ship until it is. */
export function awaitingOnlinePayment(order: AdminOrder) {
  return (
    !isCod(order) &&
    (order.paymentStatus === 'pending' || order.paymentStatus === 'failed') &&
    order.status !== 'cancelled'
  );
}

/* -------------------------------------------------------------------------- */
/* Exchanges                                                                   */
/* -------------------------------------------------------------------------- */

export const EXCHANGE_STATUS: Record<string, { label: string; tone: Tone }> = {
  requested: { label: 'Exchange requested', tone: 'violet' },
  approved: { label: 'Exchange approved', tone: 'accent' },
  in_transit: { label: 'Exchange on its way back', tone: 'warn' },
  received: { label: 'Exchange received', tone: 'teal' },
  replacement_shipped: { label: 'Replacement shipped', tone: 'teal' },
  completed: { label: 'Exchange completed', tone: 'ok' },
  rejected: { label: 'Exchange rejected', tone: 'neutral' },
  cancelled: { label: 'Exchange cancelled', tone: 'neutral' },
};

export function exchangeMeta(status: string) {
  return EXCHANGE_STATUS[status] ?? { label: `Exchange ${status.replace(/_/g, ' ')}`, tone: 'violet' as Tone };
}

const CLOSED_EXCHANGE = new Set(['completed', 'rejected', 'cancelled']);

/** Exchanges on this order that still need something from the shop. */
export function openExchanges(order: AdminOrder) {
  return (order.returns ?? []).filter((r) => !CLOSED_EXCHANGE.has(r.status));
}

/** An exchange waiting on the admin's decision (as opposed to on the customer or the courier). */
export function exchangeNeedsAdmin(r: OrderExchange) {
  return (
    r.status === 'requested' ||
    r.status === 'in_transit' ||
    (r.status === 'received' && r.inspectionResult === 'passed')
  );
}

/* -------------------------------------------------------------------------- */
/* Queues                                                                      */
/* -------------------------------------------------------------------------- */

export type OrderTab = 'toShip' | 'shipped' | 'delivered' | 'exchanges' | 'cancelled' | 'all';

export const ORDER_TABS: { key: OrderTab; label: string }[] = [
  { key: 'toShip', label: 'To ship' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'exchanges', label: 'Exchanges' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'all', label: 'All' },
];

const TO_SHIP = new Set<OrderStatus>(['pending', 'confirmed', 'processing']);
const CANCELLED = new Set<OrderStatus>(['cancelled', 'returned', 'refunded']);

export function inTab(order: AdminOrder, tab: OrderTab) {
  switch (tab) {
    case 'toShip':
      return TO_SHIP.has(order.status);
    case 'shipped':
      return order.status === 'shipped';
    case 'delivered':
      return order.status === 'delivered';
    case 'exchanges':
      return openExchanges(order).length > 0;
    case 'cancelled':
      return CANCELLED.has(order.status);
    default:
      return true;
  }
}

/**
 * The one thing to do next on an order, if there is one. Shown as the filled
 * button on the order, so the fulfilment path is always a single tap forward.
 */
export function nextStep(order: AdminOrder): { status: OrderStatus; label: string; hint: string } | null {
  switch (order.status) {
    case 'pending':
      return { status: 'confirmed', label: 'Confirm order', hint: 'Tells the customer you have accepted it.' };
    case 'confirmed':
      return { status: 'processing', label: 'Start packing', hint: 'Moves it to Packing.' };
    case 'processing':
      return { status: 'shipped', label: 'Mark shipped', hint: 'Add the courier and tracking number.' };
    case 'shipped':
      return { status: 'delivered', label: 'Mark delivered', hint: 'Opens the exchange window for the customer.' };
    default:
      return null;
  }
}

/** Cancelling is allowed only before the parcel leaves (the backend enforces the same). */
export function canCancel(order: AdminOrder) {
  return order.status === 'pending' || order.status === 'confirmed';
}

/* -------------------------------------------------------------------------- */
/* Line items                                                                  */
/* -------------------------------------------------------------------------- */

const COLOUR_KEY = /^colou?r$/i;
const SIZE_KEY = /^size$/i;

function same(a: unknown, b: unknown) {
  return a != null && b != null && String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

function pick(attrs: Record<string, string> | null | undefined, re: RegExp) {
  if (!attrs) return null;
  const key = Object.keys(attrs).find((k) => re.test(k.trim()));
  return key ? { key, value: String(attrs[key]) } : null;
}

/** Size, colour and any other options the customer chose for this line. */
export function itemOptions(item: AdminOrderItem): {
  size: string | null;
  color: string | null;
  other: [string, string][];
} {
  const own = item.variantDetails?.attributes ?? null;
  const fromVariant = item.variantId
    ? item.product?.productVariants?.find((v) => v.id === item.variantId)?.variantAttributes ?? null
    : null;
  const attrs = own && Object.keys(own).length > 0 ? own : fromVariant;
  const size = pick(attrs, SIZE_KEY);
  const color = pick(attrs, COLOUR_KEY);
  const other = Object.entries(attrs ?? {})
    .filter(([k, v]) => k !== size?.key && k !== color?.key && v !== '' && v != null)
    .map(([k, v]) => [k, String(v)] as [string, string]);
  return { size: size?.value ?? null, color: color?.value ?? null, other };
}

/**
 * The photo of what was actually bought, resolved the way the product page
 * resolves its gallery: the exact variant's own photos, then a sibling
 * variant of the same colour (one colour usually shares a photo set across
 * its sizes), then whatever the order line snapshotted, then the cover.
 */
export function itemPhoto(item: AdminOrderItem): string | null {
  const variants = item.product?.productVariants ?? [];
  if (item.variantId && variants.length > 0) {
    const own = variants.find((v) => v.id === item.variantId);
    if (own?.images?.length) return own.images[0];

    const colour = itemOptions(item).color;
    if (colour) {
      const sibling = variants.find((v) => {
        if (!v.images?.length) return false;
        const c = pick(v.variantAttributes, COLOUR_KEY);
        return c != null && same(c.value, colour);
      });
      if (sibling?.images?.length) return sibling.images[0];
    }
  }
  return item.productImage || item.product?.featuredImage || item.product?.images?.[0] || null;
}

export function itemSku(item: AdminOrderItem) {
  return item.variantDetails?.sku || item.productSku || '';
}

export function itemCount(order: AdminOrder) {
  return order.items.reduce((n, i) => n + (Number(i.quantity) || 0), 0);
}

/** "Rani Pink kurti · M · Pink" style one-liner, for CSV and search. */
export function itemLine(item: AdminOrderItem) {
  const { size, color, other } = itemOptions(item);
  const opts = [size ? `Size ${size}` : null, color, ...other.map(([k, v]) => `${k} ${v}`)].filter(Boolean);
  return `${item.productName}${opts.length ? ` (${opts.join(', ')})` : ''} x${item.quantity}`;
}

/* -------------------------------------------------------------------------- */
/* Customer and address                                                        */
/* -------------------------------------------------------------------------- */

export function shipTo(order: AdminOrder) {
  const a = typeof order.shippingAddress === 'object' && order.shippingAddress ? order.shippingAddress : null;
  const line1 = a?.addressLine1 ?? (typeof order.shippingAddress === 'string' ? order.shippingAddress : '');
  return {
    name: a?.fullName || order.shippingName || '',
    phone: a?.phone || order.shippingPhone || '',
    email: order.shippingEmail || order.user?.email || '',
    line1: line1 || '',
    city: a?.city || order.shippingCity || '',
    state: a?.state || order.shippingState || '',
    pincode: a?.postalCode || order.shippingPostalCode || '',
  };
}

/** The address as one block of text, ready to paste into a courier booking. */
export function addressText(order: AdminOrder) {
  const s = shipTo(order);
  return [s.name, s.line1, [s.city, s.state].filter(Boolean).join(', ') + (s.pincode ? ` ${s.pincode}` : ''), s.phone]
    .filter((l) => l && l.trim())
    .join('\n');
}

/** Everything a search box should match an order on. */
export function orderHaystack(order: AdminOrder) {
  const s = shipTo(order);
  return [
    order.orderNumber,
    s.name,
    s.phone,
    s.email,
    s.city,
    s.pincode,
    order.trackingNumber,
    ...order.items.map((i) => `${i.productName} ${itemSku(i)} ${itemOptions(i).color ?? ''}`),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/** A WhatsApp chat link for an Indian mobile number, or null when the number is unusable. */
export function whatsappLink(phone: string, text?: string) {
  const digits = phone.replace(/\D/g, '');
  const n = digits.length === 10 ? `91${digits}` : digits.length === 12 && digits.startsWith('91') ? digits : null;
  if (!n) return null;
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

/* -------------------------------------------------------------------------- */
/* Export                                                                      */
/* -------------------------------------------------------------------------- */

function csvCell(v: unknown) {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function ordersToCsv(orders: AdminOrder[]) {
  const header = [
    'Order',
    'Date',
    'Status',
    'Payment',
    'Customer',
    'Phone',
    'Address',
    'City',
    'State',
    'Pincode',
    'Items',
    'Total',
    'Courier',
    'Tracking',
  ];
  const rows = orders.map((o) => {
    const s = shipTo(o);
    return [
      o.orderNumber,
      new Date(o.createdAt).toLocaleString('en-IN'),
      statusMeta(o.status).label,
      paymentMeta(o).label,
      s.name,
      s.phone,
      s.line1,
      s.city,
      s.state,
      s.pincode,
      o.items.map(itemLine).join('; '),
      Number(o.total ?? 0).toFixed(2),
      o.carrier ?? '',
      o.trackingNumber ?? '',
    ];
  });
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
}

export const COURIERS = ['Delhivery', 'India Post', 'Blue Dart', 'DTDC', 'Xpressbees', 'Ekart', 'Shiprocket'];
