'use client';

import { mediaUrl } from './format';

/**
 * POM's dashboard bars: horizontal, direct-labelled, because on a dataset
 * this small the exact counts matter more than reading a length.
 */

export interface Bucket {
  key: string;
  label: string;
  count: number;
  color: string;
  onClick?: () => void;
}

export function StatusBars({ buckets, empty = 'No orders in this range.' }: { buckets: Bucket[]; empty?: string }) {
  const total = buckets.reduce((a, b) => a + b.count, 0);
  const max = Math.max(...buckets.map((b) => b.count), 1);

  if (total === 0) return <p className="muted text-sm">{empty}</p>;

  return (
    <div className="space-y-3">
      {buckets.map((b) => {
        const pct = Math.round((b.count / total) * 100);
        const width = (b.count / max) * 100;
        const Row = b.onClick ? 'button' : 'div';
        return (
          <Row
            key={b.key}
            {...(b.onClick ? { type: 'button' as const, onClick: b.onClick } : {})}
            className="block w-full text-left"
          >
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span className="pom-round h-2 w-2 shrink-0 rounded-full" style={{ background: b.color }} aria-hidden />
                {b.label}
              </span>
              <span className="tabular-nums" style={{ color: 'var(--pom-muted)' }}>
                {b.count} · {pct}%
              </span>
            </div>
            <div className="pom-round h-2.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--pom-panel-2)' }}>
              <div
                className="pom-round h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(width, b.count > 0 ? 3 : 0)}%`, background: b.color }}
              />
            </div>
          </Row>
        );
      })}
    </div>
  );
}

export interface TopItem {
  key: string;
  title: string;
  sub?: string;
  image?: string | null;
  quantity: number;
  revenue: number;
}

export function TopBars({
  items,
  format,
  empty = 'No sales in this range yet.',
}: {
  items: TopItem[];
  format: (n: number) => string;
  empty?: string;
}) {
  const max = Math.max(...items.map((i) => i.revenue), 1);
  if (items.length === 0) return <p className="muted text-sm">{empty}</p>;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-3">
          {item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl(item.image)} alt="" className="h-9 w-9 shrink-0 border object-cover" loading="lazy" />
          ) : (
            <span className="h-9 w-9 shrink-0 border" style={{ background: 'var(--pom-panel-2)' }} />
          )}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
              <span className="min-w-0 truncate">
                <span className="font-medium">{item.title}</span>
                {item.sub ? <span className="muted"> · {item.sub}</span> : null}
              </span>
              <span className="shrink-0 tabular-nums" style={{ color: 'var(--pom-muted)' }}>
                {item.quantity} sold · {format(item.revenue)}
              </span>
            </div>
            <div className="pom-round h-2 w-full overflow-hidden rounded-full" style={{ background: 'var(--pom-panel-2)' }}>
              <div
                className="pom-round h-full rounded-full"
                style={{
                  width: `${Math.max((item.revenue / max) * 100, 3)}%`,
                  background: 'linear-gradient(90deg, var(--pom-accent), var(--pom-accent-2))',
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** A small daily column chart for the sales trend. Pure SVG, no chart library. */
export function DailyColumns({
  days,
  format,
}: {
  days: { key: string; label: string; value: number; count: number }[];
  format: (n: number) => string;
}) {
  const max = Math.max(...days.map((d) => d.value), 1);
  const every = days.length > 14 ? Math.ceil(days.length / 7) : 1;
  return (
    <div>
      <div className="flex h-32 items-end gap-[3px]">
        {days.map((d) => (
          <div key={d.key} className="group relative flex h-full flex-1 items-end">
            <div
              className="pom-round w-full rounded-t-[3px] transition-all duration-500"
              style={{
                height: `${d.value > 0 ? Math.max((d.value / max) * 100, 4) : 0}%`,
                background: 'linear-gradient(180deg, var(--pom-accent-2), var(--pom-accent))',
                minHeight: d.value > 0 ? 3 : 0,
              }}
            />
            <div
              className="pom-menu pointer-events-none absolute bottom-full left-1/2 z-10 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap px-2 py-1 text-[11px] group-hover:block"
              style={{ borderRadius: 8 }}
            >
              <div className="font-semibold">{format(d.value)}</div>
              <div className="muted">
                {d.label} · {d.count} {d.count === 1 ? 'order' : 'orders'}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-[3px]">
        {days.map((d, i) => (
          <div key={d.key} className="muted flex-1 truncate text-center text-[10px]">
            {i % every === 0 ? d.label : ''}
          </div>
        ))}
      </div>
    </div>
  );
}
