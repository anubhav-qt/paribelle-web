/**
 * Presentation for `Order.paymentStatus`.
 *
 * `refund_pending` exists because cancelling a paid order only promises a
 * refund — the money moves later, when the gateway confirms. Showing it as
 * "Refunded" told customers and staff they had been paid back when they had
 * not, so the two states must stay visibly distinct.
 */
export type PaymentStatusValue =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'refund_pending'
  | 'refunded'
  | (string & {});

const LABELS: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refund_pending: 'Refund pending',
  refunded: 'Refunded',
};

const CLASSES: Record<string, string> = {
  paid: 'bg-green-100 text-green-800',
  refunded: 'bg-purple-100 text-purple-800',
  refund_pending: 'bg-orange-100 text-orange-800',
  failed: 'bg-red-100 text-red-800',
};

const FALLBACK_CLASS = 'bg-yellow-100 text-yellow-800';

export function paymentStatusLabel(status: PaymentStatusValue | undefined | null): string {
  if (!status) return '';
  return (
    LABELS[status] ??
    status
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );
}

export function paymentStatusClass(status: PaymentStatusValue | undefined | null): string {
  if (!status) return FALLBACK_CLASS;
  return CLASSES[status] ?? FALLBACK_CLASS;
}

/** A refund has been promised but not yet settled by the gateway. */
export function isRefundPending(status: PaymentStatusValue | undefined | null): boolean {
  return status === 'refund_pending';
}
