import Link from 'next/link';
import { EditorialImage } from '@/components/brand/EditorialImage';
import { RevealOnScroll } from '@/components/brand/RevealOnScroll';
import { getImageUrl } from '@/lib/image-url';
import type { Category } from '@/types/product';

export function CategoryPortals({ categories }: { categories: Category[] }) {
  const portals = categories.slice(0, 5);
  if (portals.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 md:px-8">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-6">
        {portals.map((cat, i) => (
          <RevealOnScroll key={cat.id} delayMs={i * 60}>
            <Link href={`/category/${cat.slug}`} className="group block">
              <EditorialImage
                src={getImageUrl(cat.image)}
                alt={cat.name}
                aspect="3 / 4"
                mask="arch"
                sizes="(max-width: 768px) 45vw, 20vw"
                className="transition-transform duration-500 ease-pb group-hover:-translate-y-1"
              />
              <p className="mt-3 text-center font-display text-lg text-[hsl(var(--pb-ink))]">{cat.name}</p>
            </Link>
          </RevealOnScroll>
        ))}
      </div>
    </section>
  );
}
