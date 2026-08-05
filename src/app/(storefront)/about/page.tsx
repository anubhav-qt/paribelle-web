import Link from 'next/link';
import type { Metadata } from 'next';
import { Sparkles, Ruler, BadgeCheck, Repeat2 } from 'lucide-react';
import { Monogram } from '@/components/brand/Monogram';
import { RevealOnScroll } from '@/components/brand/RevealOnScroll';
import { SectionHeading } from '@/components/brand/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';
import { EditorialSplit } from '@/components/home/EditorialSplit';
import { CommunityGrid } from '@/components/home/CommunityGrid';
import { getDisplayImage } from '@/lib/utils/product-card-helpers';

export const metadata: Metadata = {
  title: 'Our Story',
  description:
    'PariBelle is a Jaipur studio designing our own kurtis and artificial jewellery, with new pieces added every season.',
};

/**
 * The homepage used to carry both of these below its hero — moved here as
 * part of Task 6's redesign, since the homepage's job is now getting a
 * shopper to a product, not telling the brand story. Failure here degrades
 * to an empty grid (CommunityGrid returns null with no images), not a
 * broken page.
 */
async function getCommunityImages(): Promise<string[]> {
  try {
    const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/api/v1/homepage/data`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    const all = [
      ...(data.uncategorizedProducts || []),
      ...Object.values(data.productsByCategory || {}).flat(),
    ] as Array<{ featuredImage?: string; images?: string[] }>;
    return all
      .map((p) => getDisplayImage(p.featuredImage, p.images))
      .filter((img): img is string => !!img)
      .slice(0, 6);
  } catch (error) {
    console.error('[About] Failed to fetch community images:', error);
    return [];
  }
}

const CRAFTS = [
  {
    icon: Sparkles,
    title: 'In-House Design',
    body: 'Every print and silhouette starts on our own design table in Jaipur, not picked from a catalogue.',
  },
  {
    icon: Ruler,
    title: 'Fabric & Finish',
    body: 'Cotton, chanderi, silk and rayon, chosen for how they wear and move, not just how they photograph.',
  },
  {
    icon: BadgeCheck,
    title: 'Quality Checked',
    body: 'Every piece is checked for stitching, fit and finish before it ships — nothing goes out unseen.',
  },
  {
    icon: Repeat2,
    title: 'Always Evolving',
    body: 'New prints, cuts and jewellery pieces every season, alongside the styles that stay in the collection.',
  },
];

export default async function AboutPage() {
  const communityImages = await getCommunityImages();

  return (
    <div className="bg-[hsl(var(--pb-ivory))]">
      <section className="relative flex min-h-[52vh] items-center justify-center overflow-hidden bg-[hsl(var(--pb-wine))] px-6 py-24 text-center">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-16 -top-16 h-80 w-80 rounded-full bg-[hsl(var(--pb-rose))] blur-3xl" />
          <div className="absolute -bottom-16 -right-16 h-80 w-80 rounded-full bg-[hsl(var(--pb-gold))] blur-3xl" />
        </div>
        <div className="relative">
          <Monogram className="mx-auto h-10 w-10 text-[hsl(var(--pb-gold))]" />
          <p className="text-eyebrow mt-5 text-[hsl(var(--pb-gold-soft))]">Our Story</p>
          <h1 className="mt-3 text-display-xl italic text-white">Designed by us, made to be worn</h1>
          <p className="mx-auto mt-5 max-w-lg text-white/70">
            PariBelle is a Jaipur studio designing our own kurtis and artificial jewellery — pieces
            we'd actually want to wear, not just sell.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-20 md:px-8">
        <RevealOnScroll>
          <p className="text-lg leading-relaxed text-[hsl(var(--pb-ink-muted))]">
            We started because we kept wanting kurtis that felt considered — prints and cuts that
            were ours, not whatever was already on the rack everywhere else. So we started designing
            them ourselves, choosing the fabrics, and building out a jewellery line to go with them.
          </p>
          <Divider variant="gold-flourish" className="my-10" />
          <p className="text-lg leading-relaxed text-[hsl(var(--pb-ink-muted))]">
            That is still how it works. Every print and silhouette starts with us, gets checked for
            fit and finish before it ships, and the collection keeps growing — new pieces every
            season, alongside the ones that earn their place for longer.
          </p>
        </RevealOnScroll>
      </section>

      {/* Moved from the homepage as part of Task 6 — the front page's job is
          now getting a shopper to a product, not carrying the brand story. */}
      <EditorialSplit ctaHref="/category/new-in" ctaLabel="Shop New In" />

      <section className="bg-[hsl(var(--pb-blush-wash))]">
        <div className="mx-auto max-w-7xl px-6 py-20 md:px-8">
          <SectionHeading eyebrow="What we make" title="How each piece comes together" align="center" showRule />
          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {CRAFTS.map(({ icon: Icon, title, body }, i) => (
              <RevealOnScroll key={title} delayMs={i * 80}>
                <Icon className="h-7 w-7 text-[hsl(var(--pb-gold))]" strokeWidth={1.5} />
                <h2 className="mt-4 font-display text-xl text-[hsl(var(--pb-ink))]">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-[hsl(var(--pb-ink-muted))]">{body}</p>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </section>

      <CommunityGrid images={communityImages} />

      <section className="mx-auto max-w-3xl px-6 py-20 text-center md:px-8">
        <RevealOnScroll>
          <p className="text-eyebrow text-[hsl(var(--pb-rose-deep))]">Come and look</p>
          <h2 className="mt-3 text-display-lg text-[hsl(var(--pb-ink))]">
            See the current collection
          </h2>
          <p className="mx-auto mt-4 max-w-md text-[hsl(var(--pb-ink-muted))]">
            Start with the kurtis, or the jewellery designed to go with them.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/category/kurtis">
              <Button>Shop Kurtis</Button>
            </Link>
            <Link href="/category/jewellery">
              <Button variant="gold-outline">Shop Jewellery</Button>
            </Link>
          </div>
        </RevealOnScroll>
      </section>

    </div>
  );
}
