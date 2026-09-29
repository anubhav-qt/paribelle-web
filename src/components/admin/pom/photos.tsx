'use client';

import { ChevronLeft, ChevronRight, ImagePlus, X } from 'lucide-react';
import { useId, useState } from 'react';

import { api, errorMessage } from '@/lib/api';
import { cn } from '@/lib/utils';
import { mediaUrl } from './format';
import { ImageLightbox } from './image-lightbox';
import { Spinner } from './ui';

/**
 * A row of photos you can add to, reorder and remove, with the controls on
 * every photo rather than behind a hover, so it works the same on a phone.
 * The first photo is the cover.
 */
export function PhotoManager({
  value,
  onChange,
  max = 10,
  size = 'md',
  coverLabel = 'Cover',
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  size?: 'sm' | 'md';
  coverLabel?: string | null;
}) {
  const id = useId();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [zoom, setZoom] = useState<string | null>(null);

  const box = size === 'sm' ? 'h-20 w-16' : 'h-32 w-[6.5rem] sm:h-36 sm:w-28';

  async function upload(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (list.length === 0) return;
    if (value.length + list.length > max) {
      setError(`Up to ${max} photos.`);
      return;
    }
    const big = list.find((f) => f.size > 5 * 1024 * 1024);
    if (big) {
      setError(`${big.name} is over 5 MB.`);
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      list.forEach((f) => form.append('files', f));
      const data = await api.upload<{ url: string }[]>('/upload/images', form);
      onChange([...value, ...data.map((d) => d.url)]);
    } catch (e) {
      setError(errorMessage(e, 'Upload failed. Try again.'));
    } finally {
      setUploading(false);
    }
  }

  function move(from: number, to: number) {
    const next = [...value];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    onChange(next);
  }

  const small = 'pom-round flex h-6 w-6 items-center justify-center rounded-full text-white';
  const smallBg = { background: 'rgba(10,20,30,0.62)' };

  return (
    <div>
      <div
        className="flex flex-wrap gap-2.5"
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files?.length) upload(e.dataTransfer.files);
        }}
      >
        {value.map((url, i) => (
          <div key={`${url}-${i}`} className={cn('relative shrink-0 border', box)} style={{ borderColor: 'var(--pom-border)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl(url)}
              alt=""
              className="h-full w-full cursor-zoom-in object-cover"
              onClick={() => setZoom(mediaUrl(url))}
            />
            {i === 0 && coverLabel ? (
              <span
                className="absolute left-1 top-1 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-white"
                style={{ background: 'var(--pom-accent)' }}
              >
                {coverLabel}
              </span>
            ) : null}
            <button
              type="button"
              className={cn(small, 'absolute right-1 top-1')}
              style={smallBg}
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              aria-label="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {value.length > 1 ? (
              <div className="absolute inset-x-1 bottom-1 flex justify-between">
                <button
                  type="button"
                  className={cn(small, i === 0 && 'invisible')}
                  style={smallBg}
                  onClick={() => move(i, i - 1)}
                  aria-label="Move earlier"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className={cn(small, i === value.length - 1 && 'invisible')}
                  style={smallBg}
                  onClick={() => move(i, i + 1)}
                  aria-label="Move later"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}
          </div>
        ))}

        {value.length < max ? (
          <label
            htmlFor={id}
            className={cn('flex shrink-0 cursor-pointer flex-col items-center justify-center gap-1 border border-dashed text-center', box)}
            style={{
              borderColor: drag ? 'var(--pom-accent)' : 'var(--pom-border-strong)',
              background: drag ? 'var(--pom-accent-soft)' : 'var(--pom-panel-2)',
              color: 'var(--pom-muted)',
            }}
          >
            {uploading ? (
              <Spinner size="1.4rem" />
            ) : (
              <>
                <ImagePlus className="h-5 w-5" />
                <span className="px-1 text-[11px] font-medium leading-tight">Add photos</span>
              </>
            )}
            <input
              id={id}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                if (e.target.files?.length) upload(e.target.files);
                e.target.value = '';
              }}
            />
          </label>
        ) : null}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs" style={{ color: 'var(--pom-danger)' }}>
          {error}
        </p>
      ) : null}
      {zoom ? <ImageLightbox src={zoom} alt="" onClose={() => setZoom(null)} /> : null}
    </div>
  );
}
