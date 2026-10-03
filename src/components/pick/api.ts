/**
 * Find Your Pick's one endpoint, which lives in the OMS beside Seelie (its model
 * accounts are there) and is reached same-origin through /pom: Caddy routes it on
 * the ThinkPad, the OMS_ORIGIN rewrite on a dev machine. The types mirror the OMS's
 * src/lib/pick/engine.ts; a change to one needs the same change to the other.
 */

export type PickMode = 'guided' | 'photo' | 'stylist';

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
  picks: { product: PickProduct; why: string; styling: string | null }[];
}

export type PickStep = PickQuestion | PickResults;

export interface PickTurn {
  question: string;
  options: { id: string; label: string }[];
  picked: string[];
  text?: string;
}

export interface PickPhoto {
  mimeType: string;
  /** Base64, no data: prefix. */
  data: string;
  /** An object URL for showing it back. */
  preview: string;
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

export async function fetchPickStep(
  body: { mode: PickMode; turns: PickTurn[]; photo?: { mimeType: string; data: string } | null; photoNotes?: string | null },
  signal: AbortSignal
): Promise<{ step: PickStep; photoNotes?: string }> {
  let res: Response;
  try {
    res = await fetch('/pom/api/pick', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if (signal.aborted) throw err;
    throw new PickRequestError("We couldn't reach Seelie. Check your connection and try again.", 0);
  }
  const data = (await res.json().catch(() => null)) as { step?: PickStep; photoNotes?: string; error?: string } | null;
  if (!res.ok || !data?.step) {
    throw new PickRequestError(data?.error || 'Something went wrong finding your pick. Try again in a moment.', res.status);
  }
  return { step: data.step, photoNotes: data.photoNotes };
}

/** A photo made small enough to send: the long edge at most 1024px, as a JPEG. */
export async function preparePhoto(file: File): Promise<PickPhoto> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('The photo could not be read.'))), 'image/jpeg', 0.85)
  );
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
  return { mimeType: 'image/jpeg', data, preview: URL.createObjectURL(blob) };
}
