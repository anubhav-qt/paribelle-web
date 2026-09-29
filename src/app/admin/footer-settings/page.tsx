'use client';

import { Facebook, Instagram, Linkedin, Twitter, Youtube } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { toast } from '@/components/admin/pom/dialogs';
import { CenteredSpinner, FormField, Notice, PageHeader, SaveBar, Section } from '@/components/admin/pom/ui';
import { api, errorMessage } from '@/lib/api';

interface FooterSettings {
  aboutText?: string;
  socialLinks?: { platform: string; url: string; enabled?: boolean }[];
  customSections?: unknown[];
  contactInfo?: { phone?: string; email?: string; address?: string };
  copyrightText?: string;
  showCategories?: boolean;
  maxCategoriesDisplay?: number;
}

const PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'https://instagram.com/paribelle' },
  { key: 'facebook', label: 'Facebook', icon: Facebook, placeholder: 'https://facebook.com/...' },
  { key: 'youtube', label: 'YouTube', icon: Youtube, placeholder: 'https://youtube.com/@...' },
  { key: 'twitter', label: 'X (Twitter)', icon: Twitter, placeholder: 'https://x.com/...' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'https://linkedin.com/company/...' },
] as const;

interface Form {
  aboutText: string;
  email: string;
  phone: string;
  address: string;
  copyrightText: string;
  social: Record<string, string>;
}

function toForm(s: FooterSettings): Form {
  const social: Record<string, string> = {};
  for (const l of s.socialLinks ?? []) {
    const k = l.platform?.toLowerCase();
    if (k && l.url && l.enabled !== false) social[k] = l.url;
  }
  return {
    aboutText: s.aboutText ?? '',
    email: s.contactInfo?.email ?? '',
    phone: s.contactInfo?.phone ?? '',
    address: s.contactInfo?.address ?? '',
    copyrightText: s.copyrightText ?? '',
    social,
  };
}

/**
 * The shop footer: the line about PariBelle, how to get in touch and where to
 * follow. Empty fields fall back to the footer's built-in wording.
 */
export default function FooterPage() {
  const [raw, setRaw] = useState<FooterSettings | null>(null);
  const [saved, setSaved] = useState<Form | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<FooterSettings>('/footer-settings')
      .then((s) => {
        const data = s ?? {};
        setRaw(data);
        setSaved(toForm(data));
        setForm(toForm(data));
      })
      .catch((e) => setLoadError(errorMessage(e, 'Could not load the footer.')));
  }, []);

  const changes = useMemo(() => {
    if (!form || !saved) return 0;
    return JSON.stringify(form) === JSON.stringify(saved) ? 0 : 1;
  }, [form, saved]);

  async function save() {
    if (!form || !raw) return;
    setSaving(true);
    try {
      const socialLinks = PLATFORMS.filter((p) => form.social[p.key]?.trim()).map((p) => ({
        platform: p.key,
        url: form.social[p.key].trim(),
        enabled: true,
      }));
      await api.put('/footer-settings', {
        aboutText: form.aboutText.trim(),
        contactInfo: { email: form.email.trim(), phone: form.phone.trim(), address: form.address.trim() },
        socialLinks,
        copyrightText: form.copyrightText.trim(),
        // Not shown by the footer any more, sent back as they were.
        customSections: raw.customSections ?? [],
        showCategories: raw.showCategories ?? true,
        maxCategoriesDisplay: raw.maxCategoriesDisplay ?? 6,
      });
      setSaved(form);
      toast.success('Footer saved.');
    } catch (e) {
      toast.error(errorMessage(e, 'Could not save the footer.'));
    } finally {
      setSaving(false);
    }
  }

  if (loadError) return <Notice tone="danger">{loadError}</Notice>;
  if (!form || !saved) return <CenteredSpinner />;

  const set = (patch: Partial<Form>) => setForm((f) => (f ? { ...f, ...patch } : f));

  return (
    <div className="mx-auto max-w-3xl pb-20">
      <PageHeader title="Footer" hint="At the bottom of every page of the shop. Leave a field empty to use the default." />

      <div className="space-y-5">
        <Section title="About line">
          <FormField label="Shown under the PariBelle name" htmlFor="ft-about">
            <textarea
              id="ft-about"
              className="input min-h-[64px]"
              maxLength={200}
              placeholder="Kurtis and Jewellery designed to be worn, not just bought."
              value={form.aboutText}
              onChange={(e) => set({ aboutText: e.target.value })}
            />
          </FormField>
        </Section>

        <Section title="Get in touch">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Email" htmlFor="ft-email">
              <input id="ft-email" className="input" type="email" inputMode="email" value={form.email} onChange={(e) => set({ email: e.target.value })} />
            </FormField>
            <FormField label="Phone" htmlFor="ft-phone">
              <input id="ft-phone" className="input" type="tel" inputMode="tel" value={form.phone} onChange={(e) => set({ phone: e.target.value })} />
            </FormField>
            <FormField label="Location" htmlFor="ft-address" className="sm:col-span-2" hint="A short line, e.g. Jaipur, Rajasthan">
              <input id="ft-address" className="input" value={form.address} onChange={(e) => set({ address: e.target.value })} />
            </FormField>
          </div>
        </Section>

        <Section title="Follow us" hint="Only the ones filled in appear.">
          <div className="space-y-3">
            {PLATFORMS.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.key} className="flex items-center gap-3">
                  <span className="flex w-28 shrink-0 items-center gap-2 text-sm">
                    <Icon className="h-4 w-4" style={{ color: 'var(--pom-muted)' }} />
                    {p.label}
                  </span>
                  <input
                    className="input"
                    type="url"
                    inputMode="url"
                    placeholder={p.placeholder}
                    value={form.social[p.key] ?? ''}
                    onChange={(e) => set({ social: { ...form.social, [p.key]: e.target.value } })}
                    aria-label={`${p.label} link`}
                  />
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Copyright line">
          <input
            className="input"
            placeholder={`© ${new Date().getFullYear()} PariBelle. All rights reserved.`}
            value={form.copyrightText}
            onChange={(e) => set({ copyrightText: e.target.value })}
            aria-label="Copyright line"
          />
        </Section>
      </div>

      <SaveBar count={changes} saving={saving} onSave={save} onDiscard={() => setForm(saved)} />
    </div>
  );
}
