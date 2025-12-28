'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Package, Calendar, Layers } from 'lucide-react';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { useVendorContext } from '@/contexts/VendorContext';
import { useCategories } from '@/hooks/useCategories';

interface CategorySidebarProps {
  vendorId?: string;
  hideEmptyCategories?: boolean;
}

export default function CategorySidebar({ 
  vendorId,
  hideEmptyCategories = true 
}: CategorySidebarProps) {
  const theme = useThemeClasses();
  const { isVendorStore, vendor } = useVendorContext();
  const [hasBookingProducts, setHasBookingProducts] = useState(false);
  const [categoryDisplayMode, setCategoryDisplayMode] = useState<'top' | 'sidebar'>('sidebar');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // Use vendorId from props or context
  const effectiveVendorId = vendorId || (isVendorStore && vendor ? vendor.id : undefined);
  
  // Fetch categories using React Query
  const { data: categories = [], isLoading } = useCategories({
    vendorId: effectiveVendorId,
    hideEmptyCategories,
  });

  // Fetch category display mode setting
  useEffect(() => {
    // For vendor stores, check the vendor's own categoryDisplayMode setting
    if (isVendorStore && vendor) {
      console.log('🟦 CategorySidebar: Vendor detected', { vendorId: vendor.id, vendorSlug: vendor.slug });
      const vendorDisplayMode = (vendor as any).categoryDisplayMode || 'sidebar';
      console.log('🟦 CategorySidebar: Vendor categoryDisplayMode from vendor object:', vendorDisplayMode);
      setCategoryDisplayMode(vendorDisplayMode as 'top' | 'sidebar');
      return;
    }

    const fetchCategoryDisplayMode = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/v1/settings/category_display_mode`);
        if (response.ok) {
          const data = await response.json();
          const mode = data.value || 'sidebar';
          setCategoryDisplayMode(mode as 'top' | 'sidebar');
        }
      } catch (error) {
        console.error('Error fetching category display mode:', error);
        // Default to sidebar on error
        setCategoryDisplayMode('sidebar');
      }
    };

    fetchCategoryDisplayMode();
  }, [isVendorStore, vendor]);

  useEffect(() => {
    checkBookingProducts();
  }, [effectiveVendorId]);

  const checkBookingProducts = async () => {
    try {
      const url = effectiveVendorId 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?vendorId=${effectiveVendorId}&productType=booking&limit=1`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?productType=booking&limit=1`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setHasBookingProducts(data.total > 0 || (data.products && data.products.length > 0));
      }
    } catch (error) {
      console.error('Error checking booking products:', error);
    }
  };

  const scrollToElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      const headerOffset = 140;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Don't render if category display mode is not 'sidebar'
  if (categoryDisplayMode !== 'sidebar') {
    return null;
  }

  if (isLoading) {
    return (
      <aside className="hidden lg:block w-72 flex-shrink-0">
        <div className={theme.combine(theme.cardBg, 'rounded-xl shadow-lg border border-gray-200/50 overflow-hidden')}>
          <div className="p-6 border-b border-gray-200/50">
            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          </div>
          <div className="p-4 space-y-3">
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
            <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </aside>
    );
  }

  // Don't show sidebar if no categories and no bookings
  if (categories.length === 0 && !hasBookingProducts) {
    return null;
  }

  return (
    <aside className="hidden lg:block w-72 flex-shrink-0">
      <div className={theme.combine(theme.cardBg, 'rounded-xl shadow-lg border border-gray-200/50 overflow-hidden sticky top-20 max-h-[calc(100vh-6rem)]')}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-br from-gray-50 to-white">
          <div className="flex items-center gap-3">
            <div className={theme.combine(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isVendorStore ? 'bg-gradient-to-br from-[var(--vendor-primary)] to-[var(--vendor-secondary)] text-white' : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
            )}>
              <Layers className="w-5 h-5" />
            </div>
            <h2 className={theme.combine('font-bold text-xl', theme.text)}>
              Browse
            </h2>
          </div>
        </div>

        {/* Categories List */}
        <div className="p-4 overflow-y-auto max-h-[calc(100vh-14rem)] custom-scrollbar">
          <div className="space-y-1">
            {/* Bookings & Services */}
            {hasBookingProducts && (
              <Link
                href="#category-bookings-services"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToElement('category-bookings-services');
                  setActiveCategory('bookings-services');
                }}
                className={theme.combine(
                  'group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  activeCategory === 'bookings-services'
                    ? isVendorStore 
                      ? 'bg-[var(--vendor-primary)]/10 text-[var(--vendor-primary)] font-medium shadow-sm'
                      : 'bg-blue-50 text-blue-600 font-medium shadow-sm'
                    : theme.combine(
                        theme.text,
                        'hover:bg-gray-50 hover:shadow-sm'
                      )
                )}
              >
                <div className={theme.combine(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                  activeCategory === 'bookings-services'
                    ? isVendorStore 
                      ? 'bg-[var(--vendor-primary)] text-white'
                      : 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                )}>
                  <Calendar className="w-4 h-4" />
                </div>
                <span className="flex-1 text-sm font-medium">Bookings & Services</span>
                <ChevronRight className={theme.combine(
                  'w-4 h-4 transition-transform',
                  activeCategory === 'bookings-services' ? 'translate-x-1' : 'group-hover:translate-x-1'
                )} />
              </Link>
            )}
            
            {/* Regular Categories */}
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={`#category-${category.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToElement(`category-${category.slug}`);
                  setActiveCategory(category.slug);
                }}
                className={theme.combine(
                  'group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                  activeCategory === category.slug
                    ? isVendorStore 
                      ? 'bg-[var(--vendor-primary)]/10 text-[var(--vendor-primary)] font-medium shadow-sm'
                      : 'bg-blue-50 text-blue-600 font-medium shadow-sm'
                    : theme.combine(
                        theme.text,
                        'hover:bg-gray-50 hover:shadow-sm'
                      )
                )}
              >
                <div className={theme.combine(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                  activeCategory === category.slug
                    ? isVendorStore 
                      ? 'bg-[var(--vendor-primary)] text-white'
                      : 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                )}>
                  <Package className="w-4 h-4" />
                </div>
                <span className="flex-1 text-sm font-medium">{category.name}</span>
                <ChevronRight className={theme.combine(
                  'w-4 h-4 transition-transform',
                  activeCategory === category.slug ? 'translate-x-1' : 'group-hover:translate-x-1'
                )} />
              </Link>
            ))}
          </div>
        </div>

        {/* Footer Badge */}
        <div className="p-4 border-t border-gray-200/50 bg-gray-50/50">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              {categories.length + (hasBookingProducts ? 1 : 0)} {categories.length + (hasBookingProducts ? 1 : 0) === 1 ? 'Category' : 'Categories'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Custom scrollbar styles */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </aside>
  );
}
