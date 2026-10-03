import { getToken } from '@/lib/api';

/**
 * Find Your Pick's one endpoint, which lives in the OMS beside Seelie (its model
 * accounts are there) and is reached same-origin through /pom: Caddy routes it on
 * the ThinkPad, the OMS_ORIGIN rewrite on a dev machine. The types mirror the OMS's
 * src/lib/pick/engine.ts; a change to one needs the same change to the other.
 *
 * A signed-in shopper's request carries their sign-in, so Seelie can build on what
 * they've bought, and every request carries their wishlist's product ids.
 */

export interface PickProduct {
  id: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  mrp: number | null;
}

export interface PickOption {
  id: string;
  label: string;
  detail: string | null;
  product: PickProduct | null;
  /** Choosing it asks the shopper to say what they mean, sent as the turn's text. */
  specify?: boolean;
}

export interface PickQuestion {
  kind: 'question';
  say: string;
  question: string;
  hint: string | null;
  multi: boolean;
  options: PickOption[];
  number: number;
  total: number;
}

export interface PickResults {
  kind: 'picks';
  say: string;
  title: string | null;
  picks: { product: PickProduct; why: string }[];
}

export type PickStep = PickQuestion | PickResults;

export interface PickTurn {
  question: string;
  options: { id: string; label: string }[];
  picked: string[];
  text?: string;
}

export class PickRequestError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
    this.name = 'PickRequestError';
  }
}

export async function fetchPickStep(turns: PickTurn[], wishlist: string[], signal: AbortSignal): Promise<PickStep> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch('/pom/api/pick', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ turns, wishlist }),
      signal,
    });
  } catch (err) {
    if (signal.aborted) throw err;
    throw new PickRequestError("We couldn't reach Seelie. Check your connection and try again.", 0);
  }
  const data = (await res.json().catch(() => null)) as { step?: PickStep; error?: string } | null;
  if (!res.ok || !data?.step) {
    throw new PickRequestError(data?.error || 'Something went wrong finding your pick. Try again in a moment.', res.status);
  }
  return data.step;
}
