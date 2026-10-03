'use client';

import * as React from 'react';
import { fetchPickStep, PickQuestion, PickRequestError, PickStep, PickTurn } from './api';

/** One answered question: the step as Seelie asked it, and what the shopper said. */
export interface AnsweredTurn {
  step: PickQuestion;
  picked: string[];
  text?: string;
}

interface JourneyState {
  answered: AnsweredTurn[];
  step: PickStep | null;
  loading: boolean;
  error: string | null;
}

const EMPTY: JourneyState = { answered: [], step: null, loading: false, error: null };

const toTurn = (t: AnsweredTurn): PickTurn => ({
  question: t.step.question,
  options: t.step.options.map((o) => ({ id: o.id, label: o.label })),
  picked: t.picked,
  text: t.text,
});

/**
 * A Find Your Pick session: the answered questions, the step on screen, and the
 * request for the next one. The server keeps nothing, so every request sends the
 * whole session; Back is free (the earlier step comes back from memory, not the model).
 */
export function usePickJourney() {
  const [state, setState] = React.useState<JourneyState>(EMPTY);
  const inFlight = React.useRef<AbortController | null>(null);
  const stateRef = React.useRef(state);
  stateRef.current = state;

  const request = React.useCallback(async (answered: AnsweredTurn[]) => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    setState((s) => ({ ...s, answered, loading: true, error: null }));
    try {
      const step = await fetchPickStep(answered.map(toTurn), controller.signal);
      if (controller.signal.aborted) return;
      setState((s) => ({ ...s, step, loading: false }));
    } catch (err) {
      if (controller.signal.aborted) return;
      setState((s) => ({
        ...s,
        loading: false,
        error: err instanceof PickRequestError ? err.message : 'Something went wrong finding your pick. Try again in a moment.',
      }));
    }
  }, []);

  React.useEffect(() => () => inFlight.current?.abort(), []);

  const start = React.useCallback(() => request([]), [request]);

  const answer = React.useCallback(
    (picked: string[], text?: string) => {
      const { step, answered } = stateRef.current;
      if (!step || step.kind !== 'question') return;
      request([...answered, { step, picked, text: text?.trim() || undefined }]);
    },
    [request]
  );

  const back = React.useCallback(() => {
    inFlight.current?.abort();
    setState((s) => {
      const last = s.answered[s.answered.length - 1];
      if (!last) return { ...s, loading: false, error: null };
      return { ...s, answered: s.answered.slice(0, -1), step: last.step, loading: false, error: null };
    });
  }, []);

  const retry = React.useCallback(() => request(stateRef.current.answered), [request]);

  const restart = React.useCallback(() => {
    inFlight.current?.abort();
    setState(EMPTY);
  }, []);

  return { ...state, started: state.step !== null || state.loading || state.error !== null, start, answer, back, retry, restart };
}

export type PickJourney = ReturnType<typeof usePickJourney>;
