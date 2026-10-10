'use client';

import { useEffect, useState } from 'react';

import { toast } from '@/components/admin/pom/dialogs';
import { CenteredSpinner, FormField, Notice, PageHeader, SaveBar, Section } from '@/components/admin/pom/ui';
import { api, errorMessage } from '@/lib/api';

const STATES = [
  'Andaman and Nicobar Islands', 'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chandigarh', 'Chhattisgarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jammu and Kashmir',
  'Jharkhand', 'Karnataka', 'Kerala', 'Ladakh', 'Lakshadweep', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
  'Mizoram', 'Nagaland', 'Odisha', 'Puducherry', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
];

const FIELDS = [
  'storeName',
  'businessName',
  'gstNumber',
  'panNumber',
  'contactEmail',
  'contactPhone',
  'address',
  'city',
  'state',
  'postalCode',
] as const;
type Field = (typeof FIELDS)[number];
type Values = Record<Field, string>;

const EMPTY = Object.fromEntries(FIELDS.map((f) => [f, ''])) as Values;

const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
const PAN = /^[A-Z]{5}\d{4}[A-Z]$/;

/**
 * The seller details printed on every invoice: legal name, GSTIN and the
 * address goods ship from. Kept apart from the shop's look (Store settings)
 * because it changes rarely and has to be exactly right.
 */
export default function BusinessDetailsPage() {
  const [saved, setSaved] = useState<Values | null>(null);
  const [values, setValues] = useState<Values>(EMPTY);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<Record<string, unknown> & { data?: Record<string, unknown> }>('/store')
      .then((res) => {
        const v = (res?.data ?? res ?? {}) as Record<string, unknown>;
        const next = Object.fromEntries(FIELDS.map((f) => [f, v[f] == null ? '' : String(v[f])])) as Values;
        setSaved(next);
        setValues(next);
      })
      .catch((e) => setLoadError(errorMessage(e, 'Could not load the business details.')));
  }, []);

  const set = (f: Field, v: string) => setValues((cur) => ({ ...cur, [f]: v }));
  const changed = saved ? FIELDS.filter((f) => values[f] !== saved[f]) : [];

  const gstError = values.gstNumber && !GSTIN.test(values.gstNumber) ? 'That does not look like a 15-character GSTIN.' : null;
  const panError = values.panNumber && !PAN.test(values.panNumber) ? 'A PAN is 5 letters, 4 digits, 1 letter.' : null;
  const pinError = values.postalCode && !/^\d{6}$/.test(values.postalCode) ? 'A pincode is 6 digits.' : null;
  const panFromGst = GSTIN.test(values.gstNumber) ? values.gstNumber.slice(2, 12) : null;

  async function save() {
    if (!values.storeName.trim()) return toast.error('The store needs a name.');
    if (gstError || panError || pinError) return toast.error('Fix the highlighted fields first.');
    setSaving(true);
    try {
      const body = Object.fromEntries(changed.map((f) => [f, values[f].trim()]));
      await api.patch('/store', body);
      setSaved(values);
      toast.success('Business details saved.');
    } catch (e) {
      toast.error(errorMessage(e, 'Could not save.'));
    } finally {
      setSaving(false);
    }
  }

  if (loadError) return <Notice tone="danger">{loadError}</Notice>;
  if (!saved) return <CenteredSpinner />;

  const input = (f: Field, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input id={`bd-${f}`} className="input" value={values[f]} onChange={(e) => set(f, e.target.value)} {...props} />
  );

  return (
    <div className="mx-auto max-w-3xl pb-20">
      <PageHeader title="Business details" hint="Printed on every invoice. Check them against your GST registration." />

      <div className="space-y-5">
        <Section title="Business">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Store name" htmlFor="bd-storeName" hint="Used on invoices when there is no legal name.">
              {input('storeName')}
            </FormField>
            <FormField label="Legal business name" htmlFor="bd-businessName" hint="As on your GST certificate.">
              {input('businessName')}
            </FormField>
            <FormField label="GSTIN" htmlFor="bd-gstNumber" error={gstError}>
              <input
                id="bd-gstNumber"
                className="input font-mono uppercase"
                maxLength={15}
                value={values.gstNumber}
                onChange={(e) => set('gstNumber', e.target.value.toUpperCase().replace(/\s/g, ''))}
                placeholder="22AAAAA0000A1Z5"
              />
            </FormField>
            <FormField
              label="PAN"
              htmlFor="bd-panNumber"
              error={panError}
              hint={panFromGst && !values.panNumber ? `Your GSTIN says ${panFromGst}.` : undefined}
            >
              <input
                id="bd-panNumber"
                className="input font-mono uppercase"
                maxLength={10}
                value={values.panNumber}
                onChange={(e) => set('panNumber', e.target.value.toUpperCase().replace(/\s/g, ''))}
              />
            </FormField>
          </div>
        </Section>

        <Section title="Contact" hint="Where customers and couriers reach you.">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Email" htmlFor="bd-contactEmail">
              {input('contactEmail', { type: 'email', inputMode: 'email', autoComplete: 'email' })}
            </FormField>
            <FormField label="Phone" htmlFor="bd-contactPhone">
              {input('contactPhone', { type: 'tel', inputMode: 'tel', autoComplete: 'tel' })}
            </FormField>
          </div>
        </Section>

        <Section title="Address" hint="The address your parcels ship from, as registered for GST.">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Address" htmlFor="bd-address" className="sm:col-span-2">
              <textarea
                id="bd-address"
                className="input min-h-[72px]"
                value={values.address}
                onChange={(e) => set('address', e.target.value)}
              />
            </FormField>
            <FormField label="City" htmlFor="bd-city">
              {input('city')}
            </FormField>
            <FormField label="Pincode" htmlFor="bd-postalCode" error={pinError}>
              {input('postalCode', { inputMode: 'numeric', maxLength: 6 })}
            </FormField>
            <FormField label="State" htmlFor="bd-state" className="sm:col-span-2">
              <select id="bd-state" className="input" value={values.state} onChange={(e) => set('state', e.target.value)}>
                <option value="">Choose a state</option>
                {values.state && !STATES.includes(values.state) ? <option value={values.state}>{values.state}</option> : null}
                {STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
        </Section>
      </div>

      <SaveBar count={changed.length} saving={saving} onSave={save} onDiscard={() => setValues(saved)} />
    </div>
  );
}
