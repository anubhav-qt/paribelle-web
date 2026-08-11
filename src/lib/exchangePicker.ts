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
 */

const STORAGE_KEY = 'pb_exchange_picker';

export interface ExchangePick {
  productId: string;
  name: string;
  price: number;
  image?: string;
}

export interface ExchangePickerContext {
  orderId: string;
  orderNumber: string;
  orderItemId: string;
  itemName: string;
  /** What this item's return value credits — quantity already applied. */
  itemCredit: number;
  picks: ExchangePick[];
}

type Listener = (ctx: ExchangePickerContext | null) => void;
const listeners = new Set<Listener>();

function read(): ExchangePickerContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
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

export function startExchangePicker(ctx: Omit<ExchangePickerContext, 'picks'>) {
  write({ ...ctx, picks: [] });
}

export function addExchangePick(pick: ExchangePick) {
  const current = read();
  if (!current) return;
  if (current.picks.some((p) => p.productId === pick.productId)) return;
  write({ ...current, picks: [...current.picks, pick] });
}

export function removeExchangePick(productId: string) {
  const current = read();
  if (!current) return;
  write({ ...current, picks: current.picks.filter((p) => p.productId !== productId) });
}

/** Ends the picker session — called on cancel, on successful submit, and once the modal reopens with it. */
export function clearExchangePicker() {
  write(null);
}

/** Live-updating view of the current picker context, or null when no session is active. */
export function useExchangePicker(): ExchangePickerContext | null {
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
