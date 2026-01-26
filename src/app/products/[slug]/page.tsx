'use client';

// Note: This page uses 'use client' for interactive features
// ISR can still be configured when converted to Server Component in the future

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, Heart, Share2, Package, ArrowLeft, Calendar, Clock, CreditCard, ExternalLink, ShoppingCart, Facebook, Twitter, Linkedin, Link as LinkIcon, Check, XCircle } from 'lucide-react';
import BookingCalendar from '@/components/BookingCalendar';
import TourDepartureSelector from '@/components/TourDepartureSelector';
import ProductImageGallery from '@/components/ProductImageGallery';
import VariationSelector from '@/components/VariationSelector';
import ProductVariantSelector from '@/components/ProductVariantSelector';
import { getCurrencySymbol } from '@/lib/currency';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { usePolicies } from '@/contexts/PoliciesContext';
import CartButton from '@/components/CartButton';
import CategoryNav from '@/components/CategoryNav';
import ThemeRenderer from '@/components/ThemeRenderer';
import CategorySidebar from '@/components/CategorySidebar';
import Footer from '@/components/Footer';
import RatingDisplay from '@/components/RatingDisplay';
import ReviewCard from '@/components/ReviewCard';
import ReviewForm from '@/components/ReviewForm';
import { useThemeClasses } from '@/hooks/useThemeClasses';

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

interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  variantAttributes: Record<string, string>;
  price: string | number;
  compareAtPrice?: string | number;
  stockQuantity: number;
  images?: string[];
  isActive: boolean;
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
  images?: string[];
  averageRating: string | number;
  reviewCount: number;
  categories: Category[];
  productType: 'physical' | 'booking';
  stockQuantity?: number;
  vendorId?: string;
  priceType?: string; // 'mrp_with_gst' | 'selling_price_without_gst'
  gstRate?: number; // GST rate in percentage
  // Variation support (legacy)
  isParent?: boolean;
  variations?: any[];
  variationThemes?: string[];
  // Product variants support (new)
  hasVariants?: boolean;
  variantOptions?: any[];
  productVariants?: ProductVariant[];
  vendor?: {
    id: string;
    businessName: string;
    storeName?: string;
    subdomain?: string;
  };
  attributes?: {
    booking?: BookingData & {
      durationUnit?: 'hours' | 'days' | 'sessions';
      duration?: number;
    };
  };
}

export default function ProductDetailPage() {
  const params = useParams();
  const productSlug = params.slug as string;
  const router = useRouter();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { fetchVendorPolicies } = usePolicies();
  const theme = useThemeClasses();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [addToCartLoading, setAddToCartLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [calendarKey, setCalendarKey] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [thumbnailLayout, setThumbnailLayout] = useState<'vertical' | 'horizontal'>('vertical');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [vendorReturnPolicy, setVendorReturnPolicy] = useState<any>(null);
  const [vendorCancellationPolicy, setVendorCancellationPolicy] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [vendorStats, setVendorStats] = useState<any>(null);
  const [showReviews, setShowReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [userOrderItemId, setUserOrderItemId] = useState<string | undefined>();
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Clamp quantity to available stock whenever stock or variant changes
  useEffect(() => {
    if (!product) return;
    
    const maxStock = product.isParent 
      ? (selectedVariation?.stockQuantity || 999)
      : (selectedVariant?.stockQuantity || product.stockQuantity || 999);
    
    if (quantity > maxStock) {
      setQuantity(Math.max(1, maxStock));
    }
  }, [product, selectedVariation, selectedVariant, quantity]);

  useEffect(() => {
    // Reset product state when slug changes to prevent showing stale data
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
    
    // Fetch thumbnail layout setting
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/thumbnailLayout`)
      .then(res => res.json())
      .then(data => {
        setThumbnailLayout(data.value || 'vertical');
      })
      .catch(err => console.error('Error fetching thumbnail layout setting:', err));
    
    fetchProduct();
    
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, [productSlug]);

  const fetchReviews = async (productId: string) => {
    try {
      setReviewsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/reviews/products/${productId}?page=1&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };
  const fetchVendorStats = async (vendorId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/reviews/vendors/${vendorId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setVendorStats(data);
      }
    } catch (error) {
      console.error('Error fetching vendor stats:', error);
    }
  };

  const handleShowReviews = () => {
    setShowReviews(!showReviews);
    if (!showReviews && reviews.length === 0 && product?.id) {
      fetchReviews(product.id);
    }
  };

  const checkUserPurchase = async (productId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders?status=delivered`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      if (response.ok) {
        const orders = await response.json();
        // Check if any delivered order contains this product
        for (const order of orders) {
          const orderItem = order.items?.find(
            (item: any) => item.productId === productId
          );
          if (orderItem) {
            setHasPurchased(true);
            setUserOrderItemId(orderItem.id);
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error checking purchase status:', error);
    }
  };

  const handleWriteReview = () => {
    if (!isLoggedIn) {
      alert('Please login to write a review');
      router.push('/login');
      return;
    }
    setShowReviewForm(true);
    setShowReviews(true);
  };

  const handleReviewSubmit = async (data: any) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/reviews/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product?.id,
          rating: data.rating,
          comment: data.comment,
          orderItemId: userOrderItemId,
        }),
      });

      if (response.ok) {
        setShowReviewForm(false);
        // Refresh reviews
        if (product?.id) {
          await fetchReviews(product.id);
          // Refresh product to get updated rating
          await fetchProduct();
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit review');
      }
    } catch (error) {
      alert('Failed to submit review. Please try again.');
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/slug/${productSlug}`);
      if (response.ok) {
        const productData = await response.json();
        setProduct(productData);
        
        // Check if user has purchased this product
        if (productData.id) {
          checkUserPurchase(productData.id);
        }
        
        // Fetch vendor-specific policies using cached query
        if (productData.vendorId) {
          const policies = await fetchVendorPolicies(productData.vendorId);
          setVendorReturnPolicy(policies.returnPolicy);
          setVendorCancellationPolicy(policies.cancellationPolicy);
          
          // Fetch vendor stats/rating
          fetchVendorStats(productData.vendorId);
        }
      } else {
        setProduct(null);
      }
    } catch (error) {
      setProduct(null);
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
      // Handle tour bookings
      if (product.attributes?.tour?.tourMode && selectedBooking.departureId) {
        const bookingData = {
          productId: product.id,
          vendorId: product.vendorId || '',
          userId: user.id,
          bookingDate: selectedBooking.date, // Already a string in ISO format
          startTime: null,
          endTime: null,
          numberOfGuests: 1, // Default to 1, could be made configurable
          totalPrice: selectedBooking.totalPrice,
          status: 'pending',
          specialRequests: `Tour Departure ID: ${selectedBooking.departureId}`,
        };

        console.log('Creating tour booking with data:', bookingData);

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/bookings`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(bookingData),
        });

        if (response.ok) {
          const result = await response.json();
          console.log('Tour booking created successfully:', result);
          router.push(`/checkout?bookingIds=${result.id}`);
        } else {
          const error = await response.json();
          alert(`Failed to create booking: ${JSON.stringify(error)}`);
        }
        return;
      }

      // For daily bookings, we might need to create multiple booking records
      if (product.attributes?.booking?.durationUnit === 'days') {
        // Use selectedDates if available, otherwise fall back to date range
        const bookings = [];
        
        if (selectedBooking.selectedDates && selectedBooking.selectedDates.length > 0) {
          // Use the individually selected dates
          for (const date of selectedBooking.selectedDates) {
            const dateString = new Date(date).toISOString().split('T')[0];
            const bookingData = {
              productId: product.id,
              vendorId: product.vendorId || '',
              userId: user.id,
              bookingDate: dateString,
              startTime: null,
              endTime: null,
              totalPrice: Number(product.price),
              status: 'pending',
            };
            bookings.push(bookingData);
          }
        } else {
          // Fallback to date range (for backward compatibility)
          const startDate = new Date(selectedBooking.startDate);
          const endDate = new Date(selectedBooking.endDate);
          
          // First, check availability for all dates in the range
          const startDateStr = startDate.toISOString().split('T')[0];
          const endDateStr = endDate.toISOString().split('T')[0];
          
          const availabilityResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/bookings/availability/${product.id}?startDate=${startDateStr}&endDate=${endDateStr}`
          );
          
          if (!availabilityResponse.ok) {
            alert('Failed to check availability. Please try again.');
            return;
          }
          
          const availabilityData = await availabilityResponse.json();
          const unavailableDates: string[] = [];
          
          // Check which dates are unavailable
          availabilityData.forEach((dateInfo: any) => {
            if (dateInfo.slots && dateInfo.slots.length > 0) {
              const fullDaySlot = dateInfo.slots.find((s: any) => s.startTime === 'full-day');
              if (fullDaySlot && !fullDaySlot.available) {
                unavailableDates.push(dateInfo.date);
              }
            }
          });
          
          // If any dates are unavailable, show error and stop
          if (unavailableDates.length > 0) {
            const datesList = unavailableDates.map(d => new Date(d).toLocaleDateString()).join(', ');
            alert(`The following dates are not available:\\n\\n${datesList}\\n\\nPlease select different dates.`);
            return;
          }

          // Create a booking for each day in the range with PENDING status
          for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateString = new Date(d).toISOString().split('T')[0];
            const bookingData = {
              productId: product.id,
              vendorId: product.vendorId || '',
              userId: user.id,
              bookingDate: dateString,
              startTime: null,
              endTime: null,
              totalPrice: Number(product.price),
              status: 'pending',
            };
            bookings.push(bookingData);
          }
        }

        // Create all bookings
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
          // Get the first booking ID for checkout redirect
          const firstBookingData = await responses[0].json();
          console.log('First booking response:', firstBookingData);
          const bookingIds = [firstBookingData.id];
          
          // Get other booking IDs
          for (let i = 1; i < responses.length; i++) {
            const data = await responses[i].json();
            console.log(`Booking ${i} response:`, data);
            bookingIds.push(data.id);
          }
          
          console.log('All bookings created successfully, redirecting to checkout');
          console.log('Booking IDs:', bookingIds);
          // Redirect to checkout with booking IDs
          router.push(`/checkout?bookingIds=${bookingIds.join(',')}`);
        } else {
          alert('Some bookings failed. Please try again.');
        }
      } else {
        // For hourly/session bookings - handle multiple slots
        const selectedSlots = selectedBooking.selectedSlots || [];
        
        if (selectedSlots.length > 1) {
          // Multiple slots - create a booking for each slot with PENDING status
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
              status: 'pending',
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
            // Get all booking IDs
            const bookingIds = [];
            for (const response of responses) {
              const data = await response.json();
              bookingIds.push(data.id);
            }
            
            console.log('All bookings created successfully, redirecting to checkout');
            // Redirect to checkout with booking IDs
            router.push(`/checkout?bookingIds=${bookingIds.join(',')}`);
          } else {
            alert('Some bookings failed. Please try again.');
          }
        } else {
          // Single slot booking with PENDING status
          const bookingData = {
            productId: product.id,
            vendorId: product.vendorId || '',
            userId: user.id,
            bookingDate: selectedBooking.startDate.toISOString().split('T')[0],
            startTime: selectedBooking.startTime || null,
            endTime: selectedBooking.endTime || null,
            totalPrice: selectedBooking.totalPrice,
            status: 'pending',
          };

          console.log('Creating booking with data:', bookingData);

          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/bookings`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(bookingData),
          });

          if (response.ok) {
            const result = await response.json();
            console.log('Booking created successfully:', result);
            // Redirect to checkout with booking ID
            router.push(`/checkout?bookingIds=${result.id}`);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const handleAddToCart = () => {
    if (!product) return;

    // For products with variations, require a selection
    if (product.isParent && !selectedVariation) {
      alert('Please select all product options.');
      return;
    }

    // Use selected variation or main product
    const productToAdd = selectedVariation || product;
    const stockQuantity = product.isParent ? selectedVariation?.stockQuantity : product.stockQuantity;

    // Check stock for physical products
    if (product.productType === 'physical' && stockQuantity !== undefined) {
      if (stockQuantity === 0) {
        alert('Sorry, this product is out of stock.');
        return;
      }
      if (quantity > stockQuantity) {
        alert(`Sorry, only ${stockQuantity} items available.`);
        return;
      }
    }

    setAddToCartLoading(true);
    
    try {
      addToCart({
        productId: selectedVariation?.id || product.id,
        name: selectedVariation ? `${product.name} - ${Object.values(selectedVariation.variationAttributes).join(' ')}` : product.name,
        slug: selectedVariation?.slug || product.slug,
        price: Number(selectedVariation?.price || product.price),
        quantity: quantity,
        image: (selectedVariation?.images?.[0] || selectedVariation?.featuredImage) || product.images?.[0] || product.featuredImage || '/placeholder-product.png',
        vendorId: product.vendorId || '',
        vendorName: product.vendor?.storeName || product.vendor?.businessName || 'Unknown Vendor',
        productType: product.productType,
        stockQuantity: stockQuantity,
        maxQuantity: stockQuantity,
        variationAttributes: selectedVariation?.variationAttributes,
        priceType: product.priceType || 'mrp_with_gst', // Default to tax-inclusive
        gstRate: product.gstRate || 18, // Default to 18% GST
      });

      // Reset quantity after adding to cart
      setQuantity(1);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    } finally {
      setAddToCartLoading(false);
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    // Redirect to checkout after a brief delay
    setTimeout(() => {
      window.location.href = '/checkout';
    }, 500);
  };

  const handleWishlistToggle = () => {
    if (product) {
      toggleWishlist({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
        image: product.featuredImage,
        vendorId: product.vendorId || '',
        vendorName: product.vendor?.businessName || '',
        vendorSlug: product.vendor?.subdomain,
        addedAt: Date.now(),
      });
    }
  };

  const handleShare = (platform: string) => {
    if (!product) return;
    
    const url = window.location.href;
    const title = product.name;
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
          setShowShareMenu(false);
        }, 2000);
        return;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      setShowShareMenu(false);
    }
  };

  const getDiscount = (price: string | number, compareAtPrice?: string | number) => {
    if (!compareAtPrice || Number(compareAtPrice) <= Number(price)) return null;
    return Math.round(((Number(compareAtPrice) - Number(price)) / Number(compareAtPrice)) * 100);
  };

  // Get the lowest price from variants or main product price
  const getDisplayPrice = () => {
    // If a new variant is selected, use its price
    if (selectedVariant) {
      return Number(selectedVariant.price);
    }
    
    // If a legacy variation is selected
    if (selectedVariation) {
      return Number(selectedVariation.price);
    }
    
    // If product has new variants, show the lowest variant price
    if (product?.hasVariants && product.productVariants && product.productVariants.length > 0) {
      const lowestPrice = Math.min(...product.productVariants.map((v: any) => Number(v.price)));
      return lowestPrice;
    }
    
    // If product has legacy variations
    if (product?.isParent && product.variations && product.variations.length > 0) {
      const lowestPrice = Math.min(...product.variations.map((v: any) => Number(v.price)));
      return lowestPrice;
    }
    
    return Number(product?.price || 0);
  };

  // Get the best discount from all variants or main product
  const getBestDiscount = () => {
    // If a variant is selected, return its discount
    if (selectedVariant) {
      return getDiscount(selectedVariant.price, selectedVariant.compareAtPrice);
    }
    
    // If a legacy variation is selected
    if (selectedVariation) {
      return getDiscount(selectedVariation.price, selectedVariation.compareAtPrice);
    }
    
    // Check new product variants for best discount
    if (product?.hasVariants && product.productVariants && product.productVariants.length > 0) {
      const variantDiscounts = product.productVariants
        .filter((v: any) => v.compareAtPrice && Number(v.compareAtPrice) > Number(v.price))
        .map((v: any) => getDiscount(v.price, v.compareAtPrice))
        .filter((d): d is number => d !== null);
      
      if (variantDiscounts.length > 0) {
        return Math.max(...variantDiscounts);
      }
    }
    
    // Check legacy variations
    if (product?.isParent && product.variations && product.variations.length > 0) {
      const variantDiscounts = product.variations
        .filter((v: any) => v.compareAtPrice && Number(v.compareAtPrice) > Number(v.price))
        .map((v: any) => getDiscount(v.price, v.compareAtPrice))
        .filter((d): d is number => d !== null);
      
      if (variantDiscounts.length > 0) {
        return Math.max(...variantDiscounts);
      }
    }
    
    if (product?.price) {
      return getDiscount(product.price, product.compareAtPrice);
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2 text-foreground">Product Not Found</h1>
          <Link href="/" className="text-primary hover:underline">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const discount = getBestDiscount();

  return (
    <div className="min-h-screen bg-background">
      <ThemeRenderer component="header" showLocationFilter={false} showBookingsLink={true} />

      <CategoryNav mode="navigation" />

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          <CategorySidebar />
          <div className="flex-1">
            {/* Breadcrumb */}
            <div className="bg-card border-b border-border mb-4">
              <div className="px-4 py-3">
                <div className="flex items-center gap-2 text-sm">
                  <Link href="/" className="text-muted-foreground hover:text-primary">
                    Home
                  </Link>
            {product.categories && product.categories.length > 0 && (
              <>
                <span className="text-muted-foreground">/</span>
                <Link 
                  href={`/category/${product.categories[0].slug}`}
                  className="text-muted-foreground hover:text-primary"
                >
                  {product.categories[0].name}
                </Link>
              </>
            )}
            <span className="text-muted-foreground">/</span>
            <span className="text-foreground font-medium truncate">{product.name}</span>
                </div>
              </div>
            </div>

            {/* Product Detail */}
            <Link 
              href="/"
              className="inline-flex items-center gap-2 text-primary hover:underline mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Products
            </Link>

            <div className="bg-card rounded-lg shadow-sm overflow-hidden border border-border">
              <div className="grid md:grid-cols-2 gap-8 p-8">
                {/* Product Image Gallery */}
                <ProductImageGallery
                  images={product.images && product.images.length > 0 ? product.images : [product.featuredImage]}
                  productName={product.name}
                  discount={discount || undefined}
                  layout={thumbnailLayout}
                />

                {/* Product Info */}
                <div className="flex flex-col">
                  <h1 className="text-3xl font-bold mb-3 text-foreground">{product.name}</h1>
              
                  <p className="text-muted-foreground mb-4">{product.shortDescription}</p>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1 bg-accent text-primary-foreground px-3 py-1 rounded">
                  <span className="font-semibold">{Number(product.averageRating).toFixed(1)}</span>
                  <Star className="w-4 h-4 fill-white" />
                </div>
                <span className="text-muted-foreground">
                  {product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'}
                </span>
              </div>

              {/* Product Variants - Amazon Style Selector */}
              {product.hasVariants && product.variantOptions && product.productVariants && product.productVariants.length > 0 && (
                <div className="mb-6">
                  <ProductVariantSelector
                    variantOptions={product.variantOptions}
                    productVariants={product.productVariants}
                    onVariantSelect={setSelectedVariant}
                    currency={currency}
                  />
                </div>
              )}

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-4xl font-bold text-foreground">
                    {/* Show "From" prefix if has variants but none selected */}
                    {((product.hasVariants && !selectedVariant) || (product.isParent && !selectedVariation)) && (
                      <span className="text-2xl font-normal text-muted-foreground mr-1">From </span>
                    )}
                    {getCurrencySymbol(currency)}{getDisplayPrice().toLocaleString()}
                    {product.productType === 'booking' && product.attributes?.booking?.durationUnit && (
                      <span className="text-lg font-normal text-muted-foreground">
                        /{product.attributes.booking.durationUnit === 'hours' ? 'hr' : product.attributes.booking.durationUnit === 'days' ? 'day' : 'session'}
                      </span>
                    )}
                  </span>
                  {/* Show discount for selected variant */}
                  {selectedVariant && selectedVariant.compareAtPrice && Number(selectedVariant.compareAtPrice) > Number(selectedVariant.price) && (
                    <>
                      <span className="text-xl text-muted-foreground line-through">
                        {getCurrencySymbol(currency)}{Number(selectedVariant.compareAtPrice).toLocaleString()}
                      </span>
                      <span className="text-green-600 font-semibold">
                        {getDiscount(selectedVariant.price, selectedVariant.compareAtPrice)}% off
                      </span>
                    </>
                  )}
                  {/* Show discount for main product if no variants selected */}
                  {!selectedVariant && !selectedVariation && !product.hasVariants && product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && !product.isParent && (
                    <>
                      <span className="text-xl text-muted-foreground line-through">
                        {getCurrencySymbol(currency)}{Number(product.compareAtPrice).toLocaleString()}
                      </span>
                      <span className="text-green-600 font-semibold">
                        {discount}% off
                      </span>
                    </>
                  )}
                  {/* Show best discount for products with variants */}
                  {(product.isParent && !selectedVariation && getBestDiscount()) && (
                    <span className="text-green-600 font-semibold">
                      Up to {getBestDiscount()}% off
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Inclusive of all taxes</p>
              </div>

              {/* Product Variations */}
              {product.isParent && product.variations && product.variations.length > 0 && product.variationThemes && (
                <div className="mb-6">
                  <VariationSelector
                    variations={product.variations}
                    variationThemes={product.variationThemes}
                    currentPrice={typeof product.price === 'string' ? parseFloat(product.price) : product.price}
                    currency={getCurrencySymbol(currency)}
                    onVariationSelect={(variation) => setSelectedVariation(variation)}
                  />
                </div>
              )}

              {/* Quantity or Booking Info */}
              {product.productType === 'physical' ? (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-muted text-foreground"
                    >
                      -
                    </button>
                    <span className="text-lg font-semibold w-12 text-center text-foreground">{quantity}</span>
                    <button
                      onClick={() => {
                        const maxStock = product.isParent 
                          ? (selectedVariation?.stockQuantity || 999)
                          : (selectedVariant?.stockQuantity || product.stockQuantity || 999);
                        
                        const newQuantity = quantity + 1;
                        
                        if (newQuantity > maxStock) {
                          alert(`Cannot add more. Maximum ${maxStock} items available in stock.`);
                        } else {
                          setQuantity(newQuantity);
                        }
                      }}
                      disabled={quantity >= (product.isParent 
                        ? (selectedVariation?.stockQuantity || 999)
                        : (selectedVariant?.stockQuantity || product.stockQuantity || 999))}
                      className="px-4 py-2 border border-border rounded-lg hover:bg-muted text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                  {product.isParent ? (
                    selectedVariation && selectedVariation.stockQuantity !== undefined && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedVariation.stockQuantity > 0 
                          ? `${selectedVariation.stockQuantity} in stock` 
                          : 'Out of stock'}
                      </p>
                    )
                  ) : product.stockQuantity !== undefined && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {product.stockQuantity > 0 
                        ? `${product.stockQuantity} in stock` 
                        : 'Out of stock'}
                    </p>
                  )}
                </div>
              ) : product.productType === 'booking' ? (
                <div className="mb-6">
                  {product.attributes?.tour?.tourMode ? (
                    <>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
                        <Calendar className="w-5 h-5 text-primary" />
                        Select Tour Departure
                      </h3>
                      <TourDepartureSelector
                        departures={product.attributes.tour.departures}
                        onSelectDeparture={(departure) => {
                          setSelectedBooking({
                            date: departure.departureDate,
                            startTime: null,
                            endTime: null,
                            totalPrice: departure.pricePerPerson,
                            departureId: departure.id,
                          });
                        }}
                      />
                    </>
                  ) : product.attributes?.booking ? (
                    <>
                      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
                        <Calendar className="w-5 h-5 text-primary" />
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
                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded">
                      <p className="text-destructive">Booking configuration not found for this product.</p>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Actions */}
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
                        {selectedBooking ? `Book Now - ${getCurrencySymbol(currency)}${selectedBooking.totalPrice.toLocaleString()}` : 'Select Date & Time'}
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={handleAddToCart}
                      disabled={
                        addToCartLoading || 
                        (product.isParent && !selectedVariation) ||
                        (product.isParent && selectedVariation && selectedVariation.stockQuantity === 0) ||
                        (!product.isParent && product.stockQuantity !== undefined && product.stockQuantity === 0)
                      }
                      className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {addToCartLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          Adding...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-5 h-5" />
                          {product.isParent && !selectedVariation 
                            ? 'Select Options' 
                            : (product.isParent && selectedVariation && selectedVariation.stockQuantity === 0) || (!product.isParent && product.stockQuantity === 0)
                            ? 'Out of Stock' 
                            : 'Add to Cart'}
                        </>
                      )}
                    </button>
                    <button 
                      onClick={handleBuyNow}
                      disabled={
                        addToCartLoading || 
                        (product.isParent && !selectedVariation) ||
                        (product.isParent && selectedVariation && selectedVariation.stockQuantity === 0) ||
                        (!product.isParent && product.stockQuantity !== undefined && product.stockQuantity === 0)
                      }
                      className="flex-1 bg-accent text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Buy Now
                    </button>
                  </>
                )}
              </div>

              {/* Policies */}
              {(vendorReturnPolicy?.enabled || vendorCancellationPolicy?.enabled) && (
                <div className="border border-border rounded-lg p-4 bg-card/50">
                  <h4 className="font-semibold text-sm mb-3 text-foreground">Policies</h4>
                  <div className="space-y-3">
                    {vendorReturnPolicy?.enabled && (
                      <div className="flex gap-3">
                        <Package className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-sm text-foreground">Return Policy</div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {vendorReturnPolicy.text}
                          </p>
                        </div>
                      </div>
                    )}
                    {vendorCancellationPolicy?.enabled && (
                      <div className="flex gap-3">
                        <XCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-sm text-foreground">Cancellation Policy</div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {vendorCancellationPolicy.text}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Additional Actions */}
              <div className="flex gap-4 relative">
                <button 
                  onClick={handleWishlistToggle}
                  className={`flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted text-foreground transition-colors ${
                    product && isInWishlist(product.id) ? 'bg-red-50 border-red-300 text-red-600 dark:bg-red-900/20 dark:border-red-800' : ''
                  }`}
                >
                  <Heart 
                    className={`w-5 h-5 ${
                      product && isInWishlist(product.id) ? 'fill-red-600' : ''
                    }`}
                  />
                  {product && isInWishlist(product.id) ? 'In Wishlist' : 'Wishlist'}
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowShareMenu(!showShareMenu)}
                    className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg hover:bg-muted text-foreground"
                  >
                    <Share2 className="w-5 h-5" />
                    Share
                  </button>
                  
                  {showShareMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowShareMenu(false)}
                      />
                      <div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-lg shadow-lg p-4 z-[60] min-w-[240px]">
                        <div className="text-sm font-semibold mb-3 text-foreground">Share this product</div>
                        <div className="space-y-2">
                          <button
                            onClick={() => handleShare('facebook')}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg text-foreground transition-colors"
                          >
                            <Facebook className="w-5 h-5 text-blue-600" />
                            <span>Facebook</span>
                          </button>
                          <button
                            onClick={() => handleShare('twitter')}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg text-foreground transition-colors"
                          >
                            <Twitter className="w-5 h-5 text-sky-500" />
                            <span>Twitter</span>
                          </button>
                          <button
                            onClick={() => handleShare('linkedin')}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg text-foreground transition-colors"
                          >
                            <Linkedin className="w-5 h-5 text-blue-700" />
                            <span>LinkedIn</span>
                          </button>
                          <button
                            onClick={() => handleShare('whatsapp')}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg text-foreground transition-colors"
                          >
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                            <span>WhatsApp</span>
                          </button>
                          <div className="border-t border-border my-2"></div>
                          <button
                            onClick={() => handleShare('copy')}
                            className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted rounded-lg text-foreground transition-colors"
                          >
                            {copied ? (
                              <>
                                <Check className="w-5 h-5 text-green-600" />
                                <span className="text-green-600">Link Copied!</span>
                              </>
                            ) : (
                              <>
                                <LinkIcon className="w-5 h-5" />
                                <span>Copy Link</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Categories */}
              {product.categories && product.categories.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h3 className="font-semibold mb-2 text-foreground">Categories:</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/category/${category.slug}`}
                        className="px-3 py-1 bg-muted rounded-full text-sm hover:bg-muted/80 text-foreground"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Vendor Website Link */}
              {product.vendor && product.vendor.subdomain && (
                <div className="mt-4 pt-4 border-t border-border">
                  <h3 className="font-semibold mb-2 text-foreground">Sold by:</h3>
                  <a
                    href={`http://${product.vendor.subdomain}.localhost:3000`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <span className="font-medium">{product.vendor.storeName || product.vendor.businessName}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  {vendorStats && (
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <RatingDisplay rating={vendorStats.averageRating} size="sm" />
                        <span className="text-muted-foreground">({vendorStats.totalReviews} reviews)</span>
                      </div>
                      {vendorStats.averageProductQuality && (
                        <div className="text-muted-foreground">
                          Quality: {vendorStats.averageProductQuality.toFixed(1)}/5
                        </div>
                      )}
                      {vendorStats.averageShippingSpeed && (
                        <div className="text-muted-foreground">
                          Shipping: {vendorStats.averageShippingSpeed.toFixed(1)}/5
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">Visit vendor's store</p>
                </div>
              )}
            </div>
          </div>

          {/* Product Description */}
          <div className="border-t border-border p-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Product Description</h2>
            <div className="prose max-w-none text-muted-foreground">
              {product.description ? (
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
              ) : (
                <p>{product.shortDescription}</p>
              )}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="border-t border-border p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Customer Reviews</h2>
                <div className="flex items-center gap-2 mt-2">
                  {product.reviewCount > 0 ? (
                    <RatingDisplay 
                      rating={Number(product.averageRating)} 
                      count={product.reviewCount}
                      size="lg"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">No reviews yet</p>
                  )}
                </div>
                <div className="flex gap-3 mt-3">
                  {/* View Comments Button */}
                  {product.reviewCount > 0 && (
                    <button
                      onClick={handleShowReviews}
                      className="text-primary hover:underline font-medium flex items-center gap-2"
                    >
                      {showReviews ? '▼ Hide Comments' : `▶ View All ${product.reviewCount} Comments`}
                    </button>
                  )}
                  {/* Write Review Button */}
                  <button
                    onClick={handleWriteReview}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    Write a Review
                  </button>
                </div>
                {/* Purchase verification message */}
                {isLoggedIn && !hasPurchased && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ⓘ Purchase this product to write a verified review
                  </p>
                )}
              </div>
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <div className="mb-6">
                <ReviewForm
                  type="product"
                  itemId={product.id}
                  itemName={product.name}
                  orderItemId={userOrderItemId}
                  onSubmit={handleReviewSubmit}
                  onCancel={() => setShowReviewForm(false)}
                />
              </div>
            )}

            {showReviews && (
              reviewsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading reviews...</div>
              ) : reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-muted/50 rounded-lg">
                  <Star className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No reviews yet. Be the first to review this product!</p>
                </div>
              )
            )}
          </div>
        </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
