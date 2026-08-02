'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFocusTrap } from './useFocusTrap';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  maxWidthClassName?: string;
}

export function Modal({ open, onClose, title, children, maxWidthClassName = 'max-w-lg' }: ModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0 bg-[hsl(var(--pb-wine-deep)/0.45)] backdrop-blur-[2px] pb-anim-fade-in"
        onClick={onClose}
      />
      <div
        ref={containerRef}
        className={cn(
          'relative w-full rounded-md bg-[hsl(var(--pb-ivory))] shadow-pb-lg pb-anim-scale-in',
          maxWidthClassName
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
        <div className="max-h-[80vh] overflow-y-auto p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
