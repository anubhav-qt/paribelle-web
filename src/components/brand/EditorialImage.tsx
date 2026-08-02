'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface EditorialImageProps {
  src: string;
  alt: string;
  aspect?: string; // e.g. '4 / 5', '1 / 1'
  mask?: 'none' | 'scallop' | 'arch';
  sizes?: string;
  priority?: boolean;
  className?: string;
  fill?: boolean;
}

/**
 * Aspect-locked, lazy blur-up image with an optional scallop (echoes the
 * brand's fabric-edge photography) or arch mask, applied via CSS clip-path
 * so no extra image asset is needed.
 */
export function EditorialImage({
  src,
  alt,
  aspect = '4 / 5',
  mask = 'none',
  sizes = '(max-width: 768px) 100vw, 50vw',
  priority = false,
  className,
}: EditorialImageProps) {
  const [loaded, setLoaded] = React.useState(false);

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-[hsl(var(--pb-shell))]',
        mask === 'arch' && 'pb-mask-arch',
        mask === 'scallop' && 'pb-mask-scallop',
        className
      )}
      style={{ aspectRatio: aspect }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        onLoad={() => setLoaded(true)}
        className={cn(
          'object-cover transition-all duration-700 ease-pb',
          loaded ? 'scale-100 blur-0 opacity-100' : 'scale-105 blur-md opacity-0'
        )}
      />
    </div>
  );
}
