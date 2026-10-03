'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/image-url';
import { buttonClasses } from '@/components/ui/Button';
import { PriceTag } from '@/components/ui/PriceTag';
import { useHeroSectionImages } from '@/hooks/useStorefrontData';
import { resolveHeroImageUrl } from '@/lib/heroSectionImages';
import type { PickQuestion, PickResults } from './api';
import {
  BackButton,
  isPhotoQuestion,
  OwnWords,
  PhotoOption,
  PickCard,
  PickErrorNote,
  PickImage,
  RestartRow,
  SeelieMark,
  SeelieSays,
  stagger,
  TextOption,
  Thinking,
  useChoice,
  WordByWord,
} from './parts';
import type { AnsweredTurn, PickJourney } from './usePickJourney';

/**
 * Stylist session: the journey as a conversation that stays on the page. Seelie's
 * lines arrive as if written, each answer settles into the story above, and the
 * pieces chosen along the way pin themselves to an edit board, so the look takes
 * shape before the reveal: a named edit, its lead piece as a spread, two more
 * beside it.
 */
export function StylistExperience({ journey }: { journey: PickJourney }) {
  const { step, loading, error, answered } = journey;
  const currentRef = React.useRef<HTMLDivElement>(null);
  const board = boardItems(answered);
  const results = !loading && !error && step?.kind === 'picks' ? (step as PickResults) : null;

  // Each new step (and the wait for it) is brought up to where the reader is.
  React.useEffect(() => {
    if (!journey.started || answered.length === 0) return;
    currentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [journey.started, answered.length, loading, results]);

  if (!journey.started) return <StylistIntro onStart={() => journey.start()} />;

  if (results) {
    return (
      <div ref={currentRef} className="scroll-mt-[88px]">
        <StylistReveal results={results} board={board} onRestart={journey.restart} onBack={journey.back} />
      </div>
    );
  }

  return (
    <div className={cn('mx-auto max-w-6xl px-5 pt-8 md:pt-12', board.length ? 'pb-40 lg:pb-24' : 'pb-24')}>
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-16">
        <div className="min-w-0">
          <p className="text-eyebrow text-[hsl(var(--pb-rose-deep))]">A styling session with Seelie</p>

          <ol className="mt-6 space-y-10">
            {answered.map((turn, i) => (
              <Chapter key={i} turn={turn} />
            ))}
          </ol>

          <div ref={currentRef} className={cn('scroll-mt-[88px]', answered.length && 'mt-10 border-t border-[hsl(var(--pb-linen))] pt-10')}>
            {error ? (
              <PickErrorNote message={error} onRetry={journey.retry} onBack={answered.length ? journey.back : undefined} />
            ) : loading ? (
              <Thinking layout="rail" cards={3} />
            ) : step?.kind === 'question' ? (
              <CurrentTurn key={`${answered.length}-${step.question}`} question={step} onAnswer={journey.answer} onBack={answered.length ? journey.back : undefined} />
            ) : null}
          </div>
        </div>

        <EditBoard items={board} />
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function StylistIntro({ onStart }: { onStart: () => void }) {
  const { data: hero } = useHeroSectionImages();
  const photos = hero ? [hero.pink, hero.main, hero.black].map((s) => resolveHeroImageUrl(s.url, getImageUrl)) : [];
  return (
    <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 md:grid-cols-[1fr_1.05fr] md:gap-16 md:pt-20">
      <div className="text-center md:text-left">
        <p className="pb-step-in text-eyebrow text-[hsl(var(--pb-rose-deep))]">Find Your Pick</p>
        <h1
          className="pb-step-in mt-3 font-display text-[2.7rem] font-light italic leading-[1.02] text-[hsl(var(--pb-ink))] md:text-[4rem]"
          style={stagger(80)}
        >
          A styling session, <span className="text-[hsl(var(--pb-rose-deep))]">just for you.</span>
        </h1>
        <p className="pb-step-in mx-auto mt-5 max-w-md text-[0.98rem] leading-relaxed text-[hsl(var(--pb-ink-muted))] md:mx-0" style={stagger(160)}>
          Tell Seelie, our AI stylist, where you&rsquo;re headed and what you love. It puts together an edit from our
          collection as you talk, and names the pieces made for the moment.
        </p>
        <button type="button" onClick={onStart} className={buttonClasses({ size: 'lg', className: 'pb-step-in mt-9 min-w-[14rem]' })} style={stagger(240)}>
          Start my session
        </button>
      </div>

      {/* Three prints from the homepage hero, fanned like a stylist's references. */}
      <div className="relative mx-auto h-[330px] w-full max-w-[420px] md:h-[440px]" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'absolute top-1/2 w-[46%]',
              i === 0 && 'left-[2%] -translate-y-[54%] rotate-[-7deg]',
              i === 1 && 'left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rotate-[1.5deg]',
              i === 2 && 'right-[2%] -translate-y-[44%] rotate-[6deg]'
            )}
          >
            <div className="pb-step-in bg-white p-2 pb-7 shadow-pb-lg" style={stagger(200 + i * 110)}>
              <div className="relative aspect-[4/5] overflow-hidden bg-[hsl(var(--pb-blush-wash))]">
                {photos[i] && <Image src={photos[i]} alt="" fill sizes="220px" className="object-cover object-top" />}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** An answered question, settled into the story: what Seelie asked, and what they said back. */
function Chapter({ turn }: { turn: AnsweredTurn }) {
  const chosen = turn.step.options.filter((o) => turn.picked.includes(o.id));
  return (
    <li className="pb-step-in">
      <div className="flex items-start gap-3">
        <SeelieMark className="mt-0.5 h-7 w-7 [&_img]:h-[18px] [&_img]:w-[18px]" />
        <div className="min-w-0">
          <p className="text-sm leading-relaxed text-[hsl(var(--pb-ink-muted))]">{turn.step.say}</p>
          <p className="mt-1.5 font-display text-[1.35rem] italic leading-snug text-[hsl(var(--pb-ink))]">{turn.step.question}</p>
        </div>
      </div>
      <div className="mt-4 flex justify-end">
        <div className="flex max-w-[85%] items-center gap-3 rounded-[13px] bg-[hsl(var(--pb-rose-mist)/0.75)] px-4 py-3">
          {chosen.some((o) => o.product?.image) && (
            <div className="flex -space-x-3">
              {chosen
                .filter((o) => o.product?.image)
                .slice(0, 3)
                .map((o) => (
                  <div key={o.id} className="relative h-12 w-10 overflow-hidden rounded-[6px] ring-2 ring-white">
                    <Image src={getImageUrl(o.product!.image)} alt="" fill sizes="40px" className="object-cover object-top" />
                  </div>
                ))}
            </div>
          )}
          <div className="min-w-0 text-right">
            {chosen.length > 0 && (
              <p className="font-display text-[1.15rem] font-medium leading-tight text-[hsl(var(--pb-rose-ink))]">
                {chosen.map((o) => o.label).join(', ')}
              </p>
            )}
            {turn.text && <p className="mt-0.5 text-sm italic text-[hsl(var(--pb-ink-muted))]">&ldquo;{turn.text}&rdquo;</p>}
          </div>
        </div>
      </div>
    </li>
  );
}

function CurrentTurn({ question, onAnswer, onBack }: { question: PickQuestion; onAnswer: (picked: string[], text?: string) => void; onBack?: () => void }) {
  const { picked, toggle, submitText, confirm } = useChoice(question, onAnswer);
  const photos = isPhotoQuestion(question);
  // The options wait for Seelie to finish its line.
  const settle = Math.min(1600, 200 + question.say.split(/\s+/).length * 38);

  return (
    <div>
      <SeelieSays text={question.say} words />
      <h2
        className="pb-step-in mt-6 font-display text-[2.1rem] font-light italic leading-[1.06] text-[hsl(var(--pb-ink))] md:text-[2.8rem]"
        style={stagger(settle)}
      >
        {question.question}
      </h2>
      {question.hint && (
        <p className="pb-step-in mt-2 text-sm text-[hsl(var(--pb-ink-faint))]" style={stagger(settle + 60)}>
          {question.hint}
        </p>
      )}

      {photos ? (
        <div className="scrollbar-hide -mx-5 mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0">
          {question.options.map((option, i) => (
            <PhotoOption
              key={option.id}
              option={option}
              selected={picked.includes(option.id)}
              onClick={() => toggle(option.id)}
              sizes="(max-width: 767px) 64vw, 280px"
              className="pb-step-in w-[64vw] shrink-0 snap-center md:w-auto"
              style={stagger(settle + 120 + i * 80)}
            />
          ))}
        </div>
      ) : (
        <div className="mt-7 flex flex-col gap-2.5">
          {question.options.map((option, i) => (
            <TextOption
              key={option.id}
              option={option}
              selected={picked.includes(option.id)}
              onClick={() => toggle(option.id)}
              className="pb-step-in"
              style={stagger(settle + 120 + i * 80)}
            />
          ))}
        </div>
      )}

      {question.multi && (
        <button
          type="button"
          disabled={picked.length === 0}
          onClick={confirm}
          className={buttonClasses({ size: 'lg', fullWidth: true, className: 'pb-step-in mt-6 md:w-auto md:min-w-[14rem]' })}
          style={stagger(settle + 200 + question.options.length * 80)}
        >
          Continue
        </button>
      )}

      <OwnWords onSubmit={submitText} placeholder="Or tell Seelie anything" className="pb-step-in mt-6" />
      {onBack && (
        <div className="mt-4">
          <BackButton onClick={onBack} label="Change my last answer" />
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

interface BoardItem {
  key: string;
  image: string;
  label: string;
}

/** What the shopper has chosen so far that has a photo: the pieces of their edit taking shape. */
function boardItems(answered: AnsweredTurn[]): BoardItem[] {
  const out: BoardItem[] = [];
  answered.forEach((turn, t) => {
    for (const o of turn.step.options) {
      if (turn.picked.includes(o.id) && o.product?.image) out.push({ key: `${t}-${o.id}`, image: getImageUrl(o.product.image), label: o.label });
    }
  });
  return out.slice(-6);
}

const TILT = ['-rotate-3', 'rotate-2', '-rotate-1', 'rotate-3', '-rotate-2', 'rotate-1'];

/** The edit board: a sticky column of prints on a wide screen, a strip along the bottom on a phone. */
function EditBoard({ items }: { items: BoardItem[] }) {
  if (!items.length) return <div className="hidden lg:block" />;
  return (
    <>
      <aside className="hidden lg:block">
        <div className="sticky top-[96px]">
          <p className="text-eyebrow text-[hsl(var(--pb-ink-faint))]">Your edit so far</p>
          <div className="mt-5 grid grid-cols-2 gap-4">
            {items.map((item, i) => (
              <figure key={item.key} className={cn('pb-step-in bg-white p-1.5 pb-2.5 shadow-pb-sm', TILT[i % TILT.length])}>
                <div className="relative aspect-[4/5] overflow-hidden bg-[hsl(var(--pb-blush-wash))]">
                  <Image src={item.image} alt="" fill sizes="120px" className="object-cover object-top" />
                </div>
                <figcaption className="mt-1.5 truncate text-center font-display text-[0.95rem] italic text-[hsl(var(--pb-ink-muted))]">
                  {item.label}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </aside>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-ivory)/0.92)] px-5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-4">
          <p className="text-eyebrow shrink-0 leading-snug text-[hsl(var(--pb-ink-faint))]">
            Your
            <br />
            edit
          </p>
          <div className="flex min-w-0 -space-x-2 overflow-hidden py-1">
            {items.map((item, i) => (
              <div key={item.key} className={cn('pb-step-in relative h-14 w-11 shrink-0 overflow-hidden rounded-[6px] bg-white ring-2 ring-white shadow-pb-sm', TILT[i % TILT.length])}>
                <Image src={item.image} alt="" fill sizes="44px" className="object-cover object-top" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function StylistReveal({ results, board, onRestart, onBack }: { results: PickResults; board: BoardItem[]; onRestart: () => void; onBack: () => void }) {
  const [lead, ...rest] = results.picks;
  return (
    <div className="mx-auto max-w-6xl px-5 pb-24 pt-10 md:pt-16">
      <div className="flex flex-col items-center text-center">
        {board.length > 0 && (
          <div className="mb-8 flex -space-x-3" aria-hidden="true">
            {board.slice(0, 5).map((item, i) => (
              <div key={item.key} className={cn('pb-step-in relative h-16 w-12 overflow-hidden rounded-[6px] bg-white ring-2 ring-white shadow-pb-sm', TILT[i % TILT.length])} style={stagger(i * 70)}>
                <Image src={item.image} alt="" fill sizes="48px" className="object-cover object-top" />
              </div>
            ))}
          </div>
        )}
        <p className="pb-step-in text-eyebrow text-[hsl(var(--pb-rose-deep))]" style={stagger(200)}>
          Your edit, by Seelie
        </p>
        <h1 className="mt-4 font-display text-[2.9rem] font-light italic leading-[1.02] text-[hsl(var(--pb-ink))] md:text-[4.5rem]">
          <WordByWord text={results.title ?? 'Your Edit'} startMs={300} stepMs={110} />
        </h1>
        <p className="pb-step-in mt-5 max-w-xl text-[0.98rem] leading-relaxed text-[hsl(var(--pb-ink-muted))]" style={stagger(700)}>
          {results.say}
        </p>
      </div>

      {lead && (
        <article className="group mt-14 grid items-center gap-8 md:grid-cols-[1.05fr_1fr] md:gap-14">
          <Link href={`/products/${lead.product.slug}`} className="pb-step-in relative block" style={stagger(850)}>
            <PickImage product={lead.product} sizes="(max-width: 767px) 92vw, 560px" priority />
          </Link>
          <div className="pb-step-in" style={stagger(980)}>
            <p className="text-eyebrow text-[hsl(var(--pb-ink-faint))]">
              <span className="mr-2 font-display text-[1.1rem] normal-case italic tracking-normal text-[hsl(var(--pb-rose-deep))]">01</span>
              The lead piece
            </p>
            <h2 className="mt-3 font-display text-[2rem] font-medium leading-tight text-[hsl(var(--pb-ink))] md:text-[2.4rem]">
              <Link href={`/products/${lead.product.slug}`}>{lead.product.name}</Link>
            </h2>
            <PriceTag price={lead.product.price} compareAtPrice={lead.product.mrp ?? undefined} className="mt-2" />
            <p className="mt-6 font-display text-[1.45rem] italic leading-snug text-[hsl(var(--pb-rose-ink))] md:text-[1.6rem]">
              &ldquo;{lead.why}&rdquo;
            </p>
            {lead.styling && (
              <p className="mt-4 text-[0.95rem] leading-relaxed text-[hsl(var(--pb-ink-muted))]">
                <span className="text-eyebrow mr-2 text-[hsl(var(--pb-ink-faint))]">Style it</span>
                {lead.styling}
              </p>
            )}
            <Link href={`/products/${lead.product.slug}`} className={buttonClasses({ size: 'lg', className: 'mt-8 w-full md:w-auto md:min-w-[14rem]' })}>
              View this piece
            </Link>
          </div>
        </article>
      )}

      {rest.length > 0 && (
        <>
          <p className="pb-step-in text-eyebrow mt-20 text-center text-[hsl(var(--pb-ink-faint))]" style={stagger(1100)}>
            To round out your edit
          </p>
          <div className="mx-auto mt-8 grid max-w-3xl gap-12 sm:grid-cols-2 sm:gap-8">
            {rest.map((pick, i) => (
              <PickCard key={pick.product.id} pick={pick} index={i + 1} delay={1180 + i * 120} />
            ))}
          </div>
        </>
      )}

      <RestartRow onRestart={onRestart} className="mt-16" />
      <div className="mt-3 flex justify-center">
        <BackButton onClick={onBack} label="Change my last answer" />
      </div>
    </div>
  );
}
