'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Search, Loader2 } from 'lucide-react';
import { Hotspot } from '@/lib/pageSections';

interface HotspotEditorProps {
  settings: { image?: string; alt?: string; caption?: string; hotspots?: Hotspot[] };
  onChange: (settings: any) => void;
}

interface ProductSearchResult {
  id: string;
  name: string;
  price: string | number;
  featuredImage?: string;
  images?: string[];
}

export default function HotspotEditor({ settings, onChange }: HotspotEditorProps) {
  const hotspots: Hotspot[] = settings.hotspots || [];
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const updateHotspots = (next: Hotspot[]) => {
    onChange({ ...settings, hotspots: next });
  };

  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;
    const id = `hotspot-${Date.now()}`;
    updateHotspots([...hotspots, { id, x, y, productId: '' }]);
    setPickerFor(id);
  };

  const removeHotspot = (id: string) => {
    updateHotspots(hotspots.filter((h) => h.id !== id));
    if (pickerFor === id) setPickerFor(null);
  };

  const assignProduct = (id: string, product: ProductSearchResult) => {
    updateHotspots(
      hotspots.map((h) => (h.id === id ? { ...h, productId: product.id, productName: product.name } : h))
    );
    setPickerFor(null);
  };

  return (
    <div>
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Image URL</label>
        <input
          type="text"
          value={settings.image || ''}
          onChange={(e) => onChange({ ...settings, image: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-lg"
          placeholder="https://..."
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Alt text</label>
        <input
          type="text"
          value={settings.alt || ''}
          onChange={(e) => onChange({ ...settings, alt: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-lg"
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Caption</label>
        <input
          type="text"
          value={settings.caption || ''}
          onChange={(e) => onChange({ ...settings, caption: e.target.value })}
          className="w-full px-3 py-2 border border-border rounded-lg"
        />
      </div>

      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">Hotspots</label>
        <p className="text-xs text-muted-foreground mb-2">
          Click anywhere on the image to drop a pin, then pick the product it should shop.
        </p>
      </div>

      {settings.image ? (
        <div className="relative inline-block max-w-full border border-border rounded-lg overflow-hidden">
          <img
            ref={imageRef}
            src={settings.image}
            alt=""
            onClick={handleImageClick}
            className="block max-w-full cursor-crosshair select-none"
          />
          {hotspots.map((spot) => (
            <div
              key={spot.id}
              style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPickerFor(pickerFor === spot.id ? null : spot.id);
                }}
                className={`h-5 w-5 rounded-full border-2 border-white shadow-md ${
                  spot.productId ? 'bg-green-500' : 'bg-amber-500'
                }`}
                title={spot.productName || 'Unassigned — click to pick a product'}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeHotspot(spot.id);
                }}
                className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-white"
                title="Remove pin"
              >
                <X className="h-3 w-3" />
              </button>

              {pickerFor === spot.id && (
                <ProductPicker
                  onSelect={(product) => assignProduct(spot.id, product)}
                  onClose={() => setPickerFor(null)}
                />
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Add an image URL above to start placing pins.</p>
      )}

      {hotspots.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm">
          {hotspots.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-2 px-2 py-1 bg-muted/40 rounded">
              <span className={h.productId ? '' : 'text-amber-600'}>
                {h.productName || h.productId || 'Unassigned pin'}
              </span>
              <button type="button" onClick={() => removeHotspot(h.id)} className="text-destructive text-xs">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProductPicker({
  onSelect,
  onClose,
}: {
  onSelect: (product: ProductSearchResult) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ search: query, limit: '8' });
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/products?${params.toString()}`
        );
        const data = await res.json();
        setResults(Array.isArray(data) ? data : data.products || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute z-20 mt-2 w-64 rounded-lg border border-border bg-background p-2 shadow-xl"
    >
      <div className="relative mb-2">
        <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products..."
          className="w-full pl-7 pr-2 py-1.5 text-sm border border-border rounded"
        />
      </div>
      <div className="max-h-56 overflow-y-auto">
        {loading && (
          <div className="flex justify-center py-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading &&
          results.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => onSelect(product)}
              className="flex w-full items-center gap-2 rounded px-1.5 py-1.5 text-left text-sm hover:bg-muted"
            >
              <img
                src={product.featuredImage || product.images?.[0] || '/placeholder-image.svg'}
                alt=""
                className="h-8 w-8 rounded object-cover flex-shrink-0"
              />
              <span className="flex-1 truncate">{product.name}</span>
              <span className="text-xs text-muted-foreground">₹{product.price}</span>
            </button>
          ))}
        {!loading && query && results.length === 0 && (
          <p className="px-1.5 py-2 text-xs text-muted-foreground">No products found</p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-1 w-full rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
      >
        Close
      </button>
    </div>
  );
}
