'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Image as ImageIcon, Link2, Loader2, RotateCcw, Search, Upload, X } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Loader } from '@/components/ui/Loader';
import { api, errorMessage } from '@/lib/api';
import { getImageUrl } from '@/lib/image-url';
import {
  DEFAULT_HERO_IMAGES,
  HERO_SECTION_IMAGES_KEY,
  HERO_SLOT_LABELS,
  HERO_SLOTS,
  HeroProductLink,
  HeroSectionImages,
  HeroSlotId,
  isPreviousResettable,
  resolveHeroImageUrl,
} from '@/lib/heroSectionImages';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // matches the backend's /upload/image limit
const RESET_WINDOW_DAYS = 30;

/** A new photo on the image host, waiting on its product link before it goes live. */
interface Draft {
  url: string;
  product: HeroProductLink | null;
}

export default function HeroSectionPage() {
  const { isAuthenticated, loading: authLoading } = useAdminAuth();
  const [images, setImages] = useState<HeroSectionImages>(DEFAULT_HERO_IMAGES);
  const [drafts, setDrafts] = useState<Partial<Record<HeroSlotId, Draft>>>({});
  const [loading, setLoading] = useState(true);
  const [busySlot, setBusySlot] = useState<HeroSlotId | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRefs = useRef<Record<HeroSlotId, HTMLInputElement | null>>({
    main: null,
    pink: null,
    black: null,
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    api
      .get<{ key: string; value: Partial<HeroSectionImages> | null }>(`/settings/${HERO_SECTION_IMAGES_KEY}`)
      .then((res) => {
        if (!res?.value) return;
        setImages((prev) => ({
          main: res.value!.main ?? prev.main,
          pink: res.value!.pink ?? prev.pink,
          black: res.value!.black ?? prev.black,
        }));
      })
      .catch(() => {
        // No setting saved yet — the bundled defaults are the correct starting point.
      })
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const persist = async (next: HeroSectionImages) => {
    await api.put(`/settings/${HERO_SECTION_IMAGES_KEY}`, {
      value: next,
      description:
        'The three homepage hero photos (centre, left, right prints), each with the product it opens and its immediate-previous image for a 30-day reset.',
    });
    setImages(next);
  };

  const setDraft = (slot: HeroSlotId, draft: Draft | null) =>
    setDrafts((prev) => {
      const next = { ...prev };
      if (draft) next[slot] = draft;
      else delete next[slot];
      return next;
    });

  // Choosing a file puts it on the image host straight away, but the hero
  // only changes on Save, once the photo has (or deliberately hasn't) a
  // product to open.
  const handleFileChange = async (slot: HeroSlotId, file: File | undefined) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Please upload an image file.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      showMessage('error', `"${file.name}" is over the ${MAX_FILE_SIZE / 1024 / 1024}MB limit.`);
      return;
    }

    try {
      setBusySlot(slot);
      const formData = new FormData();
      formData.append('file', file);
      const uploaded = await api.upload<{ url: string }>('/upload/image', formData);
      setDraft(slot, { url: uploaded.url, product: null });
    } catch (error) {
      showMessage('error', errorMessage(error, 'Failed to upload image'));
    } finally {
      setBusySlot(null);
      const input = fileInputRefs.current[slot];
      if (input) input.value = '';
    }
  };

  const handleSaveDraft = async (slot: HeroSlotId) => {
    const draft = drafts[slot];
    if (!draft) return;
    const current = images[slot];

    try {
      setBusySlot(slot);
      await persist({
        ...images,
        [slot]: {
          url: draft.url,
          product: draft.product,
          previous: { url: current.url, changedAt: new Date().toISOString(), product: current.product ?? null },
        },
      });
      setDraft(slot, null);
      showMessage('success', `${HERO_SLOT_LABELS[slot]} updated.`);
    } catch (error) {
      showMessage('error', errorMessage(error, 'Failed to save image'));
    } finally {
      setBusySlot(null);
    }
  };

  const handleLinkChange = async (slot: HeroSlotId, product: HeroProductLink | null) => {
    try {
      setBusySlot(slot);
      await persist({ ...images, [slot]: { ...images[slot], product } });
      showMessage(
        'success',
        product ? `${HERO_SLOT_LABELS[slot]} now opens ${product.name}.` : `${HERO_SLOT_LABELS[slot]} no longer opens a product.`
      );
    } catch (error) {
      showMessage('error', errorMessage(error, 'Failed to save the link'));
    } finally {
      setBusySlot(null);
    }
  };

  const handleReset = async (slot: HeroSlotId) => {
    const current = images[slot];
    if (!current.previous) return;

    try {
      setBusySlot(slot);
      const next: HeroSectionImages = {
        ...images,
        [slot]: { url: current.previous.url, product: current.previous.product ?? null, previous: null },
      };
      await persist(next);
      showMessage('success', `${HERO_SLOT_LABELS[slot]} reset to its previous image.`);
    } catch (error) {
      showMessage('error', errorMessage(error, 'Failed to reset image'));
    } finally {
      setBusySlot(null);
    }
  };

  if (authLoading || !isAuthenticated || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader size="md" />
      </div>
    );
  }

  const now = Date.now();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white shadow-sm">
        <div className="container mx-auto px-4 py-6">
          <Link href="/admin" className="mb-2 inline-block text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <ImageIcon className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Hero Section</h1>
          </div>
          <p className="mt-1 text-gray-600">
            Replace the three homepage hero photos independently, and link each to the product it shows: tapping the
            photo on the homepage opens that product.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {message && (
          <div
            className={`mb-6 rounded-lg p-4 ${
              message.type === 'success'
                ? 'border border-green-200 bg-green-50 text-green-800'
                : 'border border-red-200 bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          {HERO_SLOTS.map((slot) => {
            const image = images[slot];
            const draft = drafts[slot];
            const resettable = isPreviousResettable(image, now);
            const busy = busySlot === slot;
            const daysLeft = image.previous
              ? RESET_WINDOW_DAYS - Math.floor((now - Date.parse(image.previous.changedAt)) / (24 * 60 * 60 * 1000))
              : 0;

            return (
              <div key={slot} className="rounded-lg border bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">{HERO_SLOT_LABELS[slot]}</h2>
                    <p className="text-sm text-gray-500">Recommended: portrait, 4:5 aspect ratio</p>
                  </div>

                  {!draft && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[slot]?.click()}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
                      >
                        <Upload className="h-4 w-4" />
                        {busy ? 'Uploading…' : 'Replace Image'}
                      </button>
                    </div>
                  )}
                  <input
                    ref={(el) => {
                      fileInputRefs.current[slot] = el;
                    }}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(slot, e.target.files?.[0])}
                  />
                </div>

                {draft ? (
                  <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                    <p className="text-sm font-medium text-gray-900">New photo</p>
                    <p className="text-sm text-gray-500">
                      Pick the product it shows, then save. The homepage keeps the current photo until you do.
                    </p>
                    <div className="mt-4 flex flex-wrap items-start gap-6">
                      <div className="relative h-48 w-40 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                        <img
                          src={resolveHeroImageUrl(draft.url, getImageUrl)}
                          alt={`New ${HERO_SLOT_LABELS[slot].toLowerCase()}`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-[16rem] flex-1 space-y-4">
                        <ProductLinkField
                          value={draft.product}
                          disabled={busy}
                          onChange={(product) => setDraft(slot, { ...draft, product })}
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleSaveDraft(slot)}
                            disabled={busy}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
                          >
                            {busy ? 'Saving…' : draft.product ? 'Save photo and link' : 'Save without a link'}
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRefs.current[slot]?.click()}
                            disabled={busy}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-40"
                          >
                            Choose another photo
                          </button>
                          <button
                            type="button"
                            onClick={() => setDraft(slot, null)}
                            disabled={busy}
                            className="rounded-lg px-4 py-2 text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-40"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap items-start gap-6">
                    <div className="relative h-48 w-40 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      <img
                        src={resolveHeroImageUrl(image.url, getImageUrl)}
                        alt={`${HERO_SLOT_LABELS[slot]} preview`}
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="min-w-[16rem] flex-1 space-y-5">
                      <ProductLinkField
                        value={image.product ?? null}
                        disabled={busy}
                        onChange={(product) => handleLinkChange(slot, product)}
                      />

                      <div className="space-y-2">
                        {image.previous ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleReset(slot)}
                              disabled={!resettable || busy}
                              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <RotateCcw className="h-4 w-4" />
                              Reset to previous image
                            </button>
                            <p className="text-sm text-gray-500">
                              {resettable
                                ? `Reverts to the image this replaced, and its link. Available for ${daysLeft} more day${daysLeft === 1 ? '' : 's'}.`
                                : 'The 30-day window to reset to the image this replaced has passed.'}
                            </p>
                          </>
                        ) : (
                          <p className="text-sm text-gray-500">No previous image to reset to yet.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface ProductResult {
  id: string;
  name: string;
  slug: string;
  price?: string | number;
  featuredImage?: string | null;
  images?: string[] | null;
}

/**
 * The product a hero photo opens: the linked one with Change and Remove, or a
 * search over the store's live products to pick one.
 */
function ProductLinkField({
  value,
  disabled,
  onChange,
}: {
  value: HeroProductLink | null;
  disabled?: boolean;
  onChange: (product: HeroProductLink | null) => void;
}) {
  const [searching, setSearching] = useState(!value);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => setSearching(!value), [value]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    const handle = setTimeout(async () => {
      try {
        const data = await api.get<ProductResult[] | { products: ProductResult[] }>('/products', {
          auth: false,
          params: { search: q, limit: 8 },
        });
        if (!cancelled) setResults(Array.isArray(data) ? data : data.products ?? []);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query]);

  if (value && !searching) {
    return (
      <div>
        <p className="mb-1.5 text-sm font-medium text-gray-700">Opens</p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={`/products/${value.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-700 hover:underline"
          >
            <Link2 className="h-4 w-4 shrink-0" />
            {value.name}
          </a>
          <button
            type="button"
            onClick={() => setSearching(true)}
            disabled={disabled}
            className="text-sm text-gray-600 underline-offset-2 hover:underline disabled:opacity-40"
          >
            Change
          </button>
          <button
            type="button"
            onClick={() => onChange(null)}
            disabled={disabled}
            className="text-sm text-red-600 underline-offset-2 hover:underline disabled:opacity-40"
          >
            Remove link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-gray-700">Product this photo opens</p>
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={disabled}
          placeholder="Search by name or SKU"
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-9 text-sm focus:border-blue-500 focus:outline-none"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSearching(false);
            }}
            aria-label="Keep the current link"
            className="absolute right-2 top-2 rounded p-0.5 text-gray-400 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {query.trim() && (
        <div className="mt-2 max-w-sm overflow-hidden rounded-lg border border-gray-200 bg-white">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          ) : results.length ? (
            <ul className="max-h-64 overflow-y-auto">
              {results.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange({ id: product.id, slug: product.slug, name: product.name });
                      setQuery('');
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <img
                      src={getImageUrl(product.featuredImage || product.images?.[0])}
                      alt=""
                      className="h-10 w-8 shrink-0 rounded object-cover"
                    />
                    <span className="flex-1 truncate">{product.name}</span>
                    {product.price !== undefined && <span className="text-xs text-gray-500">₹{product.price}</span>}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-3 text-sm text-gray-500">No live product matches.</p>
          )}
        </div>
      )}
      {!value && !query.trim() && <p className="mt-1.5 text-xs text-gray-500">Not linked: the photo is just a picture.</p>}
    </div>
  );
}
