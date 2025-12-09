'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react';
import ProductGrid from './ProductGrid';
import CategoryNav from './CategoryNav';
import { useLocale } from 'next-intl';

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  price: string | number;
  compareAtPrice?: string | number;
  featuredImage: string;
  images?: string[];
  averageRating: string | number;
  reviewCount: number;
  categories: Category[];
  productType?: 'physical' | 'booking';
  attributes?: {
    booking?: {
      durationUnit?: 'hours' | 'days' | 'sessions';
      duration?: number;
    };
  };
  vendor?: {
    id: string;
    name: string;
    businessName?: string;
    subdomain?: string;
    cityId?: string | null;
    subLocationId?: string | null;
    locationCity?: { id: string; name: string } | null;
    locationSubLocation?: { id: string; name: string } | null;
  };
}

interface HomepageContentProps {
  initialCategories: Category[];
  initialProductsByCategory: Record<string, Product[]>;
  initialUncategorizedProducts: Product[];
  categoryDisplayMode: 'top' | 'sidebar';
  currency: string;
  locationFilterEnabled: boolean;
}

export default function HomepageContent({
  initialCategories,
  initialProductsByCategory,
  initialUncategorizedProducts,
  categoryDisplayMode,
  currency,
  locationFilterEnabled
}: HomepageContentProps) {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const [categories] = useState<Category[]>(initialCategories);
  const [productsByCategory, setProductsByCategory] = useState<Record<string, Product[]>>(initialProductsByCategory);
  const [uncategorizedProducts, setUncategorizedProducts] = useState<Product[]>(initialUncategorizedProducts);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [cityId, setCityId] = useState<string | null>(null);
  const [subLocationId, setSubLocationId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Handle mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle location changes from URL params
  useEffect(() => {
    if (!mounted) return;
    
    const city = searchParams.get('cityId');
    const subLocation = searchParams.get('subLocationId');
    
    setCityId(city);
    setSubLocationId(subLocation);
  }, [searchParams, mounted]);

  // Refetch products when location changes
  useEffect(() => {
    if (!mounted) return;
    
    if (cityId || subLocationId) {
      refetchProducts();
    }
  }, [cityId, subLocationId, mounted]);

  const refetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (cityId) params.append('cityId', cityId);
      if (subLocationId) params.append('subLocationId', subLocationId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/homepage/data?${params.toString()}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setProductsByCategory(data.productsByCategory);
        setUncategorizedProducts(data.uncategorizedProducts);
      }
    } catch (error) {
      console.error('Error refetching products:', error);
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

  const scrollContainer = (containerId: string, direction: 'left' | 'right') => {
    const container = document.getElementById(containerId);
    if (container) {
      const scrollAmount = 300;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const isLocationFilterActive = locationFilterEnabled && (!!cityId || !!subLocationId);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.relative')) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Category Navigation Bar */}
      <CategoryNav mode="scroll" />

      {/* Main Content with Sidebar */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Left Sidebar - Categories Tree */}
          {categoryDisplayMode === 'sidebar' && (
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-4 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
                <h2 className="font-bold text-lg mb-4 sticky top-0 bg-white pb-2 z-10">All Categories</h2>
                <div className="space-y-1">
                  {categories.map((category) => (
                    <div key={category.id}>
                      <Link
                        href={`#category-${category.slug}`}
                        onClick={(e) => {
                          e.preventDefault();
                          scrollToElement(`category-${category.slug}`);
                        }}
                        className="flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded transition-colors"
                      >
                        <span>{category.name}</span>
                        {category.children && category.children.length > 0 && <ChevronRight className="w-4 h-4" />}
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          )}

          {/* Main Content Area */}
          <div className="flex-1 space-y-8">
            {/* Categories with Products */}
            {categories.map((category) => {
              const categoryProducts = productsByCategory[category.slug] || [];
              if (categoryProducts.length === 0) return null;

              return (
                <section
                  key={category.id}
                  id={`category-${category.slug}`}
                  className="bg-white rounded-lg shadow-sm p-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">{category.name}</h2>
                      {category.children && category.children.length > 0 && (
                        <p className="text-gray-600 text-sm">
                          {category.children.map(c => c.name).join(', ')}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/${locale}/category/${category.slug}`}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1"
                    >
                      View All
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <ProductGrid
                    products={categoryProducts}
                    currency={currency}
                    isLocationFilterActive={isLocationFilterActive}
                  />
                </section>
              );
            })}

            {/* Uncategorized Products Section */}
            {uncategorizedProducts.length > 0 && (
              <section id="more-products-section" className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">More Products</h2>
                    <p className="text-gray-600 text-sm">Discover other amazing products</p>
                  </div>
                </div>

                <ProductGrid
                  products={uncategorizedProducts}
                  currency={currency}
                  isLocationFilterActive={isLocationFilterActive}
                />
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
