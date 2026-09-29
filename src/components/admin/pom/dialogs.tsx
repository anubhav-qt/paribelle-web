'use client';

import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { create } from 'zustand';

import { cn } from '@/lib/utils';
import { Modal, PomPortal } from './modal';

/* -------------------------------------------------------------------------- */
/* Toasts                                                                      */
/* -------------------------------------------------------------------------- */

type ToastKind = 'success' | 'error' | 'info';
interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

const useToasts = create<{ items: ToastItem[]; push: (kind: ToastKind, message: string) => void; drop: (id: number) => void }>(
  (set) => ({
    items: [],
    push: (kind, message) => {
      const id = Date.now() + Math.random();
      set((s) => ({ items: [...s.items.slice(-2), { id, kind, message }] }));
      setTimeout(() => set((s) => ({ items: s.items.filter((t) => t.id !== id) })), kind === 'error' ? 6000 : 3500);
    },
    drop: (id) => set((s) => ({ items: s.items.filter((t) => t.id !== id) })),
  }),
);

/** Fire-and-forget feedback after an action. Callable from anywhere, no hook needed. */
export const toast = {
  success: (message: string) => useToasts.getState().push('success', message),
  error: (message: string) => useToasts.getState().push('error', message),
  info: (message: string) => useToasts.getState().push('info', message),
};

/* -------------------------------------------------------------------------- */
/* Confirm and prompt                                                          */
/* -------------------------------------------------------------------------- */

export interface PromptField {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  defaultValue?: string;
  hint?: string;
  /** Offer these as one-tap suggestions under the field. */
  suggestions?: string[];
}

interface DialogRequest {
  title: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: 'primary' | 'danger';
  fields?: PromptField[];
  resolve: (value: Record<string, string> | null) => void;
}

const useDialog = create<{ current: DialogRequest | null; open: (r: DialogRequest) => void; close: () => void }>((set) => ({
  current: null,
  open: (r) => set({ current: r }),
  close: () => set({ current: null }),
}));

/** Ask a yes/no question in the POM modal. Resolves true on confirm. */
export function confirmDialog(opts: {
  title: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: 'primary' | 'danger';
}): Promise<boolean> {
  return new Promise((resolve) => {
    useDialog.getState().open({ ...opts, resolve: (v) => resolve(v !== null) });
  });
}

/** Ask for one or more short answers. Resolves the values by field name, or null if cancelled. */
export function promptDialog(opts: {
  title: string;
  message?: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: 'primary' | 'danger';
  fields: PromptField[];
}): Promise<Record<string, string> | null> {
  return new Promise((resolve) => {
    useDialog.getState().open({ ...opts, resolve });
  });
}

/* -------------------------------------------------------------------------- */
/* Host: mounted once, in the admin shell                                      */
/* -------------------------------------------------------------------------- */

export function DialogHost() {
  const current = useDialog((s) => s.current);
  const toasts = useToasts((s) => s.items);
  const drop = useToasts((s) => s.drop);

  return (
    <>
      {current ? <DialogView key={current.title + (current.fields?.length ?? 0)} request={current} /> : null}
      {toasts.length > 0 ? (
        <PomPortal>
          <div
            className="pointer-events-none fixed inset-x-0 z-[95] flex flex-col items-center gap-2 px-4 sm:inset-x-auto sm:right-5 sm:items-end"
            style={{ bottom: 'calc(76px + env(safe-area-inset-bottom))' }}
          >
            {toasts.map((t) => {
              const Icon = t.kind === 'success' ? CheckCircle2 : t.kind === 'error' ? AlertTriangle : Info;
              const color =
                t.kind === 'success' ? 'var(--pom-ok)' : t.kind === 'error' ? 'var(--pom-danger)' : 'var(--pom-accent)';
              return (
                <div
                  key={t.id}
                  role="status"
                  className="pom-menu pointer-events-auto flex w-full max-w-sm items-start gap-2.5 px-3.5 py-3 text-sm"
                  style={{ animation: 'pom-rise-in 0.28s var(--pom-ease-apple)' }}
                >
                  <Icon className="mt-px h-4 w-4 shrink-0" style={{ color }} />
                  <span className="min-w-0 flex-1 leading-snug">{t.message}</span>
                  <button onClick={() => drop(t.id)} className="muted -mr-1 shrink-0" aria-label="Dismiss">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </PomPortal>
      ) : null}
    </>
  );
}

function DialogView({ request }: { request: DialogRequest }) {
  const close = useDialog((s) => s.close);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries((request.fields ?? []).map((f) => [f.name, f.defaultValue ?? ''])),
  );
  const [error, setError] = useState<string | null>(null);
  const firstRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  function finish(result: Record<string, string> | null) {
    close();
    request.resolve(result);
  }

  function submit(e?: React.FormEvent) {
    e?.preventDefault();
    for (const f of request.fields ?? []) {
      if (f.required && !values[f.name]?.trim()) {
        setError(`${f.label} is required.`);
        return;
      }
    }
    finish(Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()])));
  }

  return (
    <Modal
      title={request.title}
      onClose={() => finish(null)}
      width="28rem"
      footer={
        <div className="flex w-full justify-end gap-2">
          <button type="button" className="btn" onClick={() => finish(null)}>
            {request.cancelText ?? 'Cancel'}
          </button>
          <button
            type="button"
            className={cn('btn', request.tone === 'danger' ? 'btn-white btn-danger' : 'btn-blue')}
            onClick={() => submit()}
          >
            {request.confirmText ?? 'Confirm'}
          </button>
        </div>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {request.message ? <div className="muted text-sm leading-relaxed">{request.message}</div> : null}
        {(request.fields ?? []).map((f, i) => (
          <div key={f.name}>
            <label className="label" htmlFor={`dlg-${f.name}`}>
              {f.label}
              {f.required ? '' : ' (optional)'}
            </label>
            {f.multiline ? (
              <textarea
                id={`dlg-${f.name}`}
                ref={i === 0 ? (el) => { firstRef.current = el; } : undefined}
                className="input min-h-[88px]"
                placeholder={f.placeholder}
                value={values[f.name]}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
              />
            ) : (
              <input
                id={`dlg-${f.name}`}
                ref={i === 0 ? (el) => { firstRef.current = el; } : undefined}
                className="input"
                placeholder={f.placeholder}
                value={values[f.name]}
                onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
              />
            )}
            {f.suggestions?.length ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {f.suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setValues((v) => ({ ...v, [f.name]: s }))}
                    className="rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-[var(--pom-accent-soft)]"
                    style={
                      values[f.name] === s
                        ? { borderColor: 'var(--pom-accent)', color: 'var(--pom-accent-ink)', background: 'var(--pom-accent-soft)' }
                        : undefined
                    }
                  >
                    {s}
                  </button>
                ))}
              </div>
            ) : null}
            {f.hint ? <p className="muted mt-1 text-xs">{f.hint}</p> : null}
          </div>
        ))}
        {error ? (
          <p className="text-sm" style={{ color: 'var(--pom-danger)' }}>
            {error}
          </p>
        ) : null}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Modal>
  );
}
