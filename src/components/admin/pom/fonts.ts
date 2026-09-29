import { Inter, JetBrains_Mono } from 'next/font/google';

/**
 * POM's typefaces. Loaded here rather than in the root layout so storefront
 * visitors never download them. The class string carries the two CSS
 * variables the `.pom-admin` scope reads, and has to travel with every
 * portal (modals, lightboxes) since those render outside the admin wrapper.
 */
const inter = Inter({
  subsets: ['latin'],
  variable: '--pom-font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--pom-font-mono',
  display: 'swap',
});

export const pomFontVars = `${inter.variable} ${mono.variable}`;
