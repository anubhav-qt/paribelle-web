'use client';

import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Download, FileDown, MoreHorizontal, Plus, Trash2, Upload, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';

import { ProductEditor } from '@/components/admin/products/ProductEditor';
import { confirmDialog, toast } from '@/components/admin/pom/dialogs';
import { DropdownMenu } from '@/components/admin/pom/dropdown-menu';
import { money } from '@/components/admin/pom/format';
import { Thumb } from '@/components/admin/pom/image-lightbox';
import { Segmented } from '@/components/admin/pom/segmented';
import { colorSwatch } from '@/components/admin/pom/swatch';
import { Badge, CenteredSpinner, ColorDot, Empty, Notice, PageHeader, SearchBox, Stat } from '@/components/admin/pom/ui';
import { useAdminProducts, useAdminProductStats, useDeleteProduct, useUpdateProductStatus } from '@/hooks/useAdminProducts';
import { ApiError, api, downloadBlob, errorMessage } from '@/lib/api';
import { PRODUCT_STATUS, priceRange, productColours, sizeStock, stockTone, totalStock } from '@/lib/admin/products';
import type { Product } from '@/types/product';

type StatusFilter = 'all' | 'active' | 'draft' | 'archived';
type StockFilter = '' | 'low' | 'out';

const PER_PAGE = 24;

export default function ProductsPage() {
  return (
    <Suspense fallback={<CenteredSpinner />}>
      <Products />
    </Suspense>
  );
}

const STOCK_COLOR = { danger: 'var(--pom-danger)', warn: '#a45f0e', ok: 'var(--pom-text)' } as const;

function Colours({ product }: { product: Product }) {
  const colours = productColours(product);
  if (colours.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-1" title={colours.join(', ')}>
      {colours.slice(0, 6).map((c) => {
        const sw = colorSwatch(c);
        return <ColorDot key={c} css={sw?.css ?? '#ddd'} multi={sw?.multi} className="h-3 w-3" />;
      })}
      {colours.length > 6 ? <span className="muted text-[11px]">+{colours.length - 6}</span> : null}
    </span>
  );
}

/** Stock by size, the number the shop actually restocks by. */
function SizeStock({ product }: { product: Product }) {
  const sizes = sizeStock(product);
  if (sizes.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1">
      {sizes.map(({ size, stock }) => (
        <span
          key={size}
          className="pom-round inline-flex items-center gap-1 rounded border px-1.5 py-px text-[11px] tabular-nums"
          style={{
            borderColor: 'var(--pom-border)',
            color: STOCK_COLOR[stockTone(stock)],
            background: stock <= 0 ? 'var(--pom-danger-soft)' : undefined,
          }}
        >
          <span className="font-semibold">{size}</span>
          <span className={stock > 0 ? 'opacity-70' : undefined}>{stock}</span>
        </span>
      ))}
    </div>
  );
}

function Price({ product }: { product: Product }) {
  const { min, max, compare } = priceRange(product);
  return (
    <div className="whitespace-nowrap">
      <span className="font-semibold tabular-nums">{min === max ? money(min) : `${money(min)} to ${money(max)}`}</span>
      {compare && compare > max ? <span className="muted ml-1.5 text-xs line-through">{money(compare)}</span> : null}
    </div>
  );
}

function Products() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();

  // A low-stock notification links here with ?search=<product name>.
  const [search, setSearch] = useState(() => params.get('search') ?? '');
  const [debounced, setDebounced] = useState(search);
  const [status, setStatus] = useState<StatusFilter>(() => {
    const s = params.get('status');
    return s === 'active' || s === 'draft' || s === 'archived' ? s : 'all';
  });
  const [stock, setStock] = useState<StockFilter>(() => {
    const s = params.get('stock');
    return s === 'low' || s === 'out' ? s : '';
  });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ ok: boolean; text: string; errors: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 250);
    return () => clearTimeout(t);
  }, [search]);

  // Dashboard and notification links set these; keep following them.
  const stockParam = params.get('stock');
  useEffect(() => {
    if (stockParam === 'low' || stockParam === 'out') setStock(stockParam);
  }, [stockParam]);

  // Keep the filters in the URL so a filtered list can be bookmarked or shared.
  useEffect(() => {
    const next = new URLSearchParams();
    if (status !== 'all') next.set('status', status);
    if (stock) next.set('stock', stock);
    if (debounced) next.set('search', debounced);
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, stock, debounced]);

  const { data, isLoading, error, isFetching } = useAdminProducts({
    page,
    limit: PER_PAGE,
    status,
    search: debounced,
    stock,
  });
  const { data: stats } = useAdminProductStats();
  const updateStatus = useUpdateProductStatus();
  const deleteProduct = useDeleteProduct();

  const products = useMemo<Product[]>(() => data?.products ?? [], [data]);
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));

  useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const ids = new Set(products.map((p) => p.id));
      const next = new Set(Array.from(prev).filter((id) => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [products]);

  const allSelected = products.length > 0 && products.every((p) => selected.has(p.id));

  function refresh() {
    qc.invalidateQueries({ queryKey: ['admin-products'] });
    qc.invalidateQueries({ queryKey: ['admin-products-stats'] });
  }

  async function changeStatus(p: Product, next: string) {
    setBusy(p.id);
    try {
      await updateStatus.mutateAsync({ productId: p.id, status: next });
      qc.invalidateQueries({ queryKey: ['admin-products-stats'] });
      toast.success(`${p.name}: ${PRODUCT_STATUS[next]?.label ?? next}.`);
    } catch (e) {
      toast.error(errorMessage(e, 'Could not change the status.'));
    } finally {
      setBusy(null);
    }
  }

  async function deleteSelected() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const ok = await confirmDialog({
      title: `Delete ${ids.length} ${ids.length === 1 ? 'product' : 'products'}?`,
      message: 'Any that have been ordered are archived instead, so past orders keep their details.',
      confirmText: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    setBusy('bulk');
    const results = await Promise.allSettled(ids.map((id) => deleteProduct.mutateAsync(id)));
    const done = results.filter((r) => r.status === 'fulfilled') as PromiseFulfilledResult<{ outcome: string }>[];
    const deleted = done.filter((r) => r.value?.outcome === 'deleted').length;
    const archived = done.length - deleted;
    const failed = results.length - done.length;
    setSelected(new Set());
    setBusy(null);
    refresh();
    const parts = [deleted && `${deleted} deleted`, archived && `${archived} archived (they have orders)`, failed && `${failed} failed`].filter(Boolean);
    (failed ? toast.error : toast.success)(`${parts.join(', ')}.`);
  }

  async function download(kind: 'template' | 'export') {
    setBusy(kind);
    try {
      if (kind === 'template') {
        const res = await api.raw('GET', '/products/template-simple/download');
        await downloadBlob(res, 'paribelle-import-template.zip');
      } else {
        const ids = Array.from(selected);
        const res = await api.raw('GET', '/products/export-simple/all', { params: { ids: ids.length ? ids.join(',') : undefined } });
        await downloadBlob(res, `paribelle-products-${new Date().toISOString().slice(0, 10)}.zip`);
      }
    } catch (e) {
      toast.error(errorMessage(e, 'Download failed.'));
    } finally {
      setBusy(null);
    }
  }

  async function importZip(file: File) {
    setBusy('import');
    setImportResult(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const r = await api.upload<{ success?: boolean; message?: string; errors?: string[] }>('/products/import-simple/all', form);
      const errors = r?.errors ?? [];
      setImportResult({ ok: !!r?.success && errors.length === 0, text: r?.message || (r?.success ? 'Import complete.' : 'Import failed.'), errors });
      refresh();
    } catch (e) {
      const body = e instanceof ApiError ? (e.body as { errors?: string[] } | null) : null;
      setImportResult({ ok: false, text: errorMessage(e, 'Import failed.'), errors: body?.errors ?? [] });
    } finally {
      setBusy(null);
    }
  }

  function pickCard(card: 'all' | 'active' | 'low' | 'out') {
    if (card === 'all') {
      setStatus('all');
      setStock('');
    } else if (card === 'active') {
      setStatus('active');
      setStock('');
    } else {
      setStock((s) => (s === card ? '' : card));
    }
  }

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div>
      <PageHeader
        title="Products"
        hint={stats ? `${stats.active} on sale, ${stats.draft} drafts` : undefined}
        actions={
          <>
            <DropdownMenu
              align="right"
              label="Import and export"
              width="w-64"
              trigger={
                <span className="btn btn-white px-2.5" aria-hidden>
                  <MoreHorizontal className="h-4 w-4" />
                </span>
              }
              options={[
                { id: 'import', label: busy === 'import' ? 'Importing...' : 'Import from ZIP', icon: <Upload className="h-4 w-4" />, disabled: !!busy },
                {
                  id: 'export',
                  label: selected.size ? `Export ${selected.size} selected` : 'Export all',
                  icon: <Download className="h-4 w-4" />,
                  disabled: !!busy,
                },
                { id: 'template', label: 'Download import template', icon: <FileDown className="h-4 w-4" />, disabled: !!busy, dividerBefore: true },
              ]}
              onSelect={(id) => {
                if (id === 'import') fileRef.current?.click();
                else download(id as 'template' | 'export');
              }}
            />
            <Link href="/admin/products/add" className="btn btn-blue">
              <Plus className="h-4 w-4" />
              Add product
            </Link>
            <input
              ref={fileRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = '';
                if (f) importZip(f);
              }}
            />
          </>
        }
      />

      {importResult ? (
        <Notice tone={importResult.ok ? 'ok' : 'danger'} className="mb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium">{importResult.text}</p>
              {importResult.errors.length ? (
                <ul className="mt-1.5 list-inside list-disc space-y-0.5 text-xs">
                  {importResult.errors.slice(0, 20).map((er, i) => (
                    <li key={i}>{er}</li>
                  ))}
                  {importResult.errors.length > 20 ? <li>and {importResult.errors.length - 20} more</li> : null}
                </ul>
              ) : null}
            </div>
            <button type="button" onClick={() => setImportResult(null)} aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        </Notice>
      ) : null}

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="All products" value={stats?.total ?? '-'} onClick={() => pickCard('all')} active={status === 'all' && !stock} />
        <Stat label="On sale" value={stats?.active ?? '-'} tone="ok" onClick={() => pickCard('active')} active={status === 'active' && !stock} />
        <Stat
          label="Low stock"
          value={stats?.lowStock ?? '-'}
          tone={stats?.lowStock ? 'warn' : undefined}
          hint="Under 10 left"
          onClick={() => pickCard('low')}
          active={stock === 'low'}
        />
        <Stat
          label="Out of stock"
          value={stats?.outOfStock ?? '-'}
          tone={stats?.outOfStock ? 'danger' : undefined}
          onClick={() => pickCard('out')}
          active={stock === 'out'}
        />
      </div>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented<StatusFilter>
            label="Status"
            size="md"
            value={status}
            onChange={setStatus}
            items={[
              { key: 'all', label: 'All' },
              { key: 'active', label: 'On sale' },
              { key: 'draft', label: 'Drafts' },
              { key: 'archived', label: 'Archived' },
            ]}
          />
          {stock ? (
            <button
              type="button"
              onClick={() => setStock('')}
              className="inline-flex items-center gap-1 rounded-sm px-2.5 py-1 text-xs font-semibold"
              style={{
                background: stock === 'out' ? 'var(--pom-danger-soft)' : 'var(--pom-warn-soft)',
                color: stock === 'out' ? 'var(--pom-danger)' : '#a45f0e',
              }}
            >
              {stock === 'out' ? 'Out of stock' : 'Low stock'}
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </div>
        <SearchBox value={search} onChange={setSearch} placeholder="Name or SKU" className="w-full md:w-72" />
      </div>

      {selected.size > 0 ? (
        <div
          className="pom-menu sticky top-[7.5rem] z-30 mb-3 flex items-center gap-2 px-3 py-2 text-sm"
          style={{ animation: 'pom-rise-in 0.28s var(--pom-ease-apple)' }}
        >
          <span className="font-medium">{selected.size} selected</span>
          <div className="flex-1" />
          <button type="button" className="btn px-2.5 py-1.5 text-[13px]" onClick={() => download('export')} disabled={!!busy}>
            <Download className="h-4 w-4" />
            Export
          </button>
          <button type="button" className="btn btn-danger px-2.5 py-1.5 text-[13px]" onClick={deleteSelected} disabled={!!busy}>
            <Trash2 className="h-4 w-4" />
            {busy === 'bulk' ? 'Deleting...' : 'Delete'}
          </button>
          <button type="button" className="btn px-2 py-1.5" onClick={() => setSelected(new Set())} aria-label="Clear selection">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {error ? <Notice tone="danger" className="mb-4">Could not load products. {errorMessage(error)}</Notice> : null}

      {isLoading ? (
        <CenteredSpinner />
      ) : products.length === 0 ? (
        <div className="panel">
          <Empty
            title={debounced || stock || status !== 'all' ? 'No products match.' : 'No products yet.'}
            action={
              debounced || stock || status !== 'all' ? (
                <button
                  type="button"
                  className="btn btn-white"
                  onClick={() => {
                    setSearch('');
                    setStatus('all');
                    setStock('');
                  }}
                >
                  Clear filters
                </button>
              ) : (
                <Link href="/admin/products/add" className="btn btn-blue">
                  Add your first product
                </Link>
              )
            }
          />
        </div>
      ) : (
        <div style={{ opacity: isFetching && !isLoading ? 0.7 : 1, transition: 'opacity 0.2s' }}>
          {/* Computer */}
          <div className="panel hidden overflow-hidden md:block">
            <table className="grid-table">
              <thead>
                <tr>
                  <th className="w-px">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => setSelected(e.target.checked ? new Set(products.map((p) => p.id)) : new Set())}
                      aria-label="Select all on this page"
                    />
                  </th>
                  <th>Product</th>
                  <th>Stock by size</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const n = totalStock(p);
                  return (
                    <tr key={p.id} className="cursor-pointer" onClick={() => setEditing(p.id)}>
                      <td onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Select ${p.name}`} />
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <Thumb src={p.featuredImage || p.images?.[0]} alt={p.name} className="h-14 w-12" />
                          <div className="min-w-0">
                            <div className="line-clamp-2 max-w-[22rem] text-[13px] font-medium leading-snug">{p.name}</div>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="muted truncate text-xs">{p.categories?.[0]?.name ?? 'No category'}</span>
                              <Colours product={p} />
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <SizeStock product={p} />
                      </td>
                      <td className="text-right">
                        <Price product={p} />
                      </td>
                      <td className="text-right font-semibold tabular-nums" style={{ color: STOCK_COLOR[stockTone(n)] }}>
                        {n}
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <select
                          className="input w-[7.5rem] py-1.5 text-[13px]"
                          value={p.status || 'draft'}
                          disabled={busy === p.id}
                          onChange={(e) => changeStatus(p, e.target.value)}
                          aria-label={`Status of ${p.name}`}
                        >
                          <option value="active">On sale</option>
                          <option value="draft">Draft</option>
                          <option value="archived">Archived</option>
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Phone */}
          <div className="space-y-2.5 md:hidden">
            {products.map((p) => {
              const n = totalStock(p);
              const st = PRODUCT_STATUS[p.status || 'draft'] ?? PRODUCT_STATUS.draft;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setEditing(p.id)}
                  className="panel flex w-full gap-3 p-3 text-left active:bg-[var(--pom-panel-2)]"
                >
                  <Thumb src={p.featuredImage || p.images?.[0]} alt={p.name} className="h-24 w-20" zoom={false} />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-[13px] font-medium leading-snug">{p.name}</div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <Price product={p} />
                      <Colours product={p} />
                    </div>
                    <div className="mt-1.5">
                      <SizeStock product={p} />
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-xs">
                      <Badge tone={st.tone} className="py-0.5">
                        {st.label}
                      </Badge>
                      <span className="font-semibold tabular-nums" style={{ color: STOCK_COLOR[stockTone(n)] }}>
                        {n} in stock
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {pages > 1 ? (
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="muted text-sm">
                {(page - 1) * PER_PAGE + 1} to {Math.min(page * PER_PAGE, total)} of {total}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  className="btn btn-white px-2.5"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="px-2 text-sm tabular-nums">
                  {page} / {pages}
                </span>
                <button
                  type="button"
                  className="btn btn-white px-2.5"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => p + 1)}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {editing ? <ProductEditor productId={editing} onClose={() => setEditing(null)} /> : null}
    </div>
  );
}
