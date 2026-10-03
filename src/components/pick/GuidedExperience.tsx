'use client';

import * as React from 'react';
import { buttonClasses } from '@/components/ui/Button';
import type { PickResults } from './api';
import { BackButton, useTopOnStep, PickCard, PickErrorNote, Progress, RestartRow, SeelieMark, stagger, Thinking } from './parts';
import { QuestionStep } from './QuestionStep';
import type { PickJourney } from './usePickJourney';

/**
 * Guided: one question a screen, chosen with a tap, and three picks at the end.
 * The quickest of the three, and the closest to a classic shop quiz, except that
 * Seelie writes every question and its options for the answers so far.
 */
export function GuidedExperience({ journey }: { journey: PickJourney }) {
  const { step, loading, error, answered } = journey;
  useTopOnStep(`${answered.length}-${loading}-${step?.kind}`, journey.started);

  if (!journey.started) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center px-5 pb-20 pt-14 text-center md:pt-24">
        <SeelieMark className="pb-step-in h-12 w-12 [&_img]:h-8 [&_img]:w-8" />
        <p className="pb-step-in text-eyebrow mt-6 text-[hsl(var(--pb-rose-deep))]" style={stagger(60)}>
          Find Your Pick
        </p>
        <h1
          className="pb-step-in mt-3 font-display text-[2.6rem] font-light italic leading-[1.04] text-[hsl(var(--pb-ink))] md:text-[3.5rem]"
          style={stagger(120)}
        >
          Let&rsquo;s find the one for you.
        </h1>
        <p className="pb-step-in mt-5 max-w-md text-[0.98rem] leading-relaxed text-[hsl(var(--pb-ink-muted))]" style={stagger(200)}>
          A few quick questions, and Seelie, our AI stylist, picks the pieces from our collection that suit you best.
        </p>
        <button
          type="button"
          onClick={() => journey.start()}
          className={buttonClasses({ size: 'lg', className: 'pb-step-in mt-9 min-w-[14rem]' })}
          style={stagger(280)}
        >
          Begin
        </button>
        <p className="pb-step-in mt-4 text-xs text-[hsl(var(--pb-ink-faint))]" style={stagger(340)}>
          Takes about a minute
        </p>
      </div>
    );
  }

  const total = step?.kind === 'question' ? step.total : answered[answered.length - 1]?.step.total ?? 4;
  const results = !loading && !error && step?.kind === 'picks' ? (step as PickResults) : null;

  return (
    <div className="mx-auto max-w-4xl px-5 pb-20 pt-6 md:pt-10">
      {!results && (
        <div className="flex h-9 items-center justify-between gap-4">
          {answered.length > 0 ? <BackButton onClick={journey.back} /> : <BackButton onClick={journey.restart} label="Start" />}
          <Progress done={answered.length} total={total} />
        </div>
      )}

      <div className="mt-8 md:mt-12">
        {error ? (
          <PickErrorNote message={error} onRetry={journey.retry} onBack={answered.length ? journey.back : undefined} />
        ) : loading ? (
          <Thinking cards={answered.length ? 4 : 3} />
        ) : results ? (
          <GuidedResults results={results} onRestart={journey.restart} onBack={journey.back} />
        ) : step?.kind === 'question' ? (
          <QuestionStep key={`${answered.length}-${step.question}`} question={step} onAnswer={journey.answer} columns="grid-cols-2 md:grid-cols-4" />
        ) : null}
      </div>
    </div>
  );
}

function GuidedResults({ results, onRestart, onBack }: { results: PickResults; onRestart: () => void; onBack: () => void }) {
  return (
    <div>
      <div className="flex flex-col items-center text-center">
        <SeelieMark className="pb-step-in" />
        <p className="pb-step-in text-eyebrow mt-5 text-[hsl(var(--pb-rose-deep))]" style={stagger(60)}>
          Seelie&rsquo;s picks for you
        </p>
        <h1
          className="pb-step-in mt-3 font-display text-[2.6rem] font-light italic leading-[1.04] text-[hsl(var(--pb-ink))] md:text-[3.5rem]"
          style={stagger(120)}
        >
          {results.title ?? 'Your Picks'}
        </h1>
        <p className="pb-step-in mt-4 max-w-lg text-[0.98rem] leading-relaxed text-[hsl(var(--pb-ink-muted))]" style={stagger(180)}>
          {results.say}
        </p>
      </div>
      <div className="mx-auto mt-10 grid max-w-md gap-12 md:max-w-none md:grid-cols-3 md:gap-6">
        {results.picks.map((pick, i) => (
          <PickCard key={pick.product.id} pick={pick} index={i} delay={260 + i * 120} />
        ))}
      </div>
      <RestartRow onRestart={onRestart} className="mt-14" />
      <div className="mt-3 flex justify-center">
        <BackButton onClick={onBack} label="Change my last answer" />
      </div>
    </div>
  );
}
