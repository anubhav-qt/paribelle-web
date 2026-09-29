'use client';

import { ImagePlus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { confirmDialog, toast } from '@/components/admin/pom/dialogs';
import { mediaUrl } from '@/components/admin/pom/format';
import { Segmented } from '@/components/admin/pom/segmented';
import { CenteredSpinner, FormField, Notice, PageHeader, SaveBar, Section, Spinner } from '@/components/admin/pom/ui';
import { api, errorMessage } from '@/lib/api';

interface Setting {
  key: string;
  value: unknown;
}

interface Values {
  marketplace_name: string;
  marketplace_logo: string;
  exchange_window_days: string;
  exchange_courier_charge: string;
  thumbnailLayout: 'vertical' | 'horizontal';
}

const DESCRIPTIONS: Record<keyof Values, string> = {
  marketplace_name: 'Store name shown in the header, at checkout and on invoices',
  marketplace_logo: 'Store logo URL',
  exchange_window_days: 'Days after delivery a customer can ask for an exchange',
  exchange_courier_charge: 'Flat courier charge for sending an exchange replacement out. 0 disables the charge.',
  thumbnailLayout: 'Product photo thumbnails: "vertical" (beside the photo) or "horizontal" (under it)',
};

const DEFAULTS: Values = {
  marketplace_name: 'PariBelle',
  marketplace_logo: '',
  exchange_window_days: '7',
  exchange_courier_charge: '0',
  thumbnailLayout: 'vertical',
};

function read(list: Setting[]): Values {
  const get = (k: string) => list.find((s) => s.key === k)?.value;
  const str = (v: unknown, d: string) => (v === undefined || v === null || v === '' ? d : String(v));
  return {
    marketplace_name: str(get('marketplace_name'), DEFAULTS.marketplace_name),
    marketplace_logo: str(get('marketplace_logo'), ''),
    exchange_window_days: str(get('exchange_window_days'), DEFAULTS.exchange_window_days),
    exchange_courier_charge: str(get('exchange_courier_charge'), DEFAULTS.exchange_courier_charge),
    thumbnailLayout: get('thumbnailLayout') === 'horizontal' ? 'horizontal' : 'vertical',
  };
}

/**
 * The handful of switches the shop actually has. Each saves only the settings
 * that changed, so nothing set elsewhere (the homepage photos, legacy keys)
 * is ever overwritten from here.
 */
export default function StoreSettingsPage() {
  const [saved, setSaved] = useState<Values | null>(null);
  const [values, setValues] = useState<Values>(DEFAULTS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .get<Setting[]>('/settings/admin/all')
      .then((list) => {
        const v = read(list ?? []);
        setSaved(v);
        setValues(v);
      })
      .catch((e) => setLoadError(errorMessage(e, 'Could not load settings.')));
  }, []);

  const set = <K extends keyof Values>(k: K, v: Values[K]) => setValues((cur) => ({ ...cur, [k]: v }));
  const changed = saved ? (Object.keys(values) as (keyof Values)[]).filter((k) => values[k] !== saved[k]) : [];

  async function save() {
    const days = Number(values.exchange_window_days);
    const charge = Number(values.exchange_courier_charge);
    if (!values.marketplace_name.trim()) return toast.error('The store needs a name.');
    if (!Number.isInteger(days) || days < 1 || days > 60) return toast.error('Exchange window must be 1 to 60 days.');
    if (!Number.isFinite(charge) || charge < 0) return toast.error('Courier charge must be 0 or more.');

    setSaving(true);
    try {
      for (const k of changed) {
        const value =
          k === 'exchange_window_days' ? days : k === 'exchange_courier_charge' ? charge : k === 'marketplace_name' ? values[k].trim() : values[k];
        await api.put(`/settings/${k}`, { value, description: DESCRIPTIONS[k] });
      }
      setSaved(values);
      toast.success('Settings saved.');
    } catch (e) {
      toast.error(errorMessage(e, 'Could not save settings.'));
    } finally {
      setSaving(false);
    }
  }

  async function uploadLogo(file: File) {
    if (!file.type.startsWith('image/')) return toast.error('Choose an image file.');
    if (file.size > 2 * 1024 * 1024) return toast.error('The logo must be under 2 MB.');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.upload<{ url: string }>('/upload/image', form);
      set('marketplace_logo', res.url);
    } catch (e) {
      toast.error(errorMessage(e, 'Upload failed.'));
    } finally {
      setUploading(false);
    }
  }

  if (loadError) return <Notice tone="danger">{loadError}</Notice>;
  if (!saved) return <CenteredSpinner />;

  return (
    <div className="mx-auto max-w-3xl pb-20">
      <PageHeader title="Store settings" hint="How the shop presents itself and handles exchanges." />

      <div className="space-y-5">
        <Section title="Brand">
          <div className="grid gap-5 sm:grid-cols-[1fr_auto]">
            <FormField label="Store name" htmlFor="st-name" hint="In the header, at checkout and on every invoice.">
              <input id="st-name" className="input" value={values.marketplace_name} onChange={(e) => set('marketplace_name', e.target.value)} />
            </FormField>
            <div>
              <div className="label">Logo</div>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-16 w-28 items-center justify-center border"
                  style={{ borderColor: 'var(--pom-border)', background: 'var(--pom-panel-2)' }}
                >
                  {uploading ? (
                    <Spinner size="1.4rem" />
                  ) : values.marketplace_logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={mediaUrl(values.marketplace_logo)} alt="Logo" className="max-h-14 max-w-[6.5rem] object-contain" />
                  ) : (
                    <span className="muted text-xs">No logo</span>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <button type="button" className="btn btn-white px-3 py-1.5 text-[13px]" onClick={() => logoInput.current?.click()} disabled={uploading}>
                    <ImagePlus className="h-4 w-4" />
                    {values.marketplace_logo ? 'Replace' : 'Upload'}
                  </button>
                  {values.marketplace_logo ? (
                    <button type="button" className="btn btn-danger px-3 py-1 text-xs" onClick={() => set('marketplace_logo', '')}>
                      Remove
                    </button>
                  ) : null}
                </div>
                <input
                  ref={logoInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = '';
                    if (f) uploadLogo(f);
                  }}
                />
              </div>
            </div>
          </div>
        </Section>

        <Section title="Exchanges" hint="The shop offers exchanges only, no refunds.">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Exchange window" htmlFor="st-days" hint="Days after delivery a customer can ask to exchange.">
              <div className="flex items-center gap-2">
                <input
                  id="st-days"
                  className="input w-24"
                  inputMode="numeric"
                  value={values.exchange_window_days}
                  onChange={(e) => set('exchange_window_days', e.target.value.replace(/[^\d]/g, ''))}
                />
                <span className="muted text-sm">days</span>
              </div>
            </FormField>
            <FormField
              label="Courier charge for the replacement"
              htmlFor="st-charge"
              hint="Charged to the customer for sending the new piece out. 0 means free."
            >
              <div className="flex items-center gap-2">
                <span className="muted text-sm">₹</span>
                <input
                  id="st-charge"
                  className="input w-28"
                  inputMode="decimal"
                  value={values.exchange_courier_charge}
                  onChange={(e) => set('exchange_courier_charge', e.target.value.replace(/[^\d.]/g, ''))}
                />
              </div>
            </FormField>
          </div>
        </Section>

        <Section title="Product page">
          <div>
            <div className="label">Photo thumbnails</div>
            <Segmented<'vertical' | 'horizontal'>
              label="Thumbnail layout"
              size="md"
              value={values.thumbnailLayout}
              onChange={(v) => set('thumbnailLayout', v)}
              items={[
                { key: 'vertical', label: 'Beside the photo' },
                { key: 'horizontal', label: 'Under the photo' },
              ]}
            />
          </div>
        </Section>

        <PhotoCleanup />
      </div>

      <SaveBar count={changed.length} saving={saving} onSave={save} onDiscard={() => setValues(saved)} />
    </div>
  );
}

/** Photos uploaded but no longer used by any product, found and removed on demand. */
function PhotoCleanup() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ total: number; orphans: string[]; deleted?: number } | null>(null);

  async function scan() {
    setBusy(true);
    try {
      setResult(await api.post('/products/admin/cleanup-orphan-images'));
    } catch (e) {
      toast.error(errorMessage(e, 'Scan failed.'));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!result?.orphans.length) return;
    const ok = await confirmDialog({
      title: `Delete ${result.orphans.length} unused photos?`,
      message: 'They are not on any product. This cannot be undone.',
      confirmText: 'Delete',
      tone: 'danger',
    });
    if (!ok) return;
    setBusy(true);
    try {
      const r = await api.post<{ total: number; orphans: string[]; deleted: number }>('/products/admin/cleanup-orphan-images', undefined, {
        params: { delete: true },
      });
      toast.success(`Deleted ${r.deleted} unused photos.`);
      setResult({ ...r, orphans: [] });
    } catch (e) {
      toast.error(errorMessage(e, 'Delete failed.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section
      title="Unused photos"
      hint="Photos left behind by deleted products or replaced uploads take up storage."
      actions={
        <button type="button" className="btn btn-white px-3 py-1.5 text-[13px]" onClick={scan} disabled={busy}>
          {busy && !result ? 'Scanning...' : 'Scan'}
        </button>
      }
    >
      {!result ? (
        <p className="muted text-sm">Scan to see how many there are. Nothing is deleted until you confirm.</p>
      ) : result.orphans.length === 0 ? (
        <p className="text-sm">
          {result.deleted ? `${result.deleted} deleted. ` : ''}No unused photos{result.total ? ` among ${result.total} files` : ''}.
        </p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm">
            <span className="font-semibold">{result.orphans.length}</span> unused of {result.total} photos.
          </p>
          <div className="flex flex-wrap gap-1.5">
            {result.orphans.slice(0, 24).map((u) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={u} src={mediaUrl(u)} alt="" className="h-14 w-14 border object-cover" loading="lazy" />
            ))}
            {result.orphans.length > 24 ? <span className="muted self-center text-xs">+{result.orphans.length - 24} more</span> : null}
          </div>
          <button type="button" className="btn btn-white btn-danger" onClick={remove} disabled={busy}>
            <Trash2 className="h-4 w-4" />
            Delete {result.orphans.length} unused photos
          </button>
        </div>
      )}
    </Section>
  );
}
