'use client';

import * as React from 'react';

/**
 * The hero — an animated woven-thread canvas behind a single headline. No
 * subtext, no search bar, no CTA: the "Top Sellers" rail right below this
 * section is the call to action, and the header nav is where every other
 * destination already lives.
 *
 * The weave is a plain 2D canvas sine field, not per-thread DOM/SVG nodes —
 * a few hundred animated elements is what makes woven-pattern heroes janky.
 * It pauses via IntersectionObserver once scrolled out of view, and renders a
 * single static frame under `prefers-reduced-motion: reduce` rather than a
 * blank background.
 *
 * Hovering the weave bows the threads away from the cursor, lens-like, and
 * lets them settle back once the pointer leaves — smoothed with a lerp so it
 * reads as a responsive material, not a snap-to-cursor glitch. Skipped for
 * reduced-motion and coarse (touch) pointers, since neither can hover.
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

    // Raw pointer target vs. the smoothed position actually used to draw —
    // lerping both position and influence is what makes the distortion
    // ease in/out instead of snapping to the cursor every frame.
    const pointer = { x: 0, y: 0, active: false };
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
    // headline stays comfortably readable over the busiest frame.
    const WARP_COLOR = 'hsla(349, 48%, 70%, 0.22)'; // --pb-rose
    const WEFT_COLOR = 'hsla(38, 38%, 59%, 0.18)'; // --pb-gold

    const DISTORT_RADIUS = 180;
    const DISTORT_STRENGTH = 26;

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const warpCount = 60;
      const weftCount = 40;
      const amplitude = 10;
      const freq = 0.015;
      const { x: px, y: py, influence } = rendered;

      // Pushes a point on the thread away from the (smoothed) cursor with a
      // gaussian falloff — a lens bulge, not a hard-edged bend.
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
      // A single chain of requestAnimationFrame calls, kept running for the
      // component's whole lifetime — `visible` only gates whether a frame
      // actually draws, not whether the next frame gets scheduled. An
      // earlier version stopped rescheduling whenever `visible` was false
      // and only resumed if `rafId` happened to still be `null`, which raced
      // the IntersectionObserver's first (async) callback: if it reported
      // "not visible" before the loop's own first tick, the loop exited for
      // good and the canvas stayed permanently blank, even once the hero was
      // actually on screen. Always rescheduling avoids the race; skipping
      // the draw call itself is what actually saves the CPU off-screen.
      //
      // The frame cap steps up from 30fps to 60fps while the cursor is
      // actively distorting the weave — smooth tracking matters there far
      // more than it does for the idle drift.
      let lastFrame = 0;
      const loop = (now: number) => {
        const targetInterval = rendered.influence > 0.01 || pointer.active ? 1000 / 60 : 1000 / 30;
        if (visible && now - lastFrame >= targetInterval) {
          const targetInfluence = supportsHover && pointer.active ? 1 : 0;
          rendered.x += (pointer.x - rendered.x) * 0.15;
          rendered.y += (pointer.y - rendered.y) * 0.15;
          rendered.influence += (targetInfluence - rendered.influence) * 0.12;
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
      className="relative flex min-h-[42vh] items-center justify-center overflow-hidden bg-[hsl(var(--pb-ivory))] px-6 py-16 md:min-h-[56vh]"
    >
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center text-center">
        <h1 className="font-display text-display-lg italic text-[hsl(var(--pb-ink))] md:text-6xl">
          Designed to be worn,
          <br />
          not just bought.
        </h1>
      </div>
    </section>
  );
}
