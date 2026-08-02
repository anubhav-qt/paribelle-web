import {
  BarChart3,
  ClipboardList,
  FileText,
  Filter,
  Image,
  LayoutList,
  Package,
  Receipt,
  ScrollText,
  Settings,
  Shield,
  ShoppingBag,
  Store,
} from 'lucide-react';

export interface AdminNavItem {
  title: string;
  description: string;
  href: string;
  icon: typeof Package;
}

/**
 * Every destination in the panel. There is one store, so this is the whole of
 * it — what used to be split between a platform admin panel and a per-vendor
 * dashboard is now a single list.
 */
export const ADMIN_NAV: AdminNavItem[] = [
  {
    title: 'Products',
    description: 'Add, edit and organise the catalogue',
    href: '/admin/products',
    icon: ShoppingBag,
  },
  {
    title: 'Orders',
    description: 'Track and fulfil customer orders',
    href: '/admin/orders',
    icon: ClipboardList,
  },
  {
    title: 'Categories',
    description: 'Manage Kurtis, Jewellery and their filters',
    href: '/admin/categories',
    icon: Package,
  },
  {
    title: 'Hero Banners',
    description: 'Curate the homepage carousel',
    href: '/admin/hero-banners',
    icon: Image,
  },
  {
    title: 'Custom Pages',
    description: 'Build and publish storefront pages',
    href: '/admin/pages',
    icon: FileText,
  },
  {
    title: 'Blog Posts',
    description: 'Write and manage articles',
    href: '/admin/blog',
    icon: ScrollText,
  },
  {
    title: 'Footer Settings',
    description: 'Customise footer content and links',
    href: '/admin/footer-settings',
    icon: LayoutList,
  },
  {
    title: 'Common Filters',
    description: 'Reusable filter templates',
    href: '/admin/common-filters',
    icon: Filter,
  },
  {
    title: 'HSN Codes',
    description: 'HSN codes and GST rates',
    href: '/admin/hsn-codes',
    icon: Receipt,
  },
  {
    title: 'Invoices',
    description: 'Customer invoices and billing',
    href: '/admin/invoices',
    icon: Receipt,
  },
  {
    title: 'Policies',
    description: 'Returns, shipping and store policies',
    href: '/admin/policies',
    icon: ScrollText,
  },
  {
    title: 'Analytics',
    description: 'Sales and performance metrics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    title: 'Store Profile',
    description: 'Business details, contact and address',
    href: '/admin/store-settings',
    icon: Store,
  },
  {
    title: 'KYC',
    description: 'Business verification documents',
    href: '/admin/kyc',
    icon: Shield,
  },
  {
    title: 'Site Settings',
    description: 'Site-wide configuration and features',
    href: '/admin/settings',
    icon: Settings,
  },
];
