'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Home } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCategories } from '@/hooks/useCategories';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { useVendorContext } from '@/contexts/VendorContext';

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
  productCount?: number;
}

interface VendorPage {
  id: string;
  title: string;
  slug: string;
  showInNavigation: boolean;
}

interface CategoryNavProps {
  vendorId?: string;
  onCategorySelect?: (categoryId: string) => void;
  selectedCategory?: string;
  mode?: 'navigation' | 'filter' | 'scroll';
  vendorSlug?: string;
  hideEmptyCategories?: boolean;
  themeConfig?: any;
}

export default function CategoryNav({ 
  vendorId, 
  onCategorySelect, 
  selectedCategory = '',
  mode = 'navigation',
  vendorSlug,
  hideEmptyCategories = true,
  themeConfig
}: CategoryNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useThemeClasses();
  const { isVendorStore, vendor } = useVendorContext();
  
  console.log('🟡 CategoryNav render:', { 
    isVendorStore, 
    vendorId: vendor?.id, 
    vendorSlug: vendor?.slug,
    themeClasses: {
      bg: theme.bg,
      text: theme.text,
      primary: theme.primary
    }
  });

  const navBarClassName = theme.combine(
    "border-b sticky top-[76px] z-30",
    isVendorStore ? 'vendor-nav-bg vendor-border-primary vendor-text' : 'bg-secondary border-secondary-foreground/20'
  );
  
  console.log('🟡 CategoryNav className:', navBarClassName);
  
  // Use vendorId from props or context
  const effectiveVendorId = vendorId || (isVendorStore && vendor ? vendor.id : undefined);
  const effectiveVendorSlug = vendorSlug || (isVendorStore && vendor ? vendor.slug : undefined);
  
  // Use React Query for cached categories
  const { data: categories = [], isLoading } = useCategories({
    vendorId: effectiveVendorId,
    hideEmptyCategories,
  });
  
  const [vendorPages, setVendorPages] = useState<VendorPage[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [hasBookingProducts, setHasBookingProducts] = useState(false);

  useEffect(() => {
    if (effectiveVendorId && effectiveVendorSlug) {
      fetchVendorPages();
    }
    checkBookingProducts();
  }, [effectiveVendorId]);

  // Handle hash scrolling when page loads or pathname changes
  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#category-')) {
      const categorySlug = hash.replace('#category-', '');
      // Wait for page to render, then scroll
      setTimeout(() => {
        handleScrollToCategory(categorySlug);
      }, 300);
    }
  }, [pathname]);

  const handleNavigateToCategory = (categorySlug: string, e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    
    console.log('🔵 handleNavigateToCategory called');
    console.log('🔵 Category slug:', categorySlug);
    console.log('🔵 Current pathname:', pathname);
    console.log('🔵 Vendor slug:', effectiveVendorSlug);
    
    // If no effectiveVendorSlug, we're on main homepage
    if (!effectiveVendorSlug) {
      // Check if we're on the homepage
      const isOnHomepage = pathname === '/' || pathname === '/';
      console.log('🔵 No vendor slug - is on homepage:', isOnHomepage);
      
      if (isOnHomepage) {
        // Just scroll to category
        handleScrollToCategory(categorySlug);
      } else {
        // Navigate to homepage with hash
        const targetUrl = `/#category-${categorySlug}`;
        console.log('🔵 Navigating to:', targetUrl);
        window.location.href = targetUrl;
      }
      return;
    }
    
    // Check if we're on the vendor home page (exact match, no query params or other paths)
    const isOnVendorHome = pathname === `/vendor/${effectiveVendorSlug}` && !window.location.search;
    console.log('🔵 Is on vendor home:', isOnVendorHome);
    
    if (isOnVendorHome) {
      // Just scroll to category
      console.log('🔵 Scrolling to category on same page');
      handleScrollToCategory(categorySlug);
    } else {
      // Navigate to home page with hash (clears any query params)
      const targetUrl = `/vendor/${effectiveVendorSlug}#category-${categorySlug}`;
      console.log('🔵 Navigating to:', targetUrl);
      window.location.href = targetUrl;
    }
  };

  const fetchVendorPages = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/vendors/${effectiveVendorId}/pages`
      );
      if (response.ok) {
        const pages = await response.json();
        setVendorPages(pages.filter((p: VendorPage) => p.showInNavigation));
      }
    } catch (error) {
      console.error('Error fetching vendor pages:', error);
    }
  };

  const checkBookingProducts = async () => {
    try {
      const url = effectiveVendorId 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/products?vendorId=${effectiveVendorId}&productType=booking&limit=1`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/products?productType=booking&limit=1`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setHasBookingProducts(data.total > 0 || (data.products && data.products.length > 0));
      }
    } catch (error) {
      console.error('Error checking booking products:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown && mode !== 'navigation') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeDropdown, mode]);

  const handleCategoryClick = (categoryId: string) => {
    if (mode === 'filter' && onCategorySelect) {
      onCategorySelect(categoryId);
      setActiveDropdown(null);
    }
  };

  const handleScrollToCategory = (categorySlug: string) => {
    setActiveDropdown(null);
    
    console.log('🟢 handleScrollToCategory called with slug:', categorySlug);
    
    // First, try to find element with the exact category slug
    let elementId = `category-${categorySlug}`;
    let element = document.getElementById(elementId);
    console.log('🟢 Tried to find element:', elementId, 'Found:', !!element);
    
    // If not found, try to find the parent category
    if (!element) {
      console.log('🟢 Element not found, checking if this is a subcategory');
      
      // Find if this slug belongs to a subcategory
      for (const category of categories) {
        if (category.children) {
          const subcategory = category.children.find(sub => sub.slug === categorySlug);
          if (subcategory) {
            console.log('🟢 Found subcategory, scrolling to parent:', category.slug);
            elementId = `category-${category.slug}`;
            element = document.getElementById(elementId);
            break;
          }
        }
      }
    }
    
    // Last resort: check if it might be the bookings section
    if (!element) {
      console.log('🟢 Still not found, trying bookings-services fallback');
      elementId = 'category-bookings-services';
      element = document.getElementById(elementId);
      console.log('🟢 Fallback element found:', !!element);
    }
    
    if (element) {
      console.log('🟢 Scrolling to element:', elementId);
      const headerOffset = 140;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    } else {
      console.log('🟢 Element not found on page - category may not have products');
      // Element doesn't exist (no products in that category), just close dropdown
    }
  };

  if (isLoading) return null;

  return (
    <div 
      className={navBarClassName}
      ref={dropdownRef}
    >
      <div className="container mx-auto">
        <div className="flex items-center gap-0 flex-wrap">
          {/* Home Link - Left Side */}
          {effectiveVendorSlug && (
            <Link
              href={`/vendor/${effectiveVendorSlug}`}
              className={theme.combine(
                "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all whitespace-nowrap border-r hover:opacity-80",
                isVendorStore ? 'vendor-border-primary-30 vendor-text' : 'border-secondary-foreground/20 text-secondary-foreground'
              )}
            >
              <Home className="w-3.5 h-3.5" />
              Home
            </Link>
          )}

          {/* Categories - Middle */}
          {mode === 'filter' && (
            <button
              onClick={() => handleCategoryClick('')}
              className={theme.combine(
                "flex-shrink-0 px-4 py-2.5 text-xs font-normal transition-all whitespace-nowrap border-b-2",
                selectedCategory === '' 
                  ? isVendorStore ? 'vendor-border-primary vendor-primary font-semibold vendor-secondary-bg' : 'border-primary text-primary font-semibold bg-primary/10'
                  : isVendorStore ? 'border-transparent vendor-text hover:opacity-80 hover:vendor-secondary-bg' : 'border-transparent text-secondary-foreground hover:opacity-80 hover:bg-secondary-foreground/10'
              )}
            >
              All Products
            </button>
          )}
          
          {categories.map((category) => (
            <div
              key={category.id}
              className="relative flex-shrink-0"
              onMouseEnter={() => (mode === 'navigation' || mode === 'scroll') && setActiveDropdown(category.id)}
              onMouseLeave={() => (mode === 'navigation' || mode === 'scroll') && setActiveDropdown(null)}
            >
              {mode === 'navigation' ? (
                <button
                  onClick={(e) => handleNavigateToCategory(category.slug, e)}
                  className={theme.combine(
                    "flex items-center gap-1 px-4 py-2.5 text-xs font-normal transition-all whitespace-nowrap hover:opacity-80",
                    isVendorStore ? 'vendor-text' : 'text-secondary-foreground'
                  )}
                >
                  {category.name}
                  {category.children && category.children.length > 0 && (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              ) : mode === 'scroll' ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔴 CATEGORY CLICKED:', category.slug);
                    console.log('🔴 VendorSlug:', effectiveVendorSlug);
                    console.log('🔴 Pathname:', pathname);
                    console.log('🔴 Window search:', window.location.search);
                    
                    // If no vendorSlug, we're on main marketplace
                    if (!effectiveVendorSlug) {
                      console.log('🔴 NO VENDOR SLUG BRANCH');
                      // Check if we're on the homepage (ignore query params for filters/search)
                      const isOnHomepage = pathname === '/' || pathname === '/';
                      console.log('🔴 isOnHomepage:', isOnHomepage);
                      console.log('🔴 pathname === \'/\':', pathname === '/');
                      console.log('🔴 pathname === \'/\':', pathname === '/');
                      
                      if (!isOnHomepage) {
                        console.log('🔴 NAVIGATING TO HOME WITH HASH:', `/#category-${category.slug}`);
                        // Navigate to homepage with hash (clears query params)
                        window.location.href = `/#category-${category.slug}`;
                      } else {
                        console.log('🔴 SCROLLING TO CATEGORY (with or without children)');
                        handleScrollToCategory(category.slug);
                      }
                      return;
                    }
                    
                    console.log('🔴 VENDOR SLUG BRANCH');
                    // Check if we're on vendor home page (ignore query params for filters/search)
                    const isOnVendorHome = pathname === `/vendor/${effectiveVendorSlug}`;
                    console.log('🔴 isOnVendorHome:', isOnVendorHome);
                    
                    if (!isOnVendorHome) {
                      console.log('🔴 NAVIGATING TO VENDOR HOME WITH HASH:', `/vendor/${effectiveVendorSlug}#category-${category.slug}`);
                      // Navigate to home page with hash (clears query params)
                      window.location.href = `/vendor/${effectiveVendorSlug}#category-${category.slug}`;
                    } else {
                      console.log('🔴 SCROLLING TO VENDOR CATEGORY (with or without children)');
                      handleScrollToCategory(category.slug);
                    }
                  }}
                  className={theme.combine(
                    "flex items-center gap-1 px-4 py-2.5 text-xs font-normal transition-all whitespace-nowrap hover:opacity-80",
                    isVendorStore ? 'vendor-text' : 'text-secondary-foreground'
                  )}
                >
                  {category.name}
                  {category.children && category.children.length > 0 && (
                    <ChevronDown className={`w-3 h-3 transition-transform ${
                      activeDropdown === category.id ? 'rotate-180' : ''
                    }`} />
                  )}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (category.children && category.children.length > 0) {
                      setActiveDropdown(activeDropdown === category.id ? null : category.id);
                    } else {
                      handleCategoryClick(category.id);
                    }
                  }}
                  className={`flex items-center gap-1 px-4 py-2.5 text-xs font-normal transition-all whitespace-nowrap border-b-2
                    ${selectedCategory === category.id 
                      ? 'vendor-border-primary vendor-primary font-semibold vendor-secondary-bg' 
                      : 'border-transparent vendor-text hover:opacity-80 hover:vendor-secondary-bg'
                    }`}
                >
                  {category.name}
                  {category.children && category.children.length > 0 && (
                    <ChevronDown className={`w-3 h-3 transition-transform ${
                      activeDropdown === category.id ? 'rotate-180' : ''
                    }`} />
                  )}
                </button>
              )}
              
              {/* Subcategories Dropdown */}
              {category.children && category.children.length > 0 && activeDropdown === category.id && (
                <div className="absolute top-full left-0 mt-0 vendor-bg shadow-xl rounded-b-lg min-w-[200px] z-[9999] border vendor-border-primary py-2">
                  {mode === 'navigation' ? (
                    <>
                      <button
                        onClick={(e) => handleNavigateToCategory(category.slug, e)}
                        className="block w-full text-left px-4 py-2 text-sm font-semibold vendor-text hover:vendor-primary hover:opacity-80 transition-colors border-b vendor-border-primary-30"
                      >
                        All {category.name}
                      </button>
                      {category.children.map((subcat) => (
                        <button
                          key={subcat.id}
                          onClick={(e) => handleNavigateToCategory(subcat.slug, e)}
                          className="block w-full text-left px-4 py-2 text-sm vendor-text-80 hover:vendor-primary hover:opacity-80 transition-colors"
                        >
                          {subcat.name}
                        </button>
                      ))}
                    </>
                  ) : mode === 'scroll' ? (
                    <>
                      <button
                        onClick={() => {
                          setActiveDropdown(null);
                          handleScrollToCategory(category.slug);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm font-semibold vendor-text hover:vendor-primary hover:opacity-80 transition-colors border-b vendor-border-primary-30"
                      >
                        All {category.name}
                      </button>
                      {category.children.map((subcat) => (
                        <button
                          key={subcat.id}
                          onClick={() => {
                            setActiveDropdown(null);
                            handleScrollToCategory(subcat.slug);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm vendor-text-80 hover:vendor-primary hover:opacity-80 transition-colors"
                        >
                          {subcat.name}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleCategoryClick(category.id)}
                        className="block w-full text-left px-4 py-2 text-sm font-semibold vendor-text hover:vendor-primary hover:opacity-80 transition-colors border-b vendor-border-primary-30"
                      >
                        All {category.name}
                      </button>
                      {category.children.map((subcat) => (
                        <button
                          key={subcat.id}
                          onClick={() => handleCategoryClick(subcat.id)}
                          className="block w-full text-left px-4 py-2 text-sm vendor-text-80 hover:vendor-primary hover:opacity-80 transition-colors"
                        >
                          {subcat.name}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Booking & Services Link */}
          {hasBookingProducts && (
            <div className="relative flex-shrink-0">
              {mode === 'navigation' ? (
                <Link
                  href={effectiveVendorSlug ? `/vendor/${effectiveVendorSlug}?productType=booking` : '/?productType=booking'}
                  className={theme.combine(
                    "flex items-center gap-1 px-4 py-2.5 text-xs font-normal transition-all whitespace-nowrap hover:opacity-80",
                    isVendorStore ? 'vendor-text hover:vendor-secondary-bg' : 'text-secondary-foreground hover:bg-secondary-foreground/10'
                  )}
                >
                  Booking & Services
                </Link>
              ) : mode === 'scroll' ? (
                <Link
                  href={effectiveVendorSlug ? `/vendor/${effectiveVendorSlug}?productType=booking` : '/?productType=booking'}
                  className={theme.combine(
                    "flex items-center gap-1 px-4 py-2.5 text-xs font-normal transition-all whitespace-nowrap hover:opacity-80",
                    isVendorStore ? 'vendor-text hover:vendor-secondary-bg' : 'text-secondary-foreground hover:bg-secondary-foreground/10'
                  )}
                >
                  Booking & Services
                </Link>
              ) : (
                <Link
                  href={effectiveVendorSlug ? `/vendor/${effectiveVendorSlug}?productType=booking` : '/?productType=booking'}
                  className={theme.combine(
                    "flex items-center gap-1 px-4 py-2.5 text-xs font-normal transition-all whitespace-nowrap border-b-2 border-transparent hover:opacity-80",
                    isVendorStore ? 'vendor-text hover:vendor-secondary-bg' : 'text-secondary-foreground hover:bg-secondary-foreground/10'
                  )}
                >
                  Booking & Services
                </Link>
              )}
            </div>
          )}

          {/* Vendor Pages - Right Side */}
          {vendorPages.length > 0 && effectiveVendorSlug && (
            <>
              <div className={theme.combine(
                "border-l h-6 mx-2",
                isVendorStore ? 'vendor-border-primary-30' : 'border-secondary-foreground/20'
              )}></div>
              {vendorPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/vendor/${effectiveVendorSlug}/${page.slug}`}
                  className={theme.combine(
                    "flex-shrink-0 px-4 py-2.5 text-xs font-normal transition-all whitespace-nowrap hover:opacity-80",
                    isVendorStore ? 'vendor-text hover:vendor-secondary-bg' : 'text-secondary-foreground hover:bg-secondary-foreground/10'
                  )}
                >
                  {page.title}
                </Link>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
