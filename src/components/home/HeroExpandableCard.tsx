'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { HeroBlobPanel } from './HeroBlobPanel';
import type { HeroBlobProduct } from './heroBlobProducts';

const TRANSITION =
  'left 600ms var(--ease-pb), width 600ms var(--ease-pb), height 600ms var(--ease-pb), border-radius 600ms var(--ease-pb), box-shadow 600ms var(--ease-pb)';

/** Extra width (px) grabbed beyond the card's natural size, so the panel always has room to breathe. */
const MIN_PANEL_WIDTH = 190;
/** Gap (px) kept clear at the stage's own edge so an expanded card never rides past it. */
const STAGE_MARGIN = 8;

function isDesktopHover() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    window.matchMedia('(min-width: 1024px)').matches
  );
}

interface Rect {
  left?: number;
  width: number;
  height: number;
}

interface HeroExpandableCardProps {
  /** Positioning/sizing/z-index classes for the idle state — unchanged from before this feature existed. */
  className: string;
  style: React.CSSProperties;
  openBorderRadius: string;
  innerBorderRadius: string;
  /** Which edge grows outward. 'right' keeps the left edge fixed; 'left' keeps the right edge fixed. */
  expandDirection: 'left' | 'right';
  /** z-index to assume once expanded — must exceed whichever card(s) it needs to sit above. */
  hoverZIndex: number;
  /** The center card computes its own leftward growth from its own measured box; side cards instead match the center card's live height. */
  variant: 'center' | 'side';
  centerRef?: React.RefObject<HTMLDivElement>;
  stageRef: React.RefObject<HTMLDivElement>;
  image: React.ReactNode;
  product: HeroBlobProduct;
  productImageUrl: string;
}

export const HeroExpandableCard = React.forwardRef<HTMLDivElement, HeroExpandableCardProps>(
  function HeroExpandableCard(
    {
      className,
      style,
      openBorderRadius,
      innerBorderRadius,
      expandDirection,
      hoverZIndex,
      variant,
      centerRef,
      stageRef,
      image,
      product,
      productImageUrl,
    },
    forwardedRef,
  ) {
    const localRef = React.useRef<HTMLDivElement>(null);
    const imageInnerRef = React.useRef<HTMLDivElement>(null);
    React.useImperativeHandle(forwardedRef, () => localRef.current as HTMLDivElement);

    const [hovered, setHovered] = React.useState(false);
    // Explicit px snapshots for the idle and expanded box, so both directions
    // of the transition run between two definite states — animating out of
    // (or into) an `auto`/class-derived size is where browsers stop
    // interpolating and the shape would just snap instead of easing.
    const [naturalRect, setNaturalRect] = React.useState<Rect | null>(null);
    const [openRect, setOpenRect] = React.useState<Rect | null>(null);
    const [lockedImageWidth, setLockedImageWidth] = React.useState<number | null>(null);

    const handlePointerEnter = () => {
      if (!isDesktopHover()) return;
      const el = localRef.current;
      const stage = stageRef.current;
      if (!el || !stage) return;

      setLockedImageWidth(imageInnerRef.current?.offsetWidth ?? el.offsetWidth);

      const width = el.offsetWidth;
      const height = el.offsetHeight;
      const left = el.offsetLeft;
      const stageWidth = stage.offsetWidth;

      setNaturalRect(variant === 'center' ? { left, width, height } : { width, height });

      let targetHeight = height;
      if (variant === 'side' && centerRef?.current) {
        targetHeight = centerRef.current.offsetHeight;
      }

      if (variant === 'center') {
        const naturalRight = left + width;
        const maxPossible = Math.max(naturalRight - STAGE_MARGIN, width);
        const targetWidth = Math.min(width + MIN_PANEL_WIDTH, maxPossible);
        setOpenRect({ left: naturalRight - targetWidth, width: targetWidth, height: targetHeight });
      } else {
        const maxAllowed = stageWidth - STAGE_MARGIN;
        const targetWidth = Math.min(width + MIN_PANEL_WIDTH, maxAllowed);
        setOpenRect({ width: targetWidth, height: targetHeight });
      }

      setHovered(true);
    };

    const handlePointerLeave = () => {
      setHovered(false);
    };

    const handleTransitionEnd = (e: React.TransitionEvent<HTMLDivElement>) => {
      if (e.target !== localRef.current || e.propertyName !== 'width') return;
      if (!hovered) {
        setNaturalRect(null);
        setOpenRect(null);
        setLockedImageWidth(null);
      }
    };

    const activeRect = hovered ? openRect : naturalRect;

    const mergedStyle: React.CSSProperties = {
      ...style,
      borderRadius: hovered ? openBorderRadius : (style.borderRadius as string),
      transition: TRANSITION,
      zIndex: activeRect ? hoverZIndex : style.zIndex,
      ...(activeRect
        ? { width: activeRect.width, height: activeRect.height, ...(activeRect.left != null ? { left: activeRect.left } : null) }
        : null),
    };

    return (
      <div
        ref={localRef}
        className={cn(className, 'flex overflow-hidden', expandDirection === 'left' ? 'flex-row-reverse' : 'flex-row')}
        style={mergedStyle}
        onMouseEnter={handlePointerEnter}
        onMouseLeave={handlePointerLeave}
        onTransitionEnd={handleTransitionEnd}
      >
        <div
          ref={imageInnerRef}
          className="relative h-full shrink-0 overflow-hidden"
          style={{
            width: lockedImageWidth != null ? lockedImageWidth : '100%',
            borderRadius: innerBorderRadius,
          }}
        >
          {image}
        </div>

        <div
          className={cn(
            'h-full min-w-0 shrink-0 bg-[hsl(var(--pb-ivory))] transition-[opacity] ease-pb',
            hovered ? 'flex-1 opacity-100 duration-300' : 'w-0 opacity-0 duration-150',
          )}
          style={{ transitionDelay: hovered ? '180ms' : '0ms' }}
          aria-hidden={!hovered}
        >
          <HeroBlobPanel product={product} image={productImageUrl} interactive={hovered} />
        </div>
      </div>
    );
  },
);
