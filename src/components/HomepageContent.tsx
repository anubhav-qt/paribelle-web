'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ChevronLeft, ChevronDown } from 'lucide-react';
import ProductGrid from './ProductGrid';
import CategoryNav from './CategoryNav';
import CategorySidebar from './CategorySidebar';
import StoreNav from './StoreNav';
import ThemeRenderer from './ThemeRenderer';
import { useVendorContext } from '@/contexts/VendorContext';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { useStockWebSocket } from '@/contexts/StockWebSocketContext';

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
  stockQuantity?: number;
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
  const { vendor, isVendorStore } = useVendorContext();
  const theme = useThemeClasses();
  const { subscribeToBulkStockUpdates, subscribeToRatingUpdates, subscribeToPriceUpdates, isConnected } = useStockWebSocket();
  const [categories] = useState<Category[]>(initialCategories);
  const [productsByCategory, setProductsByCategory] = useState<Record<string, Product[]>>(initialProductsByCategory);
  const [uncategorizedProducts, setUncategorizedProducts] = useState<Product[]>(initialUncategorizedProducts);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [cityId, setCityId] = useState<string | null>(null);
  const [subLocationId, setSubLocationId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Handle mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Listen for real-time stock updates via WebSocket
  useEffect(() => {
    if (!mounted) return;

    const unsubscribe = subscribeToBulkStockUpdates((data) => {
      console.log('Received bulk stock update:', data);
      
      // Update stock quantities in productsByCategory
      setProductsByCategory((prev) => {
        const updated = { ...prev };
        data.updates.forEach(({ productId, stockQuantity }) => {
          Object.keys(updated).forEach((categorySlug) => {
            updated[categorySlug] = updated[categorySlug].map((product) =>
              product.id === productId
                ? { ...product, stockQuantity }
                : product
            );
          });
        });
        return updated;
      });

      // Update stock quantities in uncategorizedProducts
      setUncategorizedProducts((prev) =>
        prev.map((product) => {
          const update = data.updates.find((u) => u.productId === product.id);
          return update ? { ...product, stockQuantity: update.stockQuantity } : product;
        })
      );
    });

    return unsubscribe;
  }, [mounted, subscribeToBulkStockUpdates]);

  // Listen for real-time price updates
  useEffect(() => {
    if (!mounted) return;

    const unsubscribe = subscribeToPriceUpdates((data) => {
      console.log('Received price update:', data);
      
      setProductsByCategory((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((categorySlug) => {
          updated[categorySlug] = updated[categorySlug].map((product) =>
            product.id === data.productId
              ? { ...product, price: data.price, compareAtPrice: data.compareAtPrice }
              : product
          );
        });
        return updated;
      });

      setUncategorizedProducts((prev) =>
        prev.map((product) =>
          product.id === data.productId
            ? { ...product, price: data.price, compareAtPrice: data.compareAtPrice }
            : product
        )
      );
    });

    return unsubscribe;
  }, [mounted, subscribeToPriceUpdates]);

  // Listen for real-time rating updates
  useEffect(() => {
    if (!mounted) return;

    const unsubscribe = subscribeToRatingUpdates((data) => {
      console.log('Received rating update:', data);
      
      setProductsByCategory((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((categorySlug) => {
          updated[categorySlug] = updated[categorySlug].map((product) =>
            product.id === data.productId
              ? { ...product, averageRating: data.averageRating, reviewCount: data.reviewCount }
              : product
          );
        });
        return updated;
      });

      setUncategorizedProducts((prev) =>
        prev.map((product) =>
          product.id === data.productId
            ? { ...product, averageRating: data.averageRating, reviewCount: data.reviewCount }
            : product
        )
      );
    });

    return unsubscribe;
  }, [mounted, subscribeToRatingUpdates]);

  // Filter initial data by vendor if on vendor store
  useEffect(() => {
    if (isVendorStore && vendor) {
      console.log('Filtering initial data for vendor:', vendor.businessName);
      
      const filteredByCategory: Record<string, Product[]> = {};
      Object.entries(initialProductsByCategory).forEach(([slug, products]) => {
        const filtered = products.filter((p: Product) => p.vendor?.id === vendor.id);
        if (filtered.length > 0) {
          filteredByCategory[slug] = filtered;
        }
      });
      
      const filteredUncategorized = initialUncategorizedProducts.filter(
        (p: Product) => p.vendor?.id === vendor.id
      );
      
      setProductsByCategory(filteredByCategory);
      setUncategorizedProducts(filteredUncategorized);
    }
  }, [vendor, isVendorStore]);

  // Handle location and search changes from URL params
  useEffect(() => {
    if (!mounted) return;
    
    const city = searchParams.get('cityId');
    const subLocation = searchParams.get('subLocationId');
    const search = searchParams.get('search');
    
    // Only refetch if params actually changed
    if (city === cityId && subLocation === subLocationId && search === searchQuery) {
      console.log('Params unchanged, skipping refetch');
      return;
    }
    
    setCityId(city);
    setSubLocationId(subLocation);
    setSearchQuery(search);
    
    // Trigger refetch whenever params change
    refetchProducts(city, subLocation, search);
  }, [searchParams, mounted]);

  const refetchProducts = async (city?: string | null, subLocation?: string | null, search?: string | null) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      const finalCity = city !== undefined ? city : cityId;
      const finalSubLocation = subLocation !== undefined ? subLocation : subLocationId;
      const finalSearch = search !== undefined ? search : searchQuery;
      
      // If on vendor store, add vendor filter
      if (isVendorStore && vendor) {
        params.append('vendorId', vendor.id);
      }
      
      // Always fetch all products, then filter client-side
      console.log('Fetching homepage data for filtering - city:', finalCity, 'subLocation:', finalSubLocation, 'search:', finalSearch, 'vendor:', vendor?.businessName);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/homepage/data?${params.toString()}`
      );
      
      if (response.ok) {
        const data = await response.json();
        let productsToFilter = data.productsByCategory as Record<string, Product[]>;
        let uncategorizedToFilter = data.uncategorizedProducts as Product[];
        
        // Filter by vendor if on vendor store
        if (isVendorStore && vendor) {
          const filteredByCategory: Record<string, Product[]> = {};
          
          Object.entries(productsToFilter).forEach(([slug, products]) => {
            const filtered = products.filter((p: Product) => p.vendor?.id === vendor.id);
            if (filtered.length > 0) {
              filteredByCategory[slug] = filtered;
            }
          });
          
          productsToFilter = filteredByCategory;
          uncategorizedToFilter = uncategorizedToFilter.filter((p: Product) => p.vendor?.id === vendor.id);
        }
        
        // Filter by location if city or sublocation is selected
        if (finalCity || finalSubLocation) {
          const filteredByCategory: Record<string, Product[]> = {};
          
          Object.entries(productsToFilter).forEach(([slug, products]) => {
            const filtered = products.filter((p: Product) => {
              // Check if product vendor matches location criteria
              if (finalSubLocation && p.vendor?.subLocationId) {
                return p.vendor.subLocationId === finalSubLocation;
              }
              if (finalCity && p.vendor?.cityId) {
                return p.vendor.cityId === finalCity;
              }
              return false;
            });
            if (filtered.length > 0) {
              filteredByCategory[slug] = filtered;
            }
          });
          
          uncategorizedToFilter = uncategorizedToFilter.filter((p: Product) => {
            if (finalSubLocation && p.vendor?.subLocationId) {
              return p.vendor.subLocationId === finalSubLocation;
            }
            if (finalCity && p.vendor?.cityId) {
              return p.vendor.cityId === finalCity;
            }
            return false;
          });
          
          productsToFilter = filteredByCategory;
          
          console.log('Location filter results:', {
            categories: Object.keys(filteredByCategory).length,
            uncategorized: uncategorizedToFilter.length
          });
        }
        
        // If searching, filter further by search term
        if (finalSearch) {
          const searchLower = finalSearch.toLowerCase();
          const filteredByCategory: Record<string, Product[]> = {};
          
          // Filter products in each category
          Object.entries(productsToFilter).forEach(([slug, products]) => {
            const filtered = products.filter((p: Product) => 
              p.name.toLowerCase().includes(searchLower) ||
              p.shortDescription?.toLowerCase().includes(searchLower)
            );
            if (filtered.length > 0) {
              filteredByCategory[slug] = filtered;
            }
          });
          
          // Filter uncategorized products
          uncategorizedToFilter = uncategorizedToFilter.filter((p: Product) =>
            p.name.toLowerCase().includes(searchLower) ||
            p.shortDescription?.toLowerCase().includes(searchLower)
          );
          
          console.log('Search results:', {
            categories: Object.keys(filteredByCategory).length,
            uncategorized: uncategorizedToFilter.length
          });
          
          setProductsByCategory(filteredByCategory);
          setUncategorizedProducts(uncategorizedToFilter);
        } else {
          setProductsByCategory(productsToFilter);
          setUncategorizedProducts(uncategorizedToFilter);
        }
      }
    } catch (error) {
      console.error('Error refetching products:', error);
    } finally {
      setLoading(false);
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
    <div>
      {/* Category Navigation Bar */}
      <ThemeRenderer component="nav" fallback={<CategoryNav mode="scroll" />} />

      {/* Main Content with Sidebar */}
      <div className="container mx-auto px-4 pb-8">
        {/* Search Results Header */}
        {searchQuery && (
          <div className="mb-6">
            <h2 className={theme.combine('text-2xl font-bold', theme.text)}>
              Search Results for "{searchQuery}"
            </h2>
            <p className={theme.combine('mt-1', theme.textMuted)}>
              {loading ? 'Searching...' : 'Showing all matching products'}
            </p>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center py-12">
            <div className={theme.combine('inline-block animate-spin rounded-full h-12 w-12 border-b-2', isVendorStore ? 'border-[var(--vendor-primary)]' : 'border-blue-600')}></div>
            <p className={theme.combine('mt-4', theme.textMuted)}>Loading products...</p>
          </div>
        )}

        {!loading && (
          <div className="flex gap-6">
            {/* Left Sidebar - Categories */}
            <CategorySidebar />

            {/* Main Content Area */}
            <div className="flex-1 space-y-8">
            {/* Bookings & Services Section - Always show if there are booking products */}
            {(() => {
              const bookingProducts = productsByCategory['bookings-services'] || [];
              
              if (bookingProducts.length === 0) return null;
              
              return (
                <section
                  id="category-bookings-services"
                  className={theme.combine(theme.cardBg, 'rounded-lg shadow-sm p-6')}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className={theme.combine('text-2xl font-bold', isVendorStore ? 'vendor-themed-heading' : 'text-gray-900')}>Bookings & Services</h2>
                      <p className={theme.combine('text-sm', theme.textMuted)}>Book appointments and services</p>
                    </div>
                    <Link
                      href="/?productType=booking"
                      className={theme.combine('hover:opacity-80 font-medium text-sm flex items-center gap-1', isVendorStore ? 'vendor-themed-link' : 'text-primary')}
                    >
                      View All
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <ProductGrid
                    products={bookingProducts}
                    currency={currency}
                    isLocationFilterActive={isLocationFilterActive}
                  />
                </section>
              );
            })()}

            {/* Categories with Products */}
            {categories.map((category) => {
              const categoryProducts = productsByCategory[category.slug] || [];
              
              if (categoryProducts.length === 0) return null;

              return (
                <section
                  key={category.id}
                  id={`category-${category.slug}`}
                  className={theme.combine(theme.cardBg, 'rounded-lg shadow-sm p-6')}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className={theme.combine('text-2xl font-bold', isVendorStore ? 'vendor-themed-heading' : 'text-gray-900')}>{category.name}</h2>
                      {category.children && category.children.length > 0 && (
                        <p className={theme.combine('text-sm', theme.textMuted)}>
                          {category.children.map(c => c.name).join(', ')}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/category/${category.slug}`}
                      className={theme.combine('hover:opacity-80 font-medium text-sm flex items-center gap-1', isVendorStore ? 'vendor-themed-link' : 'text-primary')}
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
            {(() => {
              if (uncategorizedProducts.length === 0) return null;
              
              return (
                <section id="more-products-section" className={theme.combine(theme.cardBg, 'rounded-lg shadow-sm p-6')}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className={theme.combine('text-2xl font-bold', isVendorStore ? 'vendor-themed-heading' : 'text-gray-900')}>More Products</h2>
                      <p className={theme.combine('text-sm', theme.textMuted)}>Discover other amazing products</p>
                    </div>
                  </div>

                  <ProductGrid
                    products={uncategorizedProducts}
                    currency={currency}
                    isLocationFilterActive={isLocationFilterActive}
                  />
                </section>
              );
            })()}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
