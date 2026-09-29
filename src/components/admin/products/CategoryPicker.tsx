'use client';

import { useEffect, useState } from 'react';

import { api } from '@/lib/api';

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  level: number;
}

function flatten(nodes: any[], level = 0, parentId: string | null = null): CategoryNode[] {
  return (nodes ?? []).flatMap((n) => [
    { id: n.id, name: n.name, slug: n.slug, parentId, level },
    ...flatten(n.children ?? [], level + 1, n.id),
  ]);
}

let cache: Promise<CategoryNode[]> | null = null;

/** The category tree, flattened, fetched once per page load. */
export function useCategories() {
  const [list, setList] = useState<CategoryNode[] | null>(null);
  useEffect(() => {
    if (!cache) {
      cache = api.get<any[]>('/categories/tree/all').then((t) => flatten(t ?? []));
      cache.catch(() => {
        cache = null;
      });
    }
    let live = true;
    cache.then((l) => live && setList(l)).catch(() => live && setList([]));
    return () => {
      live = false;
    };
  }, []);
  return list;
}

/** Forget the cached tree, after categories are added or renamed. */
export function resetCategoryCache() {
  cache = null;
}

function ancestors(id: string, all: CategoryNode[]) {
  const out: string[] = [];
  let cur = all.find((c) => c.id === id);
  while (cur?.parentId) {
    out.unshift(cur.parentId);
    cur = all.find((c) => c.id === cur!.parentId);
  }
  return out;
}

function descendants(id: string, all: CategoryNode[]): string[] {
  return all.filter((c) => c.parentId === id).flatMap((c) => [c.id, ...descendants(c.id, all)]);
}

/**
 * Where a product sits in the shop: one path down the tree, e.g. Kurtis then
 * Anarkali. Picking a sub-category brings its parent along, since the parent
 * is what decides the GST rate and the shop's top-level menu.
 */
export function CategoryPicker({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const all = useCategories();

  if (!all) return <p className="muted text-sm">Loading categories...</p>;
  if (all.length === 0) return <p className="muted text-sm">No categories yet. Add them under Products, Categories.</p>;

  const selected = new Set(value);

  function pick(c: CategoryNode) {
    if (selected.has(c.id)) {
      const drop = new Set([c.id, ...descendants(c.id, all!)]);
      onChange(value.filter((id) => !drop.has(id)));
    } else {
      onChange([...ancestors(c.id, all!), c.id]);
    }
  }

  const roots = all.filter((c) => c.level === 0);
  // Show the children of every selected category, one row per level.
  const rows: CategoryNode[][] = [roots];
  let parent = roots.find((r) => selected.has(r.id));
  while (parent) {
    const kids = all.filter((c) => c.parentId === parent!.id);
    if (kids.length === 0) break;
    rows.push(kids);
    parent = kids.find((k) => selected.has(k.id));
  }

  return (
    <div className="space-y-2.5">
      {rows.map((row, i) => (
        <div key={i}>
          {i > 0 ? <div className="muted mb-1.5 text-[11px] font-medium">{i === 1 ? 'Type' : 'More specific'}</div> : null}
          <div className="flex flex-wrap gap-1.5">
            {row.map((c) => {
              const on = selected.has(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => pick(c)}
                  aria-pressed={on}
                  className="rounded-full border px-3 py-1.5 text-[13px] transition-colors"
                  style={
                    on
                      ? { borderColor: 'var(--pom-accent)', background: 'var(--pom-accent-soft)', color: 'var(--pom-accent-ink)', fontWeight: 600 }
                      : { borderColor: 'var(--pom-border-strong)', color: 'var(--pom-text)' }
                  }
                >
                  {c.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
