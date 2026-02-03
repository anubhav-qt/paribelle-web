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

export const parsePrice = (price: number | string): number => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return isNaN(numPrice) ? 0 : numPrice;
};
