'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '@/lib/utils';
import { mediaUrl } from './format';
import { PomPortal } from './modal';

/**
 * Just the image, enlarged, on a dark scrim (POM's lightbox). Clicks and
 * Escape stop here so closing the photo never also closes or opens the order
 * the photo sits in.
 */
export function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  function close(e: React.SyntheticEvent) {
    e.stopPropagation();
    onClose();
  }

  return (
    <PomPortal>
      <div
        className="fixed inset-0 z-[90] flex items-center justify-center p-6"
        style={{ background: 'rgba(8, 20, 28, 0.85)', animation: 'pom-rise-in 0.28s var(--pom-ease-apple)' }}
        onClick={close}
        role="dialog"
        aria-modal="true"
        aria-label={alt}
      >
        <button
          type="button"
          onClick={close}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-white"
          style={{ background: 'rgba(255,255,255,0.12)' }}
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-full max-w-full rounded-xl object-contain"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </PomPortal>
  );
}

/**
 * A photo that opens full screen when tapped, the way every product photo in
 * POM behaves. The tap is kept to the photo, so a row or card around it
 * still opens its own thing everywhere else.
 */
export function ZoomImg({
  src,
  alt,
  className,
  style,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  src = mediaUrl(src);

  function show(e: React.SyntheticEvent) {
    e.stopPropagation();
    e.preventDefault();
    setOpen(true);
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={cn(className, 'cursor-zoom-in')}
        style={style}
        role="button"
        tabIndex={0}
        aria-label={alt ? `Enlarge ${alt}` : 'Enlarge photo'}
        onClick={show}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') show(e);
        }}
      />
      {open ? <ImageLightbox src={src} alt={alt} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

/** A product photo that zooms on tap, or an empty box outline when there is none. */
export function Thumb({
  src,
  alt,
  className = 'h-11 w-11',
  zoom = true,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  zoom?: boolean;
}) {
  const box = cn(className, 'shrink-0 border object-cover');
  const style = { borderColor: 'var(--pom-border)', background: 'var(--pom-panel-2)' };
  if (src) {
    if (!zoom) {
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={mediaUrl(src)} alt={alt} loading="lazy" className={box} style={style} />;
    }
    return <ZoomImg src={src} alt={alt} className={box} style={style} />;
  }
  return (
    <div className={cn(className, 'flex shrink-0 items-center justify-center border')} style={style} aria-hidden>
      <svg viewBox="0 0 24 24" className="h-1/3 w-1/3" fill="none" stroke="var(--pom-muted-2)" strokeWidth="1.5">
        <path
          d="M4 8l4-4h8l4 4M4 8v11a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V8M4 8h16M9 12h6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
