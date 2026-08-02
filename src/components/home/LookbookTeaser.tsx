import Link from 'next/link';
import { Monogram } from '@/components/brand/Monogram';
import { Button } from '@/components/ui/Button';
import { RevealOnScroll } from '@/components/brand/RevealOnScroll';

export function LookbookTeaser() {
  return (
    <section className="relative flex h-[60vh] items-center justify-center overflow-hidden bg-[hsl(var(--pb-wine))] px-6 text-center">
      <div className="absolute inset-0 opacity-20">
        <div className="absolute -left-10 -top-10 h-72 w-72 rounded-full bg-[hsl(var(--pb-rose))] blur-3xl" />
        <div className="absolute -bottom-10 -right-10 h-72 w-72 rounded-full bg-[hsl(var(--pb-gold))] blur-3xl" />
      </div>
      <RevealOnScroll className="relative">
        <Monogram className="mx-auto h-10 w-10 text-[hsl(var(--pb-gold))]" />
        <p className="text-eyebrow mt-4 text-[hsl(var(--pb-gold-soft))]">The Lookbook</p>
        <h2 className="mt-3 text-display-xl italic text-white">Styled for the Season</h2>
        <p className="mx-auto mt-4 max-w-md text-white/70">
          Curated looks pairing our kurtis with jewellery designed to go with them — shop the story, piece by piece.
        </p>
        <Link href="/lookbook" className="mt-8 inline-block">
          <Button variant="gold-outline" className="border-white/40 text-white hover:bg-white/10">
            Explore the Lookbook
          </Button>
        </Link>
      </RevealOnScroll>
    </section>
  );
}
