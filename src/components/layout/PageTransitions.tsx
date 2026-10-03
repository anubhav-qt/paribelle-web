'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Never hold the old page frozen on screen for longer than this waiting on a
 * slow route; past it the transition plays out and the page lands when ready.
 */
const MAX_WAIT_MS = 2500;

/** A frame comes within ~16ms normally; past this, the snapshot isn't coming. */
const SNAPSHOT_TIMEOUT_MS = 300;

/** Controls that sit inside a link but do their own thing (a card's wishlist heart). */
const NESTED_CONTROL = 'button, input, select, textarea, label, summary, [role="button"]';

// useLayoutEffect warns during the server render; there is nothing to do there.
const useClientLayoutEffect = typeof window === 'undefined' ? React.useEffect : React.useLayoutEffect;

/**
 * Route-change transitions through the View Transitions API: the browser
 * snapshots the page, the navigation happens, and globals.css crossfades
 * from the old snapshot to the new page.
 *
 * In-site link clicks are picked up in the capture phase, before next/link's
 * own handler, which stands down once the click is marked handled — the
 * router.push happens here instead, inside the transition. The link's own
 * onClick (closing the menu, say) still runs as normal. Anything that isn't a
 * plain left click to another page of this app is left alone, as are browsers
 * without the API and visitors who prefer reduced motion.
 */
export function PageTransitions() {
  const router = useRouter();
  const pathname = usePathname();
  const settle = React.useRef<(() => void) | null>(null);

  // The new route has committed: let the browser capture it and animate.
  useClientLayoutEffect(() => {
    settle.current?.();
    settle.current = null;
  }, [pathname]);

  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!('startViewTransition' in document)) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const target = event.target as Element | null;
      const link = target?.closest?.('a[href]') as HTMLAnchorElement | null;
      if (!link || (link.target && link.target !== '_self') || link.hasAttribute('download')) return;
      // A button inside the link: its own handler decides, and this capture
      // listener runs before it could stop the navigation.
      const control = target?.closest(NESTED_CONTROL);
      if (control && link.contains(control)) return;

      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // Same page (a hash or query change) — nothing to transition between.
      if (url.pathname === window.location.pathname) return;
      // Not routes of this app: the API, and the OMS behind a rewrite.
      if (url.pathname.startsWith('/api') || url.pathname.startsWith('/pom')) return;

      event.preventDefault();
      settle.current?.();

      let navigated = false;
      const transition = document.startViewTransition(
        () =>
          new Promise<void>((resolve) => {
            navigated = true;
            settle.current = resolve;
            router.push(url.pathname + url.search + url.hash);
            window.setTimeout(resolve, MAX_WAIT_MS);
          })
      );
      // The browser waits for a frame to snapshot the old page before it
      // runs the update. If no frame comes (a throttled or backgrounded tab),
      // skipping runs the update — and so the navigation — straight away
      // rather than never.
      window.setTimeout(() => {
        if (!navigated) transition.skipTransition();
      }, SNAPSHOT_TIMEOUT_MS);
      transition.ready.catch(() => {});
      transition.finished.catch(() => {});
    };

    window.addEventListener('click', onClick, true);
    return () => window.removeEventListener('click', onClick, true);
  }, [router]);

  return null;
}
