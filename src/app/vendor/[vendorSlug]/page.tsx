'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Store } from 'lucide-react';
import { getCurrencySymbol } from '@/lib/currency';
import VendorHeroCarousel from '@/components/VendorHeroCarousel';
import CategoryNav from '@/components/CategoryNav';
import VendorHeader from '@/components/VendorHeader';
import Footer from '@/components/Footer';
import { getProductImageUrl } from '@/lib/image-url';

interface Vendor {
  id: string;
  businessName: string;
  slug: string;
  logo?: string;
  description?: string;
  themeConfig?: any;
}

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
  price: number;
  featuredImage: string;
  averageRating: number;
  reviewCount: number;
  categories?: Category[];
  productType?: 'physical' | 'booking';
  attributes?: {
    booking?: {
      durationUnit?: 'hours' | 'days' | 'sessions';
    };
  };
}

export default function VendorStorePage() {
  const params = useParams();
  const vendorSlug = params.vendorSlug as string;
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [productsByCategory, setProductsByCategory] = useState<Map<string, Product[]>>(new Map());
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('INR');

  // Scroll helper function
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

  useEffect(() => {
    // Check for authToken in URL (from login redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const authToken = urlParams.get('authToken');
    
    if (authToken) {
      console.log('Auth token found in URL, storing in localStorage and cookie');
      localStorage.setItem('token', authToken);
      
      // Fetch user data
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      })
        .then(res => res.json())
        .then(userData => {
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('User data stored:', userData.email);
        })
        .catch(err => console.error('Error fetching user data:', err));
      
      // Set cookie for this subdomain
      document.cookie = `token=${authToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      
      // Remove token from URL for security
      urlParams.delete('authToken');
      const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
      window.history.replaceState({}, '', newUrl);
    }
    
    // Fetch currency setting
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/currency`)
      .then(res => res.json())
      .then(data => {
        setCurrency(data.value || 'INR');
      })
      .catch(err => console.error('Error fetching currency setting:', err));
    
    fetchVendor();
  }, [vendorSlug]);

  useEffect(() => {
    if (vendor) {
      fetchCategories();
    }
  }, [vendor]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/vendor/${vendor!.id}`
      );
      if (response.ok) {
        const data = await response.json();
        // Fetch products for each category and only keep categories with products
        const categoriesWithProducts: Category[] = [];
        
        for (const category of data) {
          const hasProducts = await fetchProductsByCategory(category.id, category.slug);
          if (hasProducts) {
            categoriesWithProducts.push(category);
            // Also fetch and check children
            if (category.children && category.children.length > 0) {
              const childrenWithProducts: Category[] = [];
              for (const child of category.children) {
                const childHasProducts = await fetchProductsByCategory(child.id, child.slug);
                if (childHasProducts) {
                  childrenWithProducts.push(child);
                }
              }
              // Update children array to only include those with products
              category.children = childrenWithProducts;
            }
          }
        }
        
        setCategories(categoriesWithProducts);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProductsByCategory = async (categoryId: string, categorySlug: string): Promise<boolean> => {
    try {
      const params = new URLSearchParams({
        categoryId,
        vendorId: vendor!.id,
      });
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?${params.toString()}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const products = Array.isArray(data) ? data : data.products || [];
        
        if (products.length > 0) {
          setProductsByCategory(prev => new Map(prev).set(categorySlug, products));
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error(`Error fetching products for category ${categorySlug}:`, error);
      return false;
    }
  };

  // Handle hash scrolling after products load
  useEffect(() => {
    if (!loading && productsByCategory.size > 0) {
      const hash = window.location.hash;
      if (hash) {
        const elementId = hash.substring(1);
        setTimeout(() => scrollToElement(elementId), 100);
      }
    }
  }, [loading, productsByCategory]);

  const fetchVendor = async () => {
    try {
      setLoading(true);
      
      const vendorResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/slug/${vendorSlug}`
      );
      
      if (vendorResponse.ok) {
        const vendorData = await vendorResponse.json();
        setVendor(vendorData);
      }
    } catch (error) {
      console.error('Error fetching vendor:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2 text-foreground">Vendor Not Found</h1>
          <p className="text-muted-foreground mb-4">The vendor &quot;{vendorSlug}&quot; does not exist.</p>
          <Link href="http://localhost:3000" className="text-primary hover:underline">
            Go to Main Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <VendorHeader 
        vendorSlug={vendorSlug}
        vendorId={vendor.id}
        onSearch={(query) => {
          // Handle search within vendor store
          console.log('Searching vendor store for:', query);
        }}
        searchPlaceholder="Search in this store..."
      />

      {/* Category Navigation */}
      <CategoryNav 
        vendorId={vendor.id}
        vendorSlug={vendorSlug}
        mode="scroll"
      />

      {/* Hero Banner Carousel - Vendor Specific */}
      {vendor && (
        <VendorHeroCarousel 
          vendorId={vendor.id} 
          vendorName={vendor.businessName}
          vendorDescription={vendor.description}
        />
      )}

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8">
        {/* Products by Category Sections */}
        {categories.map((category) => {
          const categoryProducts = productsByCategory.get(category.slug) || [];
          
          if (categoryProducts.length === 0) return null;

          return (
            <section key={category.id} id={`category-${category.slug}`} className="mb-12 scroll-mt-36">
              <h2 className="text-2xl font-bold mb-6 text-foreground">
                {category.name} ({categoryProducts.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {categoryProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group border border-border"
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <img
                        src={getProductImageUrl(product)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary text-foreground">
                        {product.name}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {product.shortDescription}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-foreground">
                          {getCurrencySymbol(currency)}{product.price.toLocaleString()}
                          {product.productType === 'booking' && product.attributes?.booking?.durationUnit && (
                            <span className="text-sm font-normal text-muted-foreground">
                              /{product.attributes.booking.durationUnit === 'hours' ? 'hr' : product.attributes.booking.durationUnit === 'days' ? 'day' : 'session'}
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-1 text-sm">
                          <span className="text-yellow-500">★</span>
                          <span className="font-medium text-foreground">{Number(product.averageRating || 0).toFixed(1)}</span>
                          <span className="text-muted-foreground">({product.reviewCount || 0})</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {productsByCategory.size === 0 && (
          <div className="text-center py-12">
            <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No products available yet</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
