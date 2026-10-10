'use client';

import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, X } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import 'react-quill/dist/quill.snow.css';

import { CategoryPicker, useCategories } from '@/components/admin/products/CategoryPicker';
import { toast } from '@/components/admin/pom/dialogs';
import { money } from '@/components/admin/pom/format';
import { PhotoManager } from '@/components/admin/pom/photos';
import { Segmented } from '@/components/admin/pom/segmented';
import { colorSwatch, sortSizes } from '@/components/admin/pom/swatch';
import { ColorDot, FormField, Notice, PageHeader, Section, Toggle } from '@/components/admin/pom/ui';
import { api, errorMessage } from '@/lib/api';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const KURTI_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL', '5XL'];
const OTHER_SIZES = ['Free size'];
const COMMON_COLOURS = [
  'Black', 'White', 'Off White', 'Cream', 'Beige', 'Red', 'Maroon', 'Wine', 'Pink', 'Rani Pink', 'Peach', 'Orange',
  'Mustard', 'Yellow', 'Green', 'Bottle Green', 'Olive', 'Mint', 'Teal', 'Blue', 'Navy Blue', 'Sky Blue', 'Purple',
  'Lavender', 'Grey', 'Brown', 'Gold', 'Silver', 'Rose Gold', 'Oxidised', 'Multicolour',
];

interface CategoryFilter {
  id: string;
  label: string;
  type: string;
  options?: { value: string; label: string }[];
}
const SKIP_FILTERS = new Set(['priceRange', 'price', 'stock', 'stockQuantity', 'isActive', 'active', 'status', 'rating', 'variant attributes', 'size', 'color', 'colour']);

interface Colour {
  name: string;
  photos: string[];
}
interface Cell {
  price?: string;
  mrp?: string;
  stock?: string;
  off?: boolean;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
function num(v: string | undefined) {
  if (v == null || v.trim() === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function code(s: string) {
  return s.replace(/[^a-z0-9]/gi, '').toUpperCase();
}
const key = (c: string | null, s: string | null) => `${c ?? ''}|${s ?? ''}`;

/**
 * Add a product the way a kurti is actually stocked: pick its colours and
 * sizes, give each colour its photos, and fill in price and stock once for
 * all of them before adjusting the odd one out.
 */
export default function AddProductPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const categories = useCategories();

  const [name, setName] = useState('');
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [mode, setMode] = useState<'single' | 'variants'>('variants');
  const [sku, setSku] = useState(() => `PB-${Date.now().toString(36).toUpperCase().slice(-6)}`);
  const [price, setPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [stock, setStock] = useState('');
  const [sizes, setSizes] = useState<string[]>([]);
  const [customSize, setCustomSize] = useState('');
  const [colours, setColours] = useState<Colour[]>([]);
  const [colourDraft, setColourDraft] = useState('');
  const [cells, setCells] = useState<Record<string, Cell>>({});
  const [inclGst, setInclGst] = useState(true);
  const [hsn, setHsn] = useState('');
  const [filters, setFilters] = useState<CategoryFilter[]>([]);
  const [attrs, setAttrs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<'active' | 'draft' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const root = categories?.find((c) => categoryIds.includes(c.id) && c.level === 0) ?? null;
  const isJewellery = /jewel/i.test(root?.slug ?? root?.name ?? '');

  // The filters of the most specific category chosen, e.g. Fabric and Neck for kurtis.
  const leafId = categoryIds[categoryIds.length - 1];
  useEffect(() => {
    if (!leafId) {
      setFilters([]);
      return;
    }
    let live = true;
    api
      .get<{ filters?: CategoryFilter[] }>(`/categories/${leafId}/filters`)
      .then((d) => {
        if (!live) return;
        setFilters((d?.filters ?? []).filter((f) => !SKIP_FILTERS.has(f.id.toLowerCase()) && f.type !== 'range'));
      })
      .catch(() => live && setFilters([]));
    return () => {
      live = false;
    };
  }, [leafId]);

  const combos = useMemo(() => {
    const cs = colours.length ? colours.map((c) => c.name) : [null];
    const ss = sizes.length ? sortSizes(sizes) : [null];
    return cs.flatMap((c) => ss.map((s) => ({ colour: c, size: s, k: key(c, s) })));
  }, [colours, sizes]);

  const hasOptions = colours.length > 0 || sizes.length > 0;

  function cell(k: string) {
    const c = cells[k] ?? {};
    return { price: c.price ?? price, mrp: c.mrp ?? mrp, stock: c.stock ?? stock, off: !!c.off };
  }
  function setCell(k: string, patch: Cell) {
    setCells((cs) => ({ ...cs, [k]: { ...cs[k], ...patch } }));
  }

  function addColour(raw: string) {
    const n = raw.trim().replace(/\s+/g, ' ');
    if (!n) return;
    const nice = n.replace(/\b\w/g, (ch) => ch.toUpperCase());
    if (colours.some((c) => c.name.toLowerCase() === nice.toLowerCase())) return;
    setColours((cs) => [...cs, { name: nice, photos: [] }]);
    setColourDraft('');
  }

  function toggleSize(s: string) {
    setSizes((ss) => (ss.includes(s) ? ss.filter((x) => x !== s) : [...ss, s]));
  }

  const enabled = combos.filter((c) => !cell(c.k).off);
  const totalStock =
    mode === 'variants' && hasOptions ? enabled.reduce((n, c) => n + (num(cell(c.k).stock) ?? 0), 0) : num(stock) ?? 0;

  async function submit(status: 'active' | 'draft') {
    setError(null);
    const problems: string[] = [];
    if (!name.trim()) problems.push('a name');
    if (categoryIds.length === 0) problems.push('a category');
    if (status === 'active' && photos.length === 0) problems.push('at least one photo');
    if (mode === 'single') {
      if (!num(price)) problems.push('a price');
    } else if (!hasOptions) {
      problems.push('at least one colour or size (or switch to One option)');
    } else if (enabled.length === 0) {
      problems.push('at least one colour and size that you sell');
    } else if (enabled.some((c) => !num(cell(c.k).price))) {
      problems.push('a price for every colour and size');
    }
    if (problems.length) {
      setError(`Add ${problems.join(', ')}.`);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const body: Record<string, unknown> = {
      name: name.trim(),
      slug: `${slugify(name)}-${Date.now().toString(36)}`,
      description,
      categoryIds,
      status,
      images: photos,
      featuredImage: photos[0] ?? null,
      sku: sku.trim(),
      hsnCode: hsn.trim() || null,
      priceType: inclGst ? 'mrp_with_gst' : 'selling_price_without_gst',
    };

    if (mode === 'single' || !hasOptions) {
      body.price = num(price);
      body.compareAtPrice = num(mrp);
      body.stockQuantity = Math.max(0, Math.round(num(stock) ?? 0));
    } else {
      const variants = enabled.map(({ colour, size, k }) => {
        const c = cell(k);
        return {
          attributes: { ...(colour ? { Colour: colour } : {}), ...(size ? { Size: size } : {}) },
          sku: [sku.trim(), colour ? code(colour).slice(0, 5) : null, size ? code(size) : null].filter(Boolean).join('-'),
          price: num(c.price),
          compareAtPrice: num(c.mrp),
          stock: Math.max(0, Math.round(num(c.stock) ?? 0)),
          images: colour ? colours.find((x) => x.name === colour)?.photos ?? [] : [],
        };
      });
      const prices = variants.map((v) => v.price ?? 0).filter((p) => p > 0);
      const mrps = variants.map((v) => v.compareAtPrice ?? 0).filter((p) => p > 0);
      body.price = Math.min(...prices);
      body.compareAtPrice = mrps.length ? Math.max(...mrps) : null;
      body.stockQuantity = 0;
      body.variantOptions = [
        ...(colours.length ? [{ id: 'colour', name: 'Colour', values: colours.map((c) => c.name) }] : []),
        ...(sizes.length ? [{ id: 'size', name: 'Size', values: sortSizes(sizes) }] : []),
      ];
      body.variants = variants;
    }

    const chosen = Object.fromEntries(Object.entries(attrs).filter(([, v]) => v !== ''));
    if (Object.keys(chosen).length) body.attributes = chosen;

    setSaving(status);
    try {
      await api.post('/products', body);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ['admin-products'] }),
        qc.invalidateQueries({ queryKey: ['admin-products-stats'] }),
      ]);
      toast.success(status === 'active' ? `${name.trim()} is on sale.` : `${name.trim()} saved as a draft.`);
      router.push('/admin/products');
    } catch (e) {
      setError(errorMessage(e, 'Could not save the product.'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(null);
    }
  }

  const sizeChoices = isJewellery ? [...OTHER_SIZES, ...KURTI_SIZES] : [...KURTI_SIZES, ...OTHER_SIZES];
  const extraSizes = sizes.filter((s) => !sizeChoices.includes(s));

  return (
    <div className="mx-auto max-w-4xl pb-24">
      <Link href="/admin/products" className="btn btn-primary -ml-2 mb-2 px-2 py-1 text-xs">
        <ArrowLeft className="h-3.5 w-3.5" />
        Products
      </Link>
      <PageHeader title="Add product" hint="Saved products appear in the shop straight away unless kept as a draft." />

      {error ? <Notice tone="danger" className="mb-4">{error}</Notice> : null}

      <div className="space-y-5">
        <Section title="The basics">
          <div className="space-y-5">
            <FormField label="Name" htmlFor="ap-name" hint="What customers see, e.g. Rani Pink Chikankari Anarkali Kurti">
              <input id="ap-name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
            </FormField>
            <div>
              <div className="label">Category</div>
              <CategoryPicker value={categoryIds} onChange={setCategoryIds} />
            </div>
          </div>
        </Section>

        <Section title="Photos" hint="The first photo is the cover. Photos of each colour go with that colour below.">
          <PhotoManager value={photos} onChange={setPhotos} max={12} />
        </Section>

        <Section
          title="Price and stock"
          actions={
            <Segmented<'single' | 'variants'>
              label="Options"
              value={mode}
              onChange={setMode}
              items={[
                { key: 'variants', label: 'Colours and sizes' },
                { key: 'single', label: 'One option' },
              ]}
            />
          }
        >
          {mode === 'variants' ? (
            <div className="space-y-6">
              <div>
                <div className="label">Sizes</div>
                <div className="flex flex-wrap gap-1.5">
                  {[...sizeChoices, ...extraSizes].map((s) => {
                    const on = sizes.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSize(s)}
                        aria-pressed={on}
                        className="min-w-[2.75rem] rounded-sm border px-3 py-1.5 text-[13px] font-medium"
                        style={
                          on
                            ? { borderColor: 'var(--pom-accent)', background: 'var(--pom-accent)', color: '#fff' }
                            : { borderColor: 'var(--pom-border-strong)' }
                        }
                      >
                        {s}
                      </button>
                    );
                  })}
                  <form
                    className="flex items-center gap-1"
                    onSubmit={(e) => {
                      e.preventDefault();
                      const s = customSize.trim().toUpperCase();
                      if (s && !sizes.includes(s)) setSizes((ss) => [...ss, s]);
                      setCustomSize('');
                    }}
                  >
                    <input
                      className="input w-24 rounded-sm px-3 py-1.5 text-[13px]"
                      placeholder="Other"
                      value={customSize}
                      onChange={(e) => setCustomSize(e.target.value)}
                      aria-label="Add another size"
                    />
                  </form>
                </div>
              </div>

              <div>
                <div className="label">Colours</div>
                <form
                  className="flex gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    addColour(colourDraft);
                  }}
                >
                  <input
                    className="input"
                    list="ap-colours"
                    placeholder="Type a colour and press Enter, e.g. Rani Pink"
                    value={colourDraft}
                    onChange={(e) => setColourDraft(e.target.value)}
                  />
                  <datalist id="ap-colours">
                    {COMMON_COLOURS.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  <button type="submit" className="btn btn-white shrink-0">
                    <Plus className="h-4 w-4" />
                    Add
                  </button>
                </form>
                {colours.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {colours.map((c, i) => {
                      const sw = colorSwatch(c.name);
                      return (
                        <div key={c.name} className="surface-2 p-3">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="flex items-center gap-2 text-sm font-semibold">
                              {sw ? <ColorDot css={sw.css} multi={sw.multi} className="h-3.5 w-3.5" /> : null}
                              {c.name}
                            </span>
                            <button
                              type="button"
                              className="btn btn-danger px-2 py-1 text-xs"
                              onClick={() => setColours((cs) => cs.filter((_, j) => j !== i))}
                            >
                              <X className="h-3.5 w-3.5" />
                              Remove
                            </button>
                          </div>
                          <PhotoManager
                            value={c.photos}
                            size="sm"
                            max={8}
                            coverLabel={null}
                            onChange={(urls) => setColours((cs) => cs.map((x, j) => (j === i ? { ...x, photos: urls } : x)))}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="muted mt-1.5 text-xs">Skip colours if the piece comes in one colour only.</p>
                )}
              </div>

              <div>
                <div className="label">Price, MRP and stock for every option</div>
                <div className="grid grid-cols-3 gap-3 sm:max-w-md">
                  <FormField label="Price" htmlFor="ap-dprice">
                    <input id="ap-dprice" className="input" inputMode="decimal" placeholder="₹" value={price} onChange={(e) => setPrice(e.target.value)} />
                  </FormField>
                  <FormField label="MRP" htmlFor="ap-dmrp">
                    <input id="ap-dmrp" className="input" inputMode="decimal" placeholder="Optional" value={mrp} onChange={(e) => setMrp(e.target.value)} />
                  </FormField>
                  <FormField label="Stock each" htmlFor="ap-dstock">
                    <input
                      id="ap-dstock"
                      className="input"
                      inputMode="numeric"
                      placeholder="0"
                      value={stock}
                      onChange={(e) => setStock(e.target.value.replace(/[^\d]/g, ''))}
                    />
                  </FormField>
                </div>
                <p className="muted mt-1.5 text-xs">Change any single option in the table below. MRP is the crossed-out price.</p>
              </div>

              {hasOptions ? (
                <div className="surface-2 overflow-hidden" style={{ background: 'var(--pom-panel)' }}>
                  <div
                    className="hidden grid-cols-[2rem_minmax(0,1.4fr)_1fr_1fr_5.5rem] gap-3 border-b px-3 py-2 text-[11px] font-semibold uppercase tracking-wide sm:grid"
                    style={{ color: 'var(--pom-muted-2)', background: 'var(--pom-panel-2)' }}
                  >
                    <span />
                    <span>Option</span>
                    <span>Price</span>
                    <span>MRP</span>
                    <span>Stock</span>
                  </div>
                  <div className="divide-y">
                    {combos.map(({ colour, size, k }) => {
                      const c = cell(k);
                      const sw = colorSwatch(colour);
                      return (
                        <div
                          key={k}
                          className="grid grid-cols-[2rem_1fr] items-center gap-x-3 gap-y-2 px-3 py-2 sm:grid-cols-[2rem_minmax(0,1.4fr)_1fr_1fr_5.5rem]"
                          style={c.off ? { opacity: 0.45 } : undefined}
                        >
                          <input
                            type="checkbox"
                            checked={!c.off}
                            onChange={(e) => setCell(k, { off: !e.target.checked })}
                            aria-label={`Sell ${[colour, size].filter(Boolean).join(' ')}`}
                          />
                          <span className="flex items-center gap-2 text-sm">
                            {sw ? <ColorDot css={sw.css} multi={sw.multi} /> : null}
                            {colour ? <span>{colour}</span> : null}
                            {size ? <span className="font-semibold">{size}</span> : null}
                          </span>
                          <div className="col-span-2 grid grid-cols-3 gap-2 sm:contents">
                            <input
                              className="input px-2.5 py-1.5 tabular-nums"
                              inputMode="decimal"
                              aria-label="Price"
                              placeholder="Price"
                              disabled={c.off}
                              value={c.price}
                              onChange={(e) => setCell(k, { price: e.target.value })}
                            />
                            <input
                              className="input px-2.5 py-1.5 tabular-nums"
                              inputMode="decimal"
                              aria-label="MRP"
                              placeholder="MRP"
                              disabled={c.off}
                              value={c.mrp}
                              onChange={(e) => setCell(k, { mrp: e.target.value })}
                            />
                            <input
                              className="input px-2.5 py-1.5 tabular-nums"
                              inputMode="numeric"
                              aria-label="Stock"
                              placeholder="Stock"
                              disabled={c.off}
                              value={c.stock}
                              onChange={(e) => setCell(k, { stock: e.target.value.replace(/[^\d]/g, '') })}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between border-t px-3 py-2 text-xs" style={{ background: 'var(--pom-panel-2)' }}>
                    <span className="muted">
                      {enabled.length} of {combos.length} options on sale
                    </span>
                    <span className="font-semibold tabular-nums">{totalStock} pieces</span>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <FormField label="Price" htmlFor="ap-price">
                <input id="ap-price" className="input" inputMode="decimal" placeholder="₹" value={price} onChange={(e) => setPrice(e.target.value)} />
              </FormField>
              <FormField label="MRP" htmlFor="ap-mrp" hint="Optional, shown crossed out">
                <input id="ap-mrp" className="input" inputMode="decimal" value={mrp} onChange={(e) => setMrp(e.target.value)} />
              </FormField>
              <FormField label="Stock" htmlFor="ap-stock">
                <input
                  id="ap-stock"
                  className="input"
                  inputMode="numeric"
                  value={stock}
                  onChange={(e) => setStock(e.target.value.replace(/[^\d]/g, ''))}
                />
              </FormField>
            </div>
          )}

          <div className="mt-6 grid gap-4 border-t pt-5 sm:grid-cols-2">
            <Toggle
              checked={inclGst}
              onChange={setInclGst}
              label="Prices include GST"
              hint={
                inclGst
                  ? 'The customer pays the price shown. GST is worked out of it on the invoice.'
                  : 'GST is added on top of the price at checkout.'
              }
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField label="SKU" htmlFor="ap-sku" hint="Option codes are added to it">
                <input id="ap-sku" className="input font-mono" value={sku} onChange={(e) => setSku(e.target.value)} />
              </FormField>
              <FormField label="HSN code" htmlFor="ap-hsn" hint="For the invoice">
                <input
                  id="ap-hsn"
                  className="input font-mono"
                  inputMode="numeric"
                  placeholder={isJewellery ? '7117' : '6204'}
                  value={hsn}
                  onChange={(e) => setHsn(e.target.value.replace(/[^\d]/g, ''))}
                />
              </FormField>
            </div>
          </div>
          <p className="muted mt-3 text-xs">
            GST rate is set from the category and price: clothing 5% up to ₹1,000 a piece and 12% above, jewellery 3%.
            {mode === 'variants' && enabled.length > 0 && num(price) ? ` From ${money(Math.min(...enabled.map((c) => num(cell(c.k).price) ?? Infinity)))}.` : ''}
          </p>
        </Section>

        {filters.length > 0 ? (
          <Section title="Shop filters" hint="Help customers find it when they filter the category.">
            <div className="grid gap-3 sm:grid-cols-2">
              {filters.map((f) => (
                <FormField key={f.id} label={f.label} htmlFor={`ap-f-${f.id}`}>
                  <select
                    id={`ap-f-${f.id}`}
                    className="input"
                    value={attrs[f.id] ?? ''}
                    onChange={(e) => setAttrs((a) => ({ ...a, [f.id]: e.target.value }))}
                  >
                    <option value="">Not set</option>
                    {(f.options ?? []).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </FormField>
              ))}
            </div>
          </Section>
        ) : null}

        <Section title="Description" hint="Fabric, fit, work, wash care. Shown on the product page.">
          <div className="pom-quill">
            <ReactQuill theme="snow" value={description} onChange={(v) => v !== description && setDescription(v)} />
          </div>
        </Section>
      </div>

      {/* Actions, pinned above the phone's bottom bar and at the foot of the screen on a computer. */}
      <div
        className="fixed inset-x-0 bottom-[calc(59px+env(safe-area-inset-bottom))] z-30 border-t px-4 py-3 sm:bottom-0"
        style={{ background: 'var(--pom-panel)', boxShadow: '0 -8px 24px -16px rgba(13,60,82,0.25)' }}
      >
        <div className="mx-auto flex max-w-4xl items-center gap-2">
          <span className="muted hidden text-sm sm:block">
            {name.trim() || 'New product'}
            {totalStock ? ` · ${totalStock} pieces` : ''}
          </span>
          <div className="flex-1" />
          <button type="button" className="btn btn-white" disabled={!!saving} onClick={() => submit('draft')}>
            {saving === 'draft' ? 'Saving...' : 'Save draft'}
          </button>
          <button type="button" className="btn btn-blue min-w-[8rem]" disabled={!!saving} onClick={() => submit('active')}>
            {saving === 'active' ? 'Publishing...' : 'Put on sale'}
          </button>
        </div>
      </div>
    </div>
  );
}
