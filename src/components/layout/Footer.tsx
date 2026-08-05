'use client';

import * as React from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Youtube, Linkedin, ArrowRight } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { Monogram } from '@/components/brand/Monogram';
import { usePbToast } from '@/components/ui/Toast';
import { LOOKBOOK_ENABLED } from '@/lib/features';

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

export function Footer() {
  const { data: categories = [] } = useCategories();
  const [settings, setSettings] = React.useState<FooterSettings | null>(null);
  const [email, setEmail] = React.useState('');
  const { showToast } = usePbToast();

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

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    showToast('You’re on the list — welcome to PariBelle.', 'success');
    setEmail('');
  };

  return (
    <footer className="bg-[hsl(var(--pb-wine))] text-white/80">
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-12">
        <div className="grid gap-12 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <div className="sm:col-span-2">
            <Monogram className="h-8 w-8 text-[hsl(var(--pb-gold))]" />
            <p className="mt-4 font-display text-2xl italic text-white">PariBelle</p>
            <p className="mt-3 max-w-xs text-sm text-white/60">
              {settings?.aboutText ||
                'Designer kurtis and artificial jewellery, designed in Jaipur with new pieces every season.'}
            </p>
            <form onSubmit={handleSubscribe} className="mt-6 max-w-xs">
              <p className="text-eyebrow mb-2 text-[hsl(var(--pb-gold-soft))]">Join the list</p>
              <div className="flex items-center border-b border-[hsl(var(--pb-gold-soft)/0.4)] focus-within:border-[hsl(var(--pb-gold))] transition-colors duration-150">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  className="w-full bg-transparent py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
                />
                <button type="submit" aria-label="Subscribe" className="p-2 text-[hsl(var(--pb-gold))]">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          <div>
            <p className="text-eyebrow mb-4 text-white/50">Shop</p>
            <ul className="space-y-2.5">
              {shopCategories.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/category/${cat.slug}`} className="text-sm text-white/70 hover:text-white transition-colors duration-150">
                    {cat.name}
                  </Link>
                </li>
              ))}
              {LOOKBOOK_ENABLED && (
                <li>
                  <Link href="/lookbook" className="text-sm text-white/70 hover:text-white transition-colors duration-150">
                    Lookbook
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {(settings?.customSections || []).filter((s) => s.enabled).map((section) => (
            <div key={section.title}>
              <p className="text-eyebrow mb-4 text-white/50">{section.title}</p>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.url}>
                    <Link href={link.url} className="text-sm text-white/70 hover:text-white transition-colors duration-150">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="text-eyebrow mb-4 text-white/50">Get in Touch</p>
            <ul className="space-y-2.5">
              {settings?.contactInfo?.email && (
                <li>
                  <a href={`mailto:${settings.contactInfo.email}`} className="text-sm text-white/70 hover:text-white transition-colors duration-150">
                    {settings.contactInfo.email}
                  </a>
                </li>
              )}
              {settings?.contactInfo?.phone && (
                <li>
                  <a
                    href={`tel:${settings.contactInfo.phone.replace(/[^+\d]/g, '')}`}
                    className="text-sm text-white/70 hover:text-white transition-colors duration-150"
                  >
                    {settings.contactInfo.phone}
                  </a>
                </li>
              )}
              {settings?.contactInfo?.address && (
                <li className="whitespace-pre-line text-sm text-white/60">{settings.contactInfo.address}</li>
              )}
              <li>
                <Link href="/contact" className="text-sm text-white/70 hover:text-white transition-colors duration-150">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 md:flex-row">
          <p className="text-xs text-white/50">
            {settings?.copyrightText || `© ${new Date().getFullYear()} PariBelle. All rights reserved.`}
          </p>
          <div className="flex items-center gap-4">
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
                  <Icon className="h-4 w-4" />
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
