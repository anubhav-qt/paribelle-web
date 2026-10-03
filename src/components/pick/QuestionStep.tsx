'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { buttonClasses } from '@/components/ui/Button';
import type { PickQuestion } from './api';
import { isPhotoQuestion, OwnWords, PhotoOption, SeelieSays, stagger, TextOption, useChoice } from './parts';

/**
 * One question as a page: Seelie's line, the question, its options (photos in a
 * grid when they show products, else a list), the shopper's own words, and
 * Continue when several can be chosen.
 */
export function QuestionStep({
  question,
  onAnswer,
  columns = 'grid-cols-2 md:grid-cols-3',
  photoSizes = '(max-width: 767px) 45vw, 260px',
}: {
  question: PickQuestion;
  onAnswer: (picked: string[], text?: string) => void;
  columns?: string;
  photoSizes?: string;
}) {
  const { picked, toggle, submitText, confirm } = useChoice(question, onAnswer);
  const photos = isPhotoQuestion(question);

  return (
    <div>
      {question.say && <SeelieSays text={question.say} className="pb-step-in" />}
      <h1
        className="pb-step-in mt-6 font-display text-[2.15rem] font-light italic leading-[1.06] tracking-[-0.01em] text-[hsl(var(--pb-ink))] md:text-[3rem]"
        style={stagger(80)}
      >
        {question.question}
      </h1>
      {question.hint && (
        <p className="pb-step-in mt-2 text-sm text-[hsl(var(--pb-ink-faint))]" style={stagger(140)}>
          {question.hint}
        </p>
      )}

      <div className={cn('mt-7', photos ? cn('grid gap-3 md:gap-4', columns) : 'flex flex-col gap-2.5')}>
        {question.options.map((option, i) =>
          photos ? (
            <PhotoOption
              key={option.id}
              option={option}
              selected={picked.includes(option.id)}
              onClick={() => toggle(option.id)}
              sizes={photoSizes}
              className="pb-step-in"
              style={stagger(180 + i * 70)}
            />
          ) : (
            <TextOption
              key={option.id}
              option={option}
              selected={picked.includes(option.id)}
              onClick={() => toggle(option.id)}
              className="pb-step-in"
              style={stagger(180 + i * 70)}
            />
          )
        )}
      </div>

      {question.multi && (
        <div className="pb-step-in mt-6" style={stagger(260 + question.options.length * 70)}>
          <button
            type="button"
            disabled={picked.length === 0}
            onClick={confirm}
            className={buttonClasses({ size: 'lg', fullWidth: true, className: 'md:w-auto md:min-w-[14rem]' })}
          >
            Continue
          </button>
        </div>
      )}

      <OwnWords onSubmit={submitText} className="pb-step-in mt-6" />
    </div>
  );
}
