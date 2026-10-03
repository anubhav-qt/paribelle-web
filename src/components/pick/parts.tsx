'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, ChevronLeft, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/image-url';
import { buttonClasses } from '@/components/ui/Button';
import { PriceTag } from '@/components/ui/PriceTag';
import type { PickOption, PickProduct, PickQuestion, PickResults } from './api';

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
      <Image src="/logo-mark.png" alt="" width={22} height={22} className="h-[22px] w-[22px] object-contain" />
    </span>
  );
}

/** Seelie's line before a question: the mark, its name, what it says. */
export function SeelieSays({ text, className, words }: { text: string; className?: string; words?: boolean }) {
  return (
    <div className={cn('flex items-start gap-3', className)} aria-live="polite">
      <SeelieMark className="mt-0.5" />
      <div className="min-w-0">
        <p className="text-eyebrow text-[hsl(var(--pb-rose-deep))]">Seelie</p>
        <p className="mt-1.5 text-[0.95rem] leading-relaxed text-[hsl(var(--pb-ink-muted))]">
          {words ? <WordByWord text={text} /> : text}
        </p>
      </div>
    </div>
  );
}

/** Text that arrives a word at a time, as if being written. */
export function WordByWord({ text, startMs = 0, stepMs = 38 }: { text: string; startMs?: number; stepMs?: number }) {
  return (
    <>
      {text.split(/(\s+)/).map((part, i) =>
        /^\s+$/.test(part) ? (
          part
        ) : (
          <span key={i} className="pb-word-in" style={stagger(startMs + (i / 2) * stepMs)}>
            {part}
          </span>
        )
      )}
    </>
  );
}

const THINKING = ['Looking through the collection', 'Matching cuts and colours', 'Choosing what to show you'];

/** While Seelie works out the next step: its mark, a moving line, and the shape of the options to come. */
export function Thinking({ cards = 3 }: { cards?: number }) {
  const [i, setI] = React.useState(0);
  React.useEffect(() => {
    const t = window.setInterval(() => setI((n) => (n + 1) % THINKING.length), 2200);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div className="pb-step-in" role="status">
      <div className="flex items-center gap-3">
        <SeelieMark />
        <p key={i} className="pb-step-in text-[0.95rem] text-[hsl(var(--pb-ink-muted))]">
          {THINKING[i]}
          <span className="pb-thinking ml-1 inline-flex gap-[3px] align-middle" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </p>
      </div>
      <div className="-mx-5 mt-8 flex gap-3 overflow-hidden px-5 md:mx-0 md:grid md:grid-cols-3 md:px-0" aria-hidden="true">
        {Array.from({ length: cards }, (_, n) => (
          <div
            key={n}
            className="aspect-[4/5] w-[64vw] shrink-0 animate-pulse rounded-[13px] bg-[hsl(var(--pb-linen)/0.7)] md:w-auto"
            style={{ animationDelay: `${n * 120}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Options                                                                    */
/* -------------------------------------------------------------------------- */

/** Whether a question reads best as photos (most options show a product) or as a list. */
export const isPhotoQuestion = (q: PickQuestion) => q.options.filter((o) => o.product?.image).length * 2 >= q.options.length;

function SelectedMark({ on, className }: { on: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-[background-color,border-color,transform] duration-300 ease-pb',
        on
          ? 'scale-100 border-[hsl(var(--pb-rose))] bg-[hsl(var(--pb-rose))] text-white'
          : 'scale-90 border-[hsl(var(--pb-ink)/0.25)] bg-white/70 text-transparent',
        className
      )}
    >
      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
    </span>
  );
}

export function PhotoOption({
  option,
  selected,
  onClick,
  sizes,
  className,
  style,
}: {
  option: PickOption;
  selected: boolean;
  onClick: () => void;
  sizes: string;
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
        'pb-press group relative block w-full overflow-hidden rounded-[13px] bg-[hsl(var(--pb-blush-wash))] text-left',
        'outline-none ring-offset-2 ring-offset-[hsl(var(--pb-ivory))] transition-shadow duration-300 focus-visible:ring-2 focus-visible:ring-[hsl(var(--pb-rose))]',
        selected && 'ring-2 ring-[hsl(var(--pb-rose))]',
        className
      )}
    >
      <div className="relative aspect-[4/5]">
        {image ? (
          <>
            <Image
              src={image}
              alt=""
              fill
              sizes={sizes}
              quality={80}
              className="object-cover object-top transition-transform duration-700 ease-pb group-hover:scale-[1.03]"
            />
            <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-[hsl(var(--pb-ink)/0.78)] via-[hsl(var(--pb-ink)/0.25)] to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_0%,hsl(var(--pb-rose-mist)),transparent_70%)]" />
        )}
        <div className={cn('absolute inset-x-0 bottom-0 p-3.5 md:p-4', image ? 'text-white' : 'text-[hsl(var(--pb-ink))]')}>
          <p className="font-display text-[1.3rem] font-medium leading-[1.1] md:text-[1.45rem]">{option.label}</p>
          {option.detail && (
            <p className={cn('mt-1 text-[0.78rem] leading-snug', image ? 'text-white/80' : 'text-[hsl(var(--pb-ink-muted))]')}>
              {option.detail}
            </p>
          )}
        </div>
        <SelectedMark on={selected} className="absolute right-3 top-3" />
      </div>
    </button>
  );
}

export function TextOption({
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
      style={style}
      className={cn(
        'pb-press flex w-full items-center justify-between gap-4 rounded-[13px] border px-5 py-4 text-left outline-none',
        'transition-[background-color,border-color] duration-300 ease-pb focus-visible:ring-2 focus-visible:ring-[hsl(var(--pb-rose))]',
        selected
          ? 'border-[hsl(var(--pb-rose))] bg-[hsl(var(--pb-rose-mist)/0.7)]'
          : 'border-[hsl(var(--pb-linen))] bg-white/70 hover:border-[hsl(var(--pb-rose)/0.6)]',
        className
      )}
    >
      <span className="min-w-0">
        <span className="block font-display text-[1.4rem] font-medium leading-tight text-[hsl(var(--pb-ink))]">{option.label}</span>
        {option.detail && <span className="mt-0.5 block text-sm text-[hsl(var(--pb-ink-muted))]">{option.detail}</span>}
      </span>
      <SelectedMark on={selected} />
    </button>
  );
}

/**
 * The shopper's choice on a question: a tap answers a single-choice question
 * (after a beat, so the selection is seen); a multi-choice one collects taps
 * until Continue.
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
    timer.current = window.setTimeout(() => onAnswer([id]), 320);
  };
  const submitText = (text: string) => onAnswer(picked, text);
  return { picked, toggle, submitText, confirm: () => onAnswer(picked) };
}

/** "Or tell Seelie": the shopper's own words, sent with whatever they've tapped. */
export function OwnWords({ onSubmit, placeholder, className }: { onSubmit: (text: string) => void; placeholder?: string; className?: string }) {
  const [text, setText] = React.useState('');
  return (
    <form
      className={cn('flex items-stretch gap-2', className)}
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) onSubmit(text.trim());
      }}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={300}
        placeholder={placeholder ?? 'Or tell Seelie in your own words'}
        aria-label="Tell Seelie in your own words"
        className="h-12 min-w-0 flex-1 rounded-sm border border-[hsl(var(--pb-linen))] bg-white/80 px-4 text-[0.95rem] text-[hsl(var(--pb-ink))] outline-none transition-colors placeholder:text-[hsl(var(--pb-ink-faint))] focus:border-[hsl(var(--pb-rose))]"
      />
      <button
        type="submit"
        disabled={!text.trim()}
        aria-label="Send"
        className={buttonClasses({ variant: 'secondary', className: 'h-12 w-12 shrink-0 px-0' })}
      >
        <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}

export function BackButton({ onClick, label = 'Back' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="-ml-1 inline-flex h-9 items-center gap-1 rounded-sm px-1 text-sm text-[hsl(var(--pb-ink-muted))] transition-colors hover:text-[hsl(var(--pb-ink))]"
    >
      <ChevronLeft className="h-4 w-4" />
      {label}
    </button>
  );
}

export function PickErrorNote({ message, onRetry, onBack }: { message: string; onRetry: () => void; onBack?: () => void }) {
  return (
    <div className="pb-step-in rounded-[13px] border border-[hsl(var(--pb-linen))] bg-white/70 p-6">
      <div className="flex items-start gap-3">
        <SeelieMark />
        <p className="text-[0.95rem] leading-relaxed text-[hsl(var(--pb-ink))]">{message}</p>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" onClick={onRetry} className={buttonClasses({ size: 'md' })}>
          Try again
        </button>
        {onBack && (
          <button type="button" onClick={onBack} className={buttonClasses({ variant: 'ghost', size: 'md' })}>
            Go back
          </button>
        )}
        <Link href="/category/kurtis" className={buttonClasses({ variant: 'ghost', size: 'md' })}>
          Browse the shop
        </Link>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Picks                                                                      */
/* -------------------------------------------------------------------------- */

const productHref = (p: PickProduct) => `/products/${p.slug}`;

export function PickImage({ product, sizes, priority, className }: { product: PickProduct; sizes: string; priority?: boolean; className?: string }) {
  return (
    <div className={cn('relative aspect-[4/5] overflow-hidden rounded-[13px] bg-[hsl(var(--pb-blush-wash))]', className)}>
      {product.image && (
        <Image
          src={getImageUrl(product.image)}
          alt={product.name}
          fill
          sizes={sizes}
          priority={priority}
          quality={85}
          className="object-cover object-top transition-transform duration-700 ease-pb group-hover:scale-[1.03]"
        />
      )}
    </div>
  );
}

/** One pick as a card: photo, name and price, why it suits them, a styling note, and the way to it. */
export function PickCard({ pick, index, delay }: { pick: PickResults['picks'][number]; index: number; delay: number }) {
  return (
    <article className="pb-step-in group" style={stagger(delay)}>
      <Link href={productHref(pick.product)} className="block">
        <PickImage product={pick.product} sizes="(max-width: 767px) 90vw, 320px" priority={index === 0} />
        <h3 className="mt-4 flex items-baseline gap-2.5 font-display text-[1.45rem] font-medium leading-tight text-[hsl(var(--pb-ink))]">
          <span className="shrink-0 font-light italic text-[hsl(var(--pb-rose-deep))]">{String(index + 1).padStart(2, '0')}</span>
          <span>{pick.product.name}</span>
        </h3>
      </Link>
      <PriceTag price={pick.product.price} compareAtPrice={pick.product.mrp ?? undefined} size="sm" className="mt-1.5" />
      <p className="mt-3 font-display text-[1.1rem] italic leading-snug text-[hsl(var(--pb-rose-ink))]">&ldquo;{pick.why}&rdquo;</p>
      {pick.styling && (
        <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--pb-ink-muted))]">
          <span className="text-eyebrow mr-2 text-[hsl(var(--pb-ink-faint))]">Style it</span>
          {pick.styling}
        </p>
      )}
      <Link href={productHref(pick.product)} className={buttonClasses({ size: 'md', fullWidth: true, className: 'mt-5' })}>
        View this piece
      </Link>
    </article>
  );
}

export function RestartRow({ onRestart, className }: { onRestart: () => void; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-2', className)}>
      <button type="button" onClick={onRestart} className={buttonClasses({ variant: 'ghost', size: 'md' })}>
        <RotateCcw className="h-4 w-4" />
        Start again
      </button>
      <Link href="/category/kurtis" className={buttonClasses({ variant: 'gold-outline', size: 'md' })}>
        Browse everything
      </Link>
    </div>
  );
}
