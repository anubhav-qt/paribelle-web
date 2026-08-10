'use client';

import * as React from 'react';
import Image from 'next/image';

// An organic, hand-drawn-feeling outline rather than a rounded rectangle —
// four different corner radii blended on each axis so the curve reads as
// irregular but still smooth. The inner clip is the same formula pulled in a
// few points, so the blush mat shows as an even, consistent ring all the way
// round instead of a rectangular border.
const BLOB_OUTER = '62% 38% 55% 45% / 48% 62% 38% 52%';
const BLOB_INNER = '58% 42% 51% 49% / 45% 58% 42% 55%';

/**
 * The hero — the headline on the left, the campaign photo on the right in a
 * soft blush-pink organic frame, both sitting over a woven-thread canvas
 * that spans the whole section (including the empty ground around the
 * frame). The photo's mat is opaque, so the weave shows through the
 * whitespace around it, never through the photo itself.
 *
 * The weave is a plain 2D canvas sine field, not per-thread DOM/SVG nodes —
 * a few hundred animated elements is what makes woven-pattern heroes janky.
 * It pauses via IntersectionObserver once scrolled out of view, and renders a
 * single static frame under `prefers-reduced-motion: reduce` rather than a
 * blank background.
 *
 * Hovering bows the threads away from the cursor, lens-like. Position tracks
 * the pointer with no easing — any lerp on x/y reads as lag between the
 * cursor and the distortion, which is exactly what this should not have.
 * Only the influence (how strongly the lens is "on") still fades in from a
 * hover-start ripple, or the effect would pop on with a hard edge.
 */
export function FabricWeaveHero() {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const supportsHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let rafId: number | null = null;
    let visible = true;
    let t = 0;

    const pointer = { x: 0, y: 0, active: false };
    // Position is applied straight from the pointer every frame — no lerp —
    // so the bulge sits exactly under the cursor with zero spatial lag.
    const rendered = { x: 0, y: 0, influence: 0 };

    const resize = () => {
      width = container.clientWidth;
      height = container.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Thread colours pulled from the store's own palette, at low alpha so the
    // headline and photo stay comfortably readable over the busiest frame.
    const WARP_COLOR = 'hsla(349, 48%, 70%, 0.20)'; // --pb-rose
    const WEFT_COLOR = 'hsla(38, 38%, 59%, 0.16)'; // --pb-gold

    const DISTORT_RADIUS = 180;
    const DISTORT_STRENGTH = 13;

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const warpCount = 70;
      const weftCount = 46;
      const amplitude = 10;
      const freq = 0.015;
      const { x: px, y: py, influence } = rendered;

      // Pushes a point on the thread away from the cursor with a gaussian
      // falloff — a lens bulge, not a hard-edged bend.
      const distort = (x: number, y: number): [number, number] => {
        if (influence <= 0.001) return [x, y];
        const dx = x - px;
        const dy = y - py;
        const distSq = dx * dx + dy * dy;
        const falloff = Math.exp(-distSq / (2 * DISTORT_RADIUS * DISTORT_RADIUS));
        if (falloff < 0.001) return [x, y];
        const dist = Math.sqrt(distSq) || 0.0001;
        const push = influence * falloff * DISTORT_STRENGTH;
        return [x + (dx / dist) * push, y + (dy / dist) * push];
      };

      // Warp threads: mostly vertical, drifting horizontally.
      ctx.strokeStyle = WARP_COLOR;
      ctx.lineWidth = 1;
      for (let i = 0; i < warpCount; i++) {
        const baseX = (i / warpCount) * (width + 80) - 40;
        ctx.beginPath();
        for (let y = 0; y <= height; y += 8) {
          const x = baseX + Math.sin(y * freq + time * 0.0004 + i) * amplitude;
          const [dx, dy] = distort(x, y);
          if (y === 0) ctx.moveTo(dx, dy);
          else ctx.lineTo(dx, dy);
        }
        ctx.stroke();
      }

      // Weft threads: mostly horizontal, drifting vertically.
      ctx.strokeStyle = WEFT_COLOR;
      for (let i = 0; i < weftCount; i++) {
        const baseY = (i / weftCount) * (height + 80) - 40;
        ctx.beginPath();
        for (let x = 0; x <= width; x += 8) {
          const y = baseY + Math.sin(x * freq + time * 0.0003 + i * 1.7) * amplitude;
          const [dx, dy] = distort(x, y);
          if (x === 0) ctx.moveTo(dx, dy);
          else ctx.lineTo(dx, dy);
        }
        ctx.stroke();
      }
    };

    resize();

    if (prefersReducedMotion) {
      // A single still frame — the composition should hold up motionless,
      // not just disappear for anyone who has motion reduced.
      draw(0);
    } else {
      let lastFrame = 0;
      const loop = (now: number) => {
        const targetInterval = rendered.influence > 0.01 || pointer.active ? 1000 / 60 : 1000 / 30;
        if (visible && now - lastFrame >= targetInterval) {
          const targetInfluence = supportsHover && pointer.active ? 1 : 0;
          rendered.x = pointer.x;
          rendered.y = pointer.y;
          rendered.influence += (targetInfluence - rendered.influence) * 0.35;
          t = now;
          draw(t);
          lastFrame = now;
        }
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    }

    const onResize = () => resize();
    window.addEventListener('resize', onResize);

    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    observer.observe(container);

    let onPointerMove: ((e: PointerEvent) => void) | undefined;
    let onPointerLeave: (() => void) | undefined;
    if (supportsHover && !prefersReducedMotion) {
      onPointerMove = (e: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        pointer.x = e.clientX - rect.left;
        pointer.y = e.clientY - rect.top;
        pointer.active = true;
      };
      onPointerLeave = () => {
        pointer.active = false;
      };
      container.addEventListener('pointermove', onPointerMove);
      container.addEventListener('pointerleave', onPointerLeave);
    }

    return () => {
      window.removeEventListener('resize', onResize);
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (onPointerMove) container.removeEventListener('pointermove', onPointerMove);
      if (onPointerLeave) container.removeEventListener('pointerleave', onPointerLeave);
    };
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative overflow-hidden bg-[hsl(var(--pb-ivory))] pt-16 md:pt-20"
    >
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-6 px-4 md:grid-cols-2 md:gap-10 md:px-8">
        <div className="flex items-center justify-center py-8 md:justify-start md:py-8">
          <h1 className="max-w-md font-display text-display-lg italic text-[hsl(var(--pb-ink))] md:text-6xl">
            Designed to be <span className="text-[hsl(var(--pb-rose-deep))]">worn</span>,
            <br />
            not just bought.
          </h1>
        </div>

        <div className="flex items-center justify-center py-6 pb-10 md:justify-end md:py-8">
          <div
            className="relative aspect-[4/5] w-full max-w-sm bg-[hsl(var(--pb-blush-wash))] p-3 shadow-pb-lg md:p-4"
            style={{ borderRadius: BLOB_OUTER }}
          >
            <div className="relative h-full w-full overflow-hidden" style={{ borderRadius: BLOB_INNER }}>
              <Image
                src="/hero/hero-main.jpg"
                alt="A PariBelle kurti, styled with silver jhumka earrings"
                fill
                priority
                sizes="(min-width: 768px) 36vw, 85vw"
                className="object-cover object-top"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
