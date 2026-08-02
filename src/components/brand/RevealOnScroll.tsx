'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
  as?: keyof JSX.IntrinsicElements;
}

export function RevealOnScroll({ children, className, delayMs = 0, as = 'div' }: RevealOnScrollProps) {
  const ref = React.useRef<HTMLElement | null>(null);
  const [revealed, setRevealed] = React.useState(false);
  const Tag = as as any;

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn('pb-reveal', revealed && 'pb-revealed', className)}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </Tag>
  );
}
