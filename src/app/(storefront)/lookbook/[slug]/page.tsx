'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { useQueries } from '@tanstack/react-query';
import Link from 'next/link';
import SectionRenderer from '@/components/SectionRenderer';
import { Monogram } from '@/components/brand/Monogram';
import { PriceTag } from '@/components/ui/PriceTag';
import { Button } from '@/components/ui/Button';
import { PageSection, Hotspot } from '@/lib/pageSections';
import { Product } from '@/types/product';
import { getProductImageUrl } from '@/lib/image-url';
import { useCart } from '@/contexts/CartContext';

interface MarketplacePage {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
}

export default function LookbookDetailPage({ params }: { params: { slug: string } }) {
  const [page, setPage] = useState<MarketplacePage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/marketplace/pages/slug/lookbook-${params.slug}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'published') setPage(data);
        }
      } catch (error) {
        console.error('Failed to load lookbook', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [params.slug]);

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[hsl(var(--pb-ivory))]">
        <Monogram spin className="h-8 w-8 text-[hsl(var(--pb-rose))]" />
      </main>
    );
  }

  if (!page) {
    notFound();
  }

  let sections: PageSection[] = [];
  try {
    const parsed = JSON.parse(page!.content);
    if (Array.isArray(parsed)) sections = parsed;
  } catch {
    sections = [];
  }

  const visibleSections = sections.filter((s) => s.visible !== false).sort((a, b) => a.order - b.order);

  const productIds = Array.from(
    new Set(
      visibleSections
        .filter((s) => s.type === 'shoppable-image')
        .flatMap((s) => (s.settings.hotspots || []) as Hotspot[])
        .map((h) => h.productId)
        .filter(Boolean)
    )
  );

  return (
    <main className="bg-[hsl(var(--pb-ivory))] pb-24">
      {visibleSections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
      {productIds.length > 0 && <ShopThisLookBar productIds={productIds} />}
    </main>
  );
}

function ShopThisLookBar({ productIds }: { productIds: string[] }) {
  const { addToCart } = useCart();
  const [open, setOpen] = useState(false);

  const results = useQueries({
    queries: productIds.map((id) => ({
      queryKey: ['product', 'id', id],
      queryFn: async () => {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/products/${id}`
        );
        if (!res.ok) throw new Error('not found');
        return res.json() as Promise<Product>;
      },
      staleTime: 5 * 60 * 1000,
    })),
  });

  const products = results.map((r) => r.data).filter(Boolean) as Product[];
  if (products.length === 0) return null;

  const addAllToBag = () => {
    products.forEach((product) => {
      addToCart({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: Number(product.price),
        quantity: 1,
        image: getProductImageUrl(product),
        vendorId: product.vendorId || product.vendor?.id || '',
        stockQuantity: product.stockQuantity,
        maxQuantity: product.stockQuantity,
      });
    });
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-ivory))]/95 backdrop-blur-md shadow-pb-lg">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-eyebrow text-[hsl(var(--pb-ink))]"
        >
          Shop this Look ({products.length})
        </button>
        <div className="ml-auto">
          <Button size="sm" variant="primary" onClick={addAllToBag}>
            Add All to Bag
          </Button>
        </div>
      </div>
      {open && (
        <div className="border-t border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-ivory))]">
          <div className="mx-auto flex max-w-6xl gap-4 overflow-x-auto px-4 py-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="flex w-40 flex-shrink-0 flex-col gap-1.5"
              >
                <div className="aspect-[4/5] w-full overflow-hidden rounded-sm bg-[hsl(var(--pb-shell))]">
                  <img src={getProductImageUrl(product)} alt={product.name} className="h-full w-full object-cover" />
                </div>
                <p className="line-clamp-1 text-xs text-[hsl(var(--pb-ink))]">{product.name}</p>
                <PriceTag price={Number(product.price)} size="sm" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
