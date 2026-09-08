'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Loader } from '@/components/ui/Loader';
import { api } from '@/lib/api';
import { getImageUrl } from '@/lib/image-url';
import type { Category, Product } from '@/types/product';

export interface EditorsPickImageModalProps {
  category: Category;
  open: boolean;
  onClose: () => void;
  /** Persist the choice. Called with exactly the two columns this modal owns. */
  onSave: (patch: { featuredImageUrl: string | null; featuredImagePosition: string | null }) => Promise<void>;
}

/** "50% 30%" → {x: 50, y: 30}. Anything unparseable falls back to centred. */
function parsePosition(value: string | null | undefined): { x: number; y: number } {
  const match = /^\s*(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\s*$/.exec(value ?? '');
  if (!match) return { x: 50, y: 50 };
  return { x: Number(match[1]), y: Number(match[2]) };
}

const formatPosition = (p: { x: number; y: number }) => `${Math.round(p.x)}% ${Math.round(p.y)}%`;

/** The nine presets, laid out in reading order to match the grid on screen. */
const GRID_PRESETS = [
  { label: 'Top left', x: 0, y: 0 },
  { label: 'Top', x: 50, y: 0 },
  { label: 'Top right', x: 100, y: 0 },
  { label: 'Left', x: 0, y: 50 },
  { label: 'Centre', x: 50, y: 50 },
  { label: 'Right', x: 100, y: 50 },
  { label: 'Bottom left', x: 0, y: 100 },
  { label: 'Bottom', x: 50, y: 100 },
  { label: 'Bottom right', x: 100, y: 100 },
];

/**
 * Choose which image the mega menu's Editor's Pick tile shows for a category,
 * and which part of it survives the crop.
 *
 * The tile is a tall portrait frame with `object-cover`, so a landscape product
 * shot loses most of its width and a full-length one loses the model's head.
 * Neither was adjustable, and there was no way to see the damage without
 * publishing and hovering the live menu — hence the preview here, built from
 * the same markup the real tile uses so what an admin approves is what ships.
 */
export function EditorsPickImageModal({ category, open, onClose, onSave }: EditorsPickImageModalProps) {
  const productId = category.featuredProductId ?? null;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [position, setPosition] = useState(() => parsePosition(category.featuredImagePosition));

  const focalRef = useRef<HTMLDivElement | null>(null);

  // Reset to the saved state each time the modal opens, so a cancelled edit
  // doesn't linger into the next one.
  useEffect(() => {
    if (!open) return;
    setSelectedImage(category.featuredImageUrl ?? null);
    setPosition(parsePosition(category.featuredImagePosition));
    setLoadError(null);
  }, [open, category.featuredImageUrl, category.featuredImagePosition]);

  useEffect(() => {
    if (!open || !productId) return;

    let cancelled = false;
    setLoading(true);

    api
      .get<Product>(`/products/${productId}`)
      .then((data) => {
        if (!cancelled) setProduct(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not load that product.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, productId]);

  /**
   * Every image this product can offer the tile.
   *
   * Variant images are included because on this catalogue they are frequently
   * the better-composed shots — a colourway's own photograph rather than the
   * generic first one — and they were unreachable before.
   */
  const images = useMemo(() => {
    const all = [
      product?.featuredImage,
      ...(product?.images ?? []),
      ...(product?.productVariants ?? []).flatMap((variant) => variant.images ?? []),
    ];
    return Array.from(new Set(all.filter((img): img is string => !!img)));
  }, [product]);

  // Falls back to the same image the live tile would pick, so the preview is
  // honest before anything has been chosen.
  const previewImage = selectedImage || images[0] || null;

  const updateFromPointer = (clientX: number, clientY: number) => {
    const box = focalRef.current?.getBoundingClientRect();
    if (!box || box.width === 0 || box.height === 0) return;
    const clamp = (n: number) => Math.min(100, Math.max(0, n));
    setPosition({
      x: clamp(((clientX - box.left) / box.width) * 100),
      y: clamp(((clientY - box.top) / box.height) * 100),
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        featuredImageUrl: selectedImage,
        // Centre is the default the tile already applies, so it is stored as
        // null rather than as a redundant "50% 50%".
        featuredImagePosition:
          position.x === 50 && position.y === 50 ? null : formatPosition(position),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setPosition({ x: 50, y: 50 });
  };

  return (
    <Modal open={open} onClose={onClose} title={`Editor's Pick image — ${category.name}`} maxWidthClassName="max-w-3xl">
      {!productId ? (
        <p className="text-sm text-gray-600">
          Pin a product as this category&apos;s Editor&apos;s Pick first — the image is chosen from that
          product&apos;s photographs.
        </p>
      ) : loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader size="md" />
        </div>
      ) : loadError ? (
        <p className="text-sm text-red-600">{loadError}</p>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-[1fr_auto]">
            {/* Focal point: the whole image, uncropped, with a marker for the
                point the tile keeps centred. Showing it uncropped is the
                point — the admin needs to see what is being cut away. */}
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Focal point</p>
              {previewImage ? (
                <>
                  <div
                    ref={focalRef}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      updateFromPointer(e.clientX, e.clientY);
                    }}
                    onPointerMove={(e) => {
                      // Only while dragging — `buttons` is 0 on a plain hover.
                      if (e.buttons === 1) updateFromPointer(e.clientX, e.clientY);
                    }}
                    className="relative w-full cursor-crosshair touch-none overflow-hidden rounded border bg-gray-100 select-none"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getImageUrl(previewImage)}
                      alt=""
                      draggable={false}
                      className="block max-h-72 w-full object-contain"
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-600/80 shadow"
                      style={{ left: `${position.x}%`, top: `${position.y}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Drag on the image, or pick a preset. Currently{' '}
                    <code className="rounded bg-gray-100 px-1">{formatPosition(position)}</code>.
                  </p>

                  <div className="mt-3 grid w-max grid-cols-3 gap-1">
                    {GRID_PRESETS.map((preset) => {
                      const active = Math.round(position.x) === preset.x && Math.round(position.y) === preset.y;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          title={preset.label}
                          aria-label={preset.label}
                          aria-pressed={active}
                          onClick={() => setPosition({ x: preset.x, y: preset.y })}
                          className={`h-7 w-7 rounded border transition-colors ${
                            active ? 'border-blue-600 bg-blue-100' : 'border-gray-300 hover:bg-gray-100'
                          }`}
                        />
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">This product has no images.</p>
              )}
            </div>

            {/* The live tile, at the dimensions the mega menu actually gives it. */}
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">Preview</p>
              <div className="flex w-52 flex-none flex-col gap-3">
                <span className="text-eyebrow text-[hsl(var(--pb-ink-faint))]">Editor&apos;s Monthly Pick</span>
                <div
                  className="relative flex flex-1 select-none flex-col justify-end overflow-hidden rounded-none bg-gradient-to-b from-[hsl(var(--pb-wine))] to-[hsl(var(--pb-wine-deep))] p-4"
                  style={{ minHeight: '13rem' }}
                >
                  {previewImage && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(previewImage)}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        style={{ objectPosition: formatPosition(position) }}
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--pb-wine-deep)/0.9)] via-[hsl(var(--pb-wine-deep)/0.35)] to-transparent" />
                    </>
                  )}
                  <span className="relative flex flex-col gap-1">
                    <span className="font-display text-xl font-medium leading-tight text-white">
                      {product?.name ?? category.name}
                    </span>
                    {product?.price != null && Number.isFinite(Number(product.price)) && (
                      <span className="text-[13px] text-white/80">
                        ₹{Number(product.price).toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="mt-3 inline-flex w-fit rounded-full bg-[hsl(var(--pb-rose))] px-4 py-2 text-[11px] font-medium uppercase tracking-wide text-[hsl(var(--pb-wine-deep))]">
                      View piece
                    </span>
                  </span>
                </div>
              </div>
              <p className="mt-2 w-52 text-xs text-gray-500">
                Shown at the tile&apos;s minimum height. It grows taller when the menu has more rows,
                which reveals more of the image rather than less.
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-gray-700">
              Images{images.length > 0 && <span className="ml-1 font-normal text-gray-500">({images.length})</span>}
            </p>
            {images.length === 0 ? (
              <p className="text-sm text-gray-500">This product has no images to choose from.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {images.map((img) => {
                  const active = previewImage === img;
                  return (
                    <button
                      key={img}
                      type="button"
                      onClick={() => setSelectedImage(img)}
                      aria-pressed={active}
                      className={`h-20 w-20 overflow-hidden rounded border-2 transition-colors ${
                        active ? 'border-blue-600' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={getImageUrl(img)} alt="" className="h-full w-full object-cover" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t pt-4">
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Reset to default
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
