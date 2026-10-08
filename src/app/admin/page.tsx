'use client';

import { ArrowRight, Plus } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { OptionChips } from '@/components/admin/orders/ItemBits';
import { DailyColumns, StatusBars, TopBars, type Bucket, type TopItem } from '@/components/admin/pom/charts';
import { dayLabel, money, timeOfDay } from '@/components/admin/pom/format';
import { Thumb } from '@/components/admin/pom/image-lightbox';
import { Segmented } from '@/components/admin/pom/segmented';
import { Badge, CenteredSpinner, Notice, PageHeader, Section, Stat, TONES } from '@/components/admin/pom/ui';
import { useAdminOrders } from '@/hooks/useAdminOrders';
import { useAdminProductStats } from '@/hooks/useAdminProducts';
import { COD_ENABLED } from '@/lib/features';
import {
  ORDER_STATUS,
  awaitingOnlinePayment,
  exchangeNeedsAdmin,
  isCod,
  itemCount,
  itemOptions,
  itemPhoto,
  openExchanges,
  shipTo,
  statusMeta,
  type AdminOrder,
  type OrderStatus,
} from '@/lib/admin/orders';

type Range = 'today' | '7d' | '30d' | 'all';

const RANGES: { key: Range; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: 'all', label: 'All time' },
];

function startOfToday() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function rangeStart(range: Range): Date | null {
  const t = startOfToday();
  if (range === 'today') return t;
  if (range === '7d') return new Date(t.getTime() - 6 * 86_400_000);
  if (range === '30d') return new Date(t.getTime() - 29 * 86_400_000);
  return null;
}

/** An order that is real money: not cancelled, and not an online order that was never paid. */
function isSale(o: AdminOrder) {
  return o.status !== 'cancelled' && o.status !== 'refunded' && !awaitingOnlinePayment(o);
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

export default function AdminHome() {
  const router = useRouter();
  const { data, isLoading, error } = useAdminOrders();
  const { data: stock } = useAdminProductStats();
  const [range, setRange] = useState<Range>('7d');
  const orders = useMemo(() => data ?? [], [data]);

  const todo = useMemo(() => {
    const live = orders.filter((o) => !awaitingOnlinePayment(o));
    const codDue = orders.filter(
      (o) => isCod(o) && o.paymentStatus === 'pending' && (o.status === 'shipped' || o.status === 'delivered'),
    );
    return {
      confirm: live.filter((o) => o.status === 'pending').length,
      pack: live.filter((o) => o.status === 'confirmed').length,
      ship: live.filter((o) => o.status === 'processing').length,
      exchanges: orders.filter((o) => openExchanges(o).some(exchangeNeedsAdmin)).length,
      codCount: codDue.length,
      codValue: codDue.reduce((n, o) => n + Number(o.total ?? 0), 0),
      unpaid: orders.filter((o) => awaitingOnlinePayment(o) && o.status === 'pending').length,
    };
  }, [orders]);

  const inRange = useMemo(() => {
    const from = rangeStart(range);
    return from ? orders.filter((o) => new Date(o.createdAt) >= from) : orders;
  }, [orders, range]);

  const sales = useMemo(() => {
    const s = inRange.filter(isSale);
    const value = s.reduce((n, o) => n + Number(o.total ?? 0), 0);
    const pieces = s.reduce((n, o) => n + itemCount(o), 0);
    return { count: s.length, value, pieces, aov: s.length ? value / s.length : 0, list: s };
  }, [inRange]);

  const days = useMemo(() => {
    if (range === 'today') return null;
    const n = range === '7d' ? 7 : range === '30d' ? 30 : 0;
    if (n > 0) {
      const t = startOfToday();
      const buckets = Array.from({ length: n }, (_, i) => {
        const d = new Date(t.getTime() - (n - 1 - i) * 86_400_000);
        return {
          key: dayKey(d),
          label: n === 7 ? d.toLocaleDateString('en-IN', { weekday: 'short' }) : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
          value: 0,
          count: 0,
        };
      });
      const byKey = new Map(buckets.map((b) => [b.key, b]));
      for (const o of sales.list) {
        const b = byKey.get(dayKey(new Date(o.createdAt)));
        if (b) {
          b.value += Number(o.total ?? 0);
          b.count++;
        }
      }
      return buckets;
    }
    // All time: by month, the last twelve.
    const now = new Date();
    const months = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
      return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('en-IN', { month: 'short' }), value: 0, count: 0 };
    });
    const byKey = new Map(months.map((m) => [m.key, m]));
    for (const o of sales.list) {
      const d = new Date(o.createdAt);
      const m = byKey.get(`${d.getFullYear()}-${d.getMonth()}`);
      if (m) {
        m.value += Number(o.total ?? 0);
        m.count++;
      }
    }
    return months;
  }, [range, sales.list]);

  const top = useMemo<TopItem[]>(() => {
    const map = new Map<string, TopItem>();
    for (const o of sales.list) {
      for (const item of o.items) {
        const color = itemOptions(item).color;
        const key = `${item.productId}|${(color ?? '').toLowerCase()}`;
        const row = map.get(key) ?? { key, title: item.productName, sub: color ?? undefined, image: itemPhoto(item), quantity: 0, revenue: 0 };
        const qty = Number(item.quantity) || 0;
        row.quantity += qty;
        row.revenue += (Number(item.price) || 0) * qty;
        map.set(key, row);
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [sales.list]);

  const buckets = useMemo<Bucket[]>(() => {
    const order: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    const tabFor: Partial<Record<OrderStatus, string>> = {
      pending: 'tab=toShip&stage=pending',
      confirmed: 'tab=toShip&stage=confirmed',
      processing: 'tab=toShip&stage=processing',
      shipped: 'tab=shipped',
      delivered: 'tab=delivered',
      cancelled: 'tab=cancelled',
    };
    return order.map((s) => ({
      key: s,
      label: ORDER_STATUS[s].label,
      count: inRange.filter((o) => o.status === s).length,
      color: TONES[ORDER_STATUS[s].tone].dot,
      onClick: () => router.push(`/admin/orders?${tabFor[s]}`),
    }));
  }, [inRange, router]);

  const recent = orders.slice(0, 6);
  const nothingToDo =
    todo.confirm + todo.pack + todo.ship + todo.exchanges + todo.codCount === 0 && !(stock?.outOfStock || stock?.lowStock);

  return (
    <div className="space-y-6">
      <PageHeader
        title={greeting()}
        hint={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        className="mb-0"
        actions={
          <>
            <Link href="/admin/products/add" className="btn btn-white">
              <Plus className="h-4 w-4" />
              Add product
            </Link>
            <Link href="/admin/orders" className="btn btn-blue">
              Orders
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        }
      />

      {error ? <Notice tone="danger">Could not load orders. Refresh the page to try again.</Notice> : null}

      <section>
        <h2 className="label">Needs you</h2>
        {isLoading ? (
          <CenteredSpinner className="py-8" />
        ) : nothingToDo ? (
          <div className="panel px-5 py-4 text-sm">
            <span className="font-medium">All caught up.</span>
            <span className="muted"> Nothing to confirm, pack or ship, and no exchanges waiting.</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
            <Stat label="To confirm" value={todo.confirm} tone={todo.confirm ? 'warn' : undefined} href="/admin/orders?tab=toShip&stage=pending" hint="New orders" />
            <Stat label="To pack" value={todo.pack} tone={todo.pack ? 'warn' : undefined} href="/admin/orders?tab=toShip&stage=confirmed" hint="Confirmed" />
            <Stat label="To ship" value={todo.ship} tone={todo.ship ? 'warn' : undefined} href="/admin/orders?tab=toShip&stage=processing" hint="Packed, needs tracking" />
            <Stat label="Exchanges" value={todo.exchanges} tone={todo.exchanges ? 'danger' : undefined} href="/admin/orders?tab=exchanges" hint="Waiting on your decision" />
            {/* COD is archived (COD_ENABLED): the tile stays only while past COD parcels are still out. */}
            {COD_ENABLED || todo.codCount > 0 ? (
              <Stat label="COD to collect" value={money(todo.codValue)} href="/admin/orders?tab=shipped" hint={`${todo.codCount} ${todo.codCount === 1 ? 'parcel' : 'parcels'} out`} />
            ) : null}
            <Stat label="Low stock" value={stock?.lowStock ?? '-'} tone={stock?.lowStock ? 'warn' : undefined} href="/admin/products?stock=low" hint="Products running out" />
            <Stat label="Out of stock" value={stock?.outOfStock ?? '-'} tone={stock?.outOfStock ? 'danger' : undefined} href="/admin/products?stock=out" hint="Not buyable now" />
          </div>
        )}
        {todo.unpaid > 0 ? (
          <p className="muted mt-2 text-xs">
            {todo.unpaid} online {todo.unpaid === 1 ? 'order is' : 'orders are'} waiting for payment and not counted above.
          </p>
        ) : null}
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="label mb-0">Sales</h2>
          <Segmented<Range> label="Period" value={range} onChange={setRange} items={RANGES} />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Sales" value={money(sales.value)} hint="Incl. GST and shipping" />
          <Stat label="Orders" value={sales.count} hint="Excludes cancelled and unpaid" />
          <Stat label="Average order" value={money(sales.aov)} />
          <Stat label="Pieces sold" value={sales.pieces} />
        </div>
        {days ? (
          <div className="panel mt-3 px-4 pb-3 pt-4 sm:px-5">
            <DailyColumns days={days} format={(n) => money(n)} />
          </div>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Best sellers" hint="By sales value in this period, per colour">
          <TopBars items={top} format={(n) => money(n)} />
        </Section>
        <Section title="Orders by status" hint="Placed in this period. Tap one to open that queue.">
          <StatusBars buckets={buckets} />
        </Section>
      </div>

      <Section
        title="Latest orders"
        actions={
          <Link href="/admin/orders?tab=all" className="btn btn-primary px-2 py-1 text-xs">
            All orders
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
        bodyClassName="p-0 sm:p-0"
      >
        {recent.length === 0 ? (
          <p className="muted px-5 py-6 text-sm">No orders yet. They appear here the moment one is placed.</p>
        ) : (
          <div className="divide-y">
            {recent.map((o) => {
              const s = statusMeta(o.status);
              const first = o.items[0];
              const to = shipTo(o);
              return (
                <Link
                  key={o.id}
                  href={`/admin/orders?orderId=${o.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--pom-accent-soft)] sm:px-5"
                >
                  <Thumb src={first ? itemPhoto(first) : null} alt={first?.productName ?? ''} className="h-14 w-12" zoom={false} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[13px] font-medium">
                        {first?.productName}
                        {o.items.length > 1 ? <span className="muted font-normal"> + {o.items.length - 1} more</span> : null}
                      </span>
                      <span className="shrink-0 text-[13px] font-semibold tabular-nums">{money(o.total)}</span>
                    </div>
                    {first ? <OptionChips item={first} className="mt-1" /> : null}
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="muted truncate text-xs">
                        <span className="font-mono">{o.orderNumber}</span> · {to.name || 'Customer'} · {dayLabel(o.createdAt)},{' '}
                        {timeOfDay(o.createdAt)}
                      </span>
                      <Badge tone={s.tone} className="shrink-0 py-0.5">
                        {s.label}
                      </Badge>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
