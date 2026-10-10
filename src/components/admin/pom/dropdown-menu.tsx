'use client';

import { useEffect, useRef, useState } from 'react';

export interface DropdownOption {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
  /** Draw a thin rule above this option, to split a long list into groups. */
  dividerBefore?: boolean;
  icon?: React.ReactNode;
  tone?: 'danger';
}

/**
 * POM's one dropdown: a tap target plus its anchored popover. Used for the
 * phone screen switcher, the settings gear and row overflow menus.
 */
export function DropdownMenu({
  trigger,
  options,
  activeId,
  onSelect,
  align = 'left',
  side = 'down',
  className,
  label,
  width = 'w-52',
}: {
  trigger: React.ReactNode;
  options: DropdownOption[];
  activeId?: string;
  onSelect: (id: string) => void;
  align?: 'left' | 'right';
  side?: 'down' | 'up';
  className?: string;
  label?: string;
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <div className={className ?? 'relative shrink-0'} ref={ref} style={className ? { position: 'relative' } : undefined}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className={className ? 'w-full' : undefined}
      >
        {trigger}
      </button>

      {open ? (
        <div
          role="menu"
          className={`pom-menu absolute z-50 max-h-[min(70vh,26rem)] overflow-y-auto p-1.5 ${width} ${
            side === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
          style={{
            animation: 'pom-rise-in 0.28s var(--pom-ease-apple)',
            ...(align === 'right' ? { right: 0 } : { left: 0 }),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {options.map((o) => {
            const active = o.id === activeId;
            const color = o.disabled
              ? 'var(--pom-muted-2)'
              : o.tone === 'danger'
                ? 'var(--pom-danger)'
                : active
                  ? 'var(--pom-accent-ink)'
                  : 'var(--pom-text)';
            return (
              <div key={o.id}>
                {o.dividerBefore ? <div className="mx-2 my-1.5 border-t" /> : null}
                <button
                  type="button"
                  role="menuitem"
                  disabled={o.disabled}
                  onClick={() => {
                    if (o.disabled) return;
                    onSelect(o.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-[13px] transition-colors hover:bg-[var(--pom-accent-soft)] disabled:cursor-default disabled:hover:bg-transparent"
                  style={{
                    background: active ? 'var(--pom-accent-soft)' : undefined,
                    color,
                    fontWeight: active ? 600 : 500,
                  }}
                >
                  <span className="flex items-center gap-2.5">
                    {o.icon}
                    {o.label}
                  </span>
                  {o.count !== undefined ? (
                    <span
                      className="shrink-0 rounded-sm px-1.5 py-px text-[10.5px] font-semibold tabular-nums"
                      style={{
                        background: active ? 'var(--pom-accent-soft)' : 'var(--pom-panel-2)',
                        color: active ? 'var(--pom-accent-ink)' : 'var(--pom-muted)',
                      }}
                    >
                      {o.count}
                    </span>
                  ) : null}
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
