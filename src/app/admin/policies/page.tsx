'use client';

import { useEffect, useState } from 'react';

import { toast } from '@/components/admin/pom/dialogs';
import { CenteredSpinner, FormField, Notice, PageHeader, SaveBar, Section } from '@/components/admin/pom/ui';
import { api, errorMessage } from '@/lib/api';
import { useDataCache } from '@/lib/store/dataCache';
import type { StorePolicy } from '@/types/common';

interface Policies {
  returnPolicy: StorePolicy;
  cancellationPolicy: StorePolicy;
}

const DEFAULTS: Policies = {
  returnPolicy: { enabled: true, days: 7, text: '' },
  cancellationPolicy: { enabled: true, text: '' },
};

const same = (a: StorePolicy, b: StorePolicy) =>
  a.enabled === b.enabled && (a.days ?? null) === (b.days ?? null) && a.text === b.text;

/**
 * The return and cancellation policies shown on product pages and at
 * checkout. Opens on what shoppers currently see.
 */
export default function PoliciesPage() {
  const [saved, setSaved] = useState<Policies | null>(null);
  const [values, setValues] = useState<Policies>(DEFAULTS);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<{ returnPolicy: StorePolicy | null; cancellationPolicy: StorePolicy | null }>('/store/policies', { auth: false })
      .then((res) => {
        const next: Policies = {
          returnPolicy: { ...DEFAULTS.returnPolicy, ...res?.returnPolicy },
          cancellationPolicy: { enabled: res?.cancellationPolicy?.enabled ?? true, text: res?.cancellationPolicy?.text ?? '' },
        };
        setSaved(next);
        setValues(next);
      })
      .catch((e) => setLoadError(errorMessage(e, 'Could not load the policies.')));
  }, []);

  const changed = saved
    ? (['returnPolicy', 'cancellationPolicy'] as const).filter((k) => !same(values[k], saved[k]))
    : [];

  const days = values.returnPolicy.days;
  const daysError =
    values.returnPolicy.enabled && (!Number.isInteger(days) || (days as number) < 1 || (days as number) > 90)
      ? 'Between 1 and 90 days.'
      : null;

  const setReturn = (patch: Partial<StorePolicy>) =>
    setValues((cur) => ({ ...cur, returnPolicy: { ...cur.returnPolicy, ...patch } }));
  const setCancellation = (patch: Partial<StorePolicy>) =>
    setValues((cur) => ({ ...cur, cancellationPolicy: { ...cur.cancellationPolicy, ...patch } }));

  async function save() {
    if (daysError) return toast.error('Fix the return window first.');
    setSaving(true);
    try {
      const body = Object.fromEntries(
        changed.map((k) => [k, { ...values[k], text: values[k].text.trim() }]),
      );
      await api.patch('/store/policies', body);
      setSaved(values);
      // The storefront caches these on disk; drop this browser's copy.
      useDataCache.getState().invalidate('policies:');
      toast.success('Policies saved.');
    } catch (e) {
      toast.error(errorMessage(e, 'Could not save.'));
    } finally {
      setSaving(false);
    }
  }

  if (loadError) return <Notice tone="danger">{loadError}</Notice>;
  if (!saved) return <CenteredSpinner />;

  return (
    <div className="mx-auto max-w-3xl pb-20">
      <PageHeader
        title="Policies"
        hint="Shown on every product page and at checkout. Say how long, in what condition, and how to start."
      />

      <div className="space-y-5">
        <Section title="Returns and exchanges">
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={values.returnPolicy.enabled}
                onChange={(e) => setReturn({ enabled: e.target.checked })}
              />
              Accept returns and exchanges
            </label>
            {values.returnPolicy.enabled ? (
              <>
                <FormField label="Window (days after delivery)" htmlFor="pol-days" error={daysError}>
                  <input
                    id="pol-days"
                    className="input w-32"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={90}
                    value={days ?? ''}
                    onChange={(e) => setReturn({ days: e.target.value === '' ? undefined : Number(e.target.value) })}
                  />
                </FormField>
                <FormField
                  label="Policy"
                  htmlFor="pol-return"
                  hint="For example: unworn, tags on, original packaging; start from My orders; replacement or store credit."
                >
                  <textarea
                    id="pol-return"
                    className="input min-h-[120px]"
                    maxLength={5000}
                    value={values.returnPolicy.text}
                    onChange={(e) => setReturn({ text: e.target.value })}
                  />
                </FormField>
              </>
            ) : null}
          </div>
        </Section>

        <Section title="Cancellations">
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={values.cancellationPolicy.enabled}
                onChange={(e) => setCancellation({ enabled: e.target.checked })}
              />
              Allow cancellations
            </label>
            {values.cancellationPolicy.enabled ? (
              <FormField
                label="Policy"
                htmlFor="pol-cancel"
                hint="For example: free until the order ships; refunds in 3-5 business days to the original payment method."
              >
                <textarea
                  id="pol-cancel"
                  className="input min-h-[120px]"
                  maxLength={5000}
                  value={values.cancellationPolicy.text}
                  onChange={(e) => setCancellation({ text: e.target.value })}
                />
              </FormField>
            ) : null}
          </div>
        </Section>
      </div>

      <SaveBar count={changed.length} saving={saving} onSave={save} onDiscard={() => setValues(saved)} />
    </div>
  );
}
