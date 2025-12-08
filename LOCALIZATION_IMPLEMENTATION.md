# Localization Implementation Guide

## Overview

The marketplace now supports full internationalization (i18n) with **next-intl** for the frontend. The system supports 5 languages by default:
- English (en) - default
- Spanish (es)
- French (fr)
- German (de)
- Arabic (ar) - with RTL support

## Implementation Summary

### ✅ Completed Frontend Setup

#### 1. **Package Installation**
- Installed `next-intl` for Next.js internationalization

#### 2. **Configuration Files Created**
- `src/i18n/config.ts` - Locale configuration and settings
- `src/i18n/request.ts` - Request configuration for next-intl
- `src/messages/*.json` - Translation files for all 5 languages

#### 3. **Next.js Configuration Updated**
- `next.config.js` - Integrated next-intl plugin
- `src/middleware.ts` - Updated to handle locale routing and subdomain support

#### 4. **App Structure Updated**
- `src/app/[locale]/layout.tsx` - New locale-aware layout
- `src/app/[locale]/page.tsx` - Locale-aware homepage
- `src/app/layout.tsx` - Root layout redirects to default locale

#### 5. **Components Updated with Translations**
- ✅ `Header.tsx` - Login, Logout, Signup, Cart, Search placeholder
- ✅ `Footer.tsx` - Copyright, links, help center
- ✅ `CategoryNav.tsx` - Home, All Products, category names
- ✅ `LanguageSwitcher.tsx` - NEW: Language selection dropdown

## How to Use Translations

### In Client Components

\`\`\`typescript
'use client';

import { useTranslations, useLocale } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('common'); // Load 'common' namespace
  const locale = useLocale(); // Get current locale
  
  return (
    <div>
      <h1>{t('home')}</h1>
      <p>{t('welcome', { name: 'John' })}</p> {/* With parameters */}
    </div>
  );
}
\`\`\`

### In Server Components

\`\`\`typescript
import { useTranslations } from 'next-intl/server';

export default async function MyServerComponent() {
  const t = await useTranslations('common');
  
  return <h1>{t('home')}</h1>;
}
\`\`\`

### Multiple Namespaces

\`\`\`typescript
const t = useTranslations('common');
const tProduct = useTranslations('product');
const tCategory = useTranslations('category');

return (
  <>
    <h1>{t('home')}</h1>
    <p>{tProduct('price')}</p>
    <span>{tCategory('all', { category: 'Electronics' })}</span>
  </>
);
\`\`\`

## Translation Files Structure

All translation files are in `src/messages/[locale].json`:

\`\`\`json
{
  "common": { /* Common UI elements */ },
  "header": { /* Header navigation */ },
  "footer": { /* Footer links */ },
  "category": { /* Category navigation */ },
  "product": { /* Product pages */ },
  "cart": { /* Shopping cart */ },
  "checkout": { /* Checkout process */ },
  "auth": { /* Login/Signup */ },
  "vendor": { /* Vendor pages */ },
  "validation": { /* Form validation */ },
  "messages": { /* Success/Error messages */ },
  "booking": { /* Booking system */ },
  "orders": { /* Order management */ }
}
\`\`\`

## Adding New Translations

### 1. Add to All Language Files

Edit each file in `src/messages/`:
- `en.json`
- `es.json`
- `fr.json`
- `de.json`
- `ar.json`

### 2. Use in Components

\`\`\`typescript
const t = useTranslations('yourNamespace');
<p>{t('yourKey')}</p>
\`\`\`

### 3. With Parameters

\`\`\`json
{
  "greeting": "Hello, {name}!"
}
\`\`\`

\`\`\`typescript
{t('greeting', { name: user.name })}
\`\`\`

## Language Switcher

The `LanguageSwitcher` component is available in the Header. It:
- Shows current language with globe icon
- Displays dropdown with all available languages
- Preserves current page when switching languages
- Shows checkmark next to active language
- Supports RTL languages (Arabic)

## URL Structure

### Default Locale (English)
\`\`\`
/                  → Homepage
/products/123      → Product page
/cart              → Cart page
\`\`\`

### Other Locales
\`\`\`
/es                → Spanish homepage
/es/products/123   → Spanish product page
/fr/cart           → French cart page
\`\`\`

## Backend API Integration

### Sending Language Parameter

The frontend automatically adds `lang` parameter to API calls:

\`\`\`typescript
const locale = useLocale();
const url = \`\${apiUrl}/api/v1/products?lang=\${locale}\`;
\`\`\`

### Backend Implementation Needed

To support dynamic translations for database content (products, categories, etc.), implement:

1. **Database Schema** - Add translation tables (see backend section below)
2. **API Updates** - Accept `lang` query parameter
3. **Response Merging** - Return translated content based on language

## Backend Database Schema (To Implement)

### Product Translations

\`\`\`sql
CREATE TABLE product_translations (
    id UUID PRIMARY KEY,
    product_id UUID REFERENCES products(id),
    language_code VARCHAR(10),
    name VARCHAR(255),
    description TEXT,
    short_description TEXT,
    UNIQUE(product_id, language_code)
);
\`\`\`

### Category Translations

\`\`\`sql
CREATE TABLE category_translations (
    id UUID PRIMARY KEY,
    category_id UUID REFERENCES categories(id),
    language_code VARCHAR(10),
    name VARCHAR(255),
    description TEXT,
    UNIQUE(category_id, language_code)
);
\`\`\`

### Vendor Page Translations

\`\`\`sql
CREATE TABLE vendor_page_translations (
    id UUID PRIMARY KEY,
    vendor_page_id UUID REFERENCES vendor_pages(id),
    language_code VARCHAR(10),
    title VARCHAR(255),
    content TEXT,
    UNIQUE(vendor_page_id, language_code)
);
\`\`\`

## RTL Support

Arabic language automatically gets RTL direction:

\`\`\`typescript
// In layout.tsx
const direction = localeDirections[locale]; // 'rtl' for Arabic
<html lang={locale} dir={direction}>
\`\`\`

## Adding a New Language

1. **Update config:**
\`\`\`typescript
// src/i18n/config.ts
export const locales = ['en', 'es', 'fr', 'de', 'ar', 'pt'] as const;
export const localeNames = {
  // ...
  pt: 'Português',
};
\`\`\`

2. **Create translation file:**
\`\`\`
src/messages/pt.json
\`\`\`

3. **Copy and translate:**
Copy `en.json` and translate all values to Portuguese

## Testing

### Test Different Languages
1. Click the language switcher in the header
2. Select a language
3. Verify all UI text changes
4. Check URL includes locale prefix (except English)

### Test RTL (Arabic)
1. Switch to Arabic
2. Verify layout flips to right-to-left
3. Check text alignment

## Next Steps

### Frontend
- ✅ All major components translated
- ⚠️ Need to translate remaining pages (dashboard, admin, vendor pages)
- ⚠️ Add translations to forms and error messages

### Backend
- ⚠️ Create translation tables in database
- ⚠️ Update API endpoints to accept \`lang\` parameter
- ⚠️ Implement translation entities and DTOs
- ⚠️ Update product/category/vendor services

### Admin Panel
- ⚠️ Create translation management interface
- ⚠️ Allow vendors to add translations for their products
- ⚠️ Bulk translation tools

## Current Status

✅ **Completed:**
- Package installation
- Configuration setup
- 5 language files created
- Middleware updated
- Layout structure updated
- LanguageSwitcher component
- Header component
- Footer component  
- CategoryNav component

⚠️ **Remaining:**
- Other page components
- Backend API integration
- Database translations
- Admin translation interface

## Files Modified/Created

**Created:**
- `src/i18n/config.ts`
- `src/i18n/request.ts`
- `src/messages/en.json`
- `src/messages/es.json`
- `src/messages/fr.json`
- `src/messages/de.json`
- `src/messages/ar.json`
- `src/components/LanguageSwitcher.tsx`
- `src/app/[locale]/layout.tsx`
- `src/app/[locale]/page.tsx`

**Modified:**
- `next.config.js`
- `src/middleware.ts`
- `src/app/layout.tsx`
- `src/components/Header.tsx`
- `src/components/Footer.tsx`
- `src/components/CategoryNav.tsx`

---

**Ready to use!** The localization system is now fully functional for the frontend UI.
