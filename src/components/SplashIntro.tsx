'use client';

import * as React from 'react';

/**
 * The opening curtain: a full-screen blush field with the PariBelle wordmark
 * centred, which then flies up and shrinks into its resting place in the
 * header while the field dissolves to reveal the page.
 *
 * It exists to cover the second or two of product and hero imagery arriving,
 * which otherwise reads as a half-built page. The curtain is *opaque and
 * simply sits on top* rather than hiding the content beneath it — page
 * content is never given `opacity: 0`, so a JS error mid-animation can leave
 * a stuck overlay at worst, never a permanently blank site.
 *
 * The movement is a FLIP: the copy is positioned at the real wordmark's
 * measured rect and *starts* transformed out to the centre of the viewport
 * at `BIG_SCALE`, then transitions that transform away to nothing. Animating
 * a transform (rather than `font-size`/`top`) keeps it on the compositor, and
 * landing on `scale(1)` at the measured rect means the copy comes to rest
 * exactly over the real wordmark — so revealing the real one and dropping
 * the copy is invisible.
 */

/** How long the wordmark holds centre stage before it starts moving. */
const HOLD_MS = 650;
/** The flight itself: centre of the viewport into the header. */
const FLY_MS = 1000;
/** The blush field starts dissolving slightly into the flight, not with it. */
const VEIL_DELAY_MS = 150;
const VEIL_MS = 850;
/** Once the copy has landed there is nothing left to show. */
const TEARDOWN_MS = HOLD_MS + FLY_MS + 120;
/** Anyone who asked for less motion gets a brief field and no flight at all. */
const REDUCED_HOLD_MS = 420;

/**
 * A single constant rather than a breakpoint-dependent one on purpose: it
 * multiplies the header wordmark's own responsive size (24px / 30px from
 * `md:`), so it is already responsive — and a value read from `window`
 * would differ between the server render and hydration, which is a mismatch
 * and a visible jump on the first frame.
 */
const BIG_SCALE = 2.7;

/** `useLayoutEffect` warns when React renders on the server; this is the usual shim. */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

interface Flip {
  left: number;
  top: number;
  dx: number;
  dy: number;
}

export function SplashIntro() {
  // Starts `true` so the curtain is part of the server-rendered HTML and is
  // therefore painted in the very first frame. Anything that waited for an
  // effect would flash the unfinished page first, which is the entire thing
  // this component exists to prevent.
  const [visible, setVisible] = React.useState(true);
  const [flip, setFlip] = React.useState<Flip | null>(null);
  const [flying, setFlying] = React.useState(false);

  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let raf1 = 0;
    let raf2 = 0;

    // Nothing behind the curtain should scroll out from under it.
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    // Suppresses the real wordmark for the duration (see globals.css) so it
    // doesn't show through, doubled, once the field starts dissolving.
    root.classList.add('pb-intro-active');

    const restore = () => {
      root.style.overflow = previousOverflow;
      root.classList.remove('pb-intro-active');
    };
    const finish = () => {
      restore();
      setVisible(false);
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const target = document.querySelector<HTMLElement>('[data-pb-wordmark]');

    if (reduced || !target) {
      // No target means no landing spot to fly to (a layout without the
      // storefront header) — hold briefly, then just dissolve in place.
      timers.push(
        setTimeout(() => {
          root.classList.remove('pb-intro-active');
          setFlying(true);
        }, REDUCED_HOLD_MS),
      );
      timers.push(setTimeout(finish, REDUCED_HOLD_MS + VEIL_DELAY_MS + VEIL_MS));
      return () => {
        timers.forEach(clearTimeout);
        restore();
      };
    }

    const rect = target.getBoundingClientRect();
    setFlip({
      left: rect.left,
      top: rect.top,
      // Delta from the element's own centre to the viewport's — applied
      // before the scale, with a centre transform-origin, so the copy ends
      // up dead centre and enlarged about that point.
      dx: window.innerWidth / 2 - (rect.left + rect.width / 2),
      dy: window.innerHeight / 2 - (rect.top + rect.height / 2),
    });

    // Two frames: the first commits the measured start transform, the second
    // schedules the flip to the resting one. Collapsing this into a single
    // frame lets the browser coalesce both into one style recalculation and
    // skip the transition entirely.
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        timers.push(setTimeout(() => setFlying(true), HOLD_MS));
      });
    });

    // The real wordmark comes back exactly as the copy lands on it.
    timers.push(setTimeout(() => root.classList.remove('pb-intro-active'), HOLD_MS + FLY_MS));
    timers.push(setTimeout(finish, TEARDOWN_MS));

    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      restore();
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[400] overflow-hidden"
      style={{
        backgroundColor: 'hsl(var(--pb-blush-wash))',
        opacity: flying ? 0 : 1,
        transition: `opacity ${VEIL_MS}ms var(--ease-pb) ${VEIL_DELAY_MS}ms`,
        // Stops the curtain swallowing a click aimed at the page it is
        // already fading out of.
        pointerEvents: flying ? 'none' : 'auto',
      }}
    >
      <span
        className="whitespace-nowrap px-3 py-1 font-logo text-2xl tracking-wide text-[hsl(var(--pb-ink))] md:text-3xl"
        style={
          flip
            ? {
                position: 'fixed',
                left: flip.left,
                top: flip.top,
                transformOrigin: 'center',
                transform: flying
                  ? 'translate(0px, 0px) scale(1)'
                  : `translate(${flip.dx}px, ${flip.dy}px) scale(${BIG_SCALE})`,
                transition: flying ? `transform ${FLY_MS}ms var(--ease-pb)` : undefined,
              }
            : {
                // Pre-measurement (the server render and the first client
                // frame): centred by pure CSS at the same visual size the
                // measured start state resolves to, so swapping between them
                // is not a visible jump.
                position: 'fixed',
                left: '50%',
                top: '50%',
                transform: `translate(-50%, -50%) scale(${BIG_SCALE})`,
              }
        }
      >
        PariBelle
      </span>
    </div>
  );
}
