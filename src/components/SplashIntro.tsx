'use client';

import * as React from 'react';

/**
 * The opening curtain: a full-screen blush field with the PariBelle wordmark
 * centred and a hairline progress rule beneath it, which fades away as one
 * once the page behind is actually ready.
 *
 * It exists to cover the second or two of hero and product imagery arriving,
 * which otherwise reads as a half-built page. The curtain is *opaque and
 * simply sits on top* rather than hiding the content beneath it — page
 * content is never given `opacity: 0`, so a JS error mid-animation can leave
 * a stuck overlay at worst, never a permanently blank site. The fade of the
 * curtain is itself what fades the page in.
 *
 * The rule tracks real readiness (the `load` event and webfonts), not a
 * fixed timer: it eases toward 90% while waiting and only runs to the end
 * once the page is genuinely there, so it never claims to be finished before
 * the thing it is covering for.
 *
 * Progress is a pure function of elapsed time, and is driven by a
 * `requestAnimationFrame` loop *and* a plain interval. That belt-and-braces
 * arrangement is deliberate: rAF does not fire at all while the page is not
 * being composited — a tab opened in the background is the everyday case —
 * and a purely rAF-driven curtain simply never finishes and never lifts.
 * The interval keeps time in that state, and `HARD_STOP_MS` is the final
 * guarantee that this thing always comes down.
 */

/** The curtain stays up at least this long, so a fast load doesn't flash it. */
const MIN_VISIBLE_MS = 1150;
/** Backstop: past this the rule completes regardless of what is still loading. */
const MAX_WAIT_MS = 5000;
/** The whole curtain — wordmark, rule and field — dissolving together. */
const FADE_MS = 550;
/** A beat on a full rule before the fade, so completion registers. */
const SETTLE_MS = 180;
/** Reduced motion: no trickle, just a brief full rule. */
const REDUCED_HOLD_MS = 420;

/**
 * Time constant of the asymptotic creep while waiting — tuned so the rule
 * has covered most of `WAITING_CEILING` by `MIN_VISIBLE_MS` on a fast load.
 */
const TRICKLE_TAU_MS = 380;
/** How long the run from wherever the rule was to a full bar takes. */
const FINISH_MS = 260;
/** How far the rule is allowed to creep before the page is actually ready. */
const WAITING_CEILING = 0.9;
/** Coarse timer that keeps the rule moving when rAF is not running at all. */
const TICK_MS = 80;
/** Absolute ceiling on the curtain's life, whatever else has gone wrong. */
const HARD_STOP_MS = MAX_WAIT_MS + FINISH_MS + 600;

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

export function SplashIntro() {
  // Starts `true` so the curtain is part of the server-rendered HTML and is
  // therefore painted in the very first frame. Anything that waited for an
  // effect would flash the unfinished page first, which is the entire thing
  // this component exists to prevent.
  const [visible, setVisible] = React.useState(true);
  const [fading, setFading] = React.useState(false);
  // The rule is driven straight through this ref rather than React state:
  // it updates every frame, and re-rendering the tree 60 times a second to
  // move one bar is exactly the kind of work this screen should not be doing
  // while the page behind it is trying to load.
  const fillRef = React.useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    const root = document.documentElement;
    const timers: ReturnType<typeof setTimeout>[] = [];
    let raf = 0;
    let ticker: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;
    let settled = false;

    // On a reload the browser restores the previous scroll position — but
    // `overflow: hidden` below makes the document unscrollable while the
    // curtain is up, so that restore lands once the lock lifts and drops the
    // reader somewhere down the page (the bottom, from a bottom-of-page
    // reload) the instant the curtain clears. Taking manual control and
    // pinning to the top makes a reload behave exactly like a fresh visit,
    // which is what an opening curtain implies.
    const previousRestoration = 'scrollRestoration' in history ? history.scrollRestoration : null;
    if (previousRestoration !== null) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    // Belt and braces for the layout shift `scrollbar-gutter: stable` (see
    // globals.css) already handles: on a browser too old to support it, hold
    // the scrollbar's width open by hand for the duration of the lock.
    const supportsGutter =
      typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('scrollbar-gutter', 'stable');
    const previousPaddingRight = root.style.paddingRight;
    const scrollbarWidth = window.innerWidth - root.clientWidth;
    if (!supportsGutter && scrollbarWidth > 0) {
      root.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Nothing behind the curtain should scroll out from under it.
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';

    const restore = () => {
      root.style.overflow = previousOverflow;
      root.style.paddingRight = previousPaddingRight;
      // Pin the top again *after* the document can scroll: a restore queued
      // by the browser while it could not would otherwise apply right here.
      window.scrollTo(0, 0);
      if (previousRestoration !== null) history.scrollRestoration = previousRestoration;
    };
    const stopDrivers = () => {
      cancelAnimationFrame(raf);
      if (ticker !== null) clearInterval(ticker);
      ticker = null;
    };
    const setFill = (p: number) => {
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${p})`;
    };

    const beginFade = () => {
      if (cancelled) return;
      setFading(true);
      timers.push(
        setTimeout(() => {
          restore();
          setVisible(false);
        }, FADE_MS),
      );
    };

    /** Idempotent: several drivers race to call this and only the first counts. */
    const settle = () => {
      if (settled || cancelled) return;
      settled = true;
      stopDrivers();
      setFill(1);
      timers.push(setTimeout(beginFade, SETTLE_MS));
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setFill(1);
      timers.push(setTimeout(beginFade, REDUCED_HOLD_MS));
      return () => {
        cancelled = true;
        timers.forEach(clearTimeout);
        restore();
      };
    }

    // Two independent signals of "the page is actually there".
    let loaded = document.readyState === 'complete';
    let fontsReady = false;
    const onLoad = () => {
      loaded = true;
    };
    if (!loaded) window.addEventListener('load', onLoad, { once: true });
    // `document.fonts` is absent on some older browsers — treat that as ready
    // rather than waiting on a promise that will never resolve.
    if (document.fonts) {
      document.fonts.ready.then(() => {
        fontsReady = true;
      });
    } else {
      fontsReady = true;
    }

    const start = performance.now();
    let finishStart: number | null = null;
    let finishFrom = 0;

    // Deliberately a function of elapsed time, not of how many times it has
    // been called — so a 60fps rAF and an 80ms interval (or a throttled
    // once-a-second one in a hidden tab) all agree on where the rule is.
    const update = () => {
      if (cancelled || settled) return;
      const now = performance.now();
      const elapsed = now - start;
      const ready = (loaded && fontsReady) || elapsed >= MAX_WAIT_MS;
      // Held below the minimum so the rule can't complete early on a cached
      // load and leave the curtain blinking in and out.
      const mayFinish = ready && elapsed >= MIN_VISIBLE_MS;

      let progress: number;
      if (mayFinish) {
        if (finishStart === null) {
          finishStart = now;
          finishFrom = WAITING_CEILING * (1 - Math.exp(-elapsed / TRICKLE_TAU_MS));
        }
        const k = Math.min(1, (now - finishStart) / FINISH_MS);
        progress = finishFrom + (1 - finishFrom) * easeOut(k);
      } else {
        progress = WAITING_CEILING * (1 - Math.exp(-elapsed / TRICKLE_TAU_MS));
      }

      setFill(progress);
      if (progress >= 0.999) settle();
    };

    const frame = () => {
      if (cancelled || settled) return;
      update();
      if (!settled) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    ticker = setInterval(update, TICK_MS);
    // Last line of defence — the curtain comes down even if every driver
    // above has been throttled into uselessness.
    timers.push(setTimeout(settle, HARD_STOP_MS));

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      stopDrivers();
      window.removeEventListener('load', onLoad);
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
        opacity: fading ? 0 : 1,
        transition: `opacity ${FADE_MS}ms var(--ease-pb)`,
        // Stops the curtain swallowing a click aimed at the page it is
        // already fading out of.
        pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      {/* `inline-flex` + `items-stretch`: the column shrinks to the width of
          the wordmark, so the rule below it is exactly as wide as the text
          without anything having to measure it. */}
      <div className="fixed left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 flex-col items-stretch">
        <span className="whitespace-nowrap font-logo text-[4rem] leading-none tracking-wide text-[hsl(var(--pb-ink))] md:text-[5rem]">
          PariBelle
        </span>
        <div className="mt-5 h-[2px] w-full overflow-hidden bg-[hsl(var(--pb-ink)/0.12)]">
          <div
            ref={fillRef}
            className="h-full w-full bg-[hsl(var(--pb-ink))]"
            style={{ transform: 'scaleX(0)', transformOrigin: 'left center' }}
          />
        </div>
      </div>
    </div>
  );
}
