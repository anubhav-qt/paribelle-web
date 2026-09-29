/**
 * Formatting shared by every admin screen, ported from POM's lib/utils so the
 * numbers and dates read the same in both back-office tools.
 */

import { API_BASE } from '@/lib/api';

/** Uploads come back as paths on the API host; everything else is already a full URL. */
export function mediaUrl(url: string | null | undefined) {
  if (!url) return '';
  return /^(https?:|data:|blob:)/.test(url) ? url : `${API_BASE}${url.startsWith('/') ? '' : '/'}${url}`;
}

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const INR_PAISE = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function money(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '-';
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  return INR.format(n);
}

/** Rupees and paise, for invoices and money breakdowns where rounding would mislead. */
export function moneyExact(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === '') return '-';
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  return INR_PAISE.format(n);
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** "Today", "Yesterday", "3 days ago", then a plain date. */
export function dayLabel(input: string | Date | null | undefined) {
  if (!input) return '-';
  const date = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return '-';
  const days = Math.floor((startOfDay(new Date()) - startOfDay(date)) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days > 1 && days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function timeOfDay(input: string | Date | null | undefined) {
  if (!input) return '';
  const date = typeof input === 'string' ? new Date(input) : input;
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

export function dateTime(input: string | Date | null | undefined) {
  if (!input) return null;
  const date = typeof input === 'string' ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function plural(n: number, one: string, many = `${one}s`) {
  return `${n} ${n === 1 ? one : many}`;
}
