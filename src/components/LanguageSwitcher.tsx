'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Globe, ChevronDown } from 'lucide-react';
import { locales, localeNames, localeDirections } from '@/i18n/config';
import { useState, useRef, useEffect } from 'react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const switchLocale = (newLocale: string) => {
    if (newLocale === locale) {
      setIsOpen(false);
      return;
    }

    // Parse the current pathname
    const segments = pathname.split('/').filter(Boolean);
    
    // Check if the first segment is a locale
    const currentLocale = locales.find(l => segments[0] === l);
    
    let newPath: string;
    if (currentLocale) {
      // Replace the locale
      segments[0] = newLocale;
      newPath = '/' + segments.join('/');
    } else {
      // Add the locale prefix
      newPath = `/${newLocale}${pathname}`;
    }

    // If switching to default locale, remove prefix
    if (newLocale === 'en') {
      newPath = '/' + segments.slice(currentLocale ? 1 : 0).join('/');
      if (!newPath.startsWith('/')) newPath = '/' + newPath;
    }

    setIsOpen(false);
    router.push(newPath);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">
          {localeNames[locale as keyof typeof localeNames]}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-card shadow-lg rounded-md border border-border z-50 py-1">
          {locales.map((loc) => {
            const direction = localeDirections[loc];
            return (
              <button
                key={loc}
                onClick={() => switchLocale(loc)}
                className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-muted transition-colors ${
                  locale === loc ? 'bg-muted font-semibold text-primary' : 'text-foreground'
                }`}
                dir={direction}
              >
                <div className="flex items-center justify-between">
                  <span>{localeNames[loc]}</span>
                  {locale === loc && (
                    <span className="text-primary">✓</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
