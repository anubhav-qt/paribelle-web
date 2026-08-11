'use client';

import { cn } from '@/lib/utils';

export interface DualRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  className?: string;
}

/**
 * Two native range inputs stacked on the same track — the standard way to
 * get a real, independently-draggable pair of thumbs without a slider
 * library. Each input keeps its own default (invisible) track; only its
 * thumb is clickable (`pointer-events` is `none` on the input and `auto`
 * on just the thumb pseudo-element), so a click anywhere between the
 * thumbs falls through to whichever input is on top rather than fighting
 * over the same hit area. The visible track and the filled bar between the
 * two handles are separate, purely decorative divs underneath both inputs.
 *
 * Each `onChange` clamps against the other handle so the low thumb can
 * never cross above the high one (native range inputs don't know about
 * each other) — same clamp for the reverse.
 */
export function DualRangeSlider({ min, max, step = 1, value, onChange, className }: DualRangeSliderProps) {
  const [low, high] = value;
  const span = Math.max(max - min, 1);
  const lowPct = ((low - min) / span) * 100;
  const highPct = ((high - min) / span) * 100;

  return (
    <div className={cn('relative h-5', className)}>
      <div className="pointer-events-none absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-[hsl(var(--pb-linen))]" />
      <div
        className="pointer-events-none absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-[hsl(var(--pb-rose))]"
        style={{ left: `${lowPct}%`, right: `${100 - highPct}%` }}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={low}
        onChange={(e) => onChange([Math.min(Number(e.target.value), high), high])}
        aria-label="Minimum price"
        className="pb-dual-range absolute inset-x-0 top-1/2 w-full -translate-y-1/2 appearance-none bg-transparent"
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={high}
        onChange={(e) => onChange([low, Math.max(Number(e.target.value), low)])}
        aria-label="Maximum price"
        className="pb-dual-range absolute inset-x-0 top-1/2 w-full -translate-y-1/2 appearance-none bg-transparent"
      />
    </div>
  );
}
