'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Home, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useCategories } from '@/hooks/useCategories';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { useVendorContext } from '@/contexts/VendorContext';
import { getProductTypeIcon } from '@/lib/utils/product-types';
import { Category } from '@/types/product';
import { VendorPage as VendorPageType } from '@/types/common';

interface CategoryNavProps {
  vendorId?: string;
  onCategorySelect?: (categoryId: string) => void;
  selectedCategory?: string;
  mode?: 'navigation' | 'filter' | 'scroll';
  vendorSlug?: string;
  hideEmptyCategories?: boolean;
  themeConfig?: any;
  showCustomPages?: boolean; // Show custom pages instead of categories
}

export default function CategoryNav({ 
  vendorId, 
  onCategorySelect, 
  selectedCategory = '',
  mode = 'navigation',
  vendorSlug,
  hideEmptyCategories = true,
  themeConfig,
  showCustomPages = false
}: CategoryNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const theme = useThemeClasses();
  const { isVendorStore, vendor } = useVendorContext();
  const [categoryDisplayMode, setCategoryDisplayMode] = useState<'top' | 'sidebar'>('top');
  
  // Use vendorId from props or context
  const effectiveVendorId = vendorId || (isVendorStore && vendor ? vendor.id : undefined);
  const effectiveVendorSlug = vendorSlug || (isVendorStore && vendor ? vendor.slug : undefined);
  
  // Use React Query for cached categories
  const { data: categories = [], isLoading } = useCategories({
    vendorId: effectiveVendorId,
    hideEmptyCategories,
  });
  
  const [vendorPages, setVendorPages] = useState<VendorPageType[]>([]);
  const [customPages, setCustomPages] = useState<VendorPageType[]>([]);
  const [showPagesMenu, setShowPagesMenu] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pagesMenuRef = useRef<HTMLDivElement>(null);
  const [hasUncategorizedBookingProducts, setHasUncategorizedBookingProducts] = useState(false);
  const [hasTourProducts, setHasTourProducts] = useState(false);
  
  // Fetch category display mode setting
  useEffect(() => {
    console.log('🔷 CategoryNav useEffect triggered', { isVendorStore, hasVendor: !!vendor });
    
    // For vendor stores, check the vendor's own categoryDisplayMode setting
    if (isVendorStore && vendor) {
      console.log('🔵 CategoryNav: Vendor detected', { vendorId: vendor.id, vendorSlug: vendor.slug, vendor });
      const vendorDisplayMode = (vendor as any).categoryDisplayMode || 'top';
      console.log('🔵 CategoryNav: Vendor categoryDisplayMode from vendor object:', vendorDisplayMode);
      setCategoryDisplayMode(vendorDisplayMode as 'top' | 'sidebar');
      return;
    }

    const fetchCategoryDisplayMode = async () => {
      try {
        console.log('🔷 CategoryNav: Fetching settings from API...');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const response = await fetch(`${API_URL}/api/v1/settings/category_display_mode`);
        if (response.ok) {
          const data = await response.json();
          console.log('🟢 CategoryNav: Settings received:', data);
          const mode = data.value || 'top';
          console.log('🟢 CategoryNav: Display mode value:', mode);
          console.log('🟢 CategoryNav: Calling setCategoryDisplayMode with:', mode);
          setCategoryDisplayMode(mode as 'top' | 'sidebar');
          console.log('🟢 CategoryNav: setCategoryDisplayMode called');
        } else {
          console.log('🔴 CategoryNav: Failed to fetch settings, response not ok');
          setCategoryDisplayMode('top');
        }
      } catch (error) {
        console.error('🔴 CategoryNav: Error fetching category display mode:', error);
        setCategoryDisplayMode('top');
      }
    };

    fetchCategoryDisplayMode();
  }, [isVendorStore, vendor]);

  // Log whenever categoryDisplayMode changes
  useEffect(() => {
    console.log('🟣 CategoryNav: categoryDisplayMode state changed to:', categoryDisplayMode);
  }, [categoryDisplayMode]);

  useEffect(() => {
    if (effectiveVendorId && effectiveVendorSlug) {
      fetchVendorPages();
    }
    if (showCustomPages) {
      fetchMarketplacePages();
    }
    checkBookingProducts();
    checkTourProducts();
  }, [effectiveVendorId, showCustomPages]);

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
        setVendorPages(pages.filter((p: VendorPageType) => p.showInNavigation));
      }
    } catch (error) {
      console.error('Error fetching vendor pages:', error);
    }
  };

  const fetchMarketplacePages = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/marketplace/pages`
      );
      if (response.ok) {
        const pages = await response.json();
        setCustomPages(pages.filter((p: VendorPageType) => p.showInNavigation));
      }
    } catch (error) {
      console.error('Error fetching marketplace pages:', error);
    }
  };

  const checkBookingProducts = async () => {
    try {
      const url = effectiveVendorId 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/products?vendorId=${effectiveVendorId}&productType=booking&uncategorized=true&limit=1`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/products?productType=booking&uncategorized=true&limit=1`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setHasUncategorizedBookingProducts(data.total > 0 || (data.products && data.products.length > 0));
      }
    } catch (error) {
      console.error('Error checking booking products:', error);
    }
  };

  const checkTourProducts = async () => {
    try {
      // Check for products with tour.tourMode = true
      const url = effectiveVendorId 
        ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/products?vendorId=${effectiveVendorId}&productType=booking&limit=100`
        : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/products?productType=booking&limit=100`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Check if any products have tour.tourMode = true
        const hasTours = data.products?.some((p: any) => p.attributes?.tour?.tourMode === true);
        setHasTourProducts(hasTours);
      }
    } catch (error) {
      console.error('Error checking tour products:', error);
    }
  };

  // Fetch custom pages
  useEffect(() => {
    const fetchCustomPages = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        let url: string;
        
        if (isVendorStore && effectiveVendorId) {
          url = `${API_URL}/api/v1/vendors/${effectiveVendorId}/pages`;
        } else {
          url = `${API_URL}/api/v1/marketplace/pages`;
        }
        
        const response = await fetch(url);
        if (response.ok) {
          const pages = await response.json();
          const publishedPages = pages.filter((p: VendorPageType) => p.showInNavigation);
          setCustomPages(publishedPages);
        }
      } catch (error) {
        console.error('Error fetching custom pages:', error);
      }
    };

    fetchCustomPages();
  }, [isVendorStore, effectiveVendorId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
      if (pagesMenuRef.current && !pagesMenuRef.current.contains(event.target as Node)) {
        setShowPagesMenu(false);
      }
    };

    if ((activeDropdown && mode !== 'navigation') || showPagesMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [activeDropdown, mode, showPagesMenu]);

  const handleCategoryClick = (categoryId: string) => {
    if (mode === 'filter' && onCategorySelect) {
      onCategorySelect(categoryId);
      setActiveDropdown(null);
    }
  };

  const handleScrollToCategory = (categorySlug: string) => {
    setActiveDropdown(null);
    
    console.log('🟢 handleScrollToCategory called with slug:', categorySlug);

    const normalizedSlug = (categorySlug || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const candidateSlugs = new Set<string>([categorySlug]);

    // Handle booking/services slug variations used across data and section IDs.
    if (
      normalizedSlug === 'bookingservices' ||
      normalizedSlug === 'bookingsservices' ||
      normalizedSlug === 'services'
    ) {
      candidateSlugs.add('bookings-services');
      candidateSlugs.add('booking-services');
      candidateSlugs.add('services');
    }
    if (normalizedSlug === 'tourstravel') {
      candidateSlugs.add('tours-travel');
    }
    
    // First, try all candidate slugs (exact + aliases)
    let elementId = '';
    let element: HTMLElement | null = null;
    for (const slug of candidateSlugs) {
      const candidateId = `category-${slug}`;
      const candidateElement = document.getElementById(candidateId);
      console.log('🟢 Tried to find element:', candidateId, 'Found:', !!candidateElement);
      if (candidateElement) {
        elementId = candidateId;
        element = candidateElement;
        break;
      }
    }
    
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

  if (isLoading) {
    console.log('🟠 CategoryNav: isLoading = true, returning null');
    return null;
  }

  console.log('🔵 CategoryNav: Before conditional check', { 
    categoryDisplayMode,
    shouldHide: categoryDisplayMode !== 'top',
    isVendorStore,
    vendorId: vendor?.id,
  });

  // Hide CategoryNav if display mode is sidebar
  if (categoryDisplayMode !== 'top') {
    console.log('🔴 CategoryNav: HIDING because mode is:', categoryDisplayMode, '(not "top")');
    return null;
  }
  
  console.log('🟢 CategoryNav: RENDERING - mode is "top"', { 
    isVendorStore, 
    categoryDisplayMode,
    vendorId: vendor?.id, 
    vendorSlug: vendor?.slug,
  });

  const navBarClassName = theme.combine(
    "border-b sticky top-0 z-30",
    isVendorStore ? 'vendor-nav-bg vendor-border-primary vendor-text' : 'bg-secondary border-secondary-foreground/20'
  );

  return (
    <div 
      className={navBarClassName}
      ref={dropdownRef}
    >
      <div className="container mx-auto">
        <div className="flex items-center gap-0 flex-wrap">
          {/* Home Link - Left Side */}
          <Link
            href="/"
            className={theme.combine(
              "flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all whitespace-nowrap border-r hover:opacity-80",
              isVendorStore ? 'vendor-border-primary-30 vendor-text' : 'border-secondary-foreground/20 text-secondary-foreground'
            )}
          >
            <Home className="w-3.5 h-3.5" />
            Home
          </Link>

          {/* Pages Menu Button */}
          {customPages.length > 0 && (
            <div className="relative flex-shrink-0" ref={pagesMenuRef}>
              <button
                onClick={() => setShowPagesMenu(!showPagesMenu)}
                className={theme.combine(
                  "flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-all whitespace-nowrap border-r hover:opacity-80",
                  isVendorStore ? 'vendor-border-primary-30 vendor-text' : 'border-secondary-foreground/20 text-secondary-foreground'
                )}
                aria-label="View pages"
              >
                {showPagesMenu ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
                <span>More</span>
              </button>

              {/* Pages Dropdown */}
              {showPagesMenu && (
                <div
                  className={theme.combine(
                    "absolute left-0 mt-2 w-64 rounded-lg shadow-lg border z-50 max-h-96 overflow-y-auto",
                    isVendorStore ? 'vendor-nav-bg vendor-border-primary' : 'bg-white border-gray-200'
                  )}
                >
                  <div className="py-2">
                    {customPages.map((page) => {
                      const baseUrl = isVendorStore ? '' : (effectiveVendorSlug ? `/${effectiveVendorSlug}` : '');
                      const pageUrl = `${baseUrl}/${page.slug}`;
                      
                      return (
                        <Link
                          key={page.id}
                          href={pageUrl}
                          onClick={() => setShowPagesMenu(false)}
                          className={theme.combine(
                            "block px-4 py-3 text-sm transition-all hover:opacity-80",
                            isVendorStore ? 'vendor-text hover:vendor-secondary-bg' : 'text-gray-700 hover:bg-gray-100'
                          )}
                        >
                          {page.title}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Categories - Middle */}
          {showCustomPages ? (
            // Show custom pages instead of categories
            <>
              {customPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/${page.slug}`}
                  className={theme.combine(
                    "flex items-center gap-1 px-4 py-2.5 text-xs font-normal transition-all whitespace-nowrap hover:opacity-80",
                    isVendorStore ? 'vendor-text' : 'text-secondary-foreground',
                    pathname === `/${page.slug}` ? 'font-semibold border-b-2 border-primary' : ''
                  )}
                >
                  {page.title}
                </Link>
              ))}
            </>
          ) : (
            <>
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
          
          {categories.filter(cat => cat.slug !== 'tours-travel').map((category) => (
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
                  {category.primaryProductType && (
                    <span className="text-sm">{getProductTypeIcon(category.primaryProductType)}</span>
                  )}
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
                    const isOnVendorHome = pathname === '/';
                    console.log('🔴 isOnVendorHome:', isOnVendorHome);
                    
                    if (!isOnVendorHome) {
                      console.log('🔴 NAVIGATING TO VENDOR HOME WITH HASH:', `/#category-${category.slug}`);
                      // Navigate to home page with hash (clears query params)
                      window.location.href = `/#category-${category.slug}`;
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
                  {category.primaryProductType && (
                    <span className="text-sm">{getProductTypeIcon(category.primaryProductType)}</span>
                  )}
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
                  {category.primaryProductType && (
                    <span className="text-sm mr-1">{getProductTypeIcon(category.primaryProductType)}</span>
                  )}
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

          {/* Tours & Travel Link */}
          {hasTourProducts && (
            <div className="relative flex-shrink-0">
              {mode === 'navigation' ? (
                <Link
                  href="/?productType=booking&tourMode=true"
                  className={theme.combine(
                    "flex items-center gap-1 px-4 py-2.5 text-xs font-normal transition-all whitespace-nowrap hover:opacity-80",
                    isVendorStore ? 'vendor-text hover:vendor-secondary-bg' : 'text-secondary-foreground hover:bg-secondary-foreground/10'
                  )}
                >
                  Tours & Travel
                </Link>
              ) : mode === 'scroll' ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔴 TOURS CLICKED');
                    
                    if (!effectiveVendorSlug) {
                      const isOnHomepage = pathname === '/' || pathname === '/';
                      if (!isOnHomepage) {
                        window.location.href = '/#category-tours-travel';
                      } else {
                        handleScrollToCategory('tours-travel');
                      }
                    } else {
                      const isOnVendorHome = pathname === '/';
                      if (!isOnVendorHome) {
                        window.location.href = `/${effectiveVendorSlug}#category-tours-travel`;
                      } else {
                        handleScrollToCategory('tours-travel');
                      }
                    }
                  }}
                  className={theme.combine(
                    "flex items-center gap-1 px-4 py-2.5 text-xs font-normal transition-all whitespace-nowrap hover:opacity-80",
                    isVendorStore ? 'vendor-text hover:vendor-secondary-bg' : 'text-secondary-foreground hover:bg-secondary-foreground/10'
                  )}
                >
                  Tours & Travel
                </button>
              ) : (
                <Link
                  href="/?productType=booking&tourMode=true"
                  className={theme.combine(
                    "flex items-center gap-1 px-4 py-2.5 text-xs font-normal transition-all whitespace-nowrap border-b-2 border-transparent hover:opacity-80",
                    isVendorStore ? 'vendor-text hover:vendor-secondary-bg' : 'text-secondary-foreground hover:bg-secondary-foreground/10'
                  )}
                >
                  Tours & Travel
                </Link>
              )}
            </div>
          )}

          {/* Fallback link for uncategorized booking products */}
          {hasUncategorizedBookingProducts && (
            <div className="relative flex-shrink-0">
              {mode === 'navigation' ? (
                <Link
                  href="/?productType=booking&uncategorized=true"
                  className={theme.combine(
                    "flex items-center gap-1 px-4 py-2.5 text-xs font-normal transition-all whitespace-nowrap hover:opacity-80",
                    isVendorStore ? 'vendor-text hover:vendor-secondary-bg' : 'text-secondary-foreground hover:bg-secondary-foreground/10'
                  )}
                >
                  Bookings
                </Link>
              ) : mode === 'scroll' ? (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔴 BOOKINGS CLICKED');
                    
                    const targetUrl = '/?productType=booking&uncategorized=true';
                    window.location.href = targetUrl;
                  }}
                  className={theme.combine(
                    "flex items-center gap-1 px-4 py-2.5 text-xs font-normal transition-all whitespace-nowrap hover:opacity-80",
                    isVendorStore ? 'vendor-text hover:vendor-secondary-bg' : 'text-secondary-foreground hover:bg-secondary-foreground/10'
                  )}
                >
                  Bookings
                </button>
              ) : (
                <Link
                  href="/?productType=booking&uncategorized=true"
                  className={theme.combine(
                    "flex items-center gap-1 px-4 py-2.5 text-xs font-normal transition-all whitespace-nowrap border-b-2 border-transparent hover:opacity-80",
                    isVendorStore ? 'vendor-text hover:vendor-secondary-bg' : 'text-secondary-foreground hover:bg-secondary-foreground/10'
                  )}
                >
                  Bookings
                </Link>
              )}
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
