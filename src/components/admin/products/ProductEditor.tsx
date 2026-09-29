'use client';

import { useQueryClient } from '@tanstack/react-query';
import { ExternalLink, Trash2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import 'react-quill/dist/quill.snow.css';

import { confirmDialog, toast } from '@/components/admin/pom/dialogs';
import { Modal } from '@/components/admin/pom/modal';
import { PhotoManager } from '@/components/admin/pom/photos';
import { Segmented } from '@/components/admin/pom/segmented';
import { colorSwatch, sortSizes } from '@/components/admin/pom/swatch';
import { CenteredSpinner, ColorDot, FormField, Notice } from '@/components/admin/pom/ui';
import { api, errorMessage } from '@/lib/api';
import { variantColour, variantOther, variantSize } from '@/lib/admin/products';
import type { Product, ProductVariant } from '@/types/product';
import { CategoryPicker } from './CategoryPicker';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface CategoryFilter {
  id: string;
  label: string;
  type: string;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
}

type Status = 'active' | 'draft' | 'archived';

interface VariantRow {
  id: string;
  sku: string;
  size: string | null;
  other: string;
  price: string;
  compareAtPrice: string;
  stockQuantity: string;
}

interface ColourGroup {
  key: string;
  colour: string | null;
  photos: string[];
  photosTouched: boolean;
  rows: VariantRow[];
}

function num(v: string) {
  const n = Number(v);
  return v.trim() === '' || !Number.isFinite(n) ? null : n;
}

const SKIP_FILTERS = new Set(['priceRange', 'price', 'stock', 'stockQuantity', 'isActive', 'active', 'status', 'rating', 'variant attributes']);

/** Variants grouped by colour, sizes in order inside each, for an editor that reads like the rail it stocks. */
function groupVariants(variants: ProductVariant[]): ColourGroup[] {
  const groups = new Map<string, ColourGroup>();
  for (const v of variants) {
    const colour = variantColour(v);
    const key = (colour ?? '').toLowerCase();
    let g = groups.get(key);
    if (!g) {
      g = { key, colour, photos: [], photosTouched: false, rows: [] };
      groups.set(key, g);
    }
    if (g.photos.length === 0 && v.images?.length) g.photos = [...v.images];
    g.rows.push({
      id: v.id,
      sku: v.sku,
      size: variantSize(v),
      other: variantOther(v),
      price: v.price != null ? String(Number(v.price)) : '',
      compareAtPrice: v.compareAtPrice != null && Number(v.compareAtPrice) > 0 ? String(Number(v.compareAtPrice)) : '',
      stockQuantity: String(v.stockQuantity ?? 0),
    });
  }
  for (const g of Array.from(groups.values())) {
    const sizes = sortSizes(g.rows.map((r) => r.size ?? ''));
    g.rows.sort((a, b) => sizes.indexOf(a.size ?? '') - sizes.indexOf(b.size ?? '') || a.other.localeCompare(b.other));
  }
  return Array.from(groups.values());
}

/**
 * Edit one product: photos, price and stock per colour and size, where it
 * sits in the shop, and its description. Opens over the list so the catalogue
 * stays where you left it.
 */
export function ProductEditor({ productId, onClose }: { productId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [product, setProduct] = useState<Product | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [status, setStatus] = useState<Status>('draft');
  const [photos, setPhotos] = useState<string[]>([]);
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [price, setPrice] = useState('');
  const [compareAt, setCompareAt] = useState('');
  const [stock, setStock] = useState('');
  const [sku, setSku] = useState('');
  const [groups, setGroups] = useState<ColourGroup[]>([]);

  const [filters, setFilters] = useState<CategoryFilter[]>([]);
  const [attrs, setAttrs] = useState<Record<string, string>>({});
  const [attrsTouched, setAttrsTouched] = useState(false);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const p = await api.get<Product>(`/products/${productId}`);
        if (!live) return;
        setProduct(p);
        setName(p.name);
        setStatus((p.status as Status) || 'draft');
        const imgs = [...(p.images ?? [])];
        if (p.featuredImage && !imgs.includes(p.featuredImage)) imgs.unshift(p.featuredImage);
        setPhotos(imgs);
        setShortDescription(p.shortDescription ?? '');
        setDescription(p.description ?? '');
        setCategoryIds(p.categories?.map((c) => c.id) ?? []);
        setPrice(p.price != null ? String(Number(p.price)) : '');
        setCompareAt(p.compareAtPrice && Number(p.compareAtPrice) > 0 ? String(Number(p.compareAtPrice)) : '');
        setStock(String(p.stockQuantity ?? 0));
        setSku(p.sku ?? '');
        setGroups(groupVariants(p.productVariants ?? []));

        const first = p.categories?.[0]?.id;
        if (first) {
          const data = await api.get<{ filters?: CategoryFilter[] }>(`/categories/${first}/filters`).catch(() => null);
          if (!live) return;
          const fs = (data?.filters ?? []).filter((f) => !SKIP_FILTERS.has(f.id));
          setFilters(fs);
          setAttrs(Object.fromEntries(fs.map((f) => [f.id, String(p.attributes?.[f.id] ?? '')])));
        }
      } catch (e) {
        if (live) setLoadError(errorMessage(e, 'Could not load the product.'));
      }
    })();
    return () => {
      live = false;
    };
  }, [productId]);

  const hasVariants = groups.length > 0;
  const missingPrice = hasVariants && groups.some((g) => g.rows.some((r) => !num(r.price) || num(r.price)! <= 0));

  function updateRow(gi: number, ri: number, patch: Partial<VariantRow>) {
    setGroups((gs) => gs.map((g, i) => (i !== gi ? g : { ...g, rows: g.rows.map((r, j) => (j === ri ? { ...r, ...patch } : r)) })));
  }

  function fillGroup(gi: number, field: 'price' | 'compareAtPrice', value: string) {
    setGroups((gs) => gs.map((g, i) => (i !== gi ? g : { ...g, rows: g.rows.map((r) => ({ ...r, [field]: value })) })));
  }

  const groupStock = useMemo(
    () => groups.map((g) => g.rows.reduce((n, r) => n + (num(r.stockQuantity) ?? 0), 0)),
    [groups],
  );

  async function save() {
    if (!product) return;
    setError(null);
    if (!name.trim()) {
      setError('Give the product a name.');
      return;
    }
    if (missingPrice) {
      setError('Every size needs a price.');
      return;
    }
    const body: Record<string, unknown> = {
      name: name.trim(),
      status,
      shortDescription,
      description,
      categoryIds,
      images: photos,
      featuredImage: photos[0] ?? null,
    };
    if (hasVariants) {
      body.productVariants = groups.flatMap((g) =>
        g.rows.map((r) => ({
          id: r.id,
          price: num(r.price),
          compareAtPrice: num(r.compareAtPrice),
          stockQuantity: Math.max(0, Math.round(num(r.stockQuantity) ?? 0)),
          ...(g.photosTouched ? { images: g.photos } : {}),
        })),
      );
    } else {
      body.price = num(price) ?? 0;
      body.compareAtPrice = num(compareAt);
      body.stockQuantity = Math.max(0, Math.round(num(stock) ?? 0));
      body.sku = sku.trim();
    }
    if (attrsTouched) {
      const next: Record<string, string> = { ...(product.attributes ?? {}) };
      for (const [k, v] of Object.entries(attrs)) {
        if (v === '') delete next[k];
        else next[k] = v;
      }
      body.attributes = next;
    }

    setSaving(true);
    try {
      await api.patch(`/products/${product.id}`, body);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin-products'] }),
        qc.invalidateQueries({ queryKey: ['admin-products-stats'] }),
      ]);
      toast.success('Product saved.');
      onClose();
    } catch (e) {
      setError(errorMessage(e, 'Could not save the product.'));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!product) return;
    const ok = await confirmDialog({
      title: `Delete ${product.name}?`,
      message: 'If it has ever been ordered it is archived instead, so past orders keep their details.',
      confirmText: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    try {
      const res = await api.delete<{ message: string; outcome: string }>(`/products/${product.id}`);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin-products'] }),
        qc.invalidateQueries({ queryKey: ['admin-products-stats'] }),
      ]);
      toast.success(res?.outcome === 'deleted' ? 'Product deleted.' : res?.message || 'Product archived.');
      onClose();
    } catch (e) {
      toast.error(errorMessage(e, 'Could not delete the product.'));
    }
  }

  return (
    <Modal
      title={product ? 'Edit product' : 'Loading product'}
      subtitle={product ? product.name : undefined}
      onClose={onClose}
      width="56rem"
      footer={
        product ? (
          <>
            <button type="button" className="btn btn-danger px-2.5" onClick={remove} aria-label="Delete product" title="Delete">
              <Trash2 className="h-4 w-4" />
            </button>
            <Link href={`/products/${product.slug}`} target="_blank" className="btn hidden sm:inline-flex">
              <ExternalLink className="h-4 w-4" />
              View on store
            </Link>
            <div className="flex-1" />
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-blue min-w-[7rem]" onClick={save} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </>
        ) : undefined
      }
    >
      {loadError ? (
        <Notice tone="danger">{loadError}</Notice>
      ) : !product ? (
        <CenteredSpinner />
      ) : (
        <div className="space-y-7">
          {error ? <Notice tone="danger">{error}</Notice> : null}

          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <FormField label="Name" htmlFor="pe-name">
              <input id="pe-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </FormField>
            <div>
              <div className="label">Status</div>
              <Segmented<Status>
                label="Status"
                value={status}
                onChange={setStatus}
                size="md"
                items={[
                  { key: 'active', label: 'On sale' },
                  { key: 'draft', label: 'Draft' },
                  { key: 'archived', label: 'Archived' },
                ]}
              />
            </div>
          </div>

          <section>
            <div className="label">Photos</div>
            <PhotoManager value={photos} onChange={setPhotos} max={12} />
            <p className="muted mt-1.5 text-xs">The first photo is the cover in the shop. Colour photos are set per colour below.</p>
          </section>

          {hasVariants ? (
            <section>
              <div className="label">Colours, sizes, price and stock</div>
              <div className="space-y-4">
                {groups.map((g, gi) => {
                  const sw = colorSwatch(g.colour);
                  return (
                    <div key={g.key || 'none'} className="surface-2" style={{ background: 'var(--pom-panel)' }}>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-3.5 py-2.5" style={{ background: 'var(--pom-panel-2)' }}>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          {sw ? <ColorDot css={sw.css} multi={sw.multi} className="h-3 w-3" /> : null}
                          {g.colour ?? 'All options'}
                          <span className="muted text-xs font-normal">
                            · {groupStock[gi]} in stock
                          </span>
                        </div>
                        {g.rows.length > 1 ? (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="muted">Same price for all sizes</span>
                            <input
                              className="input w-24 py-1 text-xs"
                              inputMode="decimal"
                              placeholder="Price"
                              aria-label={`Price for every ${g.colour ?? ''} size`}
                              onChange={(e) => e.target.value && fillGroup(gi, 'price', e.target.value)}
                            />
                            <input
                              className="input w-24 py-1 text-xs"
                              inputMode="decimal"
                              placeholder="MRP"
                              aria-label={`MRP for every ${g.colour ?? ''} size`}
                              onChange={(e) => fillGroup(gi, 'compareAtPrice', e.target.value)}
                            />
                          </div>
                        ) : null}
                      </div>

                      {g.colour ? (
                        <div className="border-b px-3.5 py-3">
                          <div className="muted mb-2 text-xs">
                            {g.colour} photos, shown when a customer picks this colour and on its orders
                          </div>
                          <PhotoManager
                            value={g.photos}
                            size="sm"
                            max={8}
                            coverLabel={null}
                            onChange={(urls) =>
                              setGroups((gs) => gs.map((x, i) => (i === gi ? { ...x, photos: urls, photosTouched: true } : x)))
                            }
                          />
                        </div>
                      ) : null}

                      <div className="hidden grid-cols-[5.5rem_1fr_1fr_6rem_minmax(0,1.2fr)] gap-3 px-3.5 pt-2.5 text-[11px] font-semibold uppercase tracking-wide sm:grid" style={{ color: 'var(--pom-muted-2)' }}>
                        <span>Size</span>
                        <span>Price</span>
                        <span>MRP</span>
                        <span>Stock</span>
                        <span>SKU</span>
                      </div>
                      <div className="divide-y sm:divide-y-0">
                        {g.rows.map((r, ri) => {
                          const stockN = num(r.stockQuantity) ?? 0;
                          return (
                            <div
                              key={r.id}
                              className="grid grid-cols-3 gap-2 px-3.5 py-2.5 sm:grid-cols-[5.5rem_1fr_1fr_6rem_minmax(0,1.2fr)] sm:items-center sm:gap-3 sm:py-1.5"
                            >
                              <div className="col-span-3 flex items-baseline justify-between sm:col-span-1 sm:block">
                                <span className="text-sm font-semibold">{r.size || r.other || '-'}</span>
                                {r.size && r.other ? <span className="muted block text-[11px]">{r.other}</span> : null}
                                <span className="muted font-mono text-[11px] sm:hidden">{r.sku}</span>
                              </div>
                              <label className="block">
                                <span className="muted mb-0.5 block text-[10px] font-semibold uppercase sm:hidden">Price</span>
                                <input
                                  className="input px-2.5 py-1.5 tabular-nums"
                                  inputMode="decimal"
                                  value={r.price}
                                  onChange={(e) => updateRow(gi, ri, { price: e.target.value })}
                                  style={!num(r.price) ? { borderColor: 'var(--pom-danger)' } : undefined}
                                />
                              </label>
                              <label className="block">
                                <span className="muted mb-0.5 block text-[10px] font-semibold uppercase sm:hidden">MRP</span>
                                <input
                                  className="input px-2.5 py-1.5 tabular-nums"
                                  inputMode="decimal"
                                  placeholder="Optional"
                                  value={r.compareAtPrice}
                                  onChange={(e) => updateRow(gi, ri, { compareAtPrice: e.target.value })}
                                />
                              </label>
                              <label className="block">
                                <span className="muted mb-0.5 block text-[10px] font-semibold uppercase sm:hidden">Stock</span>
                                <input
                                  className="input px-2.5 py-1.5 tabular-nums"
                                  inputMode="numeric"
                                  value={r.stockQuantity}
                                  onChange={(e) => updateRow(gi, ri, { stockQuantity: e.target.value.replace(/[^\d]/g, '') })}
                                  style={
                                    stockN <= 0
                                      ? { color: 'var(--pom-danger)', fontWeight: 600 }
                                      : stockN < 10
                                        ? { color: '#a45f0e', fontWeight: 600 }
                                        : undefined
                                  }
                                />
                              </label>
                              <span className="muted hidden truncate font-mono text-xs sm:block" title={r.sku}>
                                {r.sku}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="muted mt-2 text-xs">
                MRP is the crossed-out price that shows the discount. Adding a new colour or size is done from the product import.
              </p>
            </section>
          ) : (
            <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <FormField label="Price" htmlFor="pe-price">
                <input id="pe-price" className="input" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
              </FormField>
              <FormField label="MRP" htmlFor="pe-mrp">
                <input
                  id="pe-mrp"
                  className="input"
                  inputMode="decimal"
                  placeholder="Optional"
                  value={compareAt}
                  onChange={(e) => setCompareAt(e.target.value)}
                />
              </FormField>
              <FormField label="Stock" htmlFor="pe-stock">
                <input
                  id="pe-stock"
                  className="input"
                  inputMode="numeric"
                  value={stock}
                  onChange={(e) => setStock(e.target.value.replace(/[^\d]/g, ''))}
                />
              </FormField>
              <FormField label="SKU" htmlFor="pe-sku">
                <input id="pe-sku" className="input font-mono" value={sku} onChange={(e) => setSku(e.target.value)} />
              </FormField>
            </section>
          )}

          <section>
            <div className="label">Category</div>
            <CategoryPicker value={categoryIds} onChange={setCategoryIds} />
            <p className="muted mt-1.5 text-xs">Decides the GST rate (clothing 5% up to ₹1,000 a piece, 12% above; jewellery 3%).</p>
          </section>

          {filters.length > 0 ? (
            <section>
              <div className="label">Shop filters</div>
              <div className="grid gap-3 sm:grid-cols-2">
                {filters.map((f) => (
                  <FormField key={f.id} label={f.label} htmlFor={`pe-f-${f.id}`}>
                    {f.type === 'range' ? (
                      <input
                        id={`pe-f-${f.id}`}
                        className="input"
                        type="number"
                        min={f.min}
                        max={f.max}
                        step={f.step}
                        value={attrs[f.id] ?? ''}
                        onChange={(e) => {
                          setAttrs((a) => ({ ...a, [f.id]: e.target.value }));
                          setAttrsTouched(true);
                        }}
                      />
                    ) : (
                      <select
                        id={`pe-f-${f.id}`}
                        className="input"
                        value={attrs[f.id] ?? ''}
                        onChange={(e) => {
                          setAttrs((a) => ({ ...a, [f.id]: e.target.value }));
                          setAttrsTouched(true);
                        }}
                      >
                        <option value="">Not set</option>
                        {(f.options ?? []).map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                        {attrs[f.id] && !(f.options ?? []).some((o) => o.value === attrs[f.id]) ? (
                          <option value={attrs[f.id]}>{attrs[f.id]}</option>
                        ) : null}
                      </select>
                    )}
                  </FormField>
                ))}
              </div>
            </section>
          ) : null}

          <section className="pom-quill space-y-4">
            <div>
              <div className="label">Short description</div>
              <ReactQuill theme="snow" value={shortDescription} onChange={(v) => v !== shortDescription && setShortDescription(v)} />
            </div>
            <div>
              <div className="label">Description</div>
              <ReactQuill theme="snow" value={description} onChange={(v) => v !== description && setDescription(v)} />
            </div>
          </section>
        </div>
      )}
    </Modal>
  );
}
