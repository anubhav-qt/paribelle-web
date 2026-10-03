'use client';

import { useEffect, useState } from 'react';

/**
 * Keeps an overlay mounted long enough to animate out.
 *
 * `mounted` follows `open` going true immediately and going false only after
 * `exitMs`; `shown` is what styles should key off. It flips true two frames
 * after mounting, so the closed state is painted first and the opening is a
 * real transition rather than a jump, and flips false the moment `open` does,
 * so the exit plays while the element is still in the tree.
 */
export function usePresence(open: boolean, exitMs: number) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setShown(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }

    setShown(false);
    const timer = setTimeout(() => setMounted(false), exitMs);
    return () => clearTimeout(timer);
  }, [open, exitMs]);

  return { mounted, shown };
}
