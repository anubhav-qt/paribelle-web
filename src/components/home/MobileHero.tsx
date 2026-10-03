'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getImageUrl } from '@/lib/image-url';
import { HeroSectionImages, resolveHeroImageUrl } from '@/lib/heroSectionImages';
import { buttonClasses } from '@/components/ui/Button';

export interface HeroCta {
  label: string;
  href: string;
}

interface MobileHeroProps {
  images: HeroSectionImages | null;
  cta: HeroCta;
}

const ALT = {
  main: 'A PariBelle kurti, styled with silver jhumka earrings',
  pink: 'A coral-pink block-print anarkali kurta set with a matching dupatta',
  black: 'A black kurta with floral scalloped embroidery on the hem and cuffs',
};

/** Header height below md (Header.tsx), which the hero runs underneath. */
const HEADER_PAD = 'pt-[57px] md:pt-[61px]';

const AUTOPLAY_MS = 5200;

type Style = React.CSSProperties & Record<`--${string}`, string>;
const delay = (ms: number): Style => ({ '--d': `${ms}ms` });

function Photo({
  src,
  alt,
  sizes,
  priority,
  className,
}: {
  src: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  if (!src) return <div className="h-full w-full animate-pulse bg-[hsl(var(--pb-linen))]" />;
  return (
    <Image src={src} alt={alt} fill priority={priority} quality={85} sizes={sizes} className={cn('object-cover', className)} />
  );
}

function resolve(images: HeroSectionImages | null) {
  return {
    main: images ? resolveHeroImageUrl(images.main.url, getImageUrl) : null,
    pink: images ? resolveHeroImageUrl(images.pink.url, getImageUrl) : null,
    black: images ? resolveHeroImageUrl(images.black.url, getImageUrl) : null,
  };
}

/**
 * The homepage hero below lg (desktop keeps FabricWeaveHero's own layout):
 * the headline over the season's three photos as a centred, swipeable
 * carousel.
 */
export function MobileHero({ images, cta }: MobileHeroProps) {
  const src = resolve(images);
  const slides = [
    { key: 'main', src: src.main, alt: ALT.main, position: 'object-top' },
    { key: 'pink', src: src.pink, alt: ALT.pink, position: 'object-[50%_24%]' },
    { key: 'black', src: src.black, alt: ALT.black, position: 'object-[50%_28%]' },
  ];

  const trackRef = React.useRef<HTMLDivElement>(null);
  const [index, setIndex] = React.useState(0);
  // Autoplay runs until the shopper touches the carousel, then stays off —
  // it is there to show that there is more, not to fight a swipe.
  const [autoplay, setAutoplay] = React.useState(true);
  const [inView, setInView] = React.useState(true);

  React.useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setAutoplay(false);
  }, []);

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const children = Array.from(track.children) as HTMLElement[];
        const centre = track.scrollLeft + track.clientWidth / 2;
        let best = 0;
        let bestDist = Infinity;
        children.forEach((child, i) => {
          const dist = Math.abs(child.offsetLeft + child.offsetWidth / 2 - centre);
          if (dist < bestDist) {
            bestDist = dist;
            best = i;
          }
        });
        setIndex(best);
      });
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      track.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  React.useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.5 });
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  const goTo = React.useCallback((i: number) => {
    const track = trackRef.current;
    const child = track?.children[i] as HTMLElement | undefined;
    if (!track || !child) return;
    track.scrollTo({
      left: child.offsetLeft + child.offsetWidth / 2 - track.clientWidth / 2,
      behavior: 'smooth',
    });
  }, []);

  const stopAutoplay = () => setAutoplay(false);

  return (
    <section className={cn('pb-hero-paper relative overflow-hidden', HEADER_PAD)}>
      <div className="mx-auto max-w-3xl pb-12 pt-9">
        <div className="flex flex-col items-center px-5 text-center">
          <p className="pb-enter pb-enter-up text-eyebrow text-[hsl(var(--pb-rose-deep))]" style={delay(0)}>
            New this Season
          </p>
          <h1
            className="pb-enter pb-enter-up mt-3 font-display text-[2.6rem] font-light italic leading-[1.04] tracking-[-0.01em] text-[hsl(var(--pb-ink))] min-[400px]:text-[2.85rem] md:text-[3.5rem]"
            style={delay(90)}
          >
            Designed to be <span className="text-[hsl(var(--pb-rose-deep))]">worn</span>,
            <br />
            not just bought.
          </h1>
        </div>

        <div
          ref={trackRef}
          onPointerDown={stopAutoplay}
          onTouchStart={stopAutoplay}
          // Side padding is exactly half the leftover width, so the first and
          // last slides can snap to the centre like the middle one. The
          // bottom padding (taken back by the negative margin) is room for
          // the slides' shadow, which the scroller would otherwise clip flat.
          className="scrollbar-hide -mb-10 mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto overscroll-x-contain px-[calc(50%_-_var(--slide)/2)] pb-10 [--slide:70vw] md:[--slide:340px]"
          aria-roledescription="carousel"
          aria-label="This season's pieces"
        >
          {slides.map((slide, i) => (
            <div
              key={slide.key}
              className="pb-enter pb-enter-rise w-[var(--slide)] shrink-0 snap-center snap-always"
              style={delay(160 + i * 90)}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}`}
            >
              <div className="pb-gallery-focus relative aspect-[4/5] overflow-hidden rounded-[26px] bg-[hsl(var(--pb-blush-wash))] shadow-[0_24px_48px_-24px_hsl(336_16%_18%/0.35)]">
                <Photo
                  src={slide.src}
                  alt={slide.alt}
                  priority={i === 0}
                  sizes="(max-width: 767px) 80vw, (max-width: 1023px) 45vw, 1px"
                  className={slide.position}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Hairline indicators. The active one lengthens and fills over the
            autoplay interval, then advances when it's full. */}
        <div className="pb-enter pb-enter-fade mt-5 flex items-center justify-center gap-1.5" style={delay(480)}>
          {slides.map((slide, i) => {
            const active = i === index;
            return (
              <button
                key={slide.key}
                onClick={() => {
                  stopAutoplay();
                  goTo(i);
                }}
                aria-label={`Show photo ${i + 1}`}
                aria-current={active}
                className="flex h-6 items-center"
              >
                <span
                  className={cn(
                    'relative block h-[2px] overflow-hidden bg-[hsl(var(--pb-ink)/0.18)] transition-[width] duration-500 ease-sheet',
                    active ? 'w-10' : 'w-5'
                  )}
                >
                  {active && (
                    <span
                      key={`${index}-${autoplay}`}
                      className="absolute inset-0 origin-left bg-[hsl(var(--pb-ink)/0.8)]"
                      style={
                        autoplay
                          ? {
                              animation: `pb-dot-fill ${AUTOPLAY_MS}ms linear forwards`,
                              animationPlayState: inView ? 'running' : 'paused',
                            }
                          : undefined
                      }
                      onAnimationEnd={() => goTo((index + 1) % slides.length)}
                    />
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* The product page's Add to Bag button, as a link. */}
        <div className="pb-enter pb-enter-up mt-7 flex justify-center px-5" style={delay(560)}>
          <Link href={cta.href} className={buttonClasses({ size: 'lg', className: 'min-w-[14rem]' })}>
            {cta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
