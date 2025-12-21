'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Store, MapPin, Phone, Mail, Star, Package } from 'lucide-react';
import Header from '@/components/Header';
import CategoryNav from '@/components/CategoryNav';
import Footer from '@/components/Footer';
import { getCurrencySymbol } from '@/lib/currency';
import { getProductImageUrl } from '@/lib/image-url';
import { initAuthFromCookie } from '@/lib/cross-domain-auth';

export default function VendorHomePage() {
  const params = useParams();
  const vendorSlug = params.slug as string;
  const [vendor, setVendor] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    // Initialize auth from cookie first
    initAuthFromCookie()
      .then((token) => {
        console.log('✅ Vendor home: Auth initialized, token:', token ? 'Found' : 'Not found');
        setAuthInitialized(true);
      })
      .catch((error) => {
        console.error('Vendor home: Error initializing auth:', error);
        setAuthInitialized(true);
      });
  }, []);

  useEffect(() => {
    if (vendorSlug && authInitialized) {
      fetchVendorData();
    }
  }, [vendorSlug, authInitialized]);

  const fetchVendorData = async () => {
    try {
      setLoading(true);

      // Fetch vendor details
      const vendorResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/slug/${vendorSlug}`
      );
      if (vendorResponse.ok) {
        const vendorData = await vendorResponse.json();
        setVendor(vendorData);

        // Fetch vendor's products
        const productsResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?vendorId=${vendorData.id}`
        );
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          // Handle different response formats
          setProducts(Array.isArray(productsData) ? productsData : productsData.products || []);
        }
      }
    } catch (error) {
      console.error('Error fetching vendor data:', error);
    } finally {
      setLoading(false);
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
      <div className="min-h-screen bg-background">
        <Header />
        <CategoryNav mode="navigation" />
        <div className="container mx-auto px-4 py-16 text-center">
          <Store className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Vendor Not Found</h1>
          <p className="text-muted-foreground mb-6">The vendor you're looking for doesn't exist.</p>
          <Link href="/" className="text-primary hover:underline">
            Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header showLocationFilter={false} />
      <CategoryNav mode="navigation" />

      {/* Vendor Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-start gap-8">
            <div className="w-32 h-32 bg-card rounded-full flex items-center justify-center border-4 border-background shadow-lg">
              <Store className="w-16 h-16 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-foreground mb-2">{vendor.businessName}</h1>
              <p className="text-muted-foreground text-lg mb-4">{vendor.description || 'Welcome to our store'}</p>
              
              <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                {vendor.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{vendor.address}</span>
                  </div>
                )}
                {vendor.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{vendor.contactPhone}</span>
                  </div>
                )}
                {vendor.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{vendor.contactEmail}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-foreground">Our Products</h2>
          <span className="text-muted-foreground">{products.length} products</span>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No Products Yet</h3>
            <p className="text-muted-foreground">This vendor hasn't added any products yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/vendor/${vendorSlug}/products/${product.slug}`}
                className="group bg-card rounded-lg border border-border hover:shadow-lg transition-all overflow-hidden"
              >
                <div className="aspect-square bg-muted relative overflow-hidden">
                  {product.featuredImage ? (
                    <img
                      src={getProductImageUrl(product.featuredImage)}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-16 h-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  
                  {product.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-foreground">
                        {getCurrencySymbol('INR')}{product.price}
                      </span>
                      {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                        <span className="text-sm text-muted-foreground line-through ml-2">
                          {getCurrencySymbol('INR')}{product.compareAtPrice}
                        </span>
                      )}
                    </div>
                  </div>

                  {product.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-muted-foreground">
                        {product.rating} ({product.reviewCount || 0})
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
