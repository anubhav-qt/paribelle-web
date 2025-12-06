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

export const formatPrice = (price: number | string, currencyCode: string): string => {
  const symbol = getCurrencySymbol(currencyCode);
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(numPrice)) {
    return `${symbol}0.00`;
  }
  return `${symbol}${numPrice.toFixed(2)}`;
};
