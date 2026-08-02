'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PbToastType = 'success' | 'error' | 'info' | 'warning';

interface PbToastItem {
  id: number;
  message: string;
  type: PbToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: PbToastType) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

const icons: Record<PbToastType, React.ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-[hsl(var(--pb-success))]" />,
  error: <XCircle className="h-5 w-5 text-[hsl(var(--pb-danger))]" />,
  warning: <AlertTriangle className="h-5 w-5 text-[hsl(var(--pb-warning))]" />,
  info: <Info className="h-5 w-5 text-[hsl(var(--pb-rose))]" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<PbToastItem[]>([]);
  const [mounted, setMounted] = React.useState(false);
  const idRef = React.useRef(0);

  React.useEffect(() => setMounted(true), []);

  const showToast = React.useCallback((message: string, type: PbToastType = 'info') => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {mounted &&
        createPortal(
          <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
            {toasts.map((t) => (
              <div
                key={t.id}
                className="pb-anim-toast-in flex items-start gap-3 rounded-sm border border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-ivory))] px-4 py-3 shadow-pb-md max-w-sm"
              >
                {icons[t.type]}
                <p className="flex-1 pt-0.5 text-sm text-[hsl(var(--pb-ink))]">{t.message}</p>
                <button
                  onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
                  className="text-[hsl(var(--pb-ink-faint))] hover:text-[hsl(var(--pb-ink))]"
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function usePbToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error('usePbToast must be used within ToastProvider');
  return ctx;
}
