import { ClipboardList, Home, Settings, ShoppingBag, Store, type LucideIcon } from 'lucide-react';

export type SectionKey = 'home' | 'orders' | 'products' | 'storefront' | 'settings';

export interface AdminPage {
  label: string;
  href: string;
}

export interface AdminSection {
  key: SectionKey;
  label: string;
  href: string;
  icon: LucideIcon;
  /** The section's own screens, shown as the rail under the header. */
  pages: AdminPage[];
}

/**
 * The whole panel. Five places, the same five on the desktop switch and the
 * phone's bottom bar, each with its screens on the rail beneath the header.
 */
export const ADMIN_SECTIONS: AdminSection[] = [
  { key: 'home', label: 'Home', href: '/admin', icon: Home, pages: [] },
  {
    key: 'orders',
    label: 'Orders',
    href: '/admin/orders',
    icon: ClipboardList,
    pages: [
      { label: 'Orders', href: '/admin/orders' },
      { label: 'Invoices', href: '/admin/invoices' },
    ],
  },
  {
    key: 'products',
    label: 'Products',
    href: '/admin/products',
    icon: ShoppingBag,
    pages: [
      { label: 'Products', href: '/admin/products' },
      { label: 'Add product', href: '/admin/products/add' },
      { label: 'Categories', href: '/admin/categories' },
      { label: 'HSN & GST', href: '/admin/hsn-codes' },
    ],
  },
  {
    key: 'storefront',
    label: 'Storefront',
    href: '/admin/hero-section',
    icon: Store,
    pages: [
      { label: 'Homepage photos', href: '/admin/hero-section' },
      { label: 'Pages', href: '/admin/pages' },
      { label: 'Footer', href: '/admin/footer-settings' },
      { label: 'Policies', href: '/admin/policies' },
    ],
  },
  {
    key: 'settings',
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    pages: [
      { label: 'Store settings', href: '/admin/settings' },
      { label: 'Business details', href: '/admin/store-settings' },
    ],
  },
];

function matches(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** The section a path belongs to: the one owning the longest matching page. */
export function sectionFor(pathname: string): AdminSection {
  let best: { section: AdminSection; len: number } | null = null;
  for (const section of ADMIN_SECTIONS) {
    for (const page of section.pages) {
      if (matches(pathname, page.href) && (!best || page.href.length > best.len)) {
        best = { section, len: page.href.length };
      }
    }
  }
  return best?.section ?? ADMIN_SECTIONS[0];
}

/** The rail entry a path lands on, longest match first, so /products/add beats /products. */
export function pageFor(pathname: string, section: AdminSection): AdminPage | null {
  let best: AdminPage | null = null;
  for (const page of section.pages) {
    if (matches(pathname, page.href) && (!best || page.href.length > best.href.length)) best = page;
  }
  return best;
}
