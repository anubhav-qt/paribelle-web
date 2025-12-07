'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, Store, Package } from 'lucide-react';
import VendorHeader from '@/components/VendorHeader';
import CategoryNav from '@/components/CategoryNav';
import Footer from '@/components/Footer';
import { getCurrencySymbol } from '@/lib/currency';

interface Vendor {
  id: string;
  businessName: string;
  slug: string;
  logo?: string;
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
  productType?: 'physical' | 'booking';
  attributes?: {
    booking?: {
      durationUnit?: 'hours' | 'days' | 'sessions';
    };
  };
}

export default function VendorSearchPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const vendorSlug = params.vendorSlug as string;
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('INR');
  const searchQuery = searchParams.get('q') || '';

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
    
    // Fetch currency setting once
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/currency`)
      .then(res => res.json())
      .then(data => {
        setCurrency(data.value || 'INR');
      })
      .catch(err => console.error('Error fetching currency setting:', err));
    
    // Fetch vendor once
    fetchVendor();
  }, []); // Empty dependency array - run only once on mount

  useEffect(() => {
    // Update search query from URL
    const query = searchParams.get('q');
    setSearchQuery(query || '');
    
    // Fetch products when vendor is loaded and search params change
    if (vendor) {
      if (query) {
        searchProducts(query);
      } else {
        fetchAllProducts();
      }
    }
  }, [searchParams, vendor]); // Re-run when search params or vendor changes

  const fetchVendor = async () => {
    try {
      const vendorResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/slug/${vendorSlug}`
      );
      
      if (vendorResponse.ok) {
        const vendorData = await vendorResponse.json();
        setVendor(vendorData);
      }
    } catch (error) {
      console.error('Error fetching vendor:', error);
      setLoading(false);
    }
  };

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        vendorId: vendor!.id,
      });
      
      const productsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?${params.toString()}`
      );
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async (query: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        vendorId: vendor!.id,
        search: query,
      });
      
      const productsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?${params.toString()}`
      );
      
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData.products || []);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!vendor && !loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Vendor Not Found</h1>
          <p className="text-gray-600 mb-4">The vendor &quot;{vendorSlug}&quot; does not exist.</p>
          <Link href="http://localhost:3000" className="text-blue-600 hover:underline">
            Go to Main Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Vendor Header */}
      <VendorHeader 
        vendorSlug={vendorSlug} 
        vendorId={vendor?.id}
        initialSearchQuery={searchQuery}
      />
      
      {/* Category Navigation */}
      <CategoryNav mode="scroll" vendorSlug={vendorSlug} />

      {/* Results */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {searchQuery ? `Search Results for "${searchQuery}"` : 'All Products'}
          </h1>
          <p className="text-gray-600 mt-1">
            {loading ? 'Loading...' : `${products.length} product${products.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Searching...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Products Found</h2>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? `No products match "${searchQuery}" in this store` 
                : 'This store has no products yet'}
            </p>
            {searchQuery && (
              <Link href="/" className="text-blue-600 hover:underline">
                View all products from this store
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
              >
                <div className="relative aspect-square overflow-hidden bg-gray-100">
                  <img
                    src={product.featuredImage}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600">
                    {product.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {product.shortDescription}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-900">
                      {getCurrencySymbol(currency)}{product.price.toLocaleString()}
                      {product.productType === 'booking' && product.attributes?.booking?.durationUnit && (
                        <span className="text-sm font-normal text-gray-600">
                          /{product.attributes.booking.durationUnit === 'hours' ? 'hr' : product.attributes.booking.durationUnit === 'days' ? 'day' : 'session'}
                        </span>
                      )}
                    </span>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{Number(product.averageRating || 0).toFixed(1)}</span>
                      <span className="text-gray-500">({product.reviewCount || 0})</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
