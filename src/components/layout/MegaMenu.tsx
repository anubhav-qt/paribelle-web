'use client';

import Link from 'next/link';
import { getImageUrl } from '@/lib/image-url';
import type { Category } from '@/types/product';

export interface MegaMenuProps {
  category: Category;
  onNavigate: () => void;
}

export function MegaMenu({ category, onNavigate }: MegaMenuProps) {
  const children = category.children || [];
  const columns: Category[][] = [[], [], []];
  children.forEach((child, i) => columns[i % 3].push(child));

  return (
    // A rounded panel rather than a full-width band: it hangs off the floating
    // nav pill, so it has to read as part of the same object.
    <div className="overflow-hidden rounded-3xl border border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-ivory)/0.97)] shadow-pb-lg backdrop-blur-xl">
      <div className="grid grid-cols-4 gap-8 px-8 py-8">
        {columns.map((col, i) => (
          <div key={i} className="space-y-3">
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
        <Link
          href={`/category/${category.slug}`}
          onClick={onNavigate}
          className="group relative col-span-1 block aspect-[4/5] overflow-hidden rounded-2xl"
        >
          <img
            src={getImageUrl(category.image)}
            alt={category.name}
            className="h-full w-full object-cover transition-transform duration-700 ease-pb group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--pb-wine-deep)/0.6)] to-transparent" />
          <span className="absolute bottom-4 left-4 font-display text-lg text-white">{category.name}</span>
        </Link>
      </div>
    </div>
  );
}
