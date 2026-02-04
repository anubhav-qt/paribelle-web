/**
 * Date formatting utility functions
 */

/**
 * Format date with locale support
 * @param date - Date string or Date object
 * @param locale - Locale for formatting (default: en-IN)
 * @returns Formatted date string
 */
export function formatDate(date: Date | string, locale: string = 'en-IN'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Format date with time (long format)
 * @param date - Date string or Date object
 * @param locale - Locale for formatting (default: en-IN)
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date | string, locale: string = 'en-IN'): string {
  return new Date(date).toLocaleString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date - short format (DD/MM/YYYY)
 * @param date - Date string or Date object
 * @param locale - Locale for formatting (default: en-IN)
 * @returns Short formatted date string
 */
export function formatDateShort(date: Date | string, locale: string = 'en-IN'): string {
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Format date - month and year only
 * @param date - Date string or Date object
 * @param locale - Locale for formatting (default: en-IN)
 * @returns Month and year string
 */
export function formatMonthYear(date: Date | string, locale: string = 'en-IN'): string {
  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

/**
 * Format relative time (e.g., "2 days ago", "in 3 hours")
 * @param date - Date string or Date object
 * @param locale - Locale for formatting (default: en-IN)
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date | string, locale: string = 'en-IN'): string {
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = Math.floor((target.getTime() - now.getTime()) / 1000);
  
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  
  const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ];
  
  for (const { unit, seconds } of units) {
    const value = Math.floor(diffInSeconds / seconds);
    if (Math.abs(value) >= 1) {
      return rtf.format(value, unit);
    }
  }
  
  return rtf.format(0, 'second');
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string): boolean {
  const today = new Date();
  const targetDate = new Date(date);
  return today.toDateString() === targetDate.toDateString();
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string): boolean {
  return new Date(date) < new Date();
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date | string): boolean {
  return new Date(date) > new Date();
}

/**
 * Get days between two dates
 */
export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
