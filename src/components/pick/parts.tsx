'use client';

import * as React from 'react';
import Image from 'next/image';
import { ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/image-url';
import { buttonClasses } from '@/components/ui/Button';
import type { PickOption, PickQuestion } from './api';

type Style = React.CSSProperties & Record<`--${string}`, string>;
/** A staggered entrance: `pb-step-in` with this many ms of delay. */
export const stagger = (ms: number): Style => ({ '--d': `${ms}ms` });

/* -------------------------------------------------------------------------- */
/* Seelie                                                                     */
/* -------------------------------------------------------------------------- */

export function SeelieMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'relative inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[hsl(var(--pb-rose-mist))] ring-1 ring-[hsl(var(--pb-rose)/0.35)]',
        className
      )}
    >
      <Image src="/logo-mark.png" alt="" width={20} height={20} className="h-5 w-5 object-contain" />
    </span>
  );
}

/** Seelie's one line: the mark and what it says. */
export function SeelieLine({ text, className }: { text: string; className?: string }) {
  if (!text) return null;
  return (
    <div className={cn('flex items-center gap-3', className)} aria-live="polite">
      <SeelieMark />
      <p className="text-[0.95rem] leading-snug text-[hsl(var(--pb-ink-muted))]">{text}</p>
    </div>
  );
}

/** While Seelie works out the next step: its mark, three breathing dots, and the shape of what's coming. */
export function Thinking({ photos }: { photos: boolean }) {
  return (
    <div role="status" aria-label="Seelie is thinking">
      <div className="flex items-center gap-3">
        <SeelieMark />
        <span className="pb-thinking inline-flex gap-[4px]" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </div>
      <div className="mt-6 h-9 w-2/3 max-w-md animate-pulse rounded-sm bg-[hsl(var(--pb-linen)/0.8)]" />
      {photos ? (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6" aria-hidden="true">
          {[0, 1, 2].map((n) => (
            <div key={n} className="aspect-[4/5] animate-pulse bg-[hsl(var(--pb-linen)/0.7)]" style={{ animationDelay: `${n * 120}ms` }} />
          ))}
        </div>
      ) : (
        <div className="mt-8 flex flex-wrap gap-2.5" aria-hidden="true">
          {[96, 120, 140, 104].map((w, n) => (
            <div key={n} className="h-11 animate-pulse rounded-full bg-[hsl(var(--pb-linen)/0.8)]" style={{ width: w, animationDelay: `${n * 100}ms` }} />
          ))}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Options                                                                    */
/* -------------------------------------------------------------------------- */

/** Whether a question reads best as photos (most options show a product) or as chips. */
export const isPhotoQuestion = (q: PickQuestion) => q.options.filter((o) => o.product?.image).length * 2 >= q.options.length;

/**
 * A photo option, in the storefront's own card: a print on a blush mat with its
 * caption beneath. Choosing it rings the mat; nothing moves on hover.
 */
export function PhotoOption({
  option,
  selected,
  onClick,
  className,
  style,
}: {
  option: PickOption;
  selected: boolean;
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const image = option.product?.image ? getImageUrl(option.product.image) : null;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={style}
      className={cn(
        'pb-press block w-full bg-[hsl(var(--pb-blush-wash))] p-3 pb-3.5 text-left shadow-pb-sm outline-none transition-shadow duration-300 hover:shadow-pb-lg',
        'focus-visible:ring-2 focus-visible:ring-[hsl(var(--pb-rose))] max-md:p-0 max-md:pb-0 max-md:bg-transparent max-md:shadow-none',
        selected && 'ring-2 ring-[hsl(var(--pb-rose))] ring-offset-2 ring-offset-[hsl(var(--pb-ivory))] max-md:ring-offset-0',
        className
      )}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-[hsl(var(--pb-shell))] max-md:rounded-[13px]">
        {image && <Image src={image} alt="" fill sizes="(max-width: 767px) 46vw, 300px" quality={80} className="object-cover object-top" />}
        <span
          aria-hidden="true"
          className={cn(
            'absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full transition-opacity duration-200',
            selected ? 'bg-[hsl(var(--pb-rose))] text-white opacity-100' : 'opacity-0'
          )}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
      </div>
      <p className="mt-2.5 px-0.5 font-display text-[1.15rem] leading-tight text-[hsl(var(--pb-ink))] max-md:mt-2">{option.label}</p>
      {option.detail && <p className="mt-0.5 px-0.5 text-xs text-[hsl(var(--pb-ink-muted))]">{option.detail}</p>}
    </button>
  );
}

/** A plain option: a chip, like the shop's filter chips. */
export function ChipOption({
  option,
  selected,
  onClick,
  className,
  style,
}: {
  option: PickOption;
  selected: boolean;
  onClick: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      title={option.detail ?? undefined}
      style={style}
      className={cn(
        'pb-press inline-flex min-h-11 items-center gap-2 rounded-full border px-5 py-2 text-[0.95rem] outline-none transition-colors duration-200',
        'focus-visible:ring-2 focus-visible:ring-[hsl(var(--pb-rose))] focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--pb-ivory))]',
        selected
          ? 'border-[hsl(var(--pb-rose))] bg-[hsl(var(--pb-rose))] text-white'
          : 'border-[hsl(var(--pb-linen))] bg-white/80 text-[hsl(var(--pb-ink))] hover:border-[hsl(var(--pb-rose)/0.6)]',
        className
      )}
    >
      {selected && <Check className="h-3.5 w-3.5" strokeWidth={2.5} />}
      {option.label}
    </button>
  );
}

/**
 * The shopper's choice on a question: a tap answers a single-choice question
 * (after a beat, so the selection is seen); a multi-choice one collects taps
 * until Continue. An option that needs specifying ("Someone else") waits for
 * their words instead.
 */
export function useChoice(question: PickQuestion, onAnswer: (picked: string[], text?: string) => void) {
  const [picked, setPicked] = React.useState<string[]>([]);
  const timer = React.useRef<number>();
  React.useEffect(() => {
    setPicked([]);
    return () => window.clearTimeout(timer.current);
  }, [question]);

  const toggle = (id: string) => {
    if (question.multi) {
      setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
      return;
    }
    setPicked([id]);
    window.clearTimeout(timer.current);
    if (question.options.find((o) => o.id === id)?.specify) return;
    timer.current = window.setTimeout(() => onAnswer([id]), 280);
  };
  const submitText = (text: string) => onAnswer(picked, text);
  const specifying = question.multi ? null : (question.options.find((o) => o.specify && picked.includes(o.id)) ?? null);
  return { picked, toggle, submitText, specifying, confirm: () => onAnswer(picked) };
}

/** The shopper's own words, sent with whatever they've tapped. */
export function OwnWords({
  onSubmit,
  placeholder,
  className,
  autoFocus,
}: {
  onSubmit: (text: string) => void;
  placeholder: string;
  className?: string;
  autoFocus?: boolean;
}) {
  const [text, setText] = React.useState('');
  return (
    <form
      className={cn('flex max-w-xl items-stretch gap-2', className)}
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) onSubmit(text.trim());
      }}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={300}
        autoFocus={autoFocus}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-12 min-w-0 flex-1 rounded-sm border border-[hsl(var(--pb-linen))] bg-white/80 px-4 text-[0.95rem] text-[hsl(var(--pb-ink))] outline-none transition-colors placeholder:text-[hsl(var(--pb-ink-faint))] focus:border-[hsl(var(--pb-rose))]"
      />
      <button type="submit" disabled={!text.trim()} aria-label="Send" className={buttonClasses({ size: 'md', className: 'h-12 w-12 shrink-0 px-0' })}>
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
