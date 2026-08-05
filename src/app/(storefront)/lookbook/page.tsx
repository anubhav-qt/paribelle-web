'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import SectionRenderer from '@/components/SectionRenderer';
import { Monogram } from '@/components/brand/Monogram';
import { Button } from '@/components/ui/Button';
import { PageSection } from '@/lib/pageSections';
import { LOOKBOOK_ENABLED } from '@/lib/features';

interface MarketplacePage {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
}

export default function LookbookIndexPage() {
  if (!LOOKBOOK_ENABLED) notFound();

  const [page, setPage] = useState<MarketplacePage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/marketplace/pages/slug/lookbook`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'published') setPage(data);
        }
      } catch (error) {
        console.error('Failed to load lookbook index', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, []);

  let sections: PageSection[] = [];
  try {
    const parsed = page ? JSON.parse(page.content) : [];
    if (Array.isArray(parsed)) sections = parsed;
  } catch {
    sections = [];
  }

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[hsl(var(--pb-ivory))]">
        <Monogram spin className="h-8 w-8 text-[hsl(var(--pb-rose))]" />
      </main>
    );
  }

  if (!page || sections.length === 0) {
    // No styled story published yet. Rather than dead-ending a visitor who
    // followed a Lookbook link, send them into the collections it would feature.
    return (
      <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-[hsl(var(--pb-ivory))] px-6 py-20 text-center">
        <Monogram className="h-10 w-10 text-[hsl(var(--pb-gold))]" />
        <h1 className="text-display-lg text-[hsl(var(--pb-ink))]">The Lookbook</h1>
        <p className="max-w-md text-[hsl(var(--pb-ink-muted))]">
          Our next styled story is still being shot. In the meantime, the pieces it will
          feature are waiting for you.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <Link href="/category/kurtis">
            <Button>Shop Kurtis</Button>
          </Link>
          <Link href="/category/jewellery">
            <Button variant="gold-outline">Shop Jewellery</Button>
          </Link>
          <Link href="/category/new-in">
            <Button variant="ghost">New In</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-[hsl(var(--pb-ivory))]">
      {sections
        .filter((s) => s.visible !== false)
        .sort((a, b) => a.order - b.order)
        .map((section) => (
          <SectionRenderer key={section.id} section={section} />
        ))}
    </main>
  );
}
