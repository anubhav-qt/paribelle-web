'use client';

import * as React from 'react';
import { ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { buttonClasses } from '@/components/ui/Button';
import { preparePhoto, type PickPhoto, type PickResults } from './api';
import { BackButton, useTopOnStep, PickCard, PickErrorNote, Progress, RestartRow, SeelieMark, SeelieSays, stagger, Thinking } from './parts';
import { QuestionStep } from './QuestionStep';
import type { PickJourney } from './usePickJourney';

/**
 * Photo-led: the shopper starts from a picture of a look they love. Seelie reads
 * it, says what it noticed, asks a question or two, and picks the closest pieces.
 * The photo stays beside every step (above it on a phone) as the brief.
 */
export function PhotoExperience({ journey }: { journey: PickJourney }) {
  const { step, loading, error, answered, photo, photoNotes } = journey;
  useTopOnStep(`${answered.length}-${loading}-${step?.kind}`, journey.started);
  const [reading, setReading] = React.useState(false);
  const [problem, setProblem] = React.useState<string | null>(null);

  const choose = async (file: File | undefined) => {
    if (!file) return;
    setProblem(null);
    if (!file.type.startsWith('image/')) {
      setProblem('That file isn’t a photo. Try a JPEG or PNG.');
      return;
    }
    setReading(true);
    try {
      journey.start(await preparePhoto(file));
    } catch {
      setProblem('That photo couldn’t be opened. Try another one.');
    } finally {
      setReading(false);
    }
  };

  if (!journey.started) return <PhotoIntro onChoose={choose} onSkip={() => journey.start(null)} busy={reading} problem={problem} />;

  const total = step?.kind === 'question' ? step.total : answered[answered.length - 1]?.step.total ?? 3;
  const results = !loading && !error && step?.kind === 'picks' ? (step as PickResults) : null;
  const firstRead = loading && answered.length === 0 && !!photo;

  return (
    <div className="mx-auto max-w-6xl px-5 pb-20 pt-6 md:pt-10">
      <div className={cn(photo && 'md:grid md:grid-cols-[minmax(0,320px)_1fr] md:gap-12 lg:gap-16')}>
        {photo && <YourLook photo={photo} notes={photoNotes} reading={firstRead} />}

        <div className="min-w-0">
          {!results && (
            <div className="mt-6 flex h-9 items-center justify-between gap-4 md:mt-0">
              {answered.length > 0 ? <BackButton onClick={journey.back} /> : <BackButton onClick={journey.restart} label="New photo" />}
              <Progress done={answered.length} total={total} />
            </div>
          )}
          <div className="mt-7 md:mt-10">
            {error ? (
              <PickErrorNote message={error} onRetry={journey.retry} onBack={answered.length ? journey.back : undefined} />
            ) : loading ? (
              <Thinking label={firstRead ? 'Looking at your photo' : undefined} cards={3} layout={firstRead ? 'none' : 'grid'} />
            ) : results ? (
              <PhotoResults results={results} hasPhoto={!!photo} onRestart={journey.restart} onBack={journey.back} />
            ) : step?.kind === 'question' ? (
              <QuestionStep key={`${answered.length}-${step.question}`} question={step} onAnswer={journey.answer} columns="grid-cols-2 lg:grid-cols-3" />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhotoIntro({
  onChoose,
  onSkip,
  busy,
  problem,
}: {
  onChoose: (file: File | undefined) => void;
  onSkip: () => void;
  busy: boolean;
  problem: string | null;
}) {
  const [dragging, setDragging] = React.useState(false);
  return (
    <div className="mx-auto grid max-w-5xl items-center gap-10 px-5 pb-20 pt-10 md:grid-cols-2 md:gap-16 md:pt-20">
      <div className="text-center md:text-left">
        <p className="pb-step-in text-eyebrow text-[hsl(var(--pb-rose-deep))]">Find Your Pick</p>
        <h1
          className="pb-step-in mt-3 font-display text-[2.6rem] font-light italic leading-[1.04] text-[hsl(var(--pb-ink))] md:text-[3.4rem]"
          style={stagger(80)}
        >
          Start from a look you love.
        </h1>
        <p className="pb-step-in mx-auto mt-5 max-w-md text-[0.98rem] leading-relaxed text-[hsl(var(--pb-ink-muted))] md:mx-0" style={stagger(160)}>
          A screenshot from Instagram, a photo from a wedding, a picture of your favourite kurti. Seelie, our AI
          stylist, finds the closest pieces in our collection, then asks a question or two to get it right.
        </p>
      </div>

      <div className="pb-step-in" style={stagger(220)}>
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            onChoose(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            'relative mx-auto flex aspect-[4/5] w-full max-w-sm cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[13px] border border-dashed px-8 text-center transition-colors duration-300',
            dragging
              ? 'border-[hsl(var(--pb-rose))] bg-[hsl(var(--pb-rose-mist))]'
              : 'border-[hsl(var(--pb-rose)/0.45)] bg-[hsl(var(--pb-blush-wash)/0.7)] hover:bg-[hsl(var(--pb-blush-wash))]',
            busy && 'pb-scan pointer-events-none'
          )}
        >
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => onChoose(e.target.files?.[0])} disabled={busy} />
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/80 text-[hsl(var(--pb-rose-deep))] shadow-pb-sm">
            <ImagePlus className="h-6 w-6" strokeWidth={1.5} />
          </span>
          <p className="mt-5 font-display text-[1.6rem] italic leading-tight text-[hsl(var(--pb-ink))]">
            {busy ? 'Opening your photo' : 'Add a photo'}
          </p>
          <p className="mt-2 text-sm text-[hsl(var(--pb-ink-muted))]">From your gallery or camera</p>
          <span className={buttonClasses({ size: 'md', className: 'pointer-events-none mt-6' })}>Choose a photo</span>
        </label>
        {problem && <p className="mt-3 text-center text-sm text-[hsl(var(--pb-danger))]">{problem}</p>}
        <p className="mt-5 text-center text-sm text-[hsl(var(--pb-ink-muted))]">
          No photo handy?{' '}
          <button type="button" onClick={onSkip} className="text-[hsl(var(--pb-rose-deep))] underline underline-offset-4 hover:text-[hsl(var(--pb-rose-ink))]">
            Start with a look instead
          </button>
        </p>
        <p className="mt-2 text-center text-xs text-[hsl(var(--pb-ink-faint))]">Your photo is only used to find your pick. We don&rsquo;t keep it.</p>
      </div>
    </div>
  );
}

/** The shopper's photo as the brief: big and sticky beside the steps, compact above them on a phone. */
function YourLook({ photo, notes, reading }: { photo: PickPhoto; notes: string | null; reading: boolean }) {
  return (
    <aside className="md:sticky md:top-[96px] md:self-start">
      {/* Phone: a small print and what Seelie saw. */}
      <div className="pb-step-in flex items-center gap-4 md:hidden">
        <div className={cn('relative h-24 w-[4.8rem] shrink-0 overflow-hidden rounded-[10px] bg-[hsl(var(--pb-blush-wash))] shadow-pb-sm', reading && 'pb-scan')}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.preview} alt="Your photo" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="text-eyebrow text-[hsl(var(--pb-ink-faint))]">Your look</p>
          <p className="mt-1.5 line-clamp-3 font-display text-[1.05rem] italic leading-snug text-[hsl(var(--pb-ink))]">
            {notes ?? (reading ? 'Seelie is taking a look…' : 'Your photo')}
          </p>
        </div>
      </div>

      {/* Desktop: the photo as a print, with Seelie's notes under it. */}
      <div className="hidden md:block">
        <div className="pb-step-in rotate-[-1.5deg] bg-white p-3 pb-4 shadow-pb-lg">
          <div className={cn('relative aspect-[4/5] overflow-hidden bg-[hsl(var(--pb-blush-wash))]', reading && 'pb-scan')}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.preview} alt="Your photo" className="h-full w-full object-cover" />
          </div>
          <p className="mt-3 text-center font-display text-lg italic text-[hsl(var(--pb-ink-muted))]">Your look</p>
        </div>
        {notes && (
          <div className="pb-step-in mt-8" style={stagger(120)}>
            <SeelieSays text={notes} />
          </div>
        )}
      </div>
    </aside>
  );
}

function PhotoResults({ results, hasPhoto, onRestart, onBack }: { results: PickResults; hasPhoto: boolean; onRestart: () => void; onBack: () => void }) {
  return (
    <div>
      <SeelieMark className="pb-step-in" />
      <p className="pb-step-in text-eyebrow mt-5 text-[hsl(var(--pb-rose-deep))]" style={stagger(60)}>
        {hasPhoto ? 'Closest to your look' : 'Seelie’s picks for you'}
      </p>
      <h1
        className="pb-step-in mt-3 font-display text-[2.4rem] font-light italic leading-[1.04] text-[hsl(var(--pb-ink))] md:text-[3.2rem]"
        style={stagger(120)}
      >
        {results.title ?? 'Your Picks'}
      </h1>
      <p className="pb-step-in mt-4 max-w-xl text-[0.98rem] leading-relaxed text-[hsl(var(--pb-ink-muted))]" style={stagger(180)}>
        {results.say}
      </p>
      <div className="mt-10 grid gap-12 sm:grid-cols-2 md:gap-6 lg:grid-cols-3">
        {results.picks.map((pick, i) => (
          <PickCard key={pick.product.id} pick={pick} index={i} delay={260 + i * 120} />
        ))}
      </div>
      <RestartRow onRestart={onRestart} className="mt-14 md:justify-start" />
      <div className="mt-3 flex justify-center md:justify-start">
        <BackButton onClick={onBack} label="Change my last answer" />
      </div>
    </div>
  );
}
