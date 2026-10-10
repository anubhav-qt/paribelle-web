'use client';

import * as React from 'react';
import Link from 'next/link';
import { ChevronLeft, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { buttonClasses } from '@/components/ui/Button';
import { PriceTag } from '@/components/ui/PriceTag';
import { ProductCardShell } from '@/components/product/ProductCardShell';
import { useWishlist } from '@/contexts/WishlistContext';
import type { PickQuestion, PickResults } from './api';
import { ChipOption, isPhotoQuestion, OwnWords, PhotoOption, SeelieLine, stagger, Thinking, useChoice } from './parts';
import type { AnsweredTurn, PickJourney } from './usePickJourney';

/**
 * Find Your Pick, one question at a time: Seelie's line, the question, and the
 * answers as the shop's own cards (photos) or chips. What's been answered sits
 * above as chips that go back to that question. It ends in the shopper's edit,
 * shown as the storefront's product cards with Seelie's reason under each.
 */
export function PickFlow({ journey }: { journey: PickJourney }) {
  const { step, loading, error, answered } = journey;
  const results = !loading && !error && step?.kind === 'picks' ? step : null;
  const question = !loading && !error && step?.kind === 'question' ? step : null;
  const top = React.useRef<HTMLDivElement>(null);

  // The session opens on its first question, no intro to tap through. (A second
  // run, as in development's strict mode, just replaces the first request.)
  const { start } = journey;
  React.useEffect(() => {
    void start();
  }, [start]);

  // Each new step starts at the top of the screen.
  React.useEffect(() => {
    if (answered.length === 0 && !results) return;
    top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [answered.length, results]);

  return (
    <div ref={top} className="mx-auto max-w-[1100px] scroll-mt-24 px-4 pb-20 pt-6 md:px-8">
      <div className="flex items-center justify-between gap-4">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Find Your Pick' }]} />
        {(answered.length > 0 || results) && (
          <button
            type="button"
            onClick={journey.restart}
            className="inline-flex shrink-0 items-center gap-1.5 text-xs text-[hsl(var(--pb-rose-deep))] hover:underline"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Start over
          </button>
        )}
      </div>

      {results ? (
        <Results results={results} onBack={() => journey.back()} onRestart={journey.restart} />
      ) : (
        <>
          <Progress done={answered.length} total={question?.total ?? 6} />
          {answered.length > 0 && <AnsweredChips answered={answered} onPick={journey.goTo} />}
          <div className="mt-8 md:mt-10">
            {error ? (
              <ErrorNote message={error} onRetry={journey.retry} onBack={answered.length ? () => journey.back() : undefined} />
            ) : question ? (
              <Question key={`${answered.length}-${question.question}`} question={question} onAnswer={journey.answer} onBack={answered.length ? () => journey.back() : undefined} />
            ) : (
              <Thinking photos={answered.length > 0} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Progress({ done, total }: { done: number; total: number }) {
  return (
    <div className="mt-5 h-[3px] overflow-hidden rounded-full bg-[hsl(var(--pb-linen))]" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={done}>
      <div
        className="h-full rounded-full bg-[hsl(var(--pb-rose))] transition-[width] duration-500 ease-pb"
        style={{ width: `${Math.max(6, Math.min(100, ((done + 0.5) / total) * 100))}%` }}
      />
    </div>
  );
}

/** What they've said so far, one chip per answer; a tap goes back to that question. */
function AnsweredChips({ answered, onPick }: { answered: AnsweredTurn[]; onPick: (index: number) => void }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {answered.map((turn, i) => {
        const chosen = turn.step.options.filter((o) => turn.picked.includes(o.id) && !(o.specify && turn.text)).map((o) => o.label);
        const label = [...chosen, turn.text].filter(Boolean).join(', ');
        return (
          <button
            key={i}
            type="button"
            onClick={() => onPick(i)}
            title={`Change: ${turn.step.question}`}
            className="max-w-[16rem] truncate rounded-sm border border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-rose-mist)/0.6)] px-3 py-1 text-xs text-[hsl(var(--pb-rose-ink))] transition-colors hover:border-[hsl(var(--pb-rose))]"
          >
            {label || 'Skipped'}
          </button>
        );
      })}
    </div>
  );
}

function Question({ question, onAnswer, onBack }: { question: PickQuestion; onAnswer: (picked: string[], text?: string) => void; onBack?: () => void }) {
  const { picked, toggle, submitText, specifying, confirm } = useChoice(question, onAnswer);
  const [typing, setTyping] = React.useState(false);
  const photos = isPhotoQuestion(question);

  return (
    <div>
      <SeelieLine text={question.say} className="pb-step-in" />
      <h1 className="pb-step-in mt-5 max-w-3xl font-display text-[2rem] leading-[1.1] text-[hsl(var(--pb-ink))] md:text-[2.75rem]" style={stagger(80)}>
        {question.question}
      </h1>
      {question.hint && (
        <p className="pb-step-in mt-2 text-sm text-[hsl(var(--pb-ink-faint))]" style={stagger(120)}>
          {question.hint}
        </p>
      )}

      {photos ? (
        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {question.options.map((option, i) => (
            <PhotoOption
              key={option.id}
              option={option}
              selected={picked.includes(option.id)}
              onClick={() => toggle(option.id)}
              className="pb-step-in"
              style={stagger(160 + i * 60)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-8 flex max-w-3xl flex-wrap gap-2.5">
          {question.options.map((option, i) => (
            <ChipOption
              key={option.id}
              option={option}
              selected={picked.includes(option.id)}
              onClick={() => toggle(option.id)}
              className="pb-step-in"
              style={stagger(160 + i * 50)}
            />
          ))}
        </div>
      )}

      {specifying && <OwnWords key={specifying.id} onSubmit={submitText} placeholder={specifying.detail ?? 'Tell Seelie more'} autoFocus className="pb-step-in mt-5" />}

      {question.multi && (
        <button
          type="button"
          disabled={picked.length === 0}
          onClick={confirm}
          className={buttonClasses({ size: 'lg', className: 'mt-8 w-full sm:w-auto sm:min-w-[14rem]' })}
        >
          Continue
        </button>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
        {onBack && (
          <button type="button" onClick={onBack} className="-ml-1 inline-flex items-center gap-1 text-[hsl(var(--pb-ink-muted))] hover:text-[hsl(var(--pb-ink))]">
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        )}
        {!specifying && !typing && (
          <button type="button" onClick={() => setTyping(true)} className="text-[hsl(var(--pb-rose-deep))] hover:underline">
            Rather type it?
          </button>
        )}
      </div>
      {!specifying && typing && <OwnWords onSubmit={submitText} placeholder="Tell Seelie in your own words" autoFocus className="mt-3" />}
    </div>
  );
}

function ErrorNote({ message, onRetry, onBack }: { message: string; onRetry: () => void; onBack?: () => void }) {
  return (
    <div className="pb-step-in max-w-xl">
      <SeelieLine text={message} />
      <div className="mt-6 flex flex-wrap gap-2">
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

function Results({ results, onBack, onRestart }: { results: PickResults; onBack: () => void; onRestart: () => void }) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  return (
    <div className="mt-8 md:mt-10">
      <p className="pb-step-in text-eyebrow text-[hsl(var(--pb-rose-deep))]">Your edit, by Seelie</p>
      <h1 className="pb-step-in mt-2 font-display text-[2.4rem] leading-[1.05] text-[hsl(var(--pb-ink))] md:text-[3.25rem]" style={stagger(80)}>
        {results.title ?? 'Your Picks'}
      </h1>
      <SeelieLine text={results.say} className="pb-step-in mt-4 max-w-2xl" />

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-6">
        {results.picks.map((pick, i) => {
          const p = pick.product;
          const image = p.image || '/placeholder-image.svg';
          return (
            <div key={p.id} className={cn('pb-step-in', i === 0 && results.picks.length === 3 && 'max-sm:col-span-2')} style={stagger(240 + i * 90)}>
              <ProductCardShell
                href={`/products/${p.slug}`}
                name={p.name}
                image={image}
                wishlisted={isInWishlist(p.id)}
                onToggleWishlist={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleWishlist({ productId: p.id, name: p.name, slug: p.slug, price: p.price, image, addedAt: Date.now() });
                }}
              >
                <h3 className="line-clamp-2 font-display text-[1.05rem] leading-tight text-[hsl(var(--pb-ink))]">{p.name}</h3>
                <PriceTag price={p.price} compareAtPrice={p.mrp ?? undefined} className="mt-1.5" />
                {pick.why && <p className="mt-2 text-[0.85rem] italic leading-snug text-[hsl(var(--pb-rose-ink))]">{pick.why}</p>}
              </ProductCardShell>
            </div>
          );
        })}
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onRestart} className={buttonClasses({ variant: 'ghost', size: 'md' })}>
          <RotateCcw className="h-4 w-4" />
          Start again
        </button>
        <button type="button" onClick={onBack} className={buttonClasses({ variant: 'ghost', size: 'md' })}>
          <ChevronLeft className="h-4 w-4" />
          Change my last answer
        </button>
        <Link href="/category/kurtis" className={buttonClasses({ variant: 'gold-outline', size: 'md' })}>
          Browse everything
        </Link>
      </div>
    </div>
  );
}
