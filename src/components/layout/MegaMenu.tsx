'use client';

import Link from 'next/link';
import { getImageUrl } from '@/lib/image-url';
import type { Category } from '@/types/product';

export interface MegaMenuProps {
  category: Category;
  onNavigate: () => void;
}

/**
 * The panel used to be a fixed 60rem / 4-column grid no matter how many
 * children a category had. Production's categories carry two or three
 * children each, so the panel rendered mostly empty ivory with a placeholder
 * image at the edge — reported as "a useless wide white screen". Sizing the
 * column count (and therefore the panel width, via its parent's `w-fit`) to
 * the actual number of children fixes that without touching the design once
 * a category does have enough children to fill it.
 */
export function MegaMenu({ category, onNavigate }: MegaMenuProps) {
  const children = category.children || [];

  // One column per 6 links, capped at 3 — a category with 2 children gets a
  // single compact column instead of 3 columns with one link each.
  const columnCount = Math.max(1, Math.min(3, Math.ceil(children.length / 6)));
  const columns: Category[][] = Array.from({ length: columnCount }, () => []);
  children.forEach((child, i) => columns[i % columnCount].push(child));

  const showImage = !!category.image;

  return (
    // A rounded panel rather than a full-width band: it hangs off the floating
    // nav pill, so it has to read as part of the same object. `w-fit` lets it
    // shrink to its content instead of always claiming the full 60rem.
    <div className="w-fit overflow-hidden rounded-3xl border border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-ivory)/0.97)] shadow-pb-lg backdrop-blur-xl">
      <div className="flex gap-8 px-8 py-8">
        {columns.map((col, i) => (
          <div key={i} className="w-48 space-y-3">
            {col.map((child) => (
              <Link
                key={child.id}
                href={`/category/${child.slug}`}
                onClick={onNavigate}
                className="block text-sm text-[hsl(var(--pb-ink-muted))] hover:text-[hsl(var(--pb-rose-deep))] transition-colors duration-150"
              >
                {child.name}
              </Link>
            ))}
          </div>
        ))}
        {/* No placeholder tile when the category has no image — an empty
            frame or broken-image icon is worse than not showing one at all. */}
        {showImage && (
          <Link
            href={`/category/${category.slug}`}
            onClick={onNavigate}
            className="group relative block w-48 aspect-[4/5] overflow-hidden rounded-2xl"
          >
            <img
              src={getImageUrl(category.image)}
              alt={category.name}
              className="h-full w-full object-cover transition-transform duration-700 ease-pb group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--pb-wine-deep)/0.6)] to-transparent" />
            <span className="absolute bottom-4 left-4 font-display text-lg text-white">{category.name}</span>
          </Link>
        )}
      </div>
    </div>
  );
}
