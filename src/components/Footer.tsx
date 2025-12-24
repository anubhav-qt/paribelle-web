'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';

interface FooterProps {
  categories?: Array<{ id: string; name: string; slug: string }>;
  marketplaceName?: string;
}

export default function Footer({ categories = [], marketplaceName = 'GaliCart' }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  
  // Try to get locale and translations, fallback for vendor routes
  let locale = 'en';
  let t: any;
  let tCommon: any;
  
  try {
    t = useTranslations('footer');
    tCommon = useTranslations('common');
    locale = useLocale();
  } catch {
    // Fallback for vendor routes without intl context
    const localeMatch = pathname?.match(/^\/(en|hi|mr)/);
    locale = localeMatch ? localeMatch[1] : 'en';
    t = (key: string) => key;
    tCommon = (key: string) => key;
  }

  return (
    <footer 
      className="mt-12 bg-card text-card-foreground" 
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-foreground">{marketplaceName}</h3>
            <p className="text-sm mb-4 text-muted-foreground">
              Your one-stop destination for quality products from trusted vendors across multiple categories.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 rounded-full transition-colors bg-muted hover:bg-primary hover:text-primary-foreground">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-full transition-colors bg-muted hover:bg-primary hover:text-primary-foreground">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-full transition-colors bg-muted hover:bg-primary hover:text-primary-foreground">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-full transition-colors bg-muted hover:bg-primary hover:text-primary-foreground">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Shop Categories */}
          <div>
            <h4 className="font-semibold mb-4 text-lg text-foreground">Shop by Category</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {categories.slice(0, 6).map(cat => (
                <li key={cat.id}>
                  <Link 
                    href={`/${locale}#category-${cat.slug}`}
                    className="hover:text-primary transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              {categories.length > 6 && (
                <li>
                  <Link 
                    href={`/${locale}/#categories`}
                    className="text-primary hover:underline transition-colors"
                  >
                    View All Categories →
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h4 className="font-semibold mb-4 text-lg text-foreground">{t('helpCenter')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href={`/${locale}/help`} className="hover:text-primary transition-colors">
                  {t('helpCenter')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="hover:text-primary transition-colors">
                  {t('contactUs')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/shipping`} className="hover:text-primary transition-colors">
                  {t('shipping')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/returns`} className="hover:text-primary transition-colors">
                  {t('returns')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/faq`} className="hover:text-primary transition-colors">
                  {t('faq')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/track-order`} className="hover:text-primary transition-colors">
                  Track Your Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Account & Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-lg text-foreground">My Account</h4>
            <ul className="space-y-2 text-sm mb-6 text-muted-foreground">
              <li>
                <Link href={`/${locale}/login`} className="hover:text-primary transition-colors">
                  Login / Register
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/dashboard`} className="hover:text-primary transition-colors">
                  My Dashboard
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/orders`} className="hover:text-primary transition-colors">
                  Order History
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/wishlist`} className="hover:text-primary transition-colors">
                  My Wishlist
                </Link>
              </li>
            </ul>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:support@marketplace.com" className="hover:text-primary transition-colors">
                  support@marketplace.com
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>123 Market Street<br />City, State 12345</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-center text-sm text-muted-foreground">
              {t('copyright', { year: currentYear })}
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <Link href={`/${locale}/privacy-policy`} className="hover:text-primary transition-colors">
                {t('privacyPolicy')}
              </Link>
              <span>•</span>
              <Link href={`/${locale}/terms-of-service`} className="hover:text-primary transition-colors">
                {t('termsOfService')}
              </Link>
              <span>•</span>
              <Link href={`/${locale}/cookie-policy`} className="hover:text-primary transition-colors">
                Cookie Policy
              </Link>
              <span>•</span>
              <Link href={`/${locale}/vendor-registration`} className="hover:text-primary transition-colors">
                Become a Vendor
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
