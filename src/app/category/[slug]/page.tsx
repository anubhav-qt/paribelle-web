'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Star, SlidersHorizontal, ChevronDown, Package, Calendar } from 'lucide-react';
import LocationFilter from '@/components/LocationFilter';
import { getCurrencySymbol } from '@/lib/currency';
import ThemeRenderer from '@/components/ThemeRenderer';
import CategoryNav from '@/components/CategoryNav';
import Footer from '@/components/Footer';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { useVendorContext } from '@/contexts/VendorContext';
import { Product, Category } from '@/types/product';

type SortOption = 'popularity' | 'price-low' | 'price-high' | 'rating' | 'newest';

export default function CategoryPage() {
  const params = useParams();
  const categorySlug = params.slug as string;
  const theme = useThemeClasses();
  const { isVendorStore } = useVendorContext();
  
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // Common filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [minRating, setMinRating] = useState<number>(0);
  const [sortBy, setSortBy] = useState<SortOption>('popularity');
  const [showDiscountOnly, setShowDiscountOnly] = useState(false);
  
  // Dynamic filter states from API
  const [dynamicFilters, setDynamicFilters] = useState<Record<string, any>>({});
  
  // Location filter states
  const [cityId, setCityId] = useState<string | null>(null);
  const [subLocationId, setSubLocationId] = useState<string | null>(null);
  const [locationFilterEnabled, setLocationFilterEnabled] = useState(true);
  const [currency, setCurrency] = useState('INR');

  useEffect(() => {
    // Fetch location filter setting
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/location_filter_enabled`)
      .then(res => res.json())
      .then(data => {
        setLocationFilterEnabled(data.value === true || data.value === 'true');
      })
      .catch(err => console.error('Error fetching location filter setting:', err));
    
    // Fetch currency setting
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/currency`)
      .then(res => res.json())
      .then(data => {
        setCurrency(data.value || 'INR');
      })
      .catch(err => console.error('Error fetching currency setting:', err));
    
    // Fetch all categories for CategoryNav
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories`)
      .then(res => res.json())
      .then(data => {
        setCategories(data);
      })
      .catch(err => console.error('Error fetching categories:', err));

    fetchCategoryAndProducts();
  }, [categorySlug]);

  useEffect(() => {
    // Initialize dynamic filter states when category changes
    if (category?.filterConfig) {
      const initialFilters: Record<string, any> = {};
      category.filterConfig.filters.forEach(filter => {
        if (filter.type === 'multiselect' || filter.type === 'checkbox') {
          initialFilters[filter.id] = [];
        } else if (filter.type === 'select') {
          initialFilters[filter.id] = '';
        } else if (filter.type === 'range') {
          initialFilters[filter.id] = [filter.min || 0, filter.max || 1000];
        }
      });
      setDynamicFilters(initialFilters);
    }
  }, [category]);

  useEffect(() => {
    applyFilters();
  }, [products, priceRange, minRating, sortBy, showDiscountOnly, dynamicFilters]);

  useEffect(() => {
    // Refetch products when location filter changes
    if (category) {
      fetchProducts(category.id);
    }
  }, [cityId, subLocationId]);

  const fetchProducts = async (categoryId: string) => {
    try {
      const params = new URLSearchParams({ categoryId });
      if (cityId) params.append('cityId', cityId);
      if (subLocationId) params.append('subLocationId', subLocationId);
      
      const productsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?${params.toString()}`
      );
      if (productsResponse.ok) {
        const data = await productsResponse.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchCategoryAndProducts = async () => {
    try {
      setLoading(true);
      
      // Fetch category with tree structure and filter config
      const categoryResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/slug/${categorySlug}/tree`);
      if (categoryResponse.ok) {
        const categoryData = await categoryResponse.json();
        setCategory(categoryData);
        setSubcategories(categoryData.children || []);
        
        if (categoryData) {
          await fetchProducts(categoryData.id);
        }
      }
    } catch (error) {
      console.error('Error fetching category and products:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Price filter
    filtered = filtered.filter(product => {
      const price = Number(product.price);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Rating filter
    if (minRating > 0) {
      filtered = filtered.filter(product => Number(product.averageRating) >= minRating);
    }

    // Discount filter
    if (showDiscountOnly) {
      filtered = filtered.filter(product => 
        product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price)
      );
    }

    // Dynamic category-specific filters
    // Note: In a real implementation, product data would include these attributes
    // For now, this demonstrates the filtering logic structure
    Object.entries(dynamicFilters).forEach(([key, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        // Multiselect/checkbox filtering (simulated)
        // In real implementation: filtered = filtered.filter(product => value.includes(product[key]))
      } else if (value && typeof value === 'string') {
        // Select filtering (simulated)
        // In real implementation: filtered = filtered.filter(product => product[key] === value)
      }
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return Number(a.price) - Number(b.price);
        case 'price-high':
          return Number(b.price) - Number(a.price);
        case 'rating':
          return Number(b.averageRating) - Number(a.averageRating);
        case 'newest':
          return 0; // Would need createdAt field
        case 'popularity':
        default:
          return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
      }
    });

    setFilteredProducts(filtered);
  };

  const getDiscount = (price: string | number, compareAtPrice?: string | number) => {
    if (!compareAtPrice || Number(compareAtPrice) <= Number(price)) return null;
    return Math.round(((Number(compareAtPrice) - Number(price)) / Number(compareAtPrice)) * 100);
  };

  const resetFilters = () => {
    setPriceRange([0, 1000]);
    setMinRating(0);
    setSortBy('popularity');
    setShowDiscountOnly(false);
    // Reset dynamic filters
    if (category?.filterConfig) {
      const resetDynamic: Record<string, any> = {};
      category.filterConfig.filters.forEach(filter => {
        if (filter.type === 'multiselect' || filter.type === 'checkbox') {
          resetDynamic[filter.id] = [];
        } else if (filter.type === 'select') {
          resetDynamic[filter.id] = '';
        } else if (filter.type === 'range') {
          resetDynamic[filter.id] = [filter.min || 0, filter.max || 1000];
        }
      });
      setDynamicFilters(resetDynamic);
    }
  };

  const handleDynamicFilterChange = (key: string, value: any, type: string) => {
    setDynamicFilters(prev => {
      if (type === 'multiselect' || type === 'checkbox') {
        const currentValues = prev[key] || [];
        const newValues = currentValues.includes(value)
          ? currentValues.filter((v: any) => v !== value)
          : [...currentValues, value];
        return { ...prev, [key]: newValues };
      } else {
        return { ...prev, [key]: value };
      }
    });
  };

  if (loading) {
    return (
      <div className={theme.combine('min-h-screen flex items-center justify-center', theme.bg)}>
        <div className={theme.combine('animate-spin rounded-full h-12 w-12 border-b-2', isVendorStore ? 'border-[var(--vendor-primary)]' : 'border-blue-600')}></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className={theme.combine('min-h-screen flex items-center justify-center', theme.bg)}>
        <div className="text-center">
          <Package className={theme.combine('w-16 h-16 mx-auto mb-4', theme.textMuted)} />
          <h1 className={theme.combine('text-2xl font-bold mb-2', theme.text)}>Category Not Found</h1>
          <Link href="/" className={theme.combine('hover:underline', isVendorStore ? 'vendor-themed-link' : 'text-blue-600')}>
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={theme.combine('min-h-screen', theme.bg)}>
      <ThemeRenderer 
        component="header"
        showLocationFilter={locationFilterEnabled}
        showBookingsLink={true}
      />
      <CategoryNav />

      {/* Breadcrumb */}
      <div className={theme.combine(theme.cardBg, 'border-b', isVendorStore ? 'vendor-border-primary' : 'border-border')}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Link href="/" className={theme.combine(theme.textMuted, isVendorStore ? 'hover:vendor-primary' : 'hover:text-blue-600')}>
                Home
              </Link>
              <span className={theme.textMuted}>/</span>
              {category.parent && (
                <>
                  <Link 
                    href={`/category/${category.parent.slug}`} 
                    className={theme.combine(theme.textMuted, isVendorStore ? 'hover:vendor-primary' : 'hover:text-blue-600')}
                  >
                    {category.parent.name}
                  </Link>
                  <span className={theme.textMuted}>/</span>
                </>
              )}
              <span className={theme.combine('font-medium', theme.text)}>{category.name}</span>
            </div>
            <span className={theme.combine('text-sm', theme.textMuted)}>
              ({filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'})
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar - Categories Tree & Filters */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            {/* Subcategories Tree Panel */}
            {subcategories.length > 0 && (
              <div className={theme.combine(theme.cardBg, 'rounded-lg shadow-sm p-4 mb-4 sticky top-20')}>
                <h2 className={theme.combine('font-bold text-lg mb-4', theme.text)}>Categories</h2>
                <div className="space-y-1">
                  <Link
                    href={`/category/${category.slug}`}
                    className={theme.combine('block px-3 py-2 text-sm font-semibold rounded transition-colors', 
                      isVendorStore ? 'vendor-primary vendor-secondary-bg hover:opacity-80' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                    )}
                  >
                    All {category.name}
                  </Link>
                  {subcategories.map((subcat) => (
                    <Link
                      key={subcat.id}
                      href={`/category/${subcat.slug}`}
                      className={theme.combine('block px-3 py-2 text-sm rounded transition-colors',
                        theme.text,
                        isVendorStore ? 'hover:vendor-primary hover:vendor-secondary-bg' : 'hover:text-blue-600 hover:bg-gray-50'
                      )}
                    >
                      {subcat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Filters Panel */}
            <div className={theme.combine(theme.cardBg, 'rounded-lg shadow-sm p-4 sticky top-20')}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={theme.combine('font-bold text-lg', theme.text)}>Filters</h2>
                <button
                  onClick={resetFilters}
                  className={theme.combine('text-xs hover:underline', isVendorStore ? 'vendor-themed-link' : 'text-blue-600')}
                >
                  Clear All
                </button>
              </div>

              <div className="space-y-6">
                {/* Price Range */}
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-3 text-sm">PRICE</h3>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="1000"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Ratings */}
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-3 text-sm">CUSTOMER RATINGS</h3>
                  <div className="space-y-2">
                    {[4, 3, 2, 1, 0].map((rating) => (
                      <label key={rating} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <input
                          type="radio"
                          name="rating"
                          checked={minRating === rating}
                          onChange={() => setMinRating(rating)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-1">
                          {rating > 0 ? (
                            <>
                              <span className="text-sm font-medium">{rating}</span>
                              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                              <span className="text-sm text-gray-600">& Up</span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-600">All Ratings</span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Discount */}
                <div className="border-b pb-4">
                  <h3 className="font-semibold mb-3 text-sm">DISCOUNT</h3>
                  <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                    <input
                      type="checkbox"
                      checked={showDiscountOnly}
                      onChange={(e) => setShowDiscountOnly(e.target.checked)}
                      className="text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm">Show only discounted</span>
                  </label>
                </div>

                {/* Dynamic Category-Specific Filters */}
                {category?.filterConfig && category.filterConfig.filters.map((filter) => (
                  <div key={filter.id} className="border-b pb-4 last:border-b-0">
                    <h3 className="font-semibold mb-3 text-sm uppercase">{filter.label}</h3>
                    
                    {/* Select Filter */}
                    {filter.type === 'select' && (
                      <select
                        value={dynamicFilters[filter.id] || ''}
                        onChange={(e) => handleDynamicFilterChange(filter.id, e.target.value, filter.type)}
                        className="w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All</option>
                        {filter.options?.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Multiselect/Checkbox Filter */}
                    {(filter.type === 'multiselect' || filter.type === 'checkbox') && (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {filter.options?.slice(0, 10).map(option => (
                          <label key={option.value} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={(dynamicFilters[filter.id] || []).includes(option.value)}
                              onChange={() => handleDynamicFilterChange(filter.id, option.value, filter.type)}
                              className="text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm">{option.label}</span>
                          </label>
                        ))}
                        {filter.options && filter.options.length > 10 && (
                          <button className="text-xs text-blue-600 hover:underline mt-2">
                            +{filter.options.length - 10} more
                          </button>
                        )}
                      </div>
                    )}

                    {/* Range Filter */}
                    {filter.type === 'range' && (
                      <div className="space-y-2">
                        <input
                          type="range"
                          min={filter.min || 0}
                          max={filter.max || 100}
                          step={filter.step || 1}
                          value={dynamicFilters[filter.id] || filter.min || 0}
                          onChange={(e) => handleDynamicFilterChange(filter.id, Number(e.target.value), filter.type)}
                          className="w-full accent-blue-600"
                        />
                        <div className="flex items-center justify-between text-xs text-gray-600">
                          <span>₹{filter.min?.toLocaleString()}</span>
                          <span className="font-semibold text-sm text-gray-900">
                            ₹{(dynamicFilters[filter.id] || filter.min || 0).toLocaleString()}
                          </span>
                          <span>₹{filter.max?.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Right Content - Products */}
          <div className="flex-1">
            {/* Sort Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                {/* Mobile Filter Toggle and Sort */}
                <div className="flex items-center gap-4 ml-auto">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filters
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 hidden sm:inline whitespace-nowrap">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="popularity">Popularity</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="rating">Customer Rating</option>
                      <option value="newest">Newest First</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Mobile Filter Panel */}
              {showFilters && (
                <div className="lg:hidden mt-4 pt-4 border-t max-h-96 overflow-y-auto">
                  <div className="space-y-4">
                    {/* Mobile Categories */}
                    {subcategories.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2">Categories</h3>
                        <div className="space-y-1">
                          <Link
                            href={`/category/${category.slug}`}
                            className="block px-3 py-2 text-sm font-semibold text-blue-600 bg-blue-50 rounded"
                          >
                            All {category.name}
                          </Link>
                          {subcategories.map((subcat) => (
                            <Link
                              key={subcat.id}
                              href={`/category/${subcat.slug}`}
                              className="block px-3 py-2 text-sm text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded"
                            >
                              {subcat.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* Mobile filters - same as sidebar */}
                    <div>
                      <h3 className="font-semibold mb-2">Price Range</h3>
                      <input
                        type="range"
                        min="0"
                        max="1000"
                        value={priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                        className="w-full accent-blue-600"
                      />
                      <div className="flex justify-between text-sm mt-1">
                        <span>${priceRange[0]}</span>
                        <span>${priceRange[1]}</span>
                      </div>
                    </div>
                    {/* Add more mobile filters as needed */}
                  </div>
                </div>
              )}
            </div>

            {/* Products Grid */}
            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters</p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <>
                {(() => {
                  const productsWithLocation = filteredProducts.filter(p => p.vendor?.cityId || p.vendor?.subLocationId);
                  const productsWithoutLocation = filteredProducts.filter(p => !p.vendor?.cityId && !p.vendor?.subLocationId);
                  const isLocationFilterActive = cityId || subLocationId;

                  return (
                    <>
                      {/* Products with Location */}
                      {productsWithLocation.length > 0 && (
                        <div className={productsWithoutLocation.length > 0 && isLocationFilterActive ? "mb-8" : ""}>
                          {isLocationFilterActive && (
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                              Available in Selected Location ({productsWithLocation.length})
                            </h3>
                          )}
                          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {productsWithLocation.map((product) => {
                              const discount = getDiscount(product.price, product.compareAtPrice);
                              const isTour = product.productType === 'booking' && product.attributes?.tour?.tourMode;
                              return (
                                <Link
                                  key={product.id}
                                  href={isTour ? `/tours/${product.slug}` : `/products/${product.slug}`}
                                  className="group bg-white rounded-lg overflow-hidden hover:shadow-xl transition-all border border-gray-100"
                                >
                                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                                    <img
                                      src={product.images?.[0] || product.featuredImage || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23ddd" width="400" height="400"/%3E%3Ctext fill="%23999" font-size="20" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E'}
                                      alt={product.name}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                    {discount && (
                                      <span className="absolute top-2 left-2 bg-accent text-primary-foreground px-2 py-1 rounded-md text-xs font-bold">
                                        {discount}% OFF
                                      </span>
                                    )}
                                    {product.productType === 'booking' && (
                                      <span className="absolute top-2 right-2 bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Booking
                                      </span>
                                    )}
                                  </div>
                                  <div className="p-4">
                                    <h3 className="font-medium mb-1 line-clamp-2 text-sm group-hover:text-blue-600 transition-colors min-h-[40px]">
                                      {product.name}
                                    </h3>
                                    <div className="flex items-center gap-1 mb-2">
                                      <div className="flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded text-xs">
                                        <span className="font-semibold">
                                          {Number(product.averageRating).toFixed(1)}
                                        </span>
                                        <Star className="w-3 h-3 fill-white" />
                                      </div>
                                      <span className="text-xs text-gray-500">
                                        ({product.reviewCount})
                                      </span>
                                    </div>
                                    <div className="flex items-baseline gap-2 mb-1">
                                      <span className="text-xl font-bold text-gray-900">
                                        {getCurrencySymbol(currency)}{Number(product.price).toFixed(2)}
                                        {product.productType === 'booking' && product.attributes?.booking?.durationUnit && (
                                          <span className="text-sm font-normal text-gray-600">
                                            /{product.attributes.booking.durationUnit === 'hours' ? 'hr' : product.attributes.booking.durationUnit === 'days' ? 'day' : 'session'}
                                          </span>
                                        )}
                                      </span>
                                      {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                                        <span className="text-xs text-gray-400 line-through">
                                          {getCurrencySymbol(currency)}{Number(product.compareAtPrice).toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                    {isLocationFilterActive && product.vendor?.locationCity && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        📍 {product.vendor.locationCity.name}
                                        {product.vendor.locationSubLocation && ` - ${product.vendor.locationSubLocation.name}`}
                                      </div>
                                    )}
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Products without Location */}
                      {productsWithoutLocation.length > 0 && (
                        <div>
                          {isLocationFilterActive && (
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                              Other Locations ({productsWithoutLocation.length})
                            </h3>
                          )}
                          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {productsWithoutLocation.map((product) => {
                              const discount = getDiscount(product.price, product.compareAtPrice);
                              const isTour = product.productType === 'booking' && product.attributes?.tour?.tourMode;
                              return (
                                <Link
                                  key={product.id}
                                  href={isTour ? `/tours/${product.slug}` : `/products/${product.slug}`}
                                  className="group bg-white rounded-lg overflow-hidden hover:shadow-xl transition-all border border-gray-100"
                                >
                                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                                    <img
                                      src={product.images?.[0] || product.featuredImage || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23ddd" width="400" height="400"/%3E%3Ctext fill="%23999" font-size="20" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E'}
                                      alt={product.name}
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />
                                    {discount && (
                                      <span className="absolute top-2 left-2 bg-accent text-primary-foreground px-2 py-1 rounded-md text-xs font-bold">
                                        {discount}% OFF
                                      </span>
                                    )}
                                    {product.productType === 'booking' ? (
                                      <span className="absolute top-2 right-2 bg-secondary text-secondary-foreground px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        Booking
                                      </span>
                                    ) : (
                                      <span className="absolute top-2 right-2 bg-muted text-muted-foreground px-2 py-1 rounded-md text-xs font-semibold">
                                        Unknown Location
                                      </span>
                                    )}
                                  </div>
                                  <div className="p-4">
                                    <h3 className="font-medium mb-1 line-clamp-2 text-sm group-hover:text-primary transition-colors min-h-[40px]">
                                      {product.name}
                                    </h3>
                                    <div className="flex items-center gap-1 mb-2">
                                      <div className="flex items-center gap-1 bg-accent text-primary-foreground px-2 py-0.5 rounded text-xs">
                                        <span className="font-semibold">
                                          {Number(product.averageRating).toFixed(1)}
                                        </span>
                                        <Star className="w-3 h-3 fill-current" />
                                      </div>
                                      <span className="text-xs text-gray-500">
                                        ({product.reviewCount})
                                      </span>
                                    </div>
                                    <div className="flex items-baseline gap-2 mb-1">
                                      <span className="text-xl font-bold text-gray-900">
                                        {getCurrencySymbol(currency)}{Number(product.price).toFixed(2)}
                                        {product.productType === 'booking' && product.attributes?.booking?.durationUnit && (
                                          <span className="text-sm font-normal text-gray-600">
                                            /{product.attributes.booking.durationUnit === 'hours' ? 'hr' : product.attributes.booking.durationUnit === 'days' ? 'day' : 'session'}
                                          </span>
                                        )}
                                      </span>
                                      {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                                        <span className="text-xs text-gray-400 line-through">
                                          {getCurrencySymbol(currency)}{Number(product.compareAtPrice).toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
