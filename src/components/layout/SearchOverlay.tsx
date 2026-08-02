'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { X, Clock } from 'lucide-react';
import SearchWithSuggestions from '@/components/SearchWithSuggestions';
import { useFocusTrap } from '@/components/ui/useFocusTrap';

const RECENT_KEY = 'paribelle_recent_searches';
const TRENDING = ['Kurtis', 'Jewellery', 'New In', 'Festive Edit', 'Under ₹1500'];

function getRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}

function pushRecent(query: string) {
  const recent = getRecent().filter((q) => q.toLowerCase() !== query.toLowerCase());
  const next = [query, ...recent].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const [mounted, setMounted] = React.useState(false);
  const [recent, setRecent] = React.useState<string[]>([]);
  const containerRef = useFocusTrap(open, onClose);

  React.useEffect(() => setMounted(true), []);
  React.useEffect(() => {
    if (open) setRecent(getRecent());
  }, [open]);

  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const go = (q: string) => {
    pushRecent(q);
    onClose();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-[hsl(var(--pb-wine-deep)/0.5)] backdrop-blur-sm pb-anim-fade-in" onClick={onClose} />
      <div
        ref={containerRef}
        className="pb-anim-slide-bottom absolute inset-x-0 top-0 max-h-[80vh] overflow-y-auto bg-[hsl(var(--pb-ivory))] shadow-pb-lg"
      >
        <div className="mx-auto max-w-2xl px-6 py-8 md:px-0">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-eyebrow text-[hsl(var(--pb-rose-deep))]">Search PariBelle</p>
            <button onClick={onClose} aria-label="Close search" className="rounded-full p-2 hover:bg-[hsl(var(--pb-shell))]">
              <X className="h-5 w-5 text-[hsl(var(--pb-ink-muted))]" />
            </button>
          </div>

          <SearchWithSuggestions
            placeholder="Search kurtis, jewellery, collections…"
            onSearch={go}
          />

          {recent.length > 0 && (
            <div className="mt-8">
              <p className="mb-3 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-[hsl(var(--pb-ink-faint))]">
                <Clock className="h-3.5 w-3.5" /> Recent
              </p>
              <div className="flex flex-wrap gap-2">
                {recent.map((q) => (
                  <button
                    key={q}
                    onClick={() => go(q)}
                    className="rounded-full border border-[hsl(var(--pb-linen))] px-3.5 py-1.5 text-sm text-[hsl(var(--pb-ink-muted))] hover:border-[hsl(var(--pb-rose))] hover:text-[hsl(var(--pb-rose-deep))] transition-colors duration-150"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-[hsl(var(--pb-ink-faint))]">Trending</p>
            <div className="flex flex-wrap gap-2">
              {TRENDING.map((q) => (
                <button
                  key={q}
                  onClick={() => go(q)}
                  className="rounded-full bg-[hsl(var(--pb-blush-wash))] px-3.5 py-1.5 text-sm text-[hsl(var(--pb-rose-ink))] hover:bg-[hsl(var(--pb-gold-soft)/0.4)] transition-colors duration-150"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
