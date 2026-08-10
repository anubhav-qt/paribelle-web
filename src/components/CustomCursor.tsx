'use client';

import * as React from 'react';

/**
 * A soft, small circular cursor that replaces the native OS pointer across
 * the storefront for a more premium feel — filled ivory, bordered in the
 * site's rose accent.
 *
 * Position tracking mirrors the smoothing technique in FabricWeaveHero: a
 * raw pointer target is lerped toward each animation frame and written
 * directly to the DOM node's `transform`, rather than driving a per-frame
 * React re-render via setState. The lerp factor here (0.4) is snappier than
 * the hero's background-effect smoothing (0.15) — this element is used to
 * aim clicks, so it needs to read as responsive, not laggy.
 *
 * Skipped entirely on touch/coarse pointers (same `hover: hover and
 * pointer: fine` gate used elsewhere in the codebase) and, under
 * prefers-reduced-motion, snaps straight to the pointer position instead of
 * lerping — it can still show, just without the motion.
 */
export function CustomCursor() {
  const cursorRef = React.useRef<HTMLDivElement>(null);
  const [supported, setSupported] = React.useState(false);

  React.useEffect(() => {
    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (!supportsHover) return;
    setSupported(true);
  }, []);

  React.useEffect(() => {
    if (!supported) return;
    const el = cursorRef.current;
    if (!el) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    document.body.classList.add('pb-custom-cursor-active');

    const target = { x: 0, y: 0 };
    const rendered = { x: 0, y: 0 };
    let hasPosition = false;
    let rafId: number | null = null;

    const applyTransform = (x: number, y: number) => {
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
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

    const onPointerEnter = () => {
      if (hasPosition) el.style.opacity = '1';
    };
    const onPointerLeave = () => {
      el.style.opacity = '0';
    };

    window.addEventListener('pointermove', onPointerMove);
    document.documentElement.addEventListener('pointerenter', onPointerEnter);
    document.documentElement.addEventListener('pointerleave', onPointerLeave);

    return () => {
      document.body.classList.remove('pb-custom-cursor-active');
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('pointerenter', onPointerEnter);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
    };
  }, [supported]);

  if (!supported) return null;

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[100] h-4 w-4 rounded-full border-2 border-[hsl(var(--pb-rose))] bg-[hsl(var(--pb-ivory))] opacity-0 transition-opacity duration-200"
      style={{ willChange: 'transform' }}
    />
  );
}
