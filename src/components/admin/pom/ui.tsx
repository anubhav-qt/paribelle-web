'use client';

import { Search, X } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------- */
/* Tones                                                                       */
/* -------------------------------------------------------------------------- */

export type Tone = 'accent' | 'ok' | 'warn' | 'danger' | 'violet' | 'neutral' | 'indigo' | 'teal';

/**
 * One colour pair per tone (dot / tint), POM's STATUS_TONE idea: the badge
 * and its dot always derive from the same colour, so the whole set can be
 * re-themed from this table alone.
 */
export const TONES: Record<Tone, { dot: string; tint: string }> = {
  accent: { dot: 'var(--pom-accent-ink)', tint: 'var(--pom-accent-soft)' },
  ok: { dot: '#0c9870', tint: 'var(--pom-ok-soft)' },
  warn: { dot: '#c27617', tint: 'var(--pom-warn-soft)' },
  danger: { dot: 'var(--pom-danger)', tint: 'var(--pom-danger-soft)' },
  violet: { dot: 'var(--pom-violet)', tint: 'var(--pom-violet-soft)' },
  indigo: { dot: '#5b7fe0', tint: 'rgba(91,127,224,0.12)' },
  teal: { dot: '#2f968f', tint: 'rgba(58,166,160,0.12)' },
  neutral: { dot: 'var(--pom-muted)', tint: 'rgba(148,152,171,0.14)' },
};

/** A status pill: dot plus label on a tint of the same colour. */
export function Badge({
  tone = 'neutral',
  children,
  dot = true,
  className,
  title,
}: {
  tone?: Tone;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
  title?: string;
}) {
  const t = TONES[tone];
  return (
    <span
      title={title}
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-sm px-2.5 py-1 text-xs font-medium',
        className,
      )}
      style={{ background: t.tint, color: t.dot }}
    >
      {dot ? <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: t.dot }} /> : null}
      {children}
    </span>
  );
}

/** A small uppercase tag (COD, PAID), POM's inline order flags. */
export function Tag({ tone = 'neutral', children, title }: { tone?: Tone; children: React.ReactNode; title?: string }) {
  const t = TONES[tone];
  return (
    <span
      title={title}
      className="inline-flex items-center whitespace-nowrap rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
      style={{ background: t.tint, color: t.dot }}
    >
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading and empty states                                                    */
/* -------------------------------------------------------------------------- */

/** Eight pulsing dots in a ring. Brand blue by default. */
export function Spinner({ size = '2.8rem', color, className }: { size?: string; color?: string; className?: string }) {
  return (
    <div
      className={cn('dot-spinner', className)}
      style={{ '--uib-size': size, ...(color ? { '--uib-color': color, '--uib-glow': 'transparent' } : {}) } as React.CSSProperties}
      role="status"
      aria-label="Loading"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="dot-spinner__dot" />
      ))}
    </div>
  );
}

export function CenteredSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('flex justify-center py-16', className)}>
      <Spinner />
    </div>
  );
}

export function Empty({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-4 py-16 text-center">
      <div
        className="pom-round mb-3 h-10 w-10 rounded-full"
        style={{
          background: 'radial-gradient(circle at 35% 30%, var(--pom-accent-soft), transparent 70%)',
          border: '1px solid var(--pom-border)',
        }}
        aria-hidden
      />
      <p className="text-sm font-medium">{title}</p>
      {hint ? <p className="muted mt-1 max-w-sm text-sm">{hint}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

/** An inline message strip: what went wrong, or what to know before acting. */
export function Notice({
  tone = 'warn',
  children,
  className,
}: {
  tone?: 'warn' | 'danger' | 'ok' | 'accent';
  children: React.ReactNode;
  className?: string;
}) {
  const t = TONES[tone];
  return (
    <div className={cn('px-3.5 py-2.5 text-sm', className)} style={{ background: t.tint, color: t.dot }}>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Numbers                                                                     */
/* -------------------------------------------------------------------------- */

const TONE_ACCENT = {
  danger: 'var(--pom-danger)',
  warn: 'var(--pom-warn)',
  ok: 'var(--pom-ok)',
} as const;

/**
 * POM's Stat card: a label, a big number and a coloured edge. When `onClick`
 * or `href` is given it becomes the filter or shortcut for what it counts,
 * and `active` marks the filter currently applied.
 */
export function Stat({
  label,
  value,
  tone,
  hint,
  onClick,
  href,
  active,
}: {
  label: string;
  value: string | number;
  tone?: 'danger' | 'warn' | 'ok';
  hint?: string;
  onClick?: () => void;
  href?: string;
  active?: boolean;
}) {
  const accent = tone ? TONE_ACCENT[tone] : 'var(--pom-accent)';
  const body = (
    <>
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: accent, opacity: tone || active ? 1 : 0.5 }}
        aria-hidden
      />
      <div className="muted text-[11px] font-medium uppercase tracking-wider">{label}</div>
      <div
        className="mt-1.5 text-[1.6rem] font-semibold leading-none tabular-nums sm:text-[1.75rem]"
        style={{ color: tone ? accent : 'var(--pom-text)' }}
      >
        {value}
      </div>
      {hint ? <div className="muted mt-1.5 text-[11px] leading-snug">{hint}</div> : null}
    </>
  );
  const cls = cn(
    'panel relative block overflow-hidden py-4 pl-5 pr-4 text-left',
    (onClick || href) && 'transition-shadow hover:shadow-[var(--pom-shadow-md)]',
  );
  const style = active ? { boxShadow: `0 0 0 2px ${accent}` } : undefined;
  if (href) {
    return (
      <Link href={href} className={cls} style={style}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cn(cls, 'w-full')} style={style} aria-pressed={active}>
        {body}
      </button>
    );
  }
  return (
    <div className={cls} style={style}>
      {body}
    </div>
  );
}

/**
 * The phone stand-in for a row of Stat cards: the same numbers in one slim
 * scrollable strip. Use it beside a `hidden sm:grid` of Stats.
 */
export function StatStrip({
  items,
}: {
  items: {
    label: string;
    value: string | number;
    tone?: 'danger' | 'warn' | 'ok';
    onClick?: () => void;
    active?: boolean;
  }[];
}) {
  return (
    <div className="panel scrollbar-hide flex gap-1 overflow-x-auto px-2 py-1.5 sm:hidden">
      {items.map((it) => {
        const color = it.tone ? TONE_ACCENT[it.tone] : undefined;
        const inner = (
          <>
            <div className="muted whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider">{it.label}</div>
            <div className="whitespace-nowrap text-[15px] font-semibold tabular-nums" style={{ color }}>
              {it.value}
            </div>
          </>
        );
        return it.onClick ? (
          <button
            key={it.label}
            type="button"
            onClick={it.onClick}
            className="pom-round shrink-0 rounded-lg px-2.5 py-1 text-left"
            style={it.active ? { background: 'var(--pom-accent-soft)' } : undefined}
          >
            {inner}
          </button>
        ) : (
          <div key={it.label} className="shrink-0 px-2.5 py-1">
            {inner}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Layout                                                                      */
/* -------------------------------------------------------------------------- */

/** The title row every screen opens with: name, one quiet line, actions on the right. */
export function PageHeader({
  title,
  hint,
  actions,
  className,
}: {
  title: string;
  hint?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-5 flex flex-wrap items-end justify-between gap-3', className)}>
      <div className="min-w-0">
        <h1 className="text-xl font-semibold tracking-tight sm:text-[22px]">{title}</h1>
        {hint ? <p className="muted mt-0.5 text-sm">{hint}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** A titled panel, the unit every settings and editor screen is built from. */
export function Section({
  title,
  hint,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  hint?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('panel', className)}>
      {title || actions ? (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            {title ? <h2 className="text-[14px] font-semibold">{title}</h2> : null}
            {hint ? <p className="muted mt-0.5 text-xs leading-relaxed">{hint}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn('p-4 sm:p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

/** A label over a value, for read-only facts in a detail view. */
export function Field({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="muted text-[11px] font-medium uppercase tracking-wide">{label}</div>
      <div className="mt-0.5 text-sm">{value ?? <span className="muted">-</span>}</div>
    </div>
  );
}

/** A form field: label, control, and an optional hint or error under it. */
export function FormField({
  label,
  hint,
  error,
  children,
  className,
  htmlFor,
}: {
  label: string;
  hint?: React.ReactNode;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={className}>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs" style={{ color: 'var(--pom-danger)' }}>
          {error}
        </p>
      ) : hint ? (
        <p className="muted mt-1 text-xs leading-relaxed">{hint}</p>
      ) : null}
    </div>
  );
}

/** An on/off switch with its label, for settings that are simply enabled or not. */
export function Toggle({
  checked,
  onChange,
  label,
  hint,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={cn('flex items-start justify-between gap-4', disabled ? 'opacity-60' : 'cursor-pointer')}>
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        {hint ? <span className="muted mt-0.5 block text-xs leading-relaxed">{hint}</span> : null}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="pom-round relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors"
        style={{ background: checked ? 'var(--pom-accent)' : '#d3dce3' }}
      >
        <span
          className="pom-round absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
          style={{ left: 2, transform: checked ? 'translateX(16px)' : 'none', transitionTimingFunction: 'var(--pom-ease-spring)' }}
        />
      </button>
    </label>
  );
}

/** POM's search box: a magnifier, the field, and a clear button once typed in. */
export function SearchBox({
  value,
  onChange,
  placeholder = 'Search...',
  className,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className={cn('search-box', className)}>
      <span className="search-label" aria-hidden>
        <Search className="h-3.5 w-3.5" />
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input [&::-webkit-search-cancel-button]:hidden"
        aria-label={placeholder}
        autoFocus={autoFocus}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="flex h-full items-center px-3 text-[var(--pom-muted)] hover:text-[var(--pom-text)]"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}

/**
 * The bar that rises when a settings form has unsaved changes: pinned over
 * the phone's bottom navigation, and to the foot of the window on a computer.
 */
export function SaveBar({
  count,
  saving,
  onSave,
  onDiscard,
  className,
}: {
  count: number;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
  className?: string;
}) {
  if (count === 0) return null;
  return (
    <div
      className="no-print fixed inset-x-0 bottom-[calc(59px+env(safe-area-inset-bottom))] z-30 border-t px-4 py-3 sm:bottom-0"
      style={{
        background: 'var(--pom-panel)',
        boxShadow: '0 -8px 24px -16px rgba(13,60,82,0.25)',
        animation: 'pom-rise-in 0.28s var(--pom-ease-apple)',
      }}
    >
      <div className={cn('mx-auto flex max-w-3xl items-center gap-2', className)}>
        <span className="muted text-sm">
          {count} unsaved {count === 1 ? 'change' : 'changes'}
        </span>
        <div className="flex-1" />
        <button type="button" className="btn" onClick={onDiscard} disabled={saving}>
          Discard
        </button>
        <button type="button" className="btn btn-blue min-w-[6rem]" onClick={onSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  );
}

/** A colour dot for a variant chip; a rainbow ring for multicolour prints. */
export function ColorDot({ css, multi, className }: { css?: string; multi?: boolean; className?: string }) {
  return (
    <span
      className={cn('pom-round inline-block h-2.5 w-2.5 shrink-0 rounded-full border', className)}
      style={{
        background: multi
          ? 'conic-gradient(#ec4899, #f59e0b, #10b981, #0ea5e9, #8b5cf6, #ec4899)'
          : css || 'transparent',
        borderColor: 'rgba(15,37,54,0.18)',
      }}
      aria-hidden
    />
  );
}
