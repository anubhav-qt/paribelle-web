import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface ProductMeta {
  name: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  shortDescription?: string | null;
  description?: string | null;
  images?: string[];
}

/**
 * `undefined` means the API couldn't be asked (down, timed out); `null` means
 * it answered that there is no such product. The API answers a missing slug
 * with a 200 and an empty body, not a 404, so both are treated as missing.
 * Both callers share one fetch per render through Next's request dedupe.
 */
async function getProduct(slug: string): Promise<ProductMeta | null | undefined> {
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const response = await fetch(`${apiUrl}/api/v1/products/slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (response.status === 404) return null;
    if (!response.ok) return undefined;
    const text = await response.text();
    if (!text.trim()) return null;
    const product = JSON.parse(text);
    return product && typeof product === 'object' && product.name ? product : null;
  } catch {
    return undefined;
  }
}

/**
 * The product page renders on the client, so without this every product
 * shared on WhatsApp or opened from an ad carried the site-wide title and no
 * picture. The fetch is cached, so it costs one API call per product per five
 * minutes, not one per visit.
 */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return {};

  const title = product.metaTitle || product.name;
  const description = (product.metaDescription || product.shortDescription || product.description || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160);
  const image = product.images?.[0];

  return {
    title,
    description: description || undefined,
    openGraph: {
      title,
      description: description || undefined,
      type: 'website',
      images: image ? [{ url: image }] : undefined,
    },
  };
}

/**
 * The page's own `notFound()` runs in the browser, after the server has
 * already answered 200, so search engines indexed every mistyped or deleted
 * product URL as a live page. Deciding here makes it a real 404. A failed
 * lookup is not a missing product: if the API is down the page still renders
 * and shows its own error state, rather than 404ing the whole catalogue.
 */
export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  if ((await getProduct(params.slug)) === null) notFound();
  return children;
}
