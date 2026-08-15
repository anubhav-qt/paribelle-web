'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  BLOB_OUTER,
  BLOB_INNER,
  BLOB_LEFT_OUTER,
  BLOB_LEFT_INNER,
  BLOB_RIGHT_OUTER,
  BLOB_RIGHT_INNER,
} from './heroBlobShapes';
import { getImageUrl } from '@/lib/image-url';
import {
  DEFAULT_HERO_IMAGES,
  HERO_SECTION_IMAGES_KEY,
  HeroSectionImages,
  resolveHeroImageUrl,
} from '@/lib/heroSectionImages';

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

  // Deliberately starts as `null`, not the bundled defaults: rendering the
  // bundled photos immediately and then swapping in the admin-configured
  // ones a moment later (once `hero_section_images` resolves) is exactly the
  // visible "flash" this used to have. Nothing is rendered below until the
  // fetch settles — the bundled images are only ever used as a per-slot
  // fallback *within* that resolved value (a slot the admin never touched),
  // never as a placeholder shown before it.
  const [images, setImages] = React.useState<HeroSectionImages | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/${HERO_SECTION_IMAGES_KEY}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { value?: Partial<HeroSectionImages> } | null) => {
        if (cancelled) return;
        setImages({
          main: data?.value?.main?.url ? data.value.main : DEFAULT_HERO_IMAGES.main,
          pink: data?.value?.pink?.url ? data.value.pink : DEFAULT_HERO_IMAGES.pink,
          black: data?.value?.black?.url ? data.value.black : DEFAULT_HERO_IMAGES.black,
        });
      })
      .catch(() => {
        if (!cancelled) setImages(DEFAULT_HERO_IMAGES);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
          {/* The "stage" is the trio's bounding box, and it is pinned to
              exactly the footprint the single photo used to occupy: 480px
              tall from `lg` up, which is what `max-w-sm` at 4:5 came out to,
              so the section's height is unchanged. Every card is positioned
              inside it, which is what keeps the group from running off the
              container edge — the old single card sat flush against the
              column's right edge, so anything hung off its right side got
              clipped by the section's `overflow-hidden`.

              At `xl` the stage widens past its column (`w-[126%]`, overflowing
              leftward because the row is `justify-end`) to claim the slack the
              headline column isn't using — that slack is what lets the centre
              print stay near its original size instead of shrinking to make
              room. Between `lg` and `xl` that slack doesn't exist yet, so the
              stage stays inside its column and the trio scales down together.
              Below `lg` the column is too narrow for three prints to read as
              anything but a smudge, so only the centre one renders, exactly
              as before. */}
          <div className="relative w-full max-w-sm shrink-0 lg:h-[480px] lg:max-w-none xl:w-[126%]">
            {/* Left print: pink_3, riding low and a layer behind the centre
                frame. A thinner mat and softer shadow than the centre card
                sell the depth ordering at a glance. */}
            <div
              className="absolute bottom-[6%] left-0 z-0 hidden w-[36%] bg-[hsl(var(--pb-blush-wash))] p-1.5 shadow-pb-sm lg:block xl:w-[33%]"
              style={{ aspectRatio: '4 / 5', borderRadius: BLOB_LEFT_OUTER }}
            >
              <div className="relative h-full w-full overflow-hidden" style={{ borderRadius: BLOB_LEFT_INNER }}>
                {/* The mat/frame around each photo is always present, so the
                    layout never shifts — only the photo inside waits on
                    `images`, showing a plain pulse rather than a bundled
                    stand-in while it does. */}
                {images ? (
                  <Image
                    src={resolveHeroImageUrl(images.pink.url, getImageUrl)}
                    alt="A coral-pink block-print anarkali kurta set with a matching dupatta"
                    fill
                    quality={85}
                    // Deliberately ~1.7x the card's actual rendered width
                    // (max ~245px), not a tight fit: on first paint the
                    // browser picks a srcset candidate from its earliest,
                    // roughest guess at layout, and a snug `sizes` value
                    // came out visibly soft until something (e.g. a zoom
                    // change) forced a re-pick. The headroom means even a
                    // bad first guess still lands on a large-enough image.
                    // 1px below `lg` because the card isn't rendered there —
                    // it keeps the browser from pulling a full-size candidate
                    // for something nobody sees.
                    sizes="(min-width: 1024px) 420px, 1px"
                    // Full-body shot cropped tight for a small card: framed a
                    // little below face height so the block-print bodice — the
                    // point of this card — reads clearly instead of the crop
                    // landing on empty fabric below the waist.
                    className="object-cover object-[50%_28%]"
                  />
                ) : (
                  <div className="h-full w-full animate-pulse bg-[hsl(var(--pb-linen))]" />
                )}
              </div>
            </div>

            {/* Right print: black_3, riding high and likewise behind the
                centre frame. The opposing vertical offsets are what stop the
                trio from reading as a flat row of three. */}
            <div
              className="absolute right-0 top-[4%] z-0 hidden w-[36%] bg-[hsl(var(--pb-blush-wash))] p-1.5 shadow-pb-sm lg:block xl:w-[33%]"
              style={{ aspectRatio: '4 / 5', borderRadius: BLOB_RIGHT_OUTER }}
            >
              <div className="relative h-full w-full overflow-hidden" style={{ borderRadius: BLOB_RIGHT_INNER }}>
                {images ? (
                  <Image
                    src={resolveHeroImageUrl(images.black.url, getImageUrl)}
                    alt="A black kurta with floral scalloped embroidery on the hem and cuffs"
                    fill
                    quality={85}
                    // Same headroom rationale as the pink_3 card above.
                    sizes="(min-width: 1024px) 420px, 1px"
                    // Held a touch higher in frame than the left card so the
                    // scalloped hem embroidery — this garment's distinguishing
                    // detail — stays inside the crop alongside the face.
                    className="object-cover object-[50%_32%]"
                  />
                ) : (
                  <div className="h-full w-full animate-pulse bg-[hsl(var(--pb-linen))]" />
                )}
              </div>
            </div>

            {/* Centre print: the hero shot, unchanged in content and still
                the anchor. It leaves the flow at `lg` so the stage's fixed
                height governs the section instead; below that it is the only
                card, and stays in flow at its original size. Its left offset
                is set so the two side prints tuck under it by roughly a
                quarter of their own width on each side. */}
            <div
              className="relative z-10 aspect-[4/5] w-full bg-[hsl(var(--pb-blush-wash))] p-3 shadow-pb-lg md:p-4 lg:absolute lg:left-[22%] lg:top-1/2 lg:w-[56%] lg:-translate-y-1/2 xl:left-[24%] xl:w-[51%]"
              style={{ borderRadius: BLOB_OUTER }}
            >
              <div className="relative h-full w-full overflow-hidden" style={{ borderRadius: BLOB_INNER }}>
                {images ? (
                  <Image
                    src={resolveHeroImageUrl(images.main.url, getImageUrl)}
                    alt="A PariBelle kurti, styled with silver jhumka earrings"
                    fill
                    priority
                    quality={85}
                    // Same headroom rationale as the two side cards: the
                    // card's actual rendered width tops out around 380px, but
                    // asking for ~640/480px means the very first srcset pick
                    // is already sharp instead of depending on a later
                    // re-evaluation (e.g. a browser zoom change) to correct it.
                    sizes="(min-width: 1024px) 640px, 480px"
                    className="object-cover object-top"
                  />
                ) : (
                  <div className="h-full w-full animate-pulse bg-[hsl(var(--pb-linen))]" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
