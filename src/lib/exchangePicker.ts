'use client';

import { useEffect, useState } from 'react';

/**
 * Cross-page state for "browse the store to pick an exchange replacement".
 *
 * The exchange modal used to have shoppers type a product name into a search
 * box — nobody actually knows the exact name of what they want. Instead,
 * "Browse Products" drops this context into sessionStorage and sends them to
 * the storefront to shop normally; `ExchangePickerBar` (mounted globally,
 * storefront-only) reads it to show a persistent "return to your exchange"
 * bar, and the product page reads it to offer a "Select for Exchange" action
 * in place of Add to Bag while it's active. sessionStorage (not localStorage)
 * so an abandoned pick doesn't linger into an unrelated later session.
 *
 * A pick carries the exact *variant* the shopper chose, not just the
 * product. The backend exchanges one variant for another
 * (`ExchangesService.request` needs an `exchangeVariantId`), so a pick
 * without one is not something that can actually be submitted — and asking
 * the shopper to re-pick the size in a bare dropdown after they already
 * chose it on the product page was the single most confusing step in this
 * flow.
 *
 * `draft` carries the half-filled form across the round trip. Going off to
 * browse used to wipe the reason, quantity, notes and the uploaded video,
 * so shoppers came back to a blank form and had to start over.
 */

const STORAGE_KEY = 'pb_exchange_picker';

/**
 * "Size: M · Colour: White" — one spelling of a variant's options, shared by
 * everything in the exchange flow so the label on the product page, in the
 * picker bar and in the request modal all read the same.
 */
export function formatVariantLabel(attrs?: Record<string, string> | null): string {
  return Object.entries(attrs || {})
    .map(([k, v]) => `${k}: ${v}`)
    .join(' · ');
}

export interface ExchangePick {
  productId: string;
  productSlug?: string;
  name: string;
  /** The chosen variant — required; see the note above. */
  variantId: string;
  /** Human-readable options, e.g. "Size: M · Colour: White". */
  variantLabel: string;
  /** Unit price of that variant. */
  price: number;
  image?: string;
  stockQuantity?: number;
}

/** The exchange form's in-progress answers, preserved across browsing. */
export interface ExchangeDraft {
  reason?: string;
  otherReason?: string;
  customerNotes?: string;
  /** Uploaded ahead of submission — see `POST upload/exchange-video`. */
  videoUrl?: string;
  videoName?: string;
}

export interface ExchangePickerContext {
  orderId: string;
  orderNumber: string;
  orderItemId: string;
  itemName: string;
  itemImage?: string;
  /** Unit price of the item being exchanged. */
  itemPrice: number;
  /** How many units are being exchanged — fixed when browsing starts. */
  quantity: number;
  /** What this exchange credits: `itemPrice * quantity`. */
  itemCredit: number;
  draft: ExchangeDraft;
  picks: ExchangePick[];
}

type Listener = (ctx: ExchangePickerContext | null) => void;
const listeners = new Set<Listener>();

/** Shared identity for a pick — product *and* variant, since the same dress in two sizes is two distinct candidates. */
export const pickKey = (p: { productId: string; variantId: string }) => `${p.productId}:${p.variantId}`;

function read(): ExchangePickerContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Defensive: a session started by an older build has no `draft`/`picks`.
    return { ...parsed, draft: parsed.draft || {}, picks: parsed.picks || [] };
  } catch {
    return null;
  }
}

function write(ctx: ExchangePickerContext | null) {
  if (typeof window === 'undefined') return;
  if (ctx) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
  else sessionStorage.removeItem(STORAGE_KEY);
  listeners.forEach((l) => l(ctx));
}

export function getExchangePicker(): ExchangePickerContext | null {
  return read();
}

/**
 * Starts browsing — or resumes it, if a session for this same order item is
 * already open. Resuming matters: "Browse Products" unconditionally reset
 * `picks` to `[]`, so a shopper who had selected two products and clicked
 * through to look at a third silently lost both.
 *
 * The draft merge is additive only: an incoming field is applied *only* when
 * it is non-empty. This is called every time "Browse Products" is clicked,
 * passing whatever the modal's local state holds at that instant — if that
 * local copy is ever momentarily behind what's already saved (e.g. the
 * modal only just remounted), a plain overwrite would silently blank out an
 * already-uploaded video. Something already saved here — the video above
 * all — is worth more than a possibly-stale value from the caller.
 */
export function startExchangePicker(
  ctx: Omit<ExchangePickerContext, 'picks' | 'draft'> & { draft?: ExchangeDraft },
) {
  const current = read();
  const isSameItem = current?.orderItemId === ctx.orderItemId;
  const base = isSameItem ? current!.draft : {};
  const incoming = ctx.draft || {};
  const merged: ExchangeDraft = { ...base };
  (Object.keys(incoming) as (keyof ExchangeDraft)[]).forEach((key) => {
    const value = incoming[key];
    if (value) merged[key] = value;
  });
  write({
    ...ctx,
    picks: isSameItem ? current!.picks : [],
    draft: merged,
  });
}

export function addExchangePick(pick: ExchangePick) {
  const current = read();
  if (!current) return;
  // Keyed on product *and* variant: the same dress in two sizes is two
  // distinct candidates, and the shopper may well want to compare them.
  if (current.picks.some((p) => pickKey(p) === pickKey(pick))) return;
  write({ ...current, picks: [...current.picks, pick] });
}

export function removeExchangePick(productId: string, variantId: string) {
  const current = read();
  if (!current) return;
  write({
    ...current,
    picks: current.picks.filter((p) => pickKey(p) !== pickKey({ productId, variantId })),
  });
}

/** Merges into the saved form draft, so nothing typed is lost while browsing. */
export function updateExchangeDraft(partial: ExchangeDraft) {
  const current = read();
  if (!current) return;
  write({ ...current, draft: { ...current.draft, ...partial } });
}

/** Ends the picker session — called on cancel and on successful submit. */
export function clearExchangePicker() {
  write(null);
}

/**
 * Whether the exchange request modal is currently on screen.
 *
 * Lives here, next to the rest of this flow's cross-component state, purely
 * so `ExchangePickerBar` can get out of the way: the bar is fixed to the
 * bottom of the viewport and was covering the modal's own sticky footer —
 * i.e. the Submit button the shopper came back to press. Deliberately not
 * part of `ExchangePickerContext`: this is ephemeral UI state, and writing
 * it to sessionStorage would leave the bar hidden after a reload.
 */
let modalOpen = false;
const modalListeners = new Set<(open: boolean) => void>();

export function setExchangeModalOpen(open: boolean) {
  if (modalOpen === open) return;
  modalOpen = open;
  modalListeners.forEach((l) => l(open));
}

export function useExchangeModalOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(modalOpen);
    modalListeners.add(setOpen);
    return () => {
      modalListeners.delete(setOpen);
    };
  }, []);
  return open;
}

/** Live-updating view of the current picker context, or null when no session is active. */
export function useExchangePicker(): ExchangePickerContext | null {
  // Initialised from storage on the first client render rather than in an
  // effect: consumers decide what to show based on whether a session is
  // active, and a null-then-value flip made the exchange modal open on the
  // wrong tab when a shopper returned from browsing.
  const [ctx, setCtx] = useState<ExchangePickerContext | null>(null);

  useEffect(() => {
    setCtx(read());
    listeners.add(setCtx);
    return () => {
      listeners.delete(setCtx);
    };
  }, []);

  return ctx;
}
