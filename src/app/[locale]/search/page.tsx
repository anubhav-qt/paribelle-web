'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, Package, Calendar, ChevronDown } from 'lucide-react';
import { getCurrencySymbol } from '@/lib/currency';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  price: string | number;
  compareAtPrice?: string | number;
  featuredImage: string;
  averageRating: string | number;
  reviewCount: number;
  productType?: 'physical' | 'booking';
  attributes?: {
    booking?: {
      durationUnit?: 'hours' | 'days' | 'sessions';
      duration?: number;
    };
  };
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [flatCategories, setFlatCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currency, setCurrency] = useState('INR');
  const [categoryDisplayMode, setCategoryDisplayMode] = useState<'top' | 'sidebar'>('sidebar');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [productType, setProductType] = useState<string>('');
  const [marketplaceLogo, setMarketplaceLogo] = useState<string>('');
  const [marketplaceName, setMarketplaceName] = useState<string>('Marketplace');
  const limit = 50;

  useEffect(() => {
    // Fetch marketplace branding
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/settings/marketplace_logo`)
      .then(res => res.json())
      .then(data => setMarketplaceLogo(data.value || ''))
      .catch(err => console.error('Error fetching marketplace logo:', err));
    
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/settings/marketplace_name`)
      .then(res => res.json())
      .then(data => setMarketplaceName(data.value || 'Marketplace'))
      .catch(err => console.error('Error fetching marketplace name:', err));
    
    // Fetch currency setting
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/currency`)
      .then(res => res.json())
      .then(data => {
        setCurrency(data.value || 'INR');
      })
      .catch(err => console.error('Error fetching currency setting:', err));
    
    // Fetch category display mode setting
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/category_display_mode`)
      .then(res => res.json())
      .then(data => {
        setCategoryDisplayMode(data.value === 'top' ? 'top' : 'sidebar');
      })
      .catch(err => console.error('Error fetching category display mode:', err));
    
    const query = searchParams.get('q');
    const type = searchParams.get('type');
    
    // Default to physical products if no type specified
    const filterType = type || 'physical';
    setProductType(filterType);
    
    if (query) {
      setSearchQuery(query);
      searchProducts(query, undefined, 1, false, filterType);
    } else {
      // Load all products when no search query
      searchProducts('', undefined, 1, false, filterType);
    }
    fetchCategories();
  }, [searchParams]);

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      // Check if user scrolled near bottom (within 500px)
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 500) {
        if (!loading && !loadingMore && hasMore) {
          loadMoreProducts();
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, loadingMore, hasMore, page, searchQuery, selectedCategory, productType]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/tree/all`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
        setFlatCategories(flattenCategories(data));
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const flattenCategories = (categories: any[], level = 0): any[] => {
    let result: any[] = [];
    categories.forEach((category) => {
      result.push({ ...category, level });
      if (category.children && category.children.length > 0) {
        result = result.concat(flattenCategories(category.children, level + 1));
      }
    });
    return result;
  };

  const searchProducts = async (query: string, categoryId?: string, pageNum: number = 1, append: boolean = false, type?: string) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setProducts([]);
      setPage(1);
      setHasMore(true);
    }
    try {
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products`;
      const params = new URLSearchParams();
      
      if (query) {
        params.append('search', query);
      }
      if (categoryId) {
        params.append('categoryId', categoryId);
      }
      if (type) {
        params.append('productType', type);
      }
      params.append('limit', limit.toString());
      params.append('page', pageNum.toString());
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        const newProducts = Array.isArray(data) ? data : data.products || [];
        const total = data.total || data.count || newProducts.length;
        
        if (append) {
          setProducts(prev => [...prev, ...newProducts]);
        } else {
          setProducts(newProducts);
        }
        
        // Set total count
        setTotalCount(total);
        
        // Check if there are more products
        setHasMore(newProducts.length === limit);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreProducts = () => {
    searchProducts(searchQuery, selectedCategory, page + 1, true, productType || undefined);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      searchProducts(searchQuery.trim(), selectedCategory);
    }
  };

  const handleCategoryFilter = (categoryId: string) => {
    setSelectedCategory(categoryId);
    searchProducts(searchQuery, categoryId, 1, false, productType || undefined);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        showLocationFilter={false}
        showBookingsLink={productType !== 'booking'}
        onSearch={(query) => {
          setSearchQuery(query);
          searchProducts(query, selectedCategory, 1, false, productType);
        }}
        searchPlaceholder="Search for products, brands and more"
        initialSearchQuery={searchQuery}
      />

      {/* Categories Toolbar - Flipkart Style */}
      {categoryDisplayMode === 'top' && (
        <div className="border-t bg-[#232f3e] border-[#3a4553] shadow-sm mb-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-0 overflow-visible">
              {/* All Categories - First Item */}
              <button
                onClick={() => handleCategoryFilter('')}
                className={`flex items-center gap-1 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                  selectedCategory === ''
                    ? 'text-white border-[#f90] bg-[#37475a] font-semibold'
                    : 'text-white border-transparent hover:text-[#f90] hover:bg-[#37475a]'
                }`}
              >
                All Categories
              </button>
            
              {/* Quick Category Links with Click Dropdowns */}
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="relative"
                >
                  <button
                    onClick={() => {
                      if (category.children && category.children.length > 0) {
                        setActiveDropdown(activeDropdown === category.id ? null : category.id);
                      } else {
                        handleCategoryFilter(category.id);
                      }
                    }}
                    className={`flex items-center gap-1 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                      selectedCategory === category.id
                        ? 'text-white border-[#f90] bg-[#37475a] font-semibold'
                        : 'text-white border-transparent hover:text-[#f90] hover:bg-[#37475a]'
                    }`}
                  >
                    {category.name}
                    {category.children && category.children.length > 0 && (
                      <ChevronDown className={`w-3 h-3 transition-transform ${activeDropdown === category.id ? 'rotate-180' : ''}`} />
                    )}
                  </button>
                  
                  {/* Subcategories Dropdown */}
                  {category.children && category.children.length > 0 && activeDropdown === category.id && (
                    <div className="absolute top-full left-0 mt-0 bg-white shadow-xl rounded-b-lg min-w-[200px] z-[9999] border border-t-0 py-2">
                      <button
                        onClick={() => {
                          setActiveDropdown(null);
                          handleCategoryFilter(category.id);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm font-semibold text-gray-800 hover:text-blue-600 hover:bg-blue-50 transition-colors border-b"
                      >
                        All {category.name}
                      </button>
                      {category.children.map((subcat: any) => (
                        <button
                          key={subcat.id}
                          onClick={() => {
                            setActiveDropdown(null);
                            handleCategoryFilter(subcat.id);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          {subcat.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          {categoryDisplayMode === 'sidebar' && (
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow p-6 sticky top-24">
                <h2 className="text-lg font-semibold mb-4">Filters</h2>
                
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Categories</h3>
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    <label className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === ''}
                        onChange={() => handleCategoryFilter('')}
                        className="mr-2"
                      />
                      <span className="text-sm">All Categories</span>
                    </label>
                    {flatCategories.map((category) => (
                      <label
                        key={category.id}
                        className="flex items-center cursor-pointer hover:bg-gray-50 p-1 rounded"
                        style={{ marginLeft: `${category.level * 16}px` }}
                      >
                        <input
                          type="radio"
                          name="category"
                          checked={selectedCategory === category.id}
                          onChange={() => handleCategoryFilter(category.id)}
                          className="mr-2"
                        />
                        <span className={`text-sm ${category.level === 0 ? 'font-semibold' : ''}`}>
                          {category.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          <div className="flex-1">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {productType === 'booking' ? 'Bookings & Services' : (searchQuery ? `Search Results for "${searchQuery}"` : 'All Products')}
              </h1>
              <p className="text-gray-600 mt-1">
                {loading ? 'Loading...' : `${totalCount} product${totalCount !== 1 ? 's' : ''} found`}
              </p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">No Products Found</h2>
                <p className="text-gray-600">Try adjusting your search terms or filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
                  >
                    <div className="aspect-square bg-gray-100 overflow-hidden relative">
                      <img
                        src={product.featuredImage || '/placeholder-product.jpg'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-product.jpg';
                        }}
                      />
                      {product.productType === 'booking' && (
                        <span className="absolute top-2 right-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Booking
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </h3>
                      {product.shortDescription && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {product.shortDescription}
                        </p>
                      )}
                      <div className="flex items-center gap-1 mb-2">
                        <div className="flex items-center">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium ml-1">
                            {Number(product.averageRating).toFixed(1)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          ({product.reviewCount})
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-gray-900">
                          {getCurrencySymbol(currency)}{Number(product.price).toFixed(2)}
                          {product.productType === 'booking' && product.attributes?.booking?.durationUnit && (
                            <span className="text-sm font-normal text-gray-600">
                              /{product.attributes.booking.durationUnit === 'hours' ? 'hr' : product.attributes.booking.durationUnit === 'days' ? 'day' : 'session'}
                            </span>
                          )}
                        </span>
                        {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                          <span className="text-sm text-gray-500 line-through">
                            {getCurrencySymbol(currency)}{Number(product.compareAtPrice).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Loading More Indicator */}
            {loadingMore && (
              <div className="mt-8 text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading more products...</p>
              </div>
            )}

            {/* End of Results Message */}
            {!loading && !hasMore && products.length > 0 && (
              <div className="mt-8 text-center py-8">
                <p className="text-gray-600">You've reached the end of the results</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer categories={categories} marketplaceName={marketplaceName} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchContent />
    </Suspense>
  );
}
