'use client';

import { useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/lib/utils';

/**
 * POM's one toggle, ported as is: a track with a raised thumb that glides to
 * the chosen item the way iOS segmented controls move.
 */
export interface SegmentedItem<T extends string> {
  key: T;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  /** Paints the count in the warning colour, for queues that need action. */
  alert?: boolean;
}

/**
 * The raised pill behind a toggle's chosen item. Put `ref` on the track
 * (which must be `relative`), `data-active` on the items and render `thumb`
 * inside the track. Until it has measured, `ready` is false and the chosen
 * item paints its own background so nothing flickers.
 */
export function useSlidingThumb<E extends HTMLElement = HTMLDivElement>(active: string | null) {
  const ref = useRef<E>(null);
  const [box, setBox] = useState<{ x: number; y: number; w: number; h: number; glide: boolean } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>('[data-active="true"]');
    if (!el) {
      setBox(null);
      return;
    }
    const place = () =>
      setBox((prev) => ({
        x: el.offsetLeft,
        y: el.offsetTop,
        w: el.offsetWidth,
        h: el.offsetHeight,
        glide: prev !== null,
      }));
    place();
    const ro = new ResizeObserver(place);
    for (const child of Array.from(ref.current?.children ?? [])) ro.observe(child);
    let live = true;
    document.fonts?.ready.then(() => live && place());
    return () => {
      live = false;
      ro.disconnect();
    };
  }, [active]);

  const thumb = box ? (
    <span
      aria-hidden
      className="seg-thumb"
      style={{
        width: box.w,
        height: box.h,
        transform: `translate(${box.x}px, ${box.y}px)`,
        ...(box.glide ? {} : { transition: 'none' }),
      }}
    />
  ) : null;

  return { ref, thumb, ready: box !== null };
}

export function Segmented<T extends string>({
  items,
  value,
  onChange,
  label,
  className,
  size = 'sm',
}: {
  items: SegmentedItem<T>[];
  value: T;
  onChange: (key: T) => void;
  /** Read out by screen readers. */
  label: string;
  className?: string;
  size?: 'sm' | 'md';
}) {
  const { ref, thumb, ready } = useSlidingThumb(value);

  return (
    <div
      ref={ref}
      role="group"
      aria-label={label}
      className={cn('seg scrollbar-hide relative inline-flex max-w-full overflow-x-auto rounded-[10px] p-[3px]', className)}
      style={{ background: 'var(--pom-panel-2)', border: '1px solid var(--pom-border)' }}
    >
      {thumb}
      {items.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            aria-pressed={active}
            data-active={active}
            className={cn(
              'seg-item inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[7px] font-medium',
              size === 'md' ? 'px-3.5 py-1.5 text-[13px]' : 'px-2.5 py-1.5 text-xs',
              active ? 'font-semibold' : 'muted hover:text-[var(--pom-text)]',
            )}
            style={
              active
                ? { color: 'var(--pom-text)', ...(ready ? {} : { background: 'var(--pom-panel)', boxShadow: 'var(--pom-shadow-xs)' }) }
                : undefined
            }
          >
            {t.icon}
            {t.label}
            {t.count !== undefined ? (
              <span
                className="tabular-nums"
                style={t.alert && t.count > 0 ? { color: 'var(--pom-warn)', fontWeight: 700 } : { opacity: 0.7 }}
              >
                {t.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
