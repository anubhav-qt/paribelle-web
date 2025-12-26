'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Store, Star } from 'lucide-react';
import { getCurrencySymbol } from '@/lib/currency';
import VendorHeroCarousel from '@/components/VendorHeroCarousel';
import CategoryNav from '@/components/CategoryNav';
import VendorHeader from '@/components/VendorHeader';
import Footer from '@/components/Footer';
import { getProductImageUrl } from '@/lib/image-url';
import { initAuthFromCookie } from '@/lib/cross-domain-auth';
import RatingDisplay from '@/components/RatingDisplay';
import ReviewCard from '@/components/ReviewCard';

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
  console.log('🔵 VendorStorePage: Component rendering/re-rendering');
  
  const params = useParams();
  const vendorSlug = params.vendorSlug as string;
  
  console.log('🔵 VendorStorePage: vendorSlug from params:', vendorSlug);
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [productsByCategory, setProductsByCategory] = useState<Map<string, Product[]>>(new Map());
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('INR');
  const [authInitialized, setAuthInitialized] = useState(false);
  const [vendorReviews, setVendorReviews] = useState<any[]>([]);
  const [vendorStats, setVendorStats] = useState<any>(null);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReviews, setShowReviews] = useState(false);

  // Apply theme to the page
  useEffect(() => {
    if (vendor?.themeConfig) {
      const theme = vendor.themeConfig;
      const root = document.documentElement;

      // Apply colors
      if (theme.primaryColor) root.style.setProperty('--vendor-primary', theme.primaryColor);
      if (theme.secondaryColor) root.style.setProperty('--vendor-secondary', theme.secondaryColor);
      if (theme.accentColor) root.style.setProperty('--vendor-accent', theme.accentColor);
      if (theme.backgroundColor) root.style.setProperty('--vendor-bg', theme.backgroundColor);
      if (theme.textColor) root.style.setProperty('--vendor-text', theme.textColor);

      // Apply fonts
      if (theme.fontFamily) {
        root.style.setProperty('--vendor-font-family', theme.fontFamily);
        document.body.style.fontFamily = theme.fontFamily;
      }
      if (theme.headingFont) {
        root.style.setProperty('--vendor-heading-font', theme.headingFont);
      }

      // Apply custom CSS
      if (theme.customCss) {
        const styleId = 'vendor-custom-styles';
        let styleElement = document.getElementById(styleId) as HTMLStyleElement;
        
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = styleId;
          document.head.appendChild(styleElement);
        }
        
        styleElement.textContent = theme.customCss;
      }

      // Apply layout class
      if (theme.layout) {
        document.body.classList.remove('layout-modern', 'layout-classic', 'layout-minimal', 'layout-bold');
        document.body.classList.add(`layout-${theme.layout}`);
      }

      // Cleanup function
      return () => {
        // Reset theme variables
        root.style.removeProperty('--vendor-primary');
        root.style.removeProperty('--vendor-secondary');
        root.style.removeProperty('--vendor-accent');
        root.style.removeProperty('--vendor-bg');
        root.style.removeProperty('--vendor-text');
        root.style.removeProperty('--vendor-font-family');
        root.style.removeProperty('--vendor-heading-font');
        
        // Remove custom CSS
        const styleElement = document.getElementById('vendor-custom-styles');
        if (styleElement) styleElement.remove();
        
        // Remove layout class
        if (theme.layout) {
          document.body.classList.remove(`layout-${theme.layout}`);
        }
      };
    }
  }, [vendor?.themeConfig]);

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
    console.log('Vendor page: useEffect starting, vendorSlug:', vendorSlug);
    
    // Initialize auth from cookie (secure cross-domain approach)
    initAuthFromCookie()
      .then((token) => {
        console.log('Vendor page: Auth initialization complete, token:', token ? 'Found' : 'Not found');
        setAuthInitialized(true);
      })
      .catch((error) => {
        console.error('Vendor page: Error initializing auth:', error);
        setAuthInitialized(true); // Still set to true to unblock rendering
      });
    
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
      fetchVendorStats();
    }
  }, [vendor]);

  // Handle hash scrolling when page loads or hash changes
  useEffect(() => {
    const handleHashScroll = () => {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#category-')) {
        const categorySlug = hash.replace('#category-', '');
        const elementId = `category-${categorySlug}`;
        
        // Wait for products to load, then scroll
        setTimeout(() => {
          scrollToElement(elementId);
        }, 500);
      }
    };

    // Check hash on initial load
    if (!loading && productsByCategory.size > 0) {
      handleHashScroll();
    }

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashScroll);
    return () => window.removeEventListener('hashchange', handleHashScroll);
  }, [loading, productsByCategory]);

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
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorSlug}`
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

  const fetchVendorReviews = async () => {
    if (!vendor) return;
    
    try {
      setReviewsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reviews/vendors/${vendor.id}?page=1&limit=10`
      );
      if (response.ok) {
        const data = await response.json();
        setVendorReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching vendor reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleShowReviews = () => {
    setShowReviews(!showReviews);
    if (!showReviews && vendorReviews.length === 0) {
      fetchVendorReviews();
    }
  };

  const fetchVendorStats = async () => {
    if (!vendor) return;
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reviews/vendors/${vendor.id}/stats`
      );
      if (response.ok) {
        const data = await response.json();
        setVendorStats(data);
      }
    } catch (error) {
      console.error('Error fetching vendor stats:', error);
    }
  };

  if (loading || !authInitialized) {
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
    <div className="min-h-screen bg-background" style={{
      backgroundColor: vendor.themeConfig?.backgroundColor || undefined,
      color: vendor.themeConfig?.textColor || undefined,
      fontFamily: vendor.themeConfig?.fontFamily || undefined,
    }}>
      {/* Theme Styles */}
      {vendor.themeConfig && (
        <style jsx>{`
          .vendor-themed-button {
            background-color: ${vendor.themeConfig.primaryColor || '#3B82F6'};
            color: white;
          }
          .vendor-themed-button:hover {
            background-color: ${vendor.themeConfig.secondaryColor || '#2563EB'};
          }
          .vendor-themed-link {
            color: ${vendor.themeConfig.primaryColor || '#3B82F6'};
          }
          .vendor-themed-link:hover {
            color: ${vendor.themeConfig.secondaryColor || '#2563EB'};
          }
          .vendor-themed-accent {
            color: ${vendor.themeConfig.accentColor || '#F59E0B'};
          }
          .vendor-themed-heading {
            font-family: ${vendor.themeConfig.headingFont || vendor.themeConfig.fontFamily || 'inherit'};
            color: ${vendor.themeConfig.textColor || 'inherit'};
          }
        `}</style>
      )}
      
      <VendorHeader 
        vendorSlug={vendorSlug}
        vendorId={vendor.id}
        onSearch={(query) => {
          // Handle search within vendor store
          console.log('Searching vendor store for:', query);
        }}
        searchPlaceholder="Search in this store..."
        showSearchBar={vendor.themeConfig?.showSearchBar !== false}
      />

      {/* Hero Banner Carousel - Vendor Specific */}
      {vendor && (
        <VendorHeroCarousel 
          vendorId={vendor.id} 
          vendorName={vendor.businessName}
          vendorDescription={vendor.description}
        />
      )}

      {/* Category Navigation */}
      <CategoryNav 
        vendorId={vendor.id}
        vendorSlug={vendorSlug}
        mode="scroll"
      />

      {/* Products Grid */}
      <div className="container mx-auto px-4 py-8">
        {/* Products by Category Sections */}
        {categories.map((category) => {
          const categoryProducts = productsByCategory.get(category.slug) || [];
          
          if (categoryProducts.length === 0) return null;

          return (
            <section key={category.id} id={`category-${category.slug}`} className="mb-12 scroll-mt-36">
              <h2 className="text-2xl font-bold mb-6 vendor-themed-heading">
                {category.name} ({categoryProducts.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {categoryProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="bg-card rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group border border-border"
                    style={{
                      borderColor: vendor.themeConfig?.primaryColor ? `${vendor.themeConfig.primaryColor}20` : undefined,
                    }}
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      <img
                        src={getProductImageUrl(product)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 vendor-themed-heading" style={{
                        color: vendor.themeConfig?.textColor || undefined,
                      }}>
                        {product.name}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {product.shortDescription}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold" style={{
                          color: vendor.themeConfig?.primaryColor || undefined,
                        }}>
                          {getCurrencySymbol(currency)}{product.price.toLocaleString()}
                          {product.productType === 'booking' && product.attributes?.booking?.durationUnit && (
                            <span className="text-sm font-normal text-muted-foreground">
                              /{product.attributes.booking.durationUnit === 'hours' ? 'hr' : product.attributes.booking.durationUnit === 'days' ? 'day' : 'session'}
                            </span>
                          )}
                        </span>
                        <div className="flex items-center gap-1 text-sm">
                          <span className="vendor-themed-accent">★</span>
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

        {/* Vendor Reviews Section */}
        <section className="mt-16 pt-8 border-t border-border">
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2 vendor-themed-heading">Store Reviews</h2>
            {vendorStats && (
              <div className="flex items-center gap-4 mt-3">
                <RatingDisplay 
                  rating={vendorStats.averageRating} 
                  reviewCount={vendorStats.totalReviews}
                  size="lg"
                />
                {vendorStats.averageProductQuality > 0 && (
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <div>
                      Quality: <span className="font-semibold text-foreground">{vendorStats.averageProductQuality.toFixed(1)}/5</span>
                    </div>
                    <div>
                      Shipping: <span className="font-semibold text-foreground">{vendorStats.averageShippingSpeed.toFixed(1)}/5</span>
                    </div>
                    <div>
                      Service: <span className="font-semibold text-foreground">{vendorStats.averageCustomerService.toFixed(1)}/5</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* View Comments Button */}
            {vendorStats && vendorStats.totalReviews > 0 && (
              <button
                onClick={handleShowReviews}
                className="mt-4 vendor-themed-link hover:underline font-medium flex items-center gap-2"
                style={{
                  color: vendor.themeConfig?.primaryColor || undefined,
                }}
              >
                {showReviews ? '▼ Hide Comments' : `▶ View All ${vendorStats.totalReviews} Comments`}
              </button>
            )}
          </div>

          {showReviews && (
            reviewsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading reviews...</div>
            ) : vendorReviews.length > 0 ? (
              <div className="space-y-6">
                {vendorReviews.map((review) => (
                  <ReviewCard 
                    key={review.id} 
                    review={review}
                    type="vendor"
                    productQualityRating={review.productQualityRating}
                    shippingSpeedRating={review.shippingSpeedRating}
                    customerServiceRating={review.customerServiceRating}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/50 rounded-lg">
                <Star className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No reviews yet for this store.</p>
              </div>
            )
          )}
        </section>
      </div>

      {/* Custom Footer Text */}
      {vendor.themeConfig?.footerText && (
        <div className="bg-muted border-t border-border py-6">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm" style={{ color: vendor.themeConfig?.textColor || undefined }}>
              {vendor.themeConfig.footerText}
            </p>
          </div>
        </div>
      )}

      {/* Social Links */}
      {vendor.themeConfig?.socialLinks && Object.values(vendor.themeConfig.socialLinks).some(link => link) && (
        <div className="bg-card border-t border-border py-6">
          <div className="container mx-auto px-4">
            <div className="flex justify-center gap-6">
              {vendor.themeConfig.socialLinks.facebook && (
                <a 
                  href={vendor.themeConfig.socialLinks.facebook} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="vendor-themed-link hover:opacity-80 transition-opacity"
                  style={{ color: vendor.themeConfig?.primaryColor || undefined }}
                >
                  Facebook
                </a>
              )}
              {vendor.themeConfig.socialLinks.instagram && (
                <a 
                  href={vendor.themeConfig.socialLinks.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="vendor-themed-link hover:opacity-80 transition-opacity"
                  style={{ color: vendor.themeConfig?.primaryColor || undefined }}
                >
                  Instagram
                </a>
              )}
              {vendor.themeConfig.socialLinks.twitter && (
                <a 
                  href={vendor.themeConfig.socialLinks.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="vendor-themed-link hover:opacity-80 transition-opacity"
                  style={{ color: vendor.themeConfig?.primaryColor || undefined }}
                >
                  Twitter
                </a>
              )}
              {vendor.themeConfig.socialLinks.youtube && (
                <a 
                  href={vendor.themeConfig.socialLinks.youtube} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="vendor-themed-link hover:opacity-80 transition-opacity"
                  style={{ color: vendor.themeConfig?.primaryColor || undefined }}
                >
                  YouTube
                </a>
              )}
              {vendor.themeConfig.socialLinks.linkedin && (
                <a 
                  href={vendor.themeConfig.socialLinks.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="vendor-themed-link hover:opacity-80 transition-opacity"
                  style={{ color: vendor.themeConfig?.primaryColor || undefined }}
                >
                  LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
