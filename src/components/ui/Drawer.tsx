'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFocusTrap } from './useFocusTrap';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side?: 'right' | 'bottom';
  title?: React.ReactNode;
  children: React.ReactNode;
  widthClassName?: string;
}

export function Drawer({ open, onClose, side = 'right', title, children, widthClassName }: DrawerProps) {
  const [mounted, setMounted] = React.useState(false);
  const containerRef = useFocusTrap(open, onClose);

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

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-[hsl(var(--pb-wine-deep)/0.45)] backdrop-blur-[2px] pb-anim-fade-in"
        onClick={onClose}
      />
      <div
        ref={containerRef}
        className={cn(
          'absolute bg-[hsl(var(--pb-ivory))] shadow-pb-lg flex flex-col',
          side === 'right'
            ? cn('right-0 top-0 h-full w-full max-w-md pb-anim-slide-right', widthClassName)
            : 'bottom-0 left-0 w-full max-h-[85vh] rounded-t-md pb-anim-slide-bottom'
        )}
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
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>,
    document.body
  );
}
