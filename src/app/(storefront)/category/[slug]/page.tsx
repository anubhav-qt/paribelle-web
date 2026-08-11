'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { SlidersHorizontal, Package, Star, X } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Radio } from '@/components/ui/Radio';
import { Drawer } from '@/components/ui/Drawer';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { SectionHeading } from '@/components/brand/SectionHeading';
import { getCurrencySymbol } from '@/lib/currency';
import { Product, Category } from '@/types/product';

type SortOption = 'popularity' | 'price-low' | 'price-high' | 'newest';

const HIDDEN_FILTER_IDS = ['stock', 'stockQuantity', 'isActive', 'active', 'status', 'rating', 'variant attributes'];

/**
 * Built-in filter sections not part of a category's `filterConfig` — Price,
 * Discount and (until now) Location and Customer Rating. This store sells one
 * brand's clothing rather than many local vendors, so Location is marketplace
 * furniture with nothing to filter by; Rating is dead because the catalogue
 * carries effectively no reviews, so every option but "All ratings" returns an
 * empty grid. Whether these come back is an open question for the team — see
 * the "Still open" section of the implementation plan — so this is a toggle,
 * not a deletion: removing 'rating' here restores the sidebar section with no
 * other change needed. Location's removal goes further (state and a network
 * fetch came out with it, see below) since restoring that filter is a bigger
 * job than flipping a flag regardless.
 */
const HIDDEN_STOREFRONT_FILTERS = ['rating'];

/**
 * Curated collections that live at /category/<slug> but have no row in the
 * categories table — they are a view over the whole catalogue. Without these
 * the header's "New In" link and the homepage's "View all" both landed on a
 * "Category not found" page.
 */
const VIRTUAL_COLLECTIONS: Record<
  string,
  { name: string; description: string; select: (products: Product[]) => Product[] }
> = {
  'new-in': {
    name: 'New In',
    description: 'The latest pieces to arrive at the studio.',
    select: (products) =>
      [...products]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 48),
  },
  sale: {
    name: 'Sale',
    description: 'Reduced pieces, while stocks last.',
    select: (products) =>
      products.filter((p) => p.compareAtPrice && Number(p.compareAtPrice) > Number(p.price)),
  },
};

type CategoryFilterDef = NonNullable<Category['filterConfig']>['filters'][number];

/**
 * A range filter's current upper bound. The slider is single-handled, so the
 * value is a plain number meaning "up to this much"; `max` means unconstrained.
 * The state used to be seeded with a `[min, max]` tuple but written back as a
 * scalar, after which the filter matched nothing and rendered its label as
 * "0,1000".
 */
function rangeValueFor(filter: CategoryFilterDef, value: unknown): number {
  const max = filter.max ?? 100;
  return typeof value === 'number' && Number.isFinite(value) ? value : max;
}

/** A range filter set to its maximum imposes no constraint. */
function rangeIsUnset(filter: CategoryFilterDef, value: unknown): boolean {
  return rangeValueFor(filter, value) >= (filter.max ?? 100);
}

interface FilterPanelProps {
  /** Distinguishes this panel's radio group from the other panel's. */
  idPrefix: string;
  category: Category | null;
  subcategories: Category[];
  currency: string;
  maxProductPrice: number;
  priceRange: [number, number];
  setPriceRange: (range: [number, number]) => void;
  minRating: number;
  setMinRating: (rating: number) => void;
  showDiscountOnly: boolean;
  setShowDiscountOnly: (value: boolean) => void;
  dynamicFilterDefs: CategoryFilterDef[];
  dynamicFilters: Record<string, any>;
  onDynamicFilterChange: (key: string, value: any, type: string) => void;
}

/**
 * The filter sidebar. Deliberately declared at module scope: when this lived
 * inside the page component React saw a brand-new component type on every
 * render and threw away the whole subtree, so a click that changed one filter
 * remounted the panel underneath the pointer and the change appeared not to
 * take. Everything it needs comes in as props.
 */
function FilterPanel({
  idPrefix,
  category,
  subcategories,
  currency,
  maxProductPrice,
  priceRange,
  setPriceRange,
  minRating,
  setMinRating,
  showDiscountOnly,
  setShowDiscountOnly,
  dynamicFilterDefs,
  dynamicFilters,
  onDynamicFilterChange,
}: FilterPanelProps) {
  return (
    <div className="space-y-6">
      {subcategories.length > 0 && (
        <div className="border-b border-[hsl(var(--pb-linen))] pb-5">
          <h3 className="text-eyebrow mb-3 text-[hsl(var(--pb-ink-faint))]">Categories</h3>
          <div className="space-y-1">
            <Link
              href={`/category/${category!.slug}`}
              className="block py-1.5 text-sm font-medium text-[hsl(var(--pb-rose-deep))]"
            >
              All {category!.name}
            </Link>
            {subcategories.map((subcat) => (
              <Link
                key={subcat.id}
                href={`/category/${subcat.slug}`}
                className="block py-1.5 text-sm text-[hsl(var(--pb-ink-muted))] hover:text-[hsl(var(--pb-rose-deep))]"
              >
                {subcat.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="border-b border-[hsl(var(--pb-linen))] pb-5">
        <h3 className="text-eyebrow mb-3 text-[hsl(var(--pb-ink-faint))]">Price</h3>
        <input
          type="range"
          min="0"
          max={maxProductPrice}
          step={Math.ceil(maxProductPrice / 100) || 1}
          value={priceRange[1]}
          onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
          className="w-full accent-[hsl(var(--pb-rose))]"
        />
        <div className="flex items-center justify-between text-xs text-[hsl(var(--pb-ink-muted))]">
          <span>{getCurrencySymbol(currency)}{priceRange[0].toLocaleString()}</span>
          <span>{getCurrencySymbol(currency)}{priceRange[1].toLocaleString()}</span>
        </div>
      </div>

      {!HIDDEN_STOREFRONT_FILTERS.includes('rating') && (
        <div className="border-b border-[hsl(var(--pb-linen))] pb-5">
          <h3 className="text-eyebrow mb-3 text-[hsl(var(--pb-ink-faint))]">Customer Rating</h3>
          <div className="space-y-2">
            {[4, 3, 2, 1, 0].map((rating) => (
              <Radio
                key={rating}
                name={`${idPrefix}-rating`}
                checked={minRating === rating}
                onChange={() => setMinRating(rating)}
                label={
                  rating > 0 ? (
                    <span className="flex items-center gap-1">
                      {rating} <Star className="h-3.5 w-3.5 fill-[hsl(var(--pb-gold))] text-[hsl(var(--pb-gold))]" /> &amp; up
                    </span>
                  ) : (
                    'All ratings'
                  )
                }
              />
            ))}
          </div>
        </div>
      )}

      <div className="border-b border-[hsl(var(--pb-linen))] pb-5">
        <h3 className="text-eyebrow mb-3 text-[hsl(var(--pb-ink-faint))]">Discount</h3>
        <Checkbox
          checked={showDiscountOnly}
          onChange={(e) => setShowDiscountOnly(e.target.checked)}
          label="Show only discounted"
        />
      </div>

      {dynamicFilterDefs.map((filter) => (
        <div key={filter.id} className="border-b border-[hsl(var(--pb-linen))] pb-5 last:border-b-0">
          <h3 className="text-eyebrow mb-3 text-[hsl(var(--pb-ink-faint))]">{filter.label}</h3>
          {filter.type === 'select' && (
            <Select
              value={dynamicFilters[filter.id] || ''}
              onChange={(e) => onDynamicFilterChange(filter.id, e.target.value, filter.type)}
            >
              <option value="">All</option>
              {filter.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          )}
          {(filter.type === 'multiselect' || filter.type === 'checkbox') && (
            <div className="max-h-48 space-y-1.5 overflow-y-auto">
              {filter.options?.slice(0, 10).map((option) => (
                <Checkbox
                  key={option.value}
                  checked={(dynamicFilters[filter.id] || []).includes(option.value)}
                  onChange={() => onDynamicFilterChange(filter.id, option.value, filter.type)}
                  label={option.label}
                />
              ))}
            </div>
          )}
          {filter.type === 'range' && (
            <div className="space-y-2">
              <input
                type="range"
                min={filter.min ?? 0}
                max={filter.max ?? 100}
                step={filter.step || 1}
                value={rangeValueFor(filter, dynamicFilters[filter.id])}
                onChange={(e) => onDynamicFilterChange(filter.id, Number(e.target.value), filter.type)}
                className="w-full accent-[hsl(var(--pb-rose))]"
              />
              <div className="flex items-center justify-between text-xs text-[hsl(var(--pb-ink-muted))]">
                <span>{(filter.min ?? 0).toLocaleString()}</span>
                <span className="font-medium text-[hsl(var(--pb-ink))]">
                  Up to {rangeValueFor(filter, dynamicFilters[filter.id]).toLocaleString()}
                </span>
                <span>{(filter.max ?? 100).toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.slug as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [maxProductPrice, setMaxProductPrice] = useState<number>(100000);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [showDiscountOnly, setShowDiscountOnly] = useState(false);
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, any>>({});
  // The filters this category's live catalogue actually offers — derived on
  // the server from `variant_attributes`, not a snapshot copied at import
  // time. See CategoriesService.getEffectiveFilters.
  const [effectiveFilters, setEffectiveFilters] = useState<CategoryFilterDef[]>([]);

  const [currency, setCurrency] = useState('INR');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/currency`)
      .then((res) => res.json())
      .then((data) => setCurrency(data.value || 'INR'))
      .catch(() => {});

    fetchCategoryAndProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug]);

  useEffect(() => {
    // Virtual collections (New In, Sale) have no category row to derive
    // attribute filters from.
    if (!category || category.id.startsWith('collection-')) {
      setEffectiveFilters([]);
      return;
    }
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/${category.id}/filters/effective`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setEffectiveFilters(data?.filters || []))
      .catch(() => setEffectiveFilters([]));
  }, [category?.id]);

  useEffect(() => {
    if (effectiveFilters.length > 0) {
      const initialFilters: Record<string, any> = {};
      effectiveFilters.forEach((filter) => {
        if (filter.id === 'price' || filter.id === 'priceRange') return;
        if (HIDDEN_FILTER_IDS.includes(filter.id)) return;
        if (filter.type === 'multiselect' || filter.type === 'checkbox') initialFilters[filter.id] = [];
        else if (filter.type === 'select') initialFilters[filter.id] = '';
        else if (filter.type === 'range') initialFilters[filter.id] = filter.max ?? 100;
      });
      setDynamicFilters(initialFilters);
    }
  }, [effectiveFilters]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, priceRange, minRating, sortBy, showDiscountOnly, dynamicFilters]);

  const fetchProducts = async (categoryId: string) => {
    try {
      const searchParams = new URLSearchParams({ categoryId });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?${searchParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
        if (data.length > 0) {
          const maxPrice = Math.max(...data.map((p: Product) => Number(p.price) || 0));
          const roundedMax = Math.ceil(maxPrice / 500) * 500 || 100000;
          setMaxProductPrice(roundedMax);
          setPriceRange([0, roundedMax]);
        }
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCollection = async (collectionSlug: string) => {
    const collection = VIRTUAL_COLLECTIONS[collectionSlug];
    const searchParams = new URLSearchParams({ status: 'active', limit: '100' });

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?${searchParams.toString()}`);
    const payload = res.ok ? await res.json() : null;
    const all: Product[] = Array.isArray(payload) ? payload : payload?.products || [];
    const selected = collection.select(all);

    setCategory({
      id: `collection-${collectionSlug}`,
      name: collection.name,
      slug: collectionSlug,
      description: collection.description,
    } as Category);
    setSubcategories([]);
    setProducts(selected);

    if (selected.length > 0) {
      const roundedMax = Math.ceil(Math.max(...selected.map((p) => Number(p.price) || 0)) / 500) * 500 || 100000;
      setMaxProductPrice(roundedMax);
      setPriceRange([0, roundedMax]);
    }
  };

  const fetchCategoryAndProducts = async () => {
    try {
      setLoading(true);

      if (VIRTUAL_COLLECTIONS[categorySlug]) {
        await fetchCollection(categorySlug);
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/slug/${categorySlug}/tree`);
      if (res.ok) {
        const categoryData = await res.json();
        setCategory(categoryData);
        setSubcategories(categoryData.children || []);
        if (categoryData) await fetchProducts(categoryData.id);
      }
    } catch (error) {
      console.error('Error fetching category and products:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Every value this product offers for an attribute, across its variants.
   *
   * Variants are the only place attributes live — a product's Fabric sits on
   * each of its variants, and its Sizes are one per variant — so a product
   * matches a filter when any of its variants does. Keys are compared
   * case-insensitively because they are typed by hand in the admin and in the
   * import sheet, and the same catalogue holds both `Colour` and `colour`.
   *
   * `variationAttributes` covers the older parent/child variation model, whose
   * children are products in their own right.
   */
  const getAttrValues = (product: Product, key: string): string[] => {
    const keyLower = key.toLowerCase();

    const readFrom = (attrs?: Record<string, any>): string[] => {
      if (!attrs) return [];
      const matchingKey = Object.keys(attrs).find((k) => k.toLowerCase() === keyLower);
      return matchingKey && attrs[matchingKey] != null ? [String(attrs[matchingKey])] : [];
    };

    const variants = (product as any).productVariants as
      | Array<{ variantAttributes?: Record<string, string> }>
      | undefined;
    const fromVariants = (variants || []).flatMap((v) => readFrom(v.variantAttributes));
    if (fromVariants.length > 0) return fromVariants;

    return readFrom((product as any).variationAttributes);
  };

  const applyFilters = () => {
    let filtered = [...products];

    filtered = filtered.filter((product) => {
      const price = Number(product.price);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    if (minRating > 0) {
      filtered = filtered.filter((product) => Number(product.averageRating) >= minRating);
    }

    if (showDiscountOnly) {
      filtered = filtered.filter((product) => product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price));
    }

    Object.entries(dynamicFilters).forEach(([key, value]) => {
      if (typeof value === 'number') {
        if (key === 'price' || key === 'priceRange') return;
        const def = dynamicFilterDefs.find((f) => f.id === key);
        // At its maximum the slider means "no upper bound" — skip it entirely
        // so it doesn't exclude products that carry no value for the attribute.
        if (!def || rangeIsUnset(def, value)) return;
        filtered = filtered.filter((product) => {
          const vals = getAttrValues(product, key);
          if (vals.length === 0) return true;
          return vals.some((v) => {
            const n = Number(v);
            return Number.isFinite(n) && n <= value;
          });
        });
      } else if (Array.isArray(value) && value.length > 0) {
        filtered = filtered.filter((product) => {
          const vals = getAttrValues(product, key);
          if (vals.length === 0) return false;
          return vals.some((v) => value.some((sel: string) => sel.toLowerCase() === v.toLowerCase()));
        });
      } else if (value && typeof value === 'string') {
        filtered = filtered.filter((product) => {
          const vals = getAttrValues(product, key);
          if (vals.length === 0) return false;
          return vals.some((v) => v.toLowerCase() === value.toLowerCase());
        });
      }
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return Number(a.price) - Number(b.price);
        case 'price-high':
          return Number(b.price) - Number(a.price);
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'popularity':
        default: {
          // Real sales, not review count — see Task 4. Ties (including the
          // common case of everything at 0 sales) fall back to newest first
          // rather than leaving the order arbitrary.
          const salesDiff = (b.salesCount ?? 0) - (a.salesCount ?? 0);
          if (salesDiff !== 0) return salesDiff;
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
      }
    });

    setFilteredProducts(filtered);
  };

  const resetFilters = () => {
    setPriceRange([0, maxProductPrice]);
    setMinRating(0);
    setSortBy('popularity');
    setShowDiscountOnly(false);
    if (effectiveFilters.length > 0) {
      const resetDynamic: Record<string, any> = {};
      effectiveFilters.forEach((filter) => {
        if (filter.id === 'price' || filter.id === 'priceRange') return;
        if (HIDDEN_FILTER_IDS.includes(filter.id)) return;
        if (filter.type === 'multiselect' || filter.type === 'checkbox') resetDynamic[filter.id] = [];
        else if (filter.type === 'select') resetDynamic[filter.id] = '';
        else if (filter.type === 'range') resetDynamic[filter.id] = filter.max ?? 100;
      });
      setDynamicFilters(resetDynamic);
    }
  };

  const handleDynamicFilterChange = (key: string, value: any, type: string) => {
    setDynamicFilters((prev) => {
      if (type === 'multiselect' || type === 'checkbox') {
        const currentValues = prev[key] || [];
        const newValues = currentValues.includes(value)
          ? currentValues.filter((v: any) => v !== value)
          : [...currentValues, value];
        return { ...prev, [key]: newValues };
      }
      return { ...prev, [key]: value };
    });
  };

  const dynamicFilterDefs = effectiveFilters.filter(
    (f) => f.id !== 'price' && f.id !== 'priceRange' && !HIDDEN_FILTER_IDS.includes(f.id)
  );

  /** Clear one filter without disturbing the others. */
  const clearDynamicFilter = (filterId: string, optionValue?: string) => {
    const def = dynamicFilterDefs.find((f) => f.id === filterId);
    setDynamicFilters((prev) => {
      const current = prev[filterId];
      if (optionValue !== undefined && Array.isArray(current)) {
        return { ...prev, [filterId]: current.filter((v: string) => v !== optionValue) };
      }
      if (def?.type === 'range') return { ...prev, [filterId]: def.max ?? 100 };
      if (Array.isArray(current)) return { ...prev, [filterId]: [] };
      return { ...prev, [filterId]: '' };
    });
  };

  /**
   * One chip per applied filter, each individually removable. Without these
   * the only way to undo a selection was to find the control again, which on
   * the storefront reads as the filter being stuck.
   */
  const activeFilterChips: Array<{ key: string; label: string; onRemove: () => void }> = [];

  for (const def of dynamicFilterDefs) {
    const value = dynamicFilters[def.id];

    if (Array.isArray(value)) {
      for (const selected of value) {
        const option = def.options?.find((o) => o.value === selected);
        activeFilterChips.push({
          key: `${def.id}:${selected}`,
          label: `${def.label}: ${option?.label ?? selected}`,
          onRemove: () => clearDynamicFilter(def.id, selected),
        });
      }
    } else if (def.type === 'range') {
      if (!rangeIsUnset(def, value)) {
        activeFilterChips.push({
          key: def.id,
          label: `${def.label}: up to ${rangeValueFor(def, value).toLocaleString()}`,
          onRemove: () => clearDynamicFilter(def.id),
        });
      }
    } else if (typeof value === 'string' && value) {
      const option = def.options?.find((o) => o.value === value);
      activeFilterChips.push({
        key: def.id,
        label: `${def.label}: ${option?.label ?? value}`,
        onRemove: () => clearDynamicFilter(def.id),
      });
    }
  }

  if (minRating > 0) {
    activeFilterChips.push({
      key: 'rating',
      label: `Rating: ${minRating}★ & up`,
      onRemove: () => setMinRating(0),
    });
  }
  if (showDiscountOnly) {
    activeFilterChips.push({
      key: 'discount',
      label: 'Discounted only',
      onRemove: () => setShowDiscountOnly(false),
    });
  }
  if (priceRange[1] < maxProductPrice) {
    activeFilterChips.push({
      key: 'price',
      label: `Price: up to ${getCurrencySymbol(currency)}${priceRange[1].toLocaleString()}`,
      onRemove: () => setPriceRange([0, maxProductPrice]),
    });
  }

  const filterPanelProps = {
    category,
    subcategories,
    currency,
    maxProductPrice,
    priceRange,
    setPriceRange,
    minRating,
    setMinRating,
    showDiscountOnly,
    setShowDiscountOnly,
    dynamicFilterDefs,
    dynamicFilters,
    onDynamicFilterChange: handleDynamicFilterChange,
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-[1600px] px-4 py-10 md:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[4/5] w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <EmptyState
        icon={<Package className="h-10 w-10" />}
        title="Category not found"
        action={
          <Link href="/">
            <Button size="sm">Go to Home</Button>
          </Link>
        }
        className="min-h-[50vh]"
      />
    );
  }

  return (
    <div className="bg-[hsl(var(--pb-ivory))]">
      <div className="mx-auto max-w-[1600px] px-4 pt-6 md:px-8">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            ...(category.parent ? [{ label: category.parent.name, href: `/category/${category.parent.slug}` }] : []),
            { label: category.name },
          ]}
        />
      </div>

      <div className="mx-auto max-w-[1600px] px-4 pb-8 pt-4 md:px-8">
        <SectionHeading
          eyebrow={`${filteredProducts.length} ${filteredProducts.length === 1 ? 'Piece' : 'Pieces'}`}
          title={category.name}
        />
        {category.description && (
          <p className="mt-3 max-w-2xl text-sm text-[hsl(var(--pb-ink-muted))]">{category.description}</p>
        )}
      </div>

      <div className="mx-auto max-w-[1600px] px-4 pb-16 md:px-8">
        <div className="flex gap-10">
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-24">
              {/* The row's own height must be fixed (h-12), not just floored
                  with min-height — the Select on the other column is ~46px
                  tall on its own (py-3 + text-sm + border), well past this
                  h2's natural line height, so a min-height only "wins" on
                  the shorter side and the two rows still end up different
                  heights. Border and padding live on the OUTER wrapper so
                  they can't compete with the inner row for that fixed
                  height budget either. */}
              <div className="mb-8 border-b border-[hsl(var(--pb-linen))] pb-4">
                <div className="flex h-12 items-center justify-between">
                  <h2 className="font-display text-lg text-[hsl(var(--pb-ink))]">Filters</h2>
                  <button onClick={resetFilters} className="text-xs text-[hsl(var(--pb-rose-deep))] hover:underline">
                    Clear all
                  </button>
                </div>
              </div>
              <FilterPanel idPrefix="desktop" {...filterPanelProps} />
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-8 border-b border-[hsl(var(--pb-linen))] pb-4">
              <div className="flex h-12 items-center justify-between gap-4">
                <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setShowFilters(true)}>
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                </Button>
                <div className="ml-auto flex items-center gap-2">
                  <span className="hidden shrink-0 whitespace-nowrap text-sm text-[hsl(var(--pb-ink-faint))] sm:inline">
                    Sort by
                  </span>
                  <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="w-auto">
                    <option value="popularity">Popularity</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                  </Select>
                </div>
              </div>
            </div>

            {activeFilterChips.length > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                {activeFilterChips.map((chip) => (
                  <button
                    key={chip.key}
                    onClick={chip.onRemove}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[hsl(var(--pb-linen))] px-3 py-1 text-xs text-[hsl(var(--pb-ink-muted))] transition-colors hover:border-[hsl(var(--pb-rose))] hover:text-[hsl(var(--pb-ink))]"
                  >
                    {chip.label}
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove filter</span>
                  </button>
                ))}
                <button
                  onClick={resetFilters}
                  className="text-xs text-[hsl(var(--pb-rose-deep))] hover:underline"
                >
                  Clear all
                </button>
              </div>
            )}

            {filteredProducts.length === 0 ? (
              <EmptyState
                icon={<Package className="h-10 w-10" />}
                title="No pieces match your filters"
                description="Try adjusting or clearing your filters."
                action={
                  <Button size="sm" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6 xl:grid-cols-5">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Drawer open={showFilters} onClose={() => setShowFilters(false)} side="bottom" title="Filters">
        <div className="p-6">
          {activeFilterChips.length > 0 && (
            <div className="mb-4 flex justify-end">
              <button onClick={resetFilters} className="text-xs text-[hsl(var(--pb-rose-deep))] hover:underline">
                Clear all
              </button>
            </div>
          )}
          <FilterPanel idPrefix="drawer" {...filterPanelProps} />
        </div>
      </Drawer>
    </div>
  );
}
