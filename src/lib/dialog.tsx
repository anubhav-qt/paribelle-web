'use client';

/**
 * Global replacement for window.alert()/window.confirm().
 *
 * A plain module-level store rather than a React context: alert()/confirm()
 * calls originate from places that aren't React components (CartContext's
 * stock checks, plain lib functions) and can fire before any particular
 * provider is mounted above them in the tree. Any file can `import { showAlert }`
 * and call it directly; <DialogHost/> (mounted once, near the app root) is the
 * only thing that needs to subscribe.
 */

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'error' | 'warning';

interface AlertState {
  kind: 'alert';
  message: string;
  variant: AlertVariant;
  resolve: () => void;
}

interface ConfirmState {
  kind: 'confirm';
  title?: string;
  message: string;
  confirmText: string;
  cancelText: string;
  variant: 'danger' | 'primary';
  resolve: (ok: boolean) => void;
}

interface PromptState {
  kind: 'prompt';
  title?: string;
  message: string;
  placeholder?: string;
  defaultValue: string;
  confirmText: string;
  cancelText: string;
  required: boolean;
  resolve: (value: string | null) => void;
}

type DialogState = AlertState | ConfirmState | PromptState | null;

let state: DialogState = null;
const listeners = new Set<(s: DialogState) => void>();

function setState(next: DialogState) {
  state = next;
  listeners.forEach((l) => l(next));
}

/** Drop-in replacement for `alert(message)`. Resolves once the user dismisses it. */
export function showAlert(message: string, variant: AlertVariant = 'info'): Promise<void> {
  return new Promise((resolve) => {
    setState({ kind: 'alert', message, variant, resolve });
  });
}

/** Drop-in replacement for `confirm(message)`. Resolves to whether the user confirmed. */
export function showConfirm(options: {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
}): Promise<boolean> {
  return new Promise((resolve) => {
    setState({
      kind: 'confirm',
      title: options.title,
      message: options.message,
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      variant: options.variant || 'primary',
      resolve,
    });
  });
}

/**
 * Drop-in replacement for `prompt(message, defaultValue)`. Resolves to the
 * entered text, or `null` if the user cancelled — same contract as `prompt()`.
 * Set `required: true` to disable the confirm button until non-empty text is
 * entered (native `prompt()` has no such concept, but every current caller
 * treats an empty answer as "didn't actually answer").
 */
export function showPrompt(options: {
  title?: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  required?: boolean;
}): Promise<string | null> {
  return new Promise((resolve) => {
    setState({
      kind: 'prompt',
      title: options.title,
      message: options.message,
      placeholder: options.placeholder,
      defaultValue: options.defaultValue || '',
      confirmText: options.confirmText || 'OK',
      cancelText: options.cancelText || 'Cancel',
      required: options.required ?? false,
      resolve,
    });
  });
}

const variantIcon: Record<AlertVariant, React.ReactNode> = {
  info: <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
  success: <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />,
  error: <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />,
  warning: <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
};

const variantIconBg: Record<AlertVariant, string> = {
  info: 'bg-blue-100 dark:bg-blue-900/20',
  success: 'bg-green-100 dark:bg-green-900/20',
  error: 'bg-red-100 dark:bg-red-900/20',
  warning: 'bg-orange-100 dark:bg-orange-900/20',
};

/** Mount once near the app root. Renders the centered modal for showAlert()/showConfirm(). */
export function DialogHost() {
  const [current, setCurrent] = useState<DialogState>(null);
  const [mounted, setMounted] = useState(false);
  const [promptValue, setPromptValue] = useState('');

  useEffect(() => {
    setMounted(true);
    listeners.add(setCurrent);
    return () => {
      listeners.delete(setCurrent);
    };
  }, []);

  useEffect(() => {
    setPromptValue(current?.kind === 'prompt' ? current.defaultValue : '');
  }, [current]);

  const dismiss = (state: DialogState) => {
    if (!state) return;
    if (state.kind === 'alert') state.resolve();
    else if (state.kind === 'confirm') state.resolve(false);
    else state.resolve(null);
  };

  useEffect(() => {
    if (!current) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss(current);
        setState(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [current]);

  if (!mounted || !current) return null;

  const close = () => setState(null);
  const promptInvalid = current.kind === 'prompt' && current.required && !promptValue.trim();

  return createPortal(
    <div
      // Above every other fixed overlay in the app (product/order modals sit
      // at z-50) — this can be triggered from inside one of them (e.g. the
      // admin exchange panel's reject/tracking-number prompts), and must
      // always land on top of it, never behind.
      //
      // Set as an inline style, not only as `z-[500]`: this file sat outside
      // Tailwind's `content` globs, so that class was purged and the overlay
      // rendered *behind* the very modal it was opened from. The glob is
      // fixed (see tailwind.config.js), and this makes the stacking a
      // property of the component rather than of the build configuration.
      style={{ zIndex: 500 }}
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150"
      onClick={() => {
        dismiss(current);
        close();
      }}
    >
      <div
        className="w-full max-w-sm rounded-lg bg-white dark:bg-gray-800 shadow-xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div
              className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${
                variantIconBg[current.kind === 'alert' ? current.variant : current.kind === 'confirm' && current.variant === 'danger' ? 'error' : 'info']
              }`}
            >
              {current.kind === 'alert'
                ? variantIcon[current.variant]
                : variantIcon[current.kind === 'confirm' && current.variant === 'danger' ? 'error' : 'info']}
            </div>
            <div className="flex-1 pt-1">
              {current.kind !== 'alert' && current.title && (
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {current.title}
                </h3>
              )}
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                {current.message}
              </p>
              {current.kind === 'prompt' && (
                <input
                  type="text"
                  autoFocus
                  value={promptValue}
                  placeholder={current.placeholder}
                  onChange={(e) => setPromptValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !promptInvalid) {
                      current.resolve(promptValue);
                      close();
                    }
                  }}
                  className="mt-3 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              )}
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2 justify-end">
          {current.kind !== 'alert' && (
            <button
              onClick={() => {
                dismiss(current);
                close();
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              {current.cancelText}
            </button>
          )}
          <button
            disabled={promptInvalid}
            onClick={() => {
              if (current.kind === 'alert') current.resolve();
              else if (current.kind === 'confirm') current.resolve(true);
              else current.resolve(promptValue);
              close();
            }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed ${
              current.kind === 'confirm' && current.variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            {current.kind === 'alert' ? 'OK' : current.confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
