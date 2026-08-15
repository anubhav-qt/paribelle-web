/**
 * One spelling of "what is happening to this item's exchange", shared by
 * every list that shows order items.
 *
 * An order with several products used to render every line identically, so
 * on an order where one of four items was mid-exchange there was nothing on
 * screen saying *which* one — the exchange details lived in a separate
 * collapsed panel with only a product name to tie them together. These
 * helpers give each line a colour and a chip drawn from the state of its own
 * exchange, so the item being exchanged is obvious at a glance.
 *
 * Exchange rows reach the frontend in two spellings — camelCase from the
 * TypeORM entity (`GET /orders/:id/exchanges`) and snake_case from the
 * raw-SQL joins on the order endpoints — so everything here reads both.
 */

export type ExchangeStatus =
  | 'requested'
  | 'approved'
  | 'in_transit'
  | 'received'
  | 'replacement_shipped'
  | 'completed'
  | 'rejected';

/** Any exchange row, in either of the two shapes the API hands out. */
export interface ExchangeRow {
  id?: string;
  status?: string;
  orderItemId?: string;
  order_item_id?: string;
  quantity?: number;
  productName?: string;
  product_name?: string;
  approvedAt?: string | null;
  approved_at?: string | null;
  rejectedAt?: string | null;
  rejected_at?: string | null;
  rejectionReason?: string | null;
  rejection_reason?: string | null;
  inspectionResult?: string | null;
  inspection_result?: string | null;
  [key: string]: any;
}

const pick = <T,>(row: ExchangeRow, camel: string, snake: string): T =>
  (row?.[camel] ?? row?.[snake]) as T;

export const exchangeItemId = (row: ExchangeRow): string | undefined =>
  pick<string | undefined>(row, 'orderItemId', 'order_item_id');

export const exchangeApprovedAt = (row: ExchangeRow) =>
  pick<string | null>(row, 'approvedAt', 'approved_at');

export const exchangeRejectionReason = (row: ExchangeRow) =>
  pick<string | null>(row, 'rejectionReason', 'rejection_reason');

/** Short label for a chip — the long form belongs in the exchange panel, not on an item row. */
export const EXCHANGE_STATUS_LABEL: Record<string, string> = {
  requested: 'Exchange requested',
  approved: 'Exchange approved',
  in_transit: 'Exchange on its way back',
  received: 'Exchange received',
  replacement_shipped: 'Replacement shipped',
  completed: 'Exchange complete',
  rejected: 'Exchange rejected',
};

/**
 * Chip colours, and the tint + border for the row itself. Deliberately one
 * hue per state and the same hue in both places, so the row's tint and its
 * chip read as one signal rather than two competing ones.
 */
interface ExchangeStatusStyle {
  /** Background + text for the small status chip. */
  chip: string;
  /** Tint + left rule for the whole item row. */
  row: string;
  /** Ring colour for a card-style (bordered) row. */
  border: string;
}

const NEUTRAL: ExchangeStatusStyle = {
  chip: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200',
  row: 'bg-gray-50 border-l-4 border-gray-400 dark:bg-gray-900/30',
  border: 'border-gray-300',
};

const EXCHANGE_STATUS_STYLE: Record<string, ExchangeStatusStyle> = {
  requested: {
    chip: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200',
    row: 'bg-amber-50 border-l-4 border-amber-400 dark:bg-amber-900/20',
    border: 'border-amber-300',
  },
  approved: {
    chip: 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-200',
    row: 'bg-blue-50 border-l-4 border-blue-500 dark:bg-blue-900/20',
    border: 'border-blue-300',
  },
  in_transit: {
    chip: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/40 dark:text-indigo-200',
    row: 'bg-indigo-50 border-l-4 border-indigo-500 dark:bg-indigo-900/20',
    border: 'border-indigo-300',
  },
  received: {
    chip: 'bg-teal-100 text-teal-900 dark:bg-teal-900/40 dark:text-teal-200',
    row: 'bg-teal-50 border-l-4 border-teal-500 dark:bg-teal-900/20',
    border: 'border-teal-300',
  },
  replacement_shipped: {
    chip: 'bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-200',
    row: 'bg-purple-50 border-l-4 border-purple-500 dark:bg-purple-900/20',
    border: 'border-purple-300',
  },
  completed: {
    chip: 'bg-green-100 text-green-900 dark:bg-green-900/40 dark:text-green-200',
    row: 'bg-green-50 border-l-4 border-green-600 dark:bg-green-900/20',
    border: 'border-green-300',
  },
  rejected: {
    chip: 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200',
    row: 'bg-red-50 border-l-4 border-red-500 dark:bg-red-900/20',
    border: 'border-red-300',
  },
};

export const exchangeStatusStyle = (status?: string | null): ExchangeStatusStyle =>
  EXCHANGE_STATUS_STYLE[String(status || '')] || NEUTRAL;

export const exchangeStatusLabel = (status?: string | null): string =>
  EXCHANGE_STATUS_LABEL[String(status || '')] ||
  String(status || '').replace(/_/g, ' ') ||
  'Exchange';

/**
 * Which exchange decides an item row's colour when the item has several.
 * The one still needing something from somebody wins over one already
 * finished — an item with a live request *and* a completed one from last
 * month should read as "in progress", not "done".
 */
const PRIORITY: string[] = [
  'approved',
  'requested',
  'in_transit',
  'received',
  'replacement_shipped',
  'rejected',
  'completed',
];

export interface ItemExchangeSummary {
  /** Every exchange row against this item, newest first as the API returns them. */
  rows: ExchangeRow[];
  /** The row whose status the item row is coloured by, if any. */
  primary: ExchangeRow | null;
  /** Units already spoken for by a non-rejected request. */
  requestedQuantity: number;
  /** Units of this item still eligible for a new request. */
  remaining: number;
  hasActive: boolean;
  /**
   * True once an exchange for this item was approved and then rejected —
   * we have had the item back in our hands and said no, which closes it out
   * for good. Mirrors the same rule in `ExchangesService.request`, so the
   * button doesn't invite a request the server will refuse.
   */
  blocked: boolean;
  blockedReason: string | null;
}

export function summarizeItemExchanges(
  rows: ExchangeRow[] | undefined | null,
  item: { id: string; quantity?: number },
): ItemExchangeSummary {
  const mine = (rows || []).filter((r) => exchangeItemId(r) === item.id);
  const active = mine.filter((r) => r.status !== 'rejected');
  const requestedQuantity = active.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0);
  const settled = mine.find((r) => r.status === 'rejected' && !!exchangeApprovedAt(r));

  const primary =
    PRIORITY.map((status) => mine.find((r) => r.status === status)).find(Boolean) || mine[0] || null;

  return {
    rows: mine,
    primary: primary || null,
    requestedQuantity,
    remaining: Math.max(0, (Number(item.quantity) || 0) - requestedQuantity),
    hasActive: active.length > 0,
    blocked: !!settled,
    blockedReason: settled
      ? exchangeRejectionReason(settled) ||
        'A previous exchange for this item was rejected after we received and checked it.'
      : null,
  };
}
