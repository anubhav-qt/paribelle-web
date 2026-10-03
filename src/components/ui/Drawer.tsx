'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePresence } from '@/hooks/usePresence';
import { useFocusTrap } from './useFocusTrap';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: 'right' | 'bottom';
  title?: React.ReactNode;
  children: React.ReactNode;
  widthClassName?: string;
}

/** Long enough for the sheet easing to settle; the exit uses the same curve. */
const SHEET_MS = 480;

const HIDDEN_TRANSFORM = {
  right: 'translate-x-full',
  bottom: 'translate-y-full',
} as const;

/**
 * Slides in and — unlike the keyframe version this replaced — slides back out
 * again: the panel stays mounted through its exit (usePresence) so closing
 * reads as the reverse of opening instead of the panel blinking away.
 */
export function Drawer({
  open,
  onClose,
  side = 'right',
  title,
  children,
  widthClassName,
}: DrawerProps) {
  const [mounted, setMounted] = React.useState(false);
  const { mounted: present, shown } = usePresence(open, SHEET_MS);
  const containerRef = useFocusTrap(open && present, onClose);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!mounted || !present) return null;

  return createPortal(
    <div className={cn('fixed inset-0 z-50', !open && 'pointer-events-none')} role="dialog" aria-modal="true">
      <div
        className={cn(
          'absolute inset-0 bg-[hsl(var(--pb-wine-deep)/0.4)] backdrop-blur-[3px] transition-opacity ease-pb',
          shown ? 'opacity-100' : 'opacity-0'
        )}
        style={{ transitionDuration: `${SHEET_MS}ms` }}
        onClick={onClose}
      />
      <div
        ref={containerRef}
        className={cn(
          'absolute flex flex-col bg-[hsl(var(--pb-ivory))] shadow-pb-lg transition-transform ease-sheet will-change-transform',
          side === 'bottom'
            ? 'bottom-0 left-0 max-h-[85vh] w-full rounded-t-md pb-[env(safe-area-inset-bottom)]'
            : cn('right-0 top-0 h-full w-full max-w-md', widthClassName),
          !shown && HIDDEN_TRANSFORM[side]
        )}
        style={{ transitionDuration: `${SHEET_MS}ms` }}
      >
        {title && (
          <div className="flex items-center justify-between border-b border-[hsl(var(--pb-linen))] px-6 py-5">
            <h2 className="font-display text-lg font-medium text-[hsl(var(--pb-ink))]">{title}</h2>
            <button
              onClick={onClose}
              aria-label="Close"
              className="rounded-full p-2 text-[hsl(var(--pb-ink-muted))] hover:bg-[hsl(var(--pb-shell))] transition-colors duration-150"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>,
    document.body
  );
}
