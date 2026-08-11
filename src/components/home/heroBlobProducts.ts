// Placeholder catalogue entries for the three hero blobs' expand-on-hover
// order panels. Swappable for real product data later — the panel and cart
// wiring only depend on this shape, not on where it comes from.

export interface HeroBlobVariant {
  size: string;
  stockQuantity: number;
}

export interface HeroBlobProduct {
  productId: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  colorLabel: string;
  variants: HeroBlobVariant[];
}

export const HERO_BLOB_PRODUCTS: Record<'pink' | 'main' | 'black', HeroBlobProduct> = {
  pink: {
    productId: 'hero-pink-anarkali',
    slug: 'coral-block-print-anarkali',
    name: 'Coral Block-Print Anarkali Set',
    description: 'Hand block-printed anarkali kurta with a matching dupatta, cut for a soft flare.',
    price: 3499,
    compareAtPrice: 4499,
    colorLabel: 'Coral',
    variants: [
      { size: 'S', stockQuantity: 4 },
      { size: 'M', stockQuantity: 6 },
      { size: 'L', stockQuantity: 2 },
      { size: 'XL', stockQuantity: 0 },
    ],
  },
  main: {
    productId: 'hero-main-kurti',
    slug: 'silver-jhumka-kurti',
    name: 'Rust Cotton Kurti',
    description: 'Everyday cotton kurti in a warm rust, styled here with silver jhumka earrings.',
    price: 2299,
    compareAtPrice: 2899,
    colorLabel: 'Rust',
    variants: [
      { size: 'S', stockQuantity: 5 },
      { size: 'M', stockQuantity: 8 },
      { size: 'L', stockQuantity: 5 },
      { size: 'XL', stockQuantity: 3 },
    ],
  },
  black: {
    productId: 'hero-black-kurta',
    slug: 'black-scalloped-embroidery-kurta',
    name: 'Black Scalloped Embroidery Kurta',
    description: 'Black kurta with floral scalloped embroidery along the hem and cuffs.',
    price: 2799,
    colorLabel: 'Black',
    variants: [
      { size: 'S', stockQuantity: 3 },
      { size: 'M', stockQuantity: 0 },
      { size: 'L', stockQuantity: 4 },
      { size: 'XL', stockQuantity: 2 },
    ],
  },
};
