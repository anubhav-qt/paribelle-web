'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, Heart, Share2, Package, ArrowLeft, Calendar, Store, ShoppingCart } from 'lucide-react';
import VendorHeader from '@/components/VendorHeader';
import CategoryNav from '@/components/CategoryNav';
import BookingCalendar from '@/components/BookingCalendar';
import Footer from '@/components/Footer';
import { getCurrencySymbol } from '@/lib/currency';
import { useCart } from '@/contexts/CartContext';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface BookingData {
  duration: number;
  durationUnit: 'hours' | 'days' | 'sessions';
  bufferTime: number;
  availableDays: string[];
  timeSlots: { start: string; end: string }[];
}

interface Product {
  id: string;
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  price: string | number;
  compareAtPrice?: string | number;
  featuredImage: string;
  averageRating: string | number;
  reviewCount: number;
  categories: Category[];
  productType: 'physical' | 'booking';
  stockQuantity?: number;
  vendorId?: string;
  attributes?: {
    booking?: BookingData;
  };
}

interface Vendor {
  id: string;
  businessName: string;
  slug: string;
  logo?: string;
}

export default function VendorProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart, totalItems } = useCart();
  const vendorSlug = params.vendorSlug as string;
  const productSlug = params.slug as string;
  
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [calendarKey, setCalendarKey] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [currency, setCurrency] = useState('INR');

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
    
    // Reset state when slug changes to prevent showing stale data
    setVendor(null);
    setProduct(null);
    setLoading(true);
    setSelectedBooking(null);
    setQuantity(1);
    
    // Fetch currency setting
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/currency`)
      .then(res => res.json())
      .then(data => {
        setCurrency(data.value || 'INR');
      })
      .catch(err => console.error('Error fetching currency setting:', err));
    
    fetchVendorAndProduct();
  }, [vendorSlug, productSlug]);

  const fetchVendorAndProduct = async () => {
    try {
      setLoading(true);
      
      // Fetch vendor
      const vendorResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/slug/${vendorSlug}`
      );
      
      if (vendorResponse.ok) {
        const vendorData = await vendorResponse.json();
        setVendor(vendorData);
        
        // Fetch product
        const productResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/slug/${productSlug}`
        );
        
        if (productResponse.ok) {
          const productData = await productResponse.json();
          
          // Verify product belongs to this vendor
          if (productData.vendorId === vendorData.id) {
            setProduct(productData);
          } else {
            setProduct(null);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookNow = async () => {
    if (!selectedBooking || !product) return;

    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      alert('Please login to make a booking');
      return;
    }

    const user = JSON.parse(userStr);
    setBookingLoading(true);

    try {
      if (product.attributes?.booking?.durationUnit === 'days') {
        const startDate = new Date(selectedBooking.startDate);
        const endDate = new Date(selectedBooking.endDate);
        const bookings = [];

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const bookingData = {
            productId: product.id,
            vendorId: product.vendorId || '',
            userId: user.id,
            bookingDate: d.toISOString().split('T')[0],
            startTime: null,
            endTime: null,
            totalPrice: Number(product.price),
            status: 'confirmed',
          };
          bookings.push(bookingData);
        }

        const promises = bookings.map(booking =>
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/bookings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(booking),
          })
        );

        const responses = await Promise.all(promises);
        const allSuccessful = responses.every(r => r.ok);

        if (allSuccessful) {
          alert(
            `Booking Confirmed!\n\n` +
            `Date: ${selectedBooking.startDate.toLocaleDateString()} - ${selectedBooking.endDate.toLocaleDateString()}\n` +
            `Total: ₹${selectedBooking.totalPrice.toLocaleString()}\n\n` +
            `Your booking has been confirmed!`
          );
          setSelectedBooking(null);
          setCalendarKey(prev => prev + 1);
        } else {
          alert('Some bookings failed. Please try again.');
        }
      } else {
        // For hourly/session bookings - handle multiple slots
        const selectedSlots = selectedBooking.selectedSlots || [];
        
        if (selectedSlots.length > 1) {
          // Multiple slots - create a booking for each slot
          const bookings = selectedSlots.map((slot: string) => {
            const [startTime, endTime] = slot.split(' - ').map((t: string) => t.trim());
            return {
              productId: product.id,
              vendorId: product.vendorId || '',
              userId: user.id,
              bookingDate: selectedBooking.startDate.toISOString().split('T')[0],
              startTime,
              endTime,
              totalPrice: Number(product.price),
              status: 'confirmed',
            };
          });

          const promises = bookings.map((booking: any) =>
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/bookings`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify(booking),
            })
          );

          const responses = await Promise.all(promises);
          const allSuccessful = responses.every((r: Response) => r.ok);

          if (allSuccessful) {
            alert(
              `Booking Confirmed!\n\n` +
              `Date: ${selectedBooking.startDate.toLocaleDateString()}\n` +
              `Slots: ${selectedSlots.length}\n` +
              `Total: ₹${selectedBooking.totalPrice.toLocaleString()}\n\n` +
              `Your bookings have been confirmed!`
            );
            setSelectedBooking(null);
            setCalendarKey(prev => prev + 1);
          } else {
            alert('Some bookings failed. Please try again.');
          }
        } else {
          // Single slot booking
          const bookingData = {
            productId: product.id,
            vendorId: product.vendorId || '',
            userId: user.id,
            bookingDate: selectedBooking.startDate.toISOString().split('T')[0],
            startTime: selectedBooking.startTime || null,
            endTime: selectedBooking.endTime || null,
            totalPrice: selectedBooking.totalPrice,
            status: 'confirmed',
          };

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/bookings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(bookingData),
          });

          if (response.ok) {
            alert(
              `Booking Confirmed!\n\n` +
              `Date: ${selectedBooking.startDate.toLocaleDateString()}\n` +
              `Time: ${selectedBooking.startTime} - ${selectedBooking.endTime}\n` +
              `Total: ₹${selectedBooking.totalPrice.toLocaleString()}\n\n` +
              `Your booking has been confirmed!`
            );
            setSelectedBooking(null);
            setCalendarKey(prev => prev + 1);
          } else {
            const error = await response.json();
            alert(`Failed to create booking: ${JSON.stringify(error)}`);
          }
        }
      }
    } catch (error) {
      alert(`Failed to create booking. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleAddToCart = () => {
    if (!product || !vendor) return;

    if (product.stockQuantity !== undefined && product.stockQuantity <= 0) {
      alert('This product is out of stock');
      return;
    }

    addToCart({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(product.price),
      quantity: quantity,
      image: product.featuredImage,
      vendorId: vendor.id,
      vendorName: vendor.businessName,
      vendorSlug: vendorSlug,
      productType: product.productType,
      stockQuantity: product.stockQuantity,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    // Navigate to vendor-specific checkout
    router.push(`/vendor/${vendorSlug}/checkout`);
  };

  const getDiscount = (price: string | number, compareAtPrice?: string | number) => {
    if (!compareAtPrice || Number(compareAtPrice) <= Number(price)) return null;
    return Math.round(((Number(compareAtPrice) - Number(price)) / Number(compareAtPrice)) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product || !vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
          <Link href="/" className="text-blue-600 hover:underline">
            Back to Store
          </Link>
        </div>
      </div>
    );
  }

  const discount = getDiscount(product.price, product.compareAtPrice);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Vendor Header */}
      <VendorHeader vendorSlug={vendorSlug} vendorId={vendor.id} />
      
      {/* Category Navigation */}
      <CategoryNav mode="scroll" vendorSlug={vendorSlug} />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Link href="http://localhost:3000" className="text-gray-600 hover:text-blue-600">All Vendors</Link>
            <span className="text-gray-400">/</span>
            <Link href="/" className="text-gray-600 hover:text-blue-600 flex items-center gap-1">
              <Store className="w-3 h-3" />
              {vendor.businessName}
            </Link>
            <span className="text-gray-400">/</span>
            <span className="text-gray-900 font-medium truncate">{product.name}</span>
          </div>
        </div>
      </div>

      {/* Product Detail */}
      <div className="container mx-auto px-4 py-8">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-blue-600 hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {vendor.businessName}
        </Link>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-8">
            <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={product.featuredImage}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {discount && (
                <span className="absolute top-4 left-4 bg-green-500 text-white px-3 py-1 rounded-md text-sm font-bold">
                  {discount}% OFF
                </span>
              )}
            </div>

            <div className="flex flex-col">
              <h1 className="text-3xl font-bold mb-3">{product.name}</h1>
              <p className="text-gray-600 mb-4">{product.shortDescription}</p>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded">
                  <span className="font-semibold">{Number(product.averageRating).toFixed(1)}</span>
                  <Star className="w-4 h-4 fill-white" />
                </div>
                <span className="text-gray-600">
                  {product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'}
                </span>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-bold text-gray-900">
                    {getCurrencySymbol(currency)}{Number(product.price).toLocaleString()}
                    {product.productType === 'booking' && product.attributes?.booking?.durationUnit && (
                      <span className="text-lg font-normal text-gray-600">
                        /{product.attributes.booking.durationUnit === 'hours' ? 'hr' : product.attributes.booking.durationUnit === 'days' ? 'day' : 'session'}
                      </span>
                    )}
                  </span>
                  {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                    <>
                      <span className="text-xl text-gray-400 line-through">
                        {getCurrencySymbol(currency)}{Number(product.compareAtPrice).toLocaleString()}
                      </span>
                      <span className="text-green-600 font-semibold">
                        {discount}% off
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-600">Inclusive of all taxes</p>
              </div>

              {product.productType === 'physical' ? (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      -
                    </button>
                    <span className="text-lg font-semibold w-12 text-center">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                    >
                      +
                    </button>
                  </div>
                  {product.stockQuantity !== undefined && (
                    <p className="text-sm text-gray-600 mt-2">
                      {product.stockQuantity > 0 
                        ? `${product.stockQuantity} in stock` 
                        : 'Out of stock'}
                    </p>
                  )}
                </div>
              ) : product.productType === 'booking' ? (
                <div className="mb-6">
                  {product.attributes?.booking ? (
                    <>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        Select Your Booking
                      </h3>
                      <BookingCalendar
                        key={calendarKey}
                        productId={product.id}
                        bookingData={product.attributes.booking}
                        price={Number(product.price)}
                        onBookingSelect={(booking) => setSelectedBooking(booking)}
                      />
                    </>
                  ) : (
                    <div className="p-4 bg-red-50 border border-red-200 rounded">
                      <p className="text-red-700">Booking configuration not found for this product.</p>
                    </div>
                  )}
                </div>
              ) : null}

              <div className="flex gap-4 mb-6">
                {product.productType === 'booking' ? (
                  <button 
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={!selectedBooking || bookingLoading}
                    onClick={handleBookNow}
                  >
                    {bookingLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <Calendar className="w-5 h-5" />
                        {selectedBooking ? `Book Now - ₹${selectedBooking.totalPrice.toLocaleString()}` : 'Select Date & Time'}
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={handleAddToCart}
                      disabled={product.stockQuantity !== undefined && product.stockQuantity <= 0}
                      className="flex-1 bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-5 h-5 inline mr-2" />
                      {product.stockQuantity !== undefined && product.stockQuantity <= 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                    <button 
                      onClick={handleBuyNow}
                      disabled={product.stockQuantity !== undefined && product.stockQuantity <= 0}
                      className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      Buy Now
                    </button>
                  </>
                )}
              </div>

              <div className="flex gap-4">
                <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                  <Heart className="w-5 h-5" />
                  Wishlist
                </button>
                <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>

              {product.categories && product.categories.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-2">Categories:</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.categories.map((category) => (
                      <span
                        key={category.id}
                        className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                      >
                        {category.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t p-8">
            <h2 className="text-2xl font-bold mb-4">Product Description</h2>
            <div className="prose max-w-none text-gray-600">
              {product.description || product.shortDescription}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
