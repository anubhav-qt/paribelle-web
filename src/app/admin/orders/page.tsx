'use client';

import { ClipboardList, Download, Printer, RefreshCw } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';

import { CodRefusedModal } from '@/components/admin/orders/CodRefusedModal';
import { ExchangesModal } from '@/components/admin/orders/ExchangesModal';
import { OrderDetail } from '@/components/admin/orders/OrderDetail';
import { OrderList } from '@/components/admin/orders/OrderList';
import { PickList } from '@/components/admin/orders/PickList';
import { printPackingSlips } from '@/components/admin/orders/actions';
import { Segmented } from '@/components/admin/pom/segmented';
import { CenteredSpinner, Empty, Notice, PageHeader, SearchBox } from '@/components/admin/pom/ui';
import { useAdminOrders, useRefreshAdminOrders } from '@/hooks/useAdminOrders';
import {
  ORDER_TABS,
  awaitingOnlinePayment,
  exchangeNeedsAdmin,
  inTab,
  openExchanges,
  orderHaystack,
  ordersToCsv,
  type OrderTab,
} from '@/lib/admin/orders';

type Stage = 'all' | 'pending' | 'confirmed' | 'processing';
type Sheet = { id: string; view: 'detail' | 'exchanges' | 'cod' } | null;

const PAGE = 40;

const TAB_KEYS = new Set<string>(ORDER_TABS.map((t) => t.key));
const STAGES: { key: Stage; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'New' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'processing', label: 'Packing' },
];

export default function OrdersPage() {
  return (
    <Suspense fallback={<CenteredSpinner />}>
      <Orders />
    </Suspense>
  );
}

function Orders() {
  const router = useRouter();
  const params = useSearchParams();
  const { data, isLoading, error, refetch, isFetching } = useAdminOrders();
  const refresh = useRefreshAdminOrders();
  const orders = useMemo(() => data ?? [], [data]);

  const [tab, setTab] = useState<OrderTab>(() => {
    const t = params.get('tab');
    return t && TAB_KEYS.has(t) ? (t as OrderTab) : 'toShip';
  });
  const [stage, setStage] = useState<Stage>(() => {
    const s = params.get('stage');
    return s === 'pending' || s === 'confirmed' || s === 'processing' ? s : 'all';
  });
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [limit, setLimit] = useState(PAGE);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [picking, setPicking] = useState(false);

  // Links from the dashboard pick a queue: ?tab=exchanges, ?tab=toShip&stage=pending.
  const tabParam = params.get('tab');
  const stageParam = params.get('stage');
  useEffect(() => {
    if (tabParam && TAB_KEYS.has(tabParam)) setTab(tabParam as OrderTab);
    if (stageParam === 'pending' || stageParam === 'confirmed' || stageParam === 'processing') setStage(stageParam);
  }, [tabParam, stageParam]);

  // A notification opens the order it is about (?orderId=, plus ?view=exchanges
  // for exchange requests). One-shot: the URL is cleaned straight away so a
  // background refetch cannot reopen something the admin has closed, and `n`
  // (the notification id) makes a second click on the same one open it again.
  const deepId = params.get('orderId');
  const deepView = params.get('view');
  const deepNonce = params.get('n');
  const consumed = useRef<string | null>(null);
  useEffect(() => {
    if (!deepId) {
      consumed.current = null;
      return;
    }
    if (orders.length === 0) return;
    const key = `${deepNonce ?? ''}:${deepId}:${deepView ?? ''}`;
    if (consumed.current === key) return;
    const target = orders.find((o) => o.id === deepId);
    if (!target) return;
    consumed.current = key;
    setSheet({ id: target.id, view: deepView === 'exchanges' ? 'exchanges' : 'detail' });
    router.replace('/admin/orders', { scroll: false });
  }, [deepId, deepView, deepNonce, orders, router]);

  const q = query.trim().toLowerCase();
  const matching = useMemo(() => (q ? orders.filter((o) => orderHaystack(o).includes(q)) : orders), [orders, q]);

  const counts = useMemo(() => {
    const c = Object.fromEntries(ORDER_TABS.map((t) => [t.key, 0])) as Record<OrderTab, number>;
    for (const o of matching) for (const t of ORDER_TABS) if (inTab(o, t.key)) c[t.key]++;
    return c;
  }, [matching]);

  const toShip = useMemo(() => matching.filter((o) => inTab(o, 'toShip')), [matching]);
  const stageCounts = useMemo(
    () => ({
      all: toShip.length,
      pending: toShip.filter((o) => o.status === 'pending').length,
      confirmed: toShip.filter((o) => o.status === 'confirmed').length,
      processing: toShip.filter((o) => o.status === 'processing').length,
    }),
    [toShip],
  );

  const exchangesWaiting = useMemo(
    () => matching.filter((o) => openExchanges(o).some(exchangeNeedsAdmin)).length,
    [matching],
  );

  const visible = useMemo(() => {
    let list = matching.filter((o) => inTab(o, tab));
    if (tab === 'toShip' && stage !== 'all') list = list.filter((o) => o.status === stage);
    // Ship the oldest first; everywhere else the newest is what you look for.
    if (tab === 'toShip') list = [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return list;
  }, [matching, tab, stage]);

  useEffect(() => setLimit(PAGE), [tab, stage, q]);

  // Packing only makes sense for orders that are accepted and paid for.
  const packable = useMemo(
    () => toShip.filter((o) => (o.status === 'confirmed' || o.status === 'processing') && !awaitingOnlinePayment(o)),
    [toShip],
  );

  const current = sheet ? orders.find((o) => o.id === sheet.id) ?? null : null;
  const close = () => setSheet(null);

  function exportCsv() {
    const csv = ordersToCsv(visible);
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const hint =
    counts.toShip > 0
      ? `${counts.toShip} waiting to ship${exchangesWaiting ? `, ${exchangesWaiting} ${exchangesWaiting === 1 ? 'exchange needs' : 'exchanges need'} you` : ''}`
      : exchangesWaiting
        ? `${exchangesWaiting} ${exchangesWaiting === 1 ? 'exchange needs' : 'exchanges need'} you`
        : 'All caught up';

  return (
    <div>
      <PageHeader
        title="Orders"
        hint={isLoading ? 'Loading...' : hint}
        actions={
          <>
            <button
              type="button"
              className="nav-icon-btn"
              onClick={() => refetch()}
              aria-label="Refresh orders"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
            <button type="button" className="btn btn-white hidden sm:inline-flex" onClick={exportCsv} disabled={visible.length === 0}>
              <Download className="h-4 w-4" />
              Export
            </button>
          </>
        }
      />

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented<OrderTab>
          label="Order queue"
          size="md"
          value={tab}
          onChange={setTab}
          items={ORDER_TABS.map((t) => ({
            key: t.key,
            label: t.label,
            count: counts[t.key],
            alert: t.key === 'toShip' || (t.key === 'exchanges' && exchangesWaiting > 0),
          }))}
        />
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Order no., name, phone, pincode, product"
          className="w-full lg:w-80"
        />
      </div>

      {tab === 'toShip' && toShip.length > 0 ? (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <Segmented<Stage>
            label="Stage"
            value={stage}
            onChange={setStage}
            items={STAGES.map((s) => ({ key: s.key, label: s.label, count: stageCounts[s.key] }))}
          />
          <div className="flex gap-2">
            <button type="button" className="btn btn-white px-3 py-1.5 text-[13px]" onClick={() => setPicking(true)}>
              <ClipboardList className="h-4 w-4" />
              Pick list
            </button>
            <button
              type="button"
              className="btn btn-white hidden px-3 py-1.5 text-[13px] sm:inline-flex"
              onClick={() => printPackingSlips(packable)}
              disabled={packable.length === 0}
              title="One slip per confirmed or packing order"
            >
              <Printer className="h-4 w-4" />
              Packing slips
            </button>
          </div>
        </div>
      ) : null}

      {error ? (
        <Notice tone="danger" className="mb-4">
          Could not load orders. {error instanceof Error ? error.message : ''}{' '}
          <button type="button" className="font-semibold underline" onClick={() => refetch()}>
            Try again
          </button>
        </Notice>
      ) : null}

      {isLoading ? (
        <CenteredSpinner />
      ) : visible.length === 0 ? (
        <div className="panel">
          <Empty
            title={q ? 'No orders match that search.' : EMPTY[tab]}
            hint={q ? 'Search looks at order numbers, names, phone numbers, pincodes and products.' : undefined}
            action={
              q ? (
                <button type="button" className="btn btn-white" onClick={() => setQuery('')}>
                  Clear search
                </button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          <OrderList orders={visible.slice(0, limit)} onOpen={(o) => setSheet({ id: o.id, view: 'detail' })} onChanged={refresh} />
          {visible.length > limit ? (
            <div className="mt-4 flex justify-center">
              <button type="button" className="btn btn-white" onClick={() => setLimit((n) => n + PAGE)}>
                Show {Math.min(PAGE, visible.length - limit)} more
              </button>
            </div>
          ) : null}
        </>
      )}

      {current && sheet?.view === 'detail' ? (
        <OrderDetail
          order={current}
          onClose={close}
          onChanged={refresh}
          onOpenExchanges={() => setSheet({ id: current.id, view: 'exchanges' })}
          onCodRefused={() => setSheet({ id: current.id, view: 'cod' })}
        />
      ) : null}
      {current && sheet?.view === 'exchanges' ? (
        <ExchangesModal
          order={current}
          onClose={close}
          onChanged={refresh}
          onBack={() => setSheet({ id: current.id, view: 'detail' })}
        />
      ) : null}
      {current && sheet?.view === 'cod' ? (
        <CodRefusedModal order={current} onClose={() => setSheet({ id: current.id, view: 'detail' })} onResolved={refresh} />
      ) : null}
      {picking ? <PickList orders={toShip.filter((o) => !awaitingOnlinePayment(o))} onClose={() => setPicking(false)} /> : null}
    </div>
  );
}

const EMPTY: Record<OrderTab, string> = {
  toShip: 'Nothing waiting to ship.',
  shipped: 'Nothing on its way right now.',
  delivered: 'No delivered orders yet.',
  exchanges: 'No open exchanges.',
  cancelled: 'No cancelled orders.',
  all: 'No orders yet.',
};
