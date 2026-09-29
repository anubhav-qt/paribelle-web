/**
 * Best-effort mapping of a colour name to a CSS colour, ported from POM's
 * variant-title so a "Rani Pink" kurti shows a pink dot beside its name in
 * both apps.
 */

const COLOR_MAP: Record<string, string> = {
  black: '#1c1c1e', jetblack: '#111114',
  white: '#f4f4f0', offwhite: '#efece2', 'off white': '#efece2', ivory: '#f2eadb', cream: '#f5edd6',
  grey: '#9ca3af', gray: '#9ca3af', 'light grey': '#c7ccd1', 'dark grey': '#4b5563',
  charcoal: '#374151', silver: '#c7ccd1',
  red: '#dc2626', 'brick red': '#b23b2e', rust: '#b45309', tomato: '#e04a3f',
  maroon: '#7f1d1d', wine: '#722f37', burgundy: '#5b1a2b',
  pink: '#ec4899', 'baby pink': '#f9a8d4', 'light pink': '#f7b8d2',
  'rani pink': '#d6336c', rani: '#d6336c', magenta: '#c026d3', fuchsia: '#d0208f', rose: '#e11d74',
  peach: '#ffb4a2', coral: '#fb7185', salmon: '#fa8072',
  orange: '#f97316', 'burnt orange': '#c2410c',
  yellow: '#eab308', mustard: '#ca8a04', gold: '#d4af37', golden: '#d4af37', lemon: '#fde047',
  beige: '#e3d5b8', tan: '#c19a6b', khaki: '#b7a66b', camel: '#c19a6b',
  brown: '#8a5a2b', coffee: '#4b3621', chocolate: '#3d2b1f', 'dark brown': '#3f2a1d',
  green: '#16a34a', 'dark green': '#14532d', 'bottle green': '#0b3d2e', 'forest green': '#166534',
  olive: '#65733c', 'olive green': '#5b6b2f', mint: '#6ee7b7', 'sea green': '#2e8b7a',
  teal: '#0d9488', 'teal green': '#0f766e', turquoise: '#06b6d4',
  blue: '#2563eb', navy: '#1e3a8a', 'navy blue': '#1e3a8a', 'dark blue': '#1e40af',
  'sky blue': '#38bdf8', 'light blue': '#7dd3fc', 'royal blue': '#1d4ed8', indigo: '#4338ca',
  denim: '#3b5b78', cobalt: '#1e56c8', cyan: '#22d3ee', aqua: '#2dd4bf',
  purple: '#7c3aed', violet: '#8b5cf6', lavender: '#c4b5fd', mauve: '#b784a7', plum: '#7b3f61',
  'rose gold': '#b76e79', oxidised: '#6b6f73', oxidized: '#6b6f73', copper: '#b87333',
};

export interface Swatch {
  /** A CSS colour value, or '' when `multi` is true. */
  css: string;
  /** Draw a multicolour indicator instead of a solid dot. */
  multi: boolean;
}

export function colorSwatch(name: string | null | undefined): Swatch | null {
  if (!name) return null;
  const n = name.toLowerCase().replace(/\s+/g, ' ').trim();
  if (!n) return null;
  if (/\b(multi|multicolor|multicolour|assorted|printed?|floral|patchwork)\b/.test(n)) {
    return { css: '', multi: true };
  }
  if (COLOR_MAP[n]) return { css: COLOR_MAP[n], multi: false };
  const words = n.split(' ');
  for (let i = 0; i < words.length; i++) {
    const tail = words.slice(i).join(' ');
    if (COLOR_MAP[tail]) return { css: COLOR_MAP[tail], multi: false };
  }
  return null;
}

/** Sort order for size chips. Anything unknown sorts last, alphabetically. */
const SIZE_ORDER = [
  'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', 'XXXL', '3XL', 'XXXXL', '4XL', '5XL', '6XL',
  'FREE', 'FREE SIZE', 'FREESIZE', 'ONESIZE', 'ONE SIZE',
];

export function sortSizes(sizes: string[]): string[] {
  return Array.from(new Set(sizes)).sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a.toUpperCase());
    const ib = SIZE_ORDER.indexOf(b.toUpperCase());
    if (ia === -1 && ib === -1) return a.localeCompare(b, 'en', { numeric: true });
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}
