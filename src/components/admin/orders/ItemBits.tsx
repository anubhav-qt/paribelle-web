'use client';

import Link from 'next/link';

import { moneyExact } from '@/components/admin/pom/format';
import { Thumb } from '@/components/admin/pom/image-lightbox';
import { colorSwatch } from '@/components/admin/pom/swatch';
import { ColorDot } from '@/components/admin/pom/ui';
import { itemOptions, itemPhoto, itemSku, type AdminOrderItem } from '@/lib/admin/orders';
import { cn } from '@/lib/utils';

/**
 * What was bought, the way a packer reads it: size first and big, then the
 * colour with its dot, then the quantity called out when it is more than one.
 */
export function OptionChips({ item, size = 'sm', className }: { item: AdminOrderItem; size?: 'sm' | 'md'; className?: string }) {
  const { size: sz, color, other } = itemOptions(item);
  const swatch = colorSwatch(color);
  const qty = Number(item.quantity) || 1;
  const chip = cn(
    'pom-round inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border font-medium',
    size === 'md' ? 'px-2 py-1 text-[13px]' : 'px-1.5 py-0.5 text-[11.5px]',
  );

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {sz ? (
        <span className={chip} style={{ borderColor: 'var(--pom-border-strong)', background: 'var(--pom-panel)' }}>
          <span className="muted font-normal">Size</span>
          <span className="font-semibold">{sz}</span>
        </span>
      ) : null}
      {color ? (
        <span className={chip} style={{ borderColor: 'var(--pom-border-strong)', background: 'var(--pom-panel)' }}>
          {swatch ? <ColorDot css={swatch.css} multi={swatch.multi} /> : null}
          {color}
        </span>
      ) : null}
      {other.map(([k, v]) => (
        <span key={k} className={chip} style={{ borderColor: 'var(--pom-border)', background: 'var(--pom-panel-2)' }}>
          <span className="muted font-normal">{k}</span>
          {v}
        </span>
      ))}
      <span
        className={chip}
        style={
          qty > 1
            ? { borderColor: 'transparent', background: 'var(--pom-warn-soft)', color: '#a45f0e' }
            : { borderColor: 'transparent', background: 'var(--pom-panel-2)', color: 'var(--pom-muted)' }
        }
        title="Quantity"
      >
        × {qty}
      </span>
    </div>
  );
}

/** A compact line for lists: small photo, name, chips. */
export function ItemLine({ item, photo = 'h-12 w-12' }: { item: AdminOrderItem; photo?: string }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Thumb src={itemPhoto(item)} alt={item.productName} className={photo} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium">{item.productName}</div>
        <OptionChips item={item} className="mt-1" />
      </div>
    </div>
  );
}

/** The full line in an order's detail: a photo big enough to pick the right piece from. */
export function ItemCard({ item }: { item: AdminOrderItem }) {
  const sku = itemSku(item);
  const qty = Number(item.quantity) || 1;
  const price = Number(item.price) || 0;
  const slug = item.product?.slug;

  return (
    <div className="flex gap-3.5 p-3">
      <Thumb src={itemPhoto(item)} alt={item.productName} className="h-28 w-24 sm:h-32 sm:w-28" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold leading-snug">{item.productName}</div>
        <OptionChips item={item} size="md" className="mt-2" />
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="tabular-nums">
            {moneyExact(price)}
            {qty > 1 ? <span className="muted"> × {qty} = {moneyExact(price * qty)}</span> : null}
          </span>
          {sku ? <span className="font-mono muted">{sku}</span> : null}
          {slug ? (
            <Link href={`/products/${slug}`} target="_blank" className="font-medium" style={{ color: 'var(--pom-accent-ink)' }}>
              View on store
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
