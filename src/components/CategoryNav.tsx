'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Home } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useCategories } from '@/hooks/useCategories';

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
}

export default function CategoryNav({ 
  vendorId, 
  onCategorySelect, 
  selectedCategory = '',
  mode = 'navigation',
  vendorSlug,
  hideEmptyCategories = true
}: CategoryNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  
  // Try to get locale and translations, fallback for vendor routes
  let locale = 'en';
  let t: any;
  let tCategory: any;
  
  try {
    locale = useLocale();
    t = useTranslations('common');
    tCategory = useTranslations('category');
  } catch {
    // Fallback for vendor routes without intl context
    const localeMatch = pathname?.match(/^\/(en|hi|mr)/);
    locale = localeMatch ? localeMatch[1] : 'en';
    t = (key: string) => key;
    tCategory = (key: string) => key;
  }
  
  // Use React Query for cached categories
  const { data: categories = [], isLoading } = useCategories({
    vendorId,
    locale,
    hideEmptyCategories,
  });
  
  const [vendorPages, setVendorPages] = useState<VendorPage[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (vendorId && vendorSlug) {
      fetchVendorPages();
    }
  }, [vendorId]);

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
    console.log('🔵 Vendor slug:', vendorSlug);
    
    // If no vendorSlug, we're on main homepage
    if (!vendorSlug) {
      // Check if we're on the homepage
      const isOnHomepage = pathname === `/${locale}` || pathname === '/';
      console.log('🔵 No vendor slug - is on homepage:', isOnHomepage);
      
      if (isOnHomepage) {
        // Just scroll to category
        handleScrollToCategory(categorySlug);
      } else {
        // Navigate to homepage with hash
        const targetUrl = `/${locale}#category-${categorySlug}`;
        console.log('🔵 Navigating to:', targetUrl);
        window.location.href = targetUrl;
      }
      return;
    }
    
    // Check if we're on the vendor home page (exact match, no query params or other paths)
    const isOnVendorHome = pathname === `/vendor/${vendorSlug}` && !window.location.search;
    console.log('🔵 Is on vendor home:', isOnVendorHome);
    
    if (isOnVendorHome) {
      // Just scroll to category
      console.log('🔵 Scrolling to category on same page');
      handleScrollToCategory(categorySlug);
    } else {
      // Navigate to home page with hash (clears any query params)
      const targetUrl = `/vendor/${vendorSlug}#category-${categorySlug}`;
      console.log('🔵 Navigating to:', targetUrl);
      window.location.href = targetUrl;
    }
  };

  const fetchVendorPages = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/vendors/${vendorId}/pages`
      );
      if (response.ok) {
        const pages = await response.json();
        setVendorPages(pages.filter((p: VendorPage) => p.showInNavigation));
      }
    } catch (error) {
      console.error('Error fetching vendor pages:', error);
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
    const elementId = `category-${categorySlug}`;
    const element = document.getElementById(elementId);
    
    if (element) {
      const headerOffset = 140;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Update URL hash without jumping
      window.history.pushState(null, '', `#${elementId}`);
    }
  };

  if (isLoading) return null;

  return (
    <div 
      className="border-b border-border sticky top-[61px] z-50 bg-secondary" 
      ref={dropdownRef}
    >
      <div className="container mx-auto">
        <div className="flex items-center gap-0 flex-wrap">
          {/* Home Link - Left Side */}
          {vendorSlug && (
            <Link
              href={`/vendor/${vendorSlug}`}
              className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-all whitespace-nowrap text-foreground hover:text-primary hover:bg-muted border-r border-border"
            >
              <Home className="w-3.5 h-3.5" />
              {t('home')}
            </Link>
          )}

          {/* Categories - Middle */}
          {mode === 'filter' && (
            <button
              onClick={() => handleCategoryClick('')}
              className={`flex-shrink-0 px-4 py-2.5 text-xs font-normal transition-all whitespace-nowrap border-b-2 
                ${selectedCategory === '' 
                  ? 'border-primary text-primary font-semibold bg-muted' 
                  : 'border-transparent text-foreground hover:text-primary hover:bg-muted'
                }`}
            >
              {t('allProducts')}
            </button>
          )}
          
          {categories.map((category) => (
            <div
              key={category.id}
              className="relative flex-shrink-0"
              onMouseEnter={() => mode === 'navigation' && setActiveDropdown(category.id)}
              onMouseLeave={() => mode === 'navigation' && setActiveDropdown(null)}
            >
              {mode === 'navigation' ? (
                <button
                  onClick={(e) => handleNavigateToCategory(category.slug, e)}
                  className="flex items-center gap-1 px-4 py-2.5 text-xs font-normal transition-all whitespace-nowrap text-foreground hover:text-primary hover:bg-muted"
                >
                  {category.name}
                  {category.children && category.children.length > 0 && (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>
              ) : mode === 'scroll' ? (
                <button
                  onClick={() => {
                    console.log('🔴 CATEGORY CLICKED:', category.slug);
                    console.log('🔴 VendorSlug:', vendorSlug);
                    console.log('🔴 Pathname:', pathname);
                    console.log('🔴 Locale:', locale);
                    console.log('🔴 Window search:', window.location.search);
                    
                    // If no vendorSlug, we're on main marketplace
                    if (!vendorSlug) {
                      console.log('🔴 NO VENDOR SLUG BRANCH');
                      // Check if we're on the homepage (ignore query params for filters/search)
                      const isOnHomepage = pathname === `/${locale}` || pathname === '/';
                      console.log('🔴 isOnHomepage:', isOnHomepage);
                      console.log('🔴 pathname === `/${locale}`:', pathname === `/${locale}`);
                      console.log('🔴 pathname === \'/\':', pathname === '/');
                      
                      if (!isOnHomepage) {
                        console.log('🔴 NAVIGATING TO HOME WITH HASH:', `/${locale}#category-${category.slug}`);
                        // Navigate to homepage with hash (clears query params)
                        window.location.href = `/${locale}#category-${category.slug}`;
                      } else if (category.children && category.children.length > 0) {
                        console.log('🔴 TOGGLING DROPDOWN');
                        setActiveDropdown(activeDropdown === category.id ? null : category.id);
                      } else {
                        console.log('🔴 SCROLLING TO CATEGORY');
                        handleScrollToCategory(category.slug);
                      }
                      return;
                    }
                    
                    console.log('🔴 VENDOR SLUG BRANCH');
                    // Check if we're on vendor home page (ignore query params for filters/search)
                    const isOnVendorHome = pathname === `/vendor/${vendorSlug}`;
                    console.log('🔴 isOnVendorHome:', isOnVendorHome);
                    
                    if (!isOnVendorHome) {
                      console.log('🔴 NAVIGATING TO VENDOR HOME WITH HASH:', `/vendor/${vendorSlug}#category-${category.slug}`);
                      // Navigate to home page with hash (clears query params)
                      window.location.href = `/vendor/${vendorSlug}#category-${category.slug}`;
                    } else if (category.children && category.children.length > 0) {
                      console.log('🔴 TOGGLING VENDOR DROPDOWN');
                      setActiveDropdown(activeDropdown === category.id ? null : category.id);
                    } else {
                      console.log('🔴 SCROLLING TO VENDOR CATEGORY');
                      handleScrollToCategory(category.slug);
                    }
                  }}
                  className="flex items-center gap-1 px-4 py-2.5 text-xs font-normal transition-all whitespace-nowrap text-foreground hover:text-primary hover:bg-muted"
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
                      ? 'border-primary text-primary font-semibold bg-muted' 
                      : 'border-transparent text-foreground hover:text-primary hover:bg-muted'
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
                <div className="absolute top-full left-0 mt-0 bg-card shadow-xl rounded-b-lg min-w-[200px] z-[9999] border border-border py-2">
                  {mode === 'navigation' ? (
                    <>
                      <button
                        onClick={(e) => handleNavigateToCategory(category.slug, e)}
                        className="block w-full text-left px-4 py-2 text-sm font-semibold text-foreground hover:text-primary hover:bg-muted transition-colors border-b border-border"
                      >
                        {tCategory('all', { category: category.name })}
                      </button>
                      {category.children.map((subcat) => (
                        <button
                          key={subcat.id}
                          onClick={(e) => handleNavigateToCategory(subcat.slug, e)}
                          className="block w-full text-left px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                        >
                          {subcat.name}
                        </button>
                      ))}
                    </>
                  ) : mode === 'scroll' ? (
                    <>
                      <button
                        onClick={() => {
                          if (!vendorSlug) {
                            const isOnHomepage = pathname === `/${locale}` || pathname === '/';
                            if (!isOnHomepage) {
                              window.location.href = `/${locale}#category-${category.slug}`;
                            } else {
                              handleScrollToCategory(category.slug);
                            }
                            return;
                          }
                          const isOnVendorHome = pathname === `/vendor/${vendorSlug}`;
                          if (!isOnVendorHome) {
                            window.location.href = `/vendor/${vendorSlug}#category-${category.slug}`;
                          } else {
                            handleScrollToCategory(category.slug);
                          }
                        }}
                        className="block w-full text-left px-4 py-2 text-sm font-semibold text-foreground hover:text-primary hover:bg-muted transition-colors border-b border-border"
                      >
                        {tCategory('all', { category: category.name })}
                      </button>
                      {category.children.map((subcat) => (
                        <button
                          key={subcat.id}
                          onClick={() => {
                            if (!vendorSlug) {
                              const isOnHomepage = pathname === `/${locale}` || pathname === '/';
                              if (!isOnHomepage) {
                                window.location.href = `/${locale}#category-${subcat.slug}`;
                              } else {
                                handleScrollToCategory(subcat.slug);
                              }
                              return;
                            }
                            const isOnVendorHome = pathname === `/vendor/${vendorSlug}`;
                            if (!isOnVendorHome) {
                              window.location.href = `/vendor/${vendorSlug}#category-${subcat.slug}`;
                            } else {
                              handleScrollToCategory(subcat.slug);
                            }
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                        >
                          {subcat.name}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleCategoryClick(category.id)}
                        className="block w-full text-left px-4 py-2 text-sm font-semibold text-foreground hover:text-primary hover:bg-muted transition-colors border-b border-border"
                      >
                        {tCategory('all', { category: category.name })}
                      </button>
                      {category.children.map((subcat) => (
                        <button
                          key={subcat.id}
                          onClick={() => handleCategoryClick(subcat.id)}
                          className="block w-full text-left px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
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

          {/* Vendor Pages - Right Side */}
          {vendorPages.length > 0 && vendorSlug && (
            <>
              <div className="border-l border-border h-6 mx-2"></div>
              {vendorPages.map((page) => (
                <Link
                  key={page.id}
                  href={`/vendor/${vendorSlug}/${page.slug}`}
                  className="flex-shrink-0 px-4 py-2.5 text-xs font-normal transition-all whitespace-nowrap text-foreground hover:text-primary hover:bg-muted"
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
