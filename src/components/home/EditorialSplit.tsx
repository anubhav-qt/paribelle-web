import Link from 'next/link';
import { Monogram } from '@/components/brand/Monogram';
import { RevealOnScroll } from '@/components/brand/RevealOnScroll';
import { Button } from '@/components/ui/Button';
import { Divider } from '@/components/ui/Divider';

export interface EditorialSplitProps {
  /** Defaults suit the homepage teaser; /about passes its own since it can't link to itself. */
  ctaHref?: string;
  ctaLabel?: string;
}

export function EditorialSplit({ ctaHref = '/about', ctaLabel = 'Our Story' }: EditorialSplitProps) {
  return (
    <section className="bg-[hsl(var(--pb-blush-wash))]">
      <div className="mx-auto grid max-w-7xl items-center gap-0 md:grid-cols-2">
        {/* Placeholder panel — swap for brand photography in public/brand/editorial/ */}
        <div className="flex aspect-square items-center justify-center bg-gradient-to-br from-[hsl(var(--pb-rose)/0.25)] via-[hsl(var(--pb-gold-soft)/0.3)] to-[hsl(var(--pb-blush-wash))] md:aspect-auto md:h-full">
          <Monogram className="h-24 w-24 text-[hsl(var(--pb-rose-deep))] opacity-60" />
        </div>
        <RevealOnScroll className="px-6 py-16 md:px-16">
          <p className="text-eyebrow text-[hsl(var(--pb-rose-deep))]">Our Design</p>
          <h2 className="mt-3 text-display-lg text-[hsl(var(--pb-ink))]">
            Every piece starts with us
          </h2>
          <Divider variant="gold-flourish" className="my-6 justify-start" />
          <p className="max-w-md text-[hsl(var(--pb-ink-muted))]">
            Each PariBelle kurti is our own print and silhouette, checked for fit and finish
            before it ships. We pair considered fabrics with modern cuts, so every piece feels
            as good as it looks.
          </p>
          <Link href={ctaHref} className="mt-8 inline-block">
            <Button variant="gold-outline">{ctaLabel}</Button>
          </Link>
        </RevealOnScroll>
      </div>
    </section>
  );
}
