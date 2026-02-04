import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatCurrency } from './currency';
import { generateSlug } from './utils/string';
import { formatDate as formatDateUtil } from './utils/date';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * @deprecated Use formatCurrency from '@/lib/currency' instead
 */
export function formatPrice(
  price: number,
  currency: string = 'INR',
  locale: string = 'en-IN'
) {
  return formatCurrency(price, currency, locale);
}

/**
 * @deprecated Use formatDate from '@/lib/utils/date' instead
 */
export function formatDate(date: Date | string, locale: string = 'en-IN') {
  return formatDateUtil(date, locale);
}

/**
 * @deprecated Use generateSlug from '@/lib/utils/string' instead
 */
export function slugify(text: string): string {
  return generateSlug(text);
}
