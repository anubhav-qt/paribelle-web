'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Image as ImageIcon, RotateCcw, Upload } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Loader } from '@/components/ui/Loader';
import { api, errorMessage } from '@/lib/api';
import { getImageUrl } from '@/lib/image-url';
import {
  DEFAULT_HERO_IMAGES,
  HERO_SECTION_IMAGES_KEY,
  HERO_SLOT_LABELS,
  HERO_SLOTS,
  HeroSectionImages,
  HeroSlotId,
  isPreviousResettable,
  resolveHeroImageUrl,
} from '@/lib/heroSectionImages';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // matches the backend's /upload/image limit
const RESET_WINDOW_DAYS = 30;

export default function HeroSectionPage() {
  const { isAuthenticated, loading: authLoading } = useAdminAuth();
  const [images, setImages] = useState<HeroSectionImages>(DEFAULT_HERO_IMAGES);
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
      description: 'The three homepage hero photos (centre, left, right prints), each with its immediate-previous image for a 30-day reset.',
    });
    setImages(next);
  };

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

      const next: HeroSectionImages = {
        ...images,
        [slot]: {
          url: uploaded.url,
          previous: { url: images[slot].url, changedAt: new Date().toISOString() },
        },
      };
      await persist(next);
      showMessage('success', `${HERO_SLOT_LABELS[slot]} updated.`);
    } catch (error) {
      showMessage('error', errorMessage(error, 'Failed to upload image'));
    } finally {
      setBusySlot(null);
      const input = fileInputRefs.current[slot];
      if (input) input.value = '';
    }
  };

  const handleReset = async (slot: HeroSlotId) => {
    const current = images[slot];
    if (!current.previous) return;

    try {
      setBusySlot(slot);
      const next: HeroSectionImages = {
        ...images,
        [slot]: { url: current.previous.url, previous: null },
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
            Replace the three homepage hero photos independently. Each upload takes effect immediately.
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
                </div>

                <div className="mt-4 flex flex-wrap items-start gap-6">
                  <div className="relative h-48 w-40 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                    <img
                      src={resolveHeroImageUrl(image.url, getImageUrl)}
                      alt={`${HERO_SLOT_LABELS[slot]} preview`}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="flex-1 space-y-2">
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
                            ? `Reverts to the image this replaced. Available for ${daysLeft} more day${daysLeft === 1 ? '' : 's'}.`
                            : "The 30-day window to reset to the image this replaced has passed."}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No previous image to reset to yet.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
