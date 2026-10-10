import type { Metadata } from 'next';

/**
 * The product page renders on the client, so without this every product
 * shared on WhatsApp or opened from an ad carried the site-wide title and no
 * picture. The fetch is cached, so it costs one API call per product per five
 * minutes, not one per visit.
 */
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const response = await fetch(`${apiUrl}/api/v1/products/slug/${encodeURIComponent(params.slug)}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return {};
    const product: {
      name: string;
      metaTitle?: string | null;
      metaDescription?: string | null;
      shortDescription?: string | null;
      description?: string | null;
      images?: string[];
    } = await response.json();

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
  } catch {
    return {};
  }
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return children;
}
