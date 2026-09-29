'use client';

import { X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';
import { pomFontVars } from './fonts';

/**
 * Renders into document.body, back inside the admin scope. A portal leaves
 * the `.pom-admin` wrapper, and with it every --pom-* token and the admin
 * fonts, so each one re-enters the scope here.
 */
export function PomPortal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<div className={cn('pom-admin', pomFontVars)}>{children}</div>, document.body);
}

/** Open modals, oldest first, so Escape closes only the one on top. */
const openStack: symbol[] = [];

/**
 * POM's modal: centred on a blurred scrim from `sm` up, a full-screen sheet
 * below it. Escape closes it and the page behind stops scrolling while open.
 * `footer` pins an action bar under the scrolling body, so the buttons that
 * move an order along stay in reach however long the order is.
 */
export function Modal({
  title,
  subtitle,
  onClose,
  children,
  footer,
  width = '36rem',
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: string;
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const id = Symbol('modal');
    openStack.push(id);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openStack[openStack.length - 1] === id) onCloseRef.current();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      openStack.splice(openStack.indexOf(id), 1);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = openStack.length > 0 ? 'hidden' : prevOverflow;
    };
  }, []);

  return (
    <PomPortal>
      <div className="fixed inset-0 z-[70] flex items-stretch justify-center overflow-y-auto sm:items-start sm:px-4 sm:pb-10 sm:pt-16 lg:pt-20">
        <div
          className="fixed inset-0"
          style={{ background: 'rgba(10, 20, 30, 0.35)', backdropFilter: 'blur(3px)' }}
          onClick={onClose}
          aria-hidden
        />

        <div
          role="dialog"
          aria-modal="true"
          className="panel relative flex h-full w-full flex-col overflow-hidden sm:h-auto"
          style={{ maxWidth: width, animation: 'pom-rise-in 0.28s var(--pom-ease-apple)' }}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 border-b px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
              {subtitle ? <div className="muted mt-0.5 text-xs">{subtitle}</div> : null}
            </div>
            <button onClick={onClose} className="nav-icon-btn -mr-1.5 -mt-1 shrink-0" aria-label="Close">
              <X className="h-[18px] w-[18px]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 sm:max-h-[72vh] sm:flex-none">{children}</div>

          {footer ? (
            <div
              className="flex shrink-0 flex-wrap items-center gap-2 border-t px-5 py-3"
              style={{ background: 'var(--pom-panel-2)', paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
            >
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </PomPortal>
  );
}
