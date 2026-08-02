/**
 * Theme-aware CSS classes for the store's chrome.
 *
 * This used to switch between the marketplace palette and a per-vendor one.
 * PariBelle is the only store now, so there is a single set of classes — the
 * hook stays because a dozen pages compose their class names through it.
 */
const THEME_CLASSES = {
  // Background colors
  bg: 'bg-background',
  cardBg: 'bg-card',

  // Text colors
  text: 'text-foreground',
  textMuted: 'text-muted-foreground',

  // Primary colors
  primary: 'text-primary',
  primaryBg: 'bg-primary',
  primaryFg: 'text-primary-foreground',

  // Secondary
  secondaryBg: 'bg-secondary',

  // Accent
  accent: 'text-accent',

  // Borders
  border: 'border-border',
  borderLight: 'border-border',
  borderColor: 'border-border', // alias

  // Hover states
  hoverBg: 'hover:bg-muted',
  linkHover: 'hover:underline',

  // Special classes
  heading: 'text-foreground font-bold',
  link: 'text-primary hover:underline',
  productCard: 'bg-card border border-border',
  productPrice: 'text-primary font-semibold',

  // Button styles
  primaryButton: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondaryButton: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',

  // Input/Form styles
  input: 'bg-background text-foreground border-input focus:ring-ring',
  card: 'bg-card border-border',

  // Helper to combine classes
  combine: (...classes: string[]) => classes.filter(Boolean).join(' '),
} as const;

export function useThemeClasses() {
  return THEME_CLASSES;
}
