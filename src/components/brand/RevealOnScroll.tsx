'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * `null` outside a group (or while the group's media query doesn't match), so
 * each RevealOnScroll watches itself; a boolean inside an active group, which
 * every item follows instead.
 */
const RevealGroupContext = React.createContext<boolean | null>(null);

export interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  as?: keyof JSX.IntrinsicElements;
  style?: React.CSSProperties;
}

export function RevealOnScroll({ children, className, delayMs = 0, as = 'div', style }: RevealOnScrollProps) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [selfRevealed, setSelfRevealed] = React.useState(false);
  const group = React.useContext(RevealGroupContext);
  const inGroup = group !== null;
  const Tag = as as any;

  React.useEffect(() => {
    if (inGroup) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSelfRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [inGroup]);

  const revealed = inGroup ? group : selfRevealed;

  return (
    <Tag
      ref={ref}
      className={cn('pb-reveal', inGroup && 'pb-reveal-group', revealed && 'pb-revealed', className)}
      // Capped inside a group: cards far down a swipe rail are off-screen
      // when it reveals, and shouldn't still be waiting once swiped to.
      style={{ ...style, transitionDelay: `${inGroup ? Math.min(delayMs * 1.75, 280) : delayMs}ms` }}
    >
      {children}
    </Tag>
  );
}

export interface RevealGroupProps {
  children: React.ReactNode;
  className?: string;
  /** The group only takes over while this matches; otherwise items reveal one by one. */
  media?: string;
}

/**
 * Reveals a run of RevealOnScroll items together, when the group itself
 * scrolls into view.
 *
 * For horizontal rails: an item scrolled off to the side is clipped by its
 * scroll container, so on its own it would never count as visible and would
 * only fade in mid-swipe. Under a group the whole rail arrives at once, with
 * a short stagger, as a plain fade (.pb-reveal-group in globals.css), and
 * anything swiped to later is already there.
 */
export function RevealGroup({ children, className, media }: RevealGroupProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [active, setActive] = React.useState(false);
  const [revealed, setRevealed] = React.useState(false);

  React.useEffect(() => {
    if (!media) {
      setActive(true);
      return;
    }
    const mql = window.matchMedia(media);
    const sync = () => setActive(mql.matches);
    sync();
    mql.addEventListener('change', sync);
    return () => mql.removeEventListener('change', sync);
  }, [media]);

  React.useEffect(() => {
    if (!active || revealed) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [active, revealed]);

  return (
    <div ref={ref} className={className}>
      <RevealGroupContext.Provider value={active ? revealed : null}>{children}</RevealGroupContext.Provider>
    </div>
  );
}
