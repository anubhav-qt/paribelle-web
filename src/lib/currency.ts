/**
 * Shared currency utility functions
 * Used across both mobile and web platforms
 */

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AUD: '$',
  CAD: '$',
  JPY: '¥',
  CNY: '¥',
};

export const getCurrencySymbol = (currencyCode: string): string => {
  return CURRENCY_SYMBOLS[currencyCode] || '$';
};

export const formatPrice = (price: number | string, currencyCode: string = 'INR'): string => {
  const symbol = getCurrencySymbol(currencyCode);
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) {
    return `${symbol}0.00`;
  }
  return `${symbol}${numPrice.toFixed(2)}`;
};

/**
 * Format currency with Intl.NumberFormat
 * @param amount - Amount to format
 * @param currencyCode - Currency code (default: INR)
 * @param locale - Locale for formatting (default: en-IN)
 * @param options - Additional Intl.NumberFormat options
 */
export const formatCurrency = (
  amount: number,
  currencyCode: string = 'INR',
  locale: string = 'en-IN',
  options?: Intl.NumberFormatOptions
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    ...options,
  }).format(amount);
};

/**
 * Format currency without decimals
 */
export const formatCurrencyWhole = (amount: number, currencyCode: string = 'INR'): string => {
  return formatCurrency(amount, currencyCode, 'en-IN', { maximumFractionDigits: 0 });
};

export const parsePrice = (price: number | string): number => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(numPrice) ? 0 : numPrice;
};

