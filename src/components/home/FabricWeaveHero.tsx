'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';

/**
 * The new hero — see Task 6 in the implementation plan. Replaces the old
 * photo-zoom `ScrapbookHero` with an animated woven-thread canvas behind a
 * shopping-first foreground: headline, a real search input, one primary CTA.
 * No category chips here — that was one of four places the same category
 * list repeated in a single scroll; navigation lives in the header.
 *
 * The weave is a plain 2D canvas sine field, not per-thread DOM/SVG nodes —
 * a few hundred animated elements is what makes woven-pattern heroes janky.
 * It pauses via IntersectionObserver once scrolled out of view, and renders a
 * single static frame under `prefers-reduced-motion: reduce` rather than a
 * blank background.
 */
export function FabricWeaveHero() {
  const router = useRouter();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let rafId: number | null = null;
    let visible = true;
    let t = 0;

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
    // headline and CTAs stay comfortably readable over the busiest frame.
    const WARP_COLOR = 'hsla(349, 48%, 70%, 0.22)'; // --pb-rose
    const WEFT_COLOR = 'hsla(38, 38%, 59%, 0.18)'; // --pb-gold

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);

      const warpCount = 60;
      const weftCount = 40;
      const amplitude = 10;
      const freq = 0.015;

      // Warp threads: mostly vertical, drifting horizontally.
      ctx.strokeStyle = WARP_COLOR;
      ctx.lineWidth = 1;
      for (let i = 0; i < warpCount; i++) {
        const baseX = (i / warpCount) * (width + 80) - 40;
        ctx.beginPath();
        for (let y = 0; y <= height; y += 8) {
          const x = baseX + Math.sin(y * freq + time * 0.0004 + i) * amplitude;
          if (y === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
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
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
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
      let lastFrame = 0;
      const targetInterval = 1000 / 30; // capped at ~30fps
      const loop = (now: number) => {
        if (visible && now - lastFrame >= targetInterval) {
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

    return () => {
      window.removeEventListener('resize', onResize);
      observer.disconnect();
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <section
      ref={containerRef}
      className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-[hsl(var(--pb-ivory))] px-6 py-24 md:min-h-[85vh]"
    >
      <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto flex max-w-xl flex-col items-center text-center">
        <h1 className="font-display text-display-lg italic text-[hsl(var(--pb-ink))] md:text-6xl">
          Designed to be worn,
          <br />
          not just bought.
        </h1>
        <p className="mt-4 max-w-md text-[hsl(var(--pb-ink-muted))]">
          Kurtis and jewellery cut, checked and finished in Jaipur — new pieces every season.
        </p>

        <form onSubmit={handleSearch} className="mt-8 w-full max-w-sm">
          <div className="flex items-center gap-2 rounded-full border border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-ivory)/0.9)] px-4 py-2.5 shadow-pb-md backdrop-blur-sm focus-within:border-[hsl(var(--pb-rose-deep))]">
            <Search className="h-4 w-4 shrink-0 text-[hsl(var(--pb-ink-faint))]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search kurtis, jewellery…"
              className="w-full bg-transparent text-sm text-[hsl(var(--pb-ink))] placeholder:text-[hsl(var(--pb-ink-faint))] focus:outline-none"
            />
          </div>
        </form>

        <div className="mt-6">
          <Button onClick={() => router.push('/category/new-in')}>Shop New In</Button>
        </div>
      </div>
    </section>
  );
}
