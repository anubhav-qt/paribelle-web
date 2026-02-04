'use client';

import { useState, useEffect } from 'react';
import { Home, ShoppingBag, Tag, TrendingUp, Percent, Sparkles, FileText } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { useVendorContext } from '@/contexts/VendorContext';
import { useSettings } from '@/hooks/useSettings';
import { VendorPage } from '@/types/common';

interface ExtendedVendorPage extends VendorPage {
  pageType: string;
  status: string;
}

interface StoreNavProps {
  vendorSlug?: string;
}

export default function StoreNav({ vendorSlug }: StoreNavProps) {
  const pathname = usePathname();
  const theme = useThemeClasses();
  const { isVendorStore, vendor } = useVendorContext();
  const { data: settings } = useSettings();
  const [mounted, setMounted] = useState(false);
  const [customPages, setCustomPages] = useState<VendorPage[]>([]);
  
  const effectiveVendorSlug = vendorSlug || (isVendorStore && vendor ? vendor.slug : undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch custom pages for vendor or marketplace
  useEffect(() => {
    if (isVendorStore && vendor?.id) {
      console.log('🔵 StoreNav: Fetching vendor custom pages:', { vendorId: vendor.id, slug: effectiveVendorSlug });
      fetchVendorCustomPages();
    } else if (!isVendorStore) {
      console.log('🔵 StoreNav: Fetching marketplace custom pages');
      fetchMarketplaceCustomPages();
    }
  }, [isVendorStore, vendor?.id, effectiveVendorSlug]);

  const fetchVendorCustomPages = async () => {
    if (!vendor?.id) return;
    
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const url = `${API_URL}/api/v1/vendors/${vendor.id}/pages`;
      console.log('🔵 StoreNav: Fetching from:', url);
      const response = await fetch(url);
      console.log('🔵 StoreNav: Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('🔵 StoreNav: Received vendor pages:', data);
        const navigationPages = data.filter((page: VendorPage) => 
          page.status === 'published' && page.showInNavigation
        );
        console.log('🔵 StoreNav: Filtered navigation pages:', navigationPages);
        setCustomPages(navigationPages);
      } else {
        console.log('🔴 StoreNav: Response not ok');
      }
    } catch (error) {
      console.error('🔴 StoreNav: Error fetching vendor pages:', error);
    }
  };

  const fetchMarketplaceCustomPages = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const url = `${API_URL}/api/v1/marketplace/pages`;
      console.log('🔵 StoreNav: Fetching marketplace pages from:', url);
      const response = await fetch(url);
      console.log('🔵 StoreNav: Marketplace pages response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('🔵 StoreNav: Received marketplace pages:', data);
        const navigationPages = data.filter((page: VendorPage) => 
          page.status === 'published' && page.showInNavigation
        );
        console.log('🔵 StoreNav: Filtered marketplace navigation pages:', navigationPages);
        setCustomPages(navigationPages);
      } else {
        console.log('🔴 StoreNav: Marketplace pages response not ok');
      }
    } catch (error) {
      console.error('🔴 StoreNav: Error fetching marketplace pages:', error);
    }
  };

  if (!mounted) return null;

  // When on vendor subdomain (isVendorStore), don't include slug in path
  // When on main site viewing vendor (/vendor-slug/...), include slug in path
  const baseUrl = isVendorStore ? '' : (effectiveVendorSlug ? `/${effectiveVendorSlug}` : '');

  const navItems: any[] = [];

  console.log('🟢 StoreNav: Rendering', { mounted, isVendorStore, vendorSlug: effectiveVendorSlug, navItemsCount: navItems.length, customPagesCount: customPages.length, baseUrl });

  return (
    <div className={theme.combine(
      'border-b',
      isVendorStore ? 'vendor-nav-bg vendor-border-primary vendor-text vendor-font' : 'bg-secondary border-secondary-foreground/20'
    )}>
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={theme.combine(
                  'group flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200',
                  isActive
                    ? isVendorStore
                      ? 'vendor-primary-bg text-white shadow-sm'
                      : 'bg-primary text-white shadow-sm'
                    : isVendorStore
                      ? 'vendor-text hover:opacity-80'
                      : 'text-secondary-foreground hover:opacity-80'
                )}
              >
                <Icon className={theme.combine(
                  'w-4 h-4 transition-transform group-hover:scale-110',
                  isActive ? 'text-white' : ''
                )} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* Custom Pages - For both vendor stores and marketplace */}
          {customPages.map((page) => {
            const pageUrl = baseUrl ? `${baseUrl}/${page.slug}` : `/${page.slug}`;
            const isActive = pathname === pageUrl;
            
            return (
              <Link
                key={page.id}
                href={pageUrl}
                className={theme.combine(
                  'group flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200',
                  isActive
                    ? isVendorStore
                      ? 'vendor-primary-bg text-white shadow-sm'
                      : 'bg-primary text-white shadow-sm'
                    : isVendorStore
                      ? 'vendor-text hover:opacity-80'
                      : 'text-secondary-foreground hover:opacity-80'
                )}
              >
                <FileText className={theme.combine(
                  'w-4 h-4 transition-transform group-hover:scale-110',
                  isActive ? 'text-white' : ''
                )} />
                <span>{page.title}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Hide scrollbar but keep functionality */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
