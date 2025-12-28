'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
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
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className={theme.combine(theme.cardBg, 'rounded-lg shadow-sm p-4 sticky top-20')}>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
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
    <aside className="hidden lg:block w-64 flex-shrink-0">
      <div className={theme.combine(theme.cardBg, 'rounded-lg shadow-sm p-4 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto')}>
        <h2 className={theme.combine('font-bold text-lg mb-4 sticky top-0 pb-2 z-10', theme.cardBg, theme.text)}>
          Categories
        </h2>
        <div className="space-y-1">
          {/* Bookings & Services */}
          {hasBookingProducts && (
            <div>
              <Link
                href="#category-bookings-services"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToElement('category-bookings-services');
                }}
                className={theme.combine(
                  'flex items-center justify-between px-3 py-2 text-sm font-medium rounded transition-colors', 
                  theme.text, 
                  isVendorStore ? 'hover:vendor-primary' : 'hover:text-primary hover:bg-accent/10'
                )}
              >
                <span>Bookings & Services</span>
              </Link>
            </div>
          )}
          
          {/* Regular Categories */}
          {categories.map((category) => (
            <div key={category.id}>
              <Link
                href={`#category-${category.slug}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToElement(`category-${category.slug}`);
                }}
                className={theme.combine(
                  'flex items-center justify-between px-3 py-2 text-sm font-medium rounded transition-colors', 
                  theme.text, 
                  isVendorStore ? 'hover:vendor-primary' : 'hover:text-primary hover:bg-accent/10'
                )}
              >
                <span>{category.name}</span>
                {category.children && category.children.length > 0 && (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
