'use client';

import * as React from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube, Linkedin } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { Monogram } from '@/components/brand/Monogram';

interface FooterSettings {
  aboutText: string;
  socialLinks: Array<{ platform: string; url: string }>;
  customSections: Array<{ title: string; links: Array<{ label: string; url: string }>; enabled: boolean }>;
  contactInfo: { phone: string; email: string; address: string };
  copyrightText: string;
}

const SOCIAL_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  facebook: Facebook,
  instagram: Instagram,
  twitter: Twitter,
  youtube: Youtube,
  linkedin: Linkedin,
};

const DEFAULT_CONTACT = {
  email: 'paribelle.official@gmail.com',
  phone: '+91 86969 30217',
  address: 'Jaipur, Rajasthan',
};

const SERVICE_LINKS = [
  { label: 'Shipping & Returns', href: '/shipping-returns' },
  { label: 'Track your order', href: '/orders' },
  { label: 'Contact', href: '/contact' },
  { label: 'FAQ', href: '/faq' },
];

export function Footer() {
  const { data: categories = [] } = useCategories();
  const [settings, setSettings] = React.useState<FooterSettings | null>(null);

  React.useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/footer-settings`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setSettings)
      .catch(() => setSettings(null));
  }, []);

  // Shoppers browse the leaves (Kurtis, Jewellery), not the grouping parent.
  const shopCategories = categories
    .flatMap((cat) => (cat.children?.length ? cat.children : [cat]))
    .slice(0, 6);

  const contact = {
    email: settings?.contactInfo?.email || DEFAULT_CONTACT.email,
    phone: settings?.contactInfo?.phone || DEFAULT_CONTACT.phone,
    address: settings?.contactInfo?.address || DEFAULT_CONTACT.address,
  };

  return (
    <footer className="relative overflow-hidden bg-[hsl(var(--pb-wine))] text-white/80">
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(80% 120% at 88% 0%, hsl(var(--pb-wine-deep) / 0.55), transparent 62%)' }}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl px-6 pb-10 pt-16 md:px-12 md:pt-[4.5rem]">
        <div className="flex flex-col items-start justify-between gap-12 md:flex-row md:items-end md:gap-24">
          <div>
            <Monogram className="h-[26px] w-[26px] text-[hsl(var(--pb-gold))]" />
            <p className="mt-[18px] font-logo text-[3.5rem] leading-none tracking-wide text-white md:text-[4.25rem]">
              PariBelle
            </p>
            <p className="mt-[18px] max-w-xs text-[15px] leading-relaxed text-white/60">
              {settings?.aboutText || 'Kurtis and Jewellery designed to be worn, not just bought.'}
            </p>
          </div>

          <div className="w-full shrink-0 md:w-80">
            <p className="text-eyebrow mb-[18px] text-[hsl(var(--pb-gold-soft))]">Get in touch</p>
            <div className="flex flex-col items-start gap-2.5">
              <a href={`mailto:${contact.email}`} className="text-[15px] text-white/85 hover:text-white transition-colors duration-150">
                {contact.email}
              </a>
              <a
                href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}
                className="text-[15px] text-white/85 hover:text-white transition-colors duration-150"
              >
                {contact.phone}
              </a>
              <p className="text-[15px] text-white/60">{contact.address}</p>
            </div>
            <p className="mt-4 text-xs tracking-wide text-white/40">We reply within a day, Monday to Saturday.</p>
          </div>
        </div>

        <div
          className="mt-14 h-px"
          style={{ background: 'linear-gradient(to right, hsl(var(--pb-gold) / 0.38), hsl(var(--pb-gold) / 0.1))' }}
        />

        <div className="flex flex-col items-start justify-between gap-6 pt-7 md:flex-row md:items-center">
          <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
            {shopCategories.map((cat) => (
              <Link
                key={cat.id}
                href={`/category/${cat.slug}`}
                className="text-[13px] tracking-wide text-white/74 hover:text-white transition-colors duration-150"
              >
                {cat.name}
              </Link>
            ))}
            {SERVICE_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="text-[13px] tracking-wide text-white/74 hover:text-white transition-colors duration-150">
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-5">
            {(settings?.socialLinks || []).map((social) => {
              const Icon = SOCIAL_ICONS[social.platform?.toLowerCase()];
              if (!Icon || !social.url) return null;
              return (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.platform}
                  className="text-white/60 hover:text-[hsl(var(--pb-gold))] transition-colors duration-150"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              );
            })}
          </div>
        </div>

        <div className="mt-[26px] flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs tracking-wide text-white/38">
            {settings?.copyrightText || `© ${new Date().getFullYear()} PariBelle. All rights reserved.`}
          </p>
          <div className="flex items-center gap-[18px]">
            <Link href="/privacy-policy" className="text-xs tracking-wide text-white/38 hover:text-white transition-colors duration-150">
              Privacy
            </Link>
            <Link href="/terms-of-service" className="text-xs tracking-wide text-white/38 hover:text-white transition-colors duration-150">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
