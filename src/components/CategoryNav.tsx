'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
  productCount?: number;
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories();
  }, [vendorId]);

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

  const fetchCategories = async () => {
    try {
      let url: string;
      
      if (vendorId) {
        // For vendor pages, get vendor-specific categories
        url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/categories/vendor/${vendorId}`;
        
        // Add withProductCounts query parameter if hiding empty categories
        if (hideEmptyCategories) {
          url += '?withProductCounts=true';
        }
      } else {
        // For main pages, get global categories
        url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/categories/tree`;
        
        // Add withProductCounts query parameter if hiding empty categories
        if (hideEmptyCategories) {
          url += '?withProductCounts=true';
        }
      }
      
      console.log('Fetching categories from:', url);
      
      const response = await fetch(url);
      if (response.ok) {
        let data = await response.json();
        console.log('Categories received:', data);
        
        // If hideEmptyCategories is true, filter out categories without products
        if (hideEmptyCategories) {
          console.log('Filtering empty categories...');
          data = filterCategoriesWithProducts(data);
          console.log('Filtered categories:', data);
        }
        
        setCategories(data);
      } else {
        console.error('Failed to fetch categories:', response.status);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter out categories with no products (including checking children)
  const filterCategoriesWithProducts = (categories: Category[]): Category[] => {
    const hasProducts = (category: Category): boolean => {
      // Check if category itself has products
      if (category.productCount && category.productCount > 0) {
        return true;
      }

      // Check if any children have products
      if (category.children && category.children.length > 0) {
        return category.children.some(child => hasProducts(child));
      }

      return false;
    };

    const filterCategory = (category: Category): Category | null => {
      // Filter children first
      if (category.children && category.children.length > 0) {
        category.children = category.children
          .map(child => filterCategory(child))
          .filter((child): child is Category => child !== null);
      }

      // Include category if it has products or has children with products
      if (hasProducts(category)) {
        return category;
      }

      return null;
    };

    return categories
      .map(cat => filterCategory(cat))
      .filter((cat): cat is Category => cat !== null);
  };

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

  if (loading || categories.length === 0) return null;

  return (
    <div 
      className="border-b border-border sticky top-[61px] z-50 bg-secondary" 
      ref={dropdownRef}
    >
      <div className="container mx-auto">
        <div className="flex items-center gap-0 flex-wrap">
          {mode === 'filter' && (
            <button
              onClick={() => handleCategoryClick('')}
              className={`flex-shrink-0 px-4 py-2.5 text-xs font-normal transition-all whitespace-nowrap border-b-2 
                ${selectedCategory === '' 
                  ? 'border-primary text-primary font-semibold bg-muted' 
                  : 'border-transparent text-foreground hover:text-primary hover:bg-muted'
                }`}
            >
              All Products
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
                <Link
                  href={`/#category-${category.slug}`}
                  className="flex items-center gap-1 px-4 py-2.5 text-xs font-normal transition-all whitespace-nowrap text-foreground hover:text-primary hover:bg-muted"
                >
                  {category.name}
                  {category.children && category.children.length > 0 && (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </Link>
              ) : mode === 'scroll' ? (
                <button
                  onClick={() => {
                    if (category.children && category.children.length > 0) {
                      setActiveDropdown(activeDropdown === category.id ? null : category.id);
                    } else {
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
                      <Link
                        href={`/#category-${category.slug}`}
                        className="block px-4 py-2 text-sm font-semibold text-foreground hover:text-primary hover:bg-muted transition-colors border-b border-border"
                      >
                        All {category.name}
                      </Link>
                      {category.children.map((subcat) => (
                        <Link
                          key={subcat.id}
                          href={`/#category-${category.slug}`}
                          className="block px-4 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                        >
                          {subcat.name}
                        </Link>
                      ))}
                    </>
                  ) : mode === 'scroll' ? (
                    <>
                      <button
                        onClick={() => handleScrollToCategory(category.slug)}
                        className="block w-full text-left px-4 py-2 text-sm font-semibold text-foreground hover:text-primary hover:bg-muted transition-colors border-b border-border"
                      >
                        All {category.name}
                      </button>
                      {category.children.map((subcat) => (
                        <button
                          key={subcat.id}
                          onClick={() => handleScrollToCategory(subcat.slug)}
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
                        All {category.name}
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
        </div>
      </div>
    </div>
  );
}
