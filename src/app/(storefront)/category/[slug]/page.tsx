'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { SlidersHorizontal, Package, Star } from 'lucide-react';
import LocationFilter from '@/components/LocationFilter';
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

type SortOption = 'popularity' | 'price-low' | 'price-high' | 'rating' | 'newest';

const HIDDEN_FILTER_IDS = ['stock', 'stockQuantity', 'isActive', 'active', 'status', 'rating', 'variant attributes'];

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

  const [cityId, setCityId] = useState<string | null>(null);
  const [subLocationId, setSubLocationId] = useState<string | null>(null);
  const [locationFilterEnabled, setLocationFilterEnabled] = useState(false);
  const [currency, setCurrency] = useState('INR');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/location_filter_enabled`)
      .then((res) => res.json())
      .then((data) => setLocationFilterEnabled(data.value === true || data.value === 'true'))
      .catch(() => {});

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/currency`)
      .then((res) => res.json())
      .then((data) => setCurrency(data.value || 'INR'))
      .catch(() => {});

    fetchCategoryAndProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categorySlug]);

  useEffect(() => {
    if (category?.filterConfig) {
      const initialFilters: Record<string, any> = {};
      category.filterConfig.filters.forEach((filter) => {
        if (filter.id === 'price' || filter.id === 'priceRange') return;
        if (HIDDEN_FILTER_IDS.includes(filter.id)) return;
        if (filter.type === 'multiselect' || filter.type === 'checkbox') initialFilters[filter.id] = [];
        else if (filter.type === 'select') initialFilters[filter.id] = '';
        else if (filter.type === 'range') initialFilters[filter.id] = [filter.min || 0, filter.max || 1000];
      });
      setDynamicFilters(initialFilters);
    }
  }, [category]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, priceRange, minRating, sortBy, showDiscountOnly, dynamicFilters]);

  useEffect(() => {
    // Virtual collections have no category row to refetch against.
    if (category && !VIRTUAL_COLLECTIONS[categorySlug]) fetchProducts(category.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityId, subLocationId]);

  const fetchProducts = async (categoryId: string) => {
    try {
      const searchParams = new URLSearchParams({ categoryId });
      if (cityId) searchParams.append('cityId', cityId);
      if (subLocationId) searchParams.append('subLocationId', subLocationId);

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

  const getAttrValues = (product: Product, key: string): string[] => {
    const keyLower = key.toLowerCase();
    const variants = (product as any).productVariants as Array<{ variantAttributes?: Record<string, string> }> | undefined;
    if (variants && variants.length > 0) {
      const vals = variants.flatMap((v) => {
        if (!v.variantAttributes) return [];
        const matchingKey = Object.keys(v.variantAttributes).find((k) => k.toLowerCase() === keyLower);
        return matchingKey ? [v.variantAttributes[matchingKey]] : [];
      });
      if (vals.length > 0) return vals;
    }
    const attrs = (product as any).attributes as Record<string, any> | undefined;
    if (attrs) {
      const matchingKey = Object.keys(attrs).find((k) => k.toLowerCase() === keyLower);
      if (matchingKey && attrs[matchingKey] != null) return [String(attrs[matchingKey])];
    }
    const varAttrs = (product as any).variationAttributes as Record<string, string> | undefined;
    if (varAttrs) {
      const matchingKey = Object.keys(varAttrs).find((k) => k.toLowerCase() === keyLower);
      if (matchingKey) return [varAttrs[matchingKey]];
    }
    return [];
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
      if (Array.isArray(value) && value.length === 2 && typeof value[0] === 'number') {
        if (key === 'price' || key === 'priceRange') return;
        filtered = filtered.filter((product) => {
          const vals = getAttrValues(product, key);
          if (vals.length === 0) return true;
          return vals.some((v) => {
            const n = Number(v);
            return n >= value[0] && n <= value[1];
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
        case 'rating':
          return Number(b.averageRating) - Number(a.averageRating);
        case 'newest':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'popularity':
        default:
          return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
      }
    });

    setFilteredProducts(filtered);
  };

  const resetFilters = () => {
    setPriceRange([0, maxProductPrice]);
    setMinRating(0);
    setSortBy('popularity');
    setShowDiscountOnly(false);
    if (category?.filterConfig) {
      const resetDynamic: Record<string, any> = {};
      category.filterConfig.filters.forEach((filter) => {
        if (filter.id === 'price' || filter.id === 'priceRange') return;
        if (HIDDEN_FILTER_IDS.includes(filter.id)) return;
        if (filter.type === 'multiselect' || filter.type === 'checkbox') resetDynamic[filter.id] = [];
        else if (filter.type === 'select') resetDynamic[filter.id] = '';
        else if (filter.type === 'range') resetDynamic[filter.id] = [filter.min || 0, filter.max || 1000];
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

  const dynamicFilterDefs = (category?.filterConfig?.filters || []).filter(
    (f) => f.id !== 'price' && f.id !== 'priceRange' && !HIDDEN_FILTER_IDS.includes(f.id)
  );

  const FilterPanel = () => (
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

      {locationFilterEnabled && (
        <div className="border-b border-[hsl(var(--pb-linen))] pb-5">
          <h3 className="text-eyebrow mb-3 text-[hsl(var(--pb-ink-faint))]">Location</h3>
          <LocationFilter
            onFilterChange={(c, s) => {
              setCityId(c);
              setSubLocationId(s);
            }}
            showLabel={false}
          />
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

      <div className="border-b border-[hsl(var(--pb-linen))] pb-5">
        <h3 className="text-eyebrow mb-3 text-[hsl(var(--pb-ink-faint))]">Customer Rating</h3>
        <div className="space-y-2">
          {[4, 3, 2, 1, 0].map((rating) => (
            <Radio
              key={rating}
              name="rating"
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
              onChange={(e) => handleDynamicFilterChange(filter.id, e.target.value, filter.type)}
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
                  onChange={() => handleDynamicFilterChange(filter.id, option.value, filter.type)}
                  label={option.label}
                />
              ))}
            </div>
          )}
          {filter.type === 'range' && (
            <div className="space-y-2">
              <input
                type="range"
                min={filter.min || 0}
                max={filter.max || 100}
                step={filter.step || 1}
                value={dynamicFilters[filter.id] || filter.min || 0}
                onChange={(e) => handleDynamicFilterChange(filter.id, Number(e.target.value), filter.type)}
                className="w-full accent-[hsl(var(--pb-rose))]"
              />
              <div className="flex items-center justify-between text-xs text-[hsl(var(--pb-ink-muted))]">
                <span>{filter.min?.toLocaleString()}</span>
                <span className="font-medium text-[hsl(var(--pb-ink))]">
                  {(dynamicFilters[filter.id] || filter.min || 0).toLocaleString()}
                </span>
                <span>{filter.max?.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
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
      <div className="mx-auto max-w-7xl px-4 pt-6 md:px-8">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            ...(category.parent ? [{ label: category.parent.name, href: `/category/${category.parent.slug}` }] : []),
            { label: category.name },
          ]}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-8 pt-4 md:px-8">
        <SectionHeading
          eyebrow={`${filteredProducts.length} ${filteredProducts.length === 1 ? 'Piece' : 'Pieces'}`}
          title={category.name}
        />
        {category.description && (
          <p className="mt-3 max-w-2xl text-sm text-[hsl(var(--pb-ink-muted))]">{category.description}</p>
        )}
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 md:px-8">
        <div className="flex gap-10">
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-24">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg text-[hsl(var(--pb-ink))]">Filters</h2>
                <button onClick={resetFilters} className="text-xs text-[hsl(var(--pb-rose-deep))] hover:underline">
                  Clear all
                </button>
              </div>
              <FilterPanel />
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-8 flex items-center justify-between gap-4 border-b border-[hsl(var(--pb-linen))] pb-4">
              <Button variant="ghost" size="sm" className="lg:hidden" onClick={() => setShowFilters(true)}>
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </Button>
              <div className="ml-auto flex items-center gap-2">
                <span className="hidden text-sm text-[hsl(var(--pb-ink-faint))] sm:inline">Sort by</span>
                <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)} className="w-auto">
                  <option value="popularity">Popularity</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Customer Rating</option>
                  <option value="newest">Newest First</option>
                </Select>
              </div>
            </div>

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
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6 xl:grid-cols-4">
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
          <FilterPanel />
        </div>
      </Drawer>
    </div>
  );
}
