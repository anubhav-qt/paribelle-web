'use client';

import * as React from 'react';

// Anything genuinely operable — not a heuristic on computed `cursor` (button
// elements don't get `cursor: pointer` from any browser's default styles,
// and this codebase doesn't set it everywhere either, so that check would
// silently miss most buttons). Matching by role instead reaches every
// interactive element site-wide with no per-component opt-in required.
const INTERACTIVE_SELECTOR =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), ' +
  'textarea:not(:disabled), label, summary, [role="button"], [tabindex]:not([tabindex="-1"])';

/**
 * A custom cursor that keeps the ordinary arrow silhouette — ivory fill,
 * rose outline — rather than inventing a new shape, so it still reads as
 * "a cursor" at a glance. It replaces the native OS pointer across the
 * storefront only for the fill swap: solid rose the moment the pointer
 * lands on anything hoverable or selectable, back to ivory the moment it
 * leaves. One state, one rule; nothing about the arrow's shape or size
 * changes, only which color is inside it.
 *
 * Position tracking mirrors the smoothing technique in FabricWeaveHero: a
 * raw pointer target is lerped toward each animation frame and written
 * directly to the outer DOM node's `transform`, rather than driving a
 * per-frame React re-render via setState. The lerp factor here (0.4) is
 * snappier than the hero's background-effect smoothing (0.15) — this
 * element is used to aim clicks, so it needs to read as responsive, not
 * laggy. The fill toggle is a separate, much rarer update, applied via a
 * plain DOM attribute on the inner dot rather than React state, so hovering
 * doesn't re-render anything either.
 *
 * Skipped entirely on touch/coarse pointers (same `hover: hover and
 * pointer: fine` gate used elsewhere in the codebase) and, under
 * prefers-reduced-motion, snaps straight to the pointer position instead of
 * lerping — it can still show, just without the motion.
 */
export function CustomCursor() {
  const cursorRef = React.useRef<HTMLDivElement>(null);
  const dotRef = React.useRef<SVGSVGElement>(null);
  const [supported, setSupported] = React.useState(false);

  React.useEffect(() => {
    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!supportsHover) return;
    setSupported(true);
  }, []);

  React.useEffect(() => {
    if (!supported) return;
    const el = cursorRef.current;
    const dot = dotRef.current;
    if (!el || !dot) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.body.classList.add('pb-custom-cursor-active');

    const target = { x: 0, y: 0 };
    const rendered = { x: 0, y: 0 };
    let hasPosition = false;
    let rafId: number | null = null;

    const applyTransform = (x: number, y: number) => {
      el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    };

    const loop = () => {
      if (prefersReducedMotion) {
        rendered.x = target.x;
        rendered.y = target.y;
      } else {
        rendered.x += (target.x - rendered.x) * 0.4;
        rendered.y += (target.y - rendered.y) * 0.4;
      }
      applyTransform(rendered.x, rendered.y);
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);

    const onPointerMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!hasPosition) {
        hasPosition = true;
        rendered.x = target.x;
        rendered.y = target.y;
        applyTransform(rendered.x, rendered.y);
        el.style.opacity = '1';
      }
    };

    // Delegated on `document` rather than attached per-target: the set of
    // links/buttons on a page changes constantly (pagination, filters,
    // infinite scroll), and a single listener here needs no wiring-up when
    // new ones mount.
    const onPointerOver = (e: PointerEvent) => {
      const target = e.target as Element | null;
      dot.dataset.cursorActive = String(!!target?.closest(INTERACTIVE_SELECTOR));
    };

    const onPointerEnter = () => {
      if (hasPosition) el.style.opacity = '1';
    };
    const onPointerLeave = () => {
      el.style.opacity = '0';
    };

    window.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerover', onPointerOver);
    document.documentElement.addEventListener('pointerenter', onPointerEnter);
    document.documentElement.addEventListener('pointerleave', onPointerLeave);

    return () => {
      document.body.classList.remove('pb-custom-cursor-active');
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerover', onPointerOver);
      document.documentElement.removeEventListener('pointerenter', onPointerEnter);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [supported]);

  if (!supported) return null;

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[100] opacity-0"
      style={{ willChange: 'transform' }}
    >
      {/* A plain arrow silhouette with a near-vertical left edge — the
          shape an OS pointer actually has — rather than lucide's
          MousePointer2, whose whole body leans hard to the right and
          reads as "slanted" instead of "a cursor". Tip sits at (5,3) in
          this 24x24 viewBox; `.pb-cursor-arrow` (globals.css) offsets the
          element by that same (-5px, -3px) so the tip — not the shape's
          center — lands on the actual pointer position, the way a real
          cursor's hotspot works. */}
      <svg
        ref={dotRef}
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="pb-cursor-arrow"
      >
        <path d="M5 3 L5 17.5 L8.5 14.3 L11.2 20.5 L13.5 19.5 L10.9 13.4 L16 13.4 Z" />
      </svg>
    </div>
  );
}
