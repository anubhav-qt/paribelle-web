'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatPrice } from '@/lib/currency';
import { useRazorpay } from '@/hooks/useRazorpay';
import ThemeRenderer from '@/components/ThemeRenderer';
import { 
  Calendar, 
  MapPin, 
  CreditCard, 
  CheckCircle, 
  ChevronRight,
  Lock,
  ArrowLeft,
  Clock,
  Plus,
  Edit2,
  Trash2,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { useThemeClasses } from '@/hooks/useThemeClasses';

type CheckoutStep = 'review' | 'address' | 'payment' | 'confirmation';

interface Address {
  id?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault?: boolean;
}

interface Booking {
  id: string;
  bookingDate: string | Date;
  startTime: string | null;
  endTime: string | null;
  totalPrice: number;
  status: string;
  product: {
    id: string;
    name: string;
    featuredImage: string;
  };
}

function BookingCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { createOrder: createRazorpayOrder, verifyPayment, openCheckout } = useRazorpay();
  const theme = useThemeClasses();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('review');
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [user, setUser] = useState<any>(null);
  const [marketplaceLogo, setMarketplaceLogo] = useState('');
  const [marketplaceName, setMarketplaceName] = useState('GaliCart');
  const [currency, setCurrency] = useState('INR');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [orderId, setOrderId] = useState<string>('');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState<Address>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });
  const [tourBooking, setTourBooking] = useState<any>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [selectedDepartureId, setSelectedDepartureId] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  useEffect(() => {
    // Fetch marketplace branding
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/settings/marketplace_logo`)
      .then(res => res.json())
      .then(data => setMarketplaceLogo(data.value || ''))
      .catch(err => console.error('Error fetching marketplace logo:', err));
    
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/settings/marketplace_name`)
      .then(res => res.json())
      .then(data => setMarketplaceName(data.value || 'GaliCart'))
      .catch(err => console.error('Error fetching marketplace name:', err));

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/settings/currency`)
      .then(res => res.json())
      .then(data => setCurrency(data.value || 'INR'))
      .catch(err => console.error('Error fetching currency:', err));

    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      alert('Please login to continue');
      router.push('/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      
      // Validate user session by checking if user exists in database
      const validateAndProceed = async () => {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/${parsedUser.id}`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );
          
          if (!response.ok) {
            // User doesn't exist in database - session is stale
            alert('Your session has expired or is invalid. Please log in again.');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
            return;
          }
        } catch (error) {
          console.error('Error validating user:', error);
          // Continue anyway if validation fails due to network issues
        }
        
        // Fetch saved addresses
        fetchSavedAddresses(token);
        
        // Check if this is a tour booking
        const bookingType = searchParams.get('type');
        if (bookingType === 'tour') {
          const tourBookingData = sessionStorage.getItem('tourBooking');
          if (tourBookingData) {
            const tourData = JSON.parse(tourBookingData);
            console.log('Tour booking data loaded:', tourData);
            console.log('Available departures:', tourData.availableDepartures);
            
            setTourBooking(tourData);
            if (tourData.selectedDeparture) {
              setSelectedDepartureId(tourData.selectedDeparture.id);
              setBookingDate(tourData.selectedDeparture.departureDate.split('T')[0]);
            } else if (tourData.availableDepartures && tourData.availableDepartures.length > 0) {
              setSelectedDepartureId(tourData.availableDepartures[0].id);
              setBookingDate(tourData.availableDepartures[0].departureDate.split('T')[0]);
            } else {
              // Fallback: allow manual date selection
              console.warn('No available departures found, allowing manual date selection');
              setBookingDate(new Date().toISOString().split('T')[0]);
            }
            setLoading(false);
            return;
          } else {
            alert('Tour booking data not found');
            router.push('/');
            return;
          }
        }
        
        // Regular booking flow
        const bookingIds = searchParams.get('bookingIds')?.split(',') || [];
        if (bookingIds.length === 0) {
          alert('No bookings found');
          router.push('/');
          return;
        }
        
        fetchBookings(bookingIds, token);
      };
      
      // Call the async validation and proceed function
      validateAndProceed();
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }, [router, searchParams]);

  const fetchBookings = async (bookingIds: string[], token: string) => {
    try {
      console.log('Fetching bookings with IDs:', bookingIds);
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
      console.log('Token:', token ? 'Present' : 'Missing');
      
      // First test if backend is reachable
      try {
        const healthCheck = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories`);
        console.log('Backend health check (categories endpoint):', healthCheck.status);
      } catch (e) {
        console.error('Backend appears to be down:', e);
        throw new Error('Cannot connect to backend server');
      }
      
      const promises = bookingIds.map(id => {
        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/bookings/${id}`;
        console.log('Fetching from:', url);
        return fetch(url, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      });
      
      const responses = await Promise.all(promises);
      
      // Log response status
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        console.log(`Response ${i} status:`, response.status, response.statusText);
        console.log(`Response ${i} URL:`, response.url);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Response ${i} error body:`, errorText);
        }
      }
      
      // Check for errors
      const failedResponses = responses.filter(r => !r.ok);
      if (failedResponses.length > 0) {
        console.error('Failed responses count:', failedResponses.length);
        throw new Error(`Failed to fetch bookings: ${failedResponses[0].status} ${failedResponses[0].statusText}`);
      }
      
      const bookingsData = await Promise.all(responses.map(r => r.json()));
      
      console.log('Fetched bookings data:', bookingsData);
      console.log('First booking:', JSON.stringify(bookingsData[0], null, 2));
      
      setBookings(bookingsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      alert(`Failed to load booking details: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoading(false);
    }
  };

  const fetchSavedAddresses = async (token: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/user/addresses`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setAddresses(data);
          // Auto-select default address
          const defaultAddr = data.find((a: Address) => a.isDefault);
          if (defaultAddr) {
            setSelectedAddress(defaultAddr);
          } else {
            setSelectedAddress(data[0]);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching saved addresses:', error);
    }
  };

  const formatDate = (date: string | Date): string => {
    try {
      console.log('Formatting date:', date, 'Type:', typeof date);
      
      if (!date) return 'No date';
      
      // Handle different date formats
      let dateObj: Date;
      
      if (typeof date === 'string') {
        // If it's a date string like "2024-12-11", parse it properly
        if (date.includes('T')) {
          dateObj = new Date(date);
        } else {
          // For date-only strings, add time to avoid timezone issues
          dateObj = new Date(date + 'T00:00:00');
        }
      } else {
        dateObj = new Date(date);
      }
      
      console.log('Parsed date object:', dateObj);
      
      if (isNaN(dateObj.getTime())) {
        console.error('Invalid date:', date);
        return 'Invalid Date';
      }
      
      return dateObj.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Invalid Date';
    }
  };

  const totalAmount = tourBooking 
    ? tourBooking.totalPrice 
    : bookings.reduce((sum, booking) => sum + Number(booking.totalPrice), 0);

  const handlePayment = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (paymentMethod === 'razorpay') {
        // Handle tour booking creation
        if (tourBooking) {
          // Create booking first for tours
          const bookingResponse = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/bookings`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                productId: tourBooking.productId,
                userId: user.id,
                vendorId: tourBooking.vendorId,
                bookingDate: bookingDate,
                numberOfGuests: tourBooking.numberOfGuests,
                totalPrice: tourBooking.totalPrice,
                specialRequests: specialRequests || null,
                status: 'pending',
                departureId: selectedDepartureId,
              }),
            }
          );

          if (!bookingResponse.ok) {
            const errorData = await bookingResponse.json().catch(() => ({}));
            
            // Check if it's a USER_NOT_FOUND error (session expired)
            if (errorData.error === 'USER_NOT_FOUND' || errorData.message?.includes('session has expired')) {
              alert('Your session has expired. Please log in again.');
              // Clear localStorage
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              // Redirect to login with return URL
              router.push(`/login?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
              return;
            }
            
            throw new Error(errorData.message || 'Failed to create booking');
          }

          const booking = await bookingResponse.json();
          console.log('Booking created:', booking);
          
          // Create Razorpay order
          console.log('Creating Razorpay order for booking:', booking.id, 'amount:', tourBooking.totalPrice);
          const razorpayOrder = await createRazorpayOrder(booking.id, tourBooking.totalPrice);
          console.log('Razorpay order created:', razorpayOrder);
          
          // Open Razorpay checkout
          openCheckout(
            {
              order_id: razorpayOrder.id,
              amount: tourBooking.totalPrice * 100,
              currency: currency,
              name: marketplaceName,
              description: tourBooking.productName,
              prefill: {
                name: user.firstName + ' ' + user.lastName,
                email: user.email,
                contact: user.phone || '',
              },
            },
            async (response) => {
              try {
                await verifyPayment(
                  response.razorpay_order_id,
                  response.razorpay_payment_id,
                  response.razorpay_signature,
                  'success'
                );

                // Update booking status
                await fetch(
                  `${process.env.NEXT_PUBLIC_API_URL}/api/v1/bookings/${booking.id}`,
                  {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      status: 'confirmed',
                      paymentId: response.razorpay_payment_id,
                    }),
                  }
                );

                sessionStorage.removeItem('tourBooking');
                router.push('/profile?tab=bookings&success=true');
              } catch (error) {
                console.error('Payment verification error:', error);
                alert('Payment verification failed');
                setLoading(false);
              }
            },
            (error) => {
              console.error('Payment failed:', error);
              alert('Payment failed. Please try again.');
              setLoading(false);
            }
          );
        } else {
          // Regular booking flow
          const razorpayOrder = await createRazorpayOrder(bookings[0].id, totalAmount);
          
          openCheckout(
            {
              order_id: razorpayOrder.id,
              amount: totalAmount * 100,
              currency: currency,
              name: marketplaceName,
              description: `Booking Payment for ${bookings.length} booking(s)`,
              prefill: {
                name: user.firstName + ' ' + user.lastName,
                email: user.email,
                contact: user.phone || '',
              },
            },
            async (response) => {
              try {
                const verified = await verifyPayment(
                  response.razorpay_order_id,
                  response.razorpay_payment_id,
                  response.razorpay_signature,
                  'success'
                );

                if (verified) {
                  await handlePaymentSuccess(response.razorpay_payment_id, response.razorpay_order_id);
                } else {
                  alert('Payment verification failed');
                  setLoading(false);
                }
              } catch (error) {
                console.error('Payment verification error:', error);
                alert('Payment verification failed');
                setLoading(false);
              }
            },
            (error) => {
              console.error('Payment failed:', error);
              alert('Payment failed. Please try again.');
              setLoading(false);
            }
          );
        }
      } else {
        // COD - just confirm bookings
        await confirmBookings();
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Payment failed: ${errorMessage}\n\nPlease check:\n- Your internet connection\n- Payment gateway configuration\n- Backend server status`);
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string, razorpayOrderId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      // Create payment record
      const paymentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: totalAmount,
          currency: currency,
          paymentMethod: 'razorpay',
          status: 'completed',
          razorpayOrderId: razorpayOrderId,
          razorpayPaymentId: paymentId,
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error('Failed to create payment record');
      }

      const payment = await paymentResponse.json();

      // Update all bookings with payment ID and confirm them
      const updatePromises = bookings.map(booking =>
        Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/bookings/${booking.id}/payment`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ paymentId: payment.id }),
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/bookings/${booking.id}/status`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ status: 'confirmed' }),
          })
        ])
      );

      await Promise.all(updatePromises);
      
      setCurrentStep('confirmation');
      setOrderId(payment.id);
      setLoading(false);
    } catch (error) {
      console.error('Error updating bookings:', error);
      alert('Payment successful but failed to update booking status. Please contact support.');
      setLoading(false);
    }
  };

  const confirmBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Update all bookings to confirmed status (for COD)
      const updatePromises = bookings.map(booking =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/bookings/${booking.id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: 'confirmed' }),
        })
      );

      await Promise.all(updatePromises);
      
      setCurrentStep('confirmation');
      setLoading(false);
    } catch (error) {
      console.error('Error confirming bookings:', error);
      alert('Failed to confirm bookings. Please try again.');
      setLoading(false);
    }
  };

  const getStepNumber = (step: CheckoutStep): number => {
    const steps: CheckoutStep[] = ['review', 'address', 'payment', 'confirmation'];
    return steps.indexOf(step) + 1;
  };

  const isStepCompleted = (step: CheckoutStep): boolean => {
    return getStepNumber(step) < getStepNumber(currentStep);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <ThemeRenderer component="header" showLocationFilter={false} showBookingsLink={false} />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (currentStep === 'confirmation') {
    return (
      <div className="min-h-screen bg-background">
        <ThemeRenderer component="header" showLocationFilter={false} showBookingsLink={false} />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto bg-card rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">Booking Confirmed!</h1>
            <p className="text-muted-foreground mb-6">
              Your booking has been confirmed successfully. You will receive a confirmation email shortly.
            </p>
            
            <div className="bg-muted rounded-lg p-6 mb-6">
              <h2 className="font-semibold text-foreground mb-4">Booking Summary</h2>
              {tourBooking ? (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>{tourBooking.productName}</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {tourBooking.numberOfGuests} {tourBooking.numberOfGuests === 1 ? 'Person' : 'People'}
                  </p>
                  {tourBooking.departureDate && (
                    <p className="text-sm text-muted-foreground">
                      Departure: {new Date(tourBooking.departureDate).toLocaleDateString()}
                    </p>
                  )}
                  <p className="text-sm font-semibold text-foreground">
                    {formatPrice(tourBooking.totalPrice, currency)}
                  </p>
                </div>
              ) : (
                bookings.map((booking) => (
                  <div key={booking.id} className="mb-4 pb-4 border-b border-border last:border-b-0">
                    <p className="text-sm text-muted-foreground">
                      <strong>{booking.product?.name || 'Booking Service'}</strong>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Date: {formatDate(booking.bookingDate)}
                    </p>
                    {booking.startTime && booking.endTime && (
                      <p className="text-sm text-muted-foreground">
                        Time: {booking.startTime} - {booking.endTime}
                      </p>
                    )}
                    <p className="text-sm font-semibold text-foreground">
                      {formatPrice(Number(booking.totalPrice), currency)}
                    </p>
                  </div>
                ))
              )}
              <div className="pt-4 border-t border-border">
                <p className="text-lg font-bold text-foreground">
                  Total: {formatPrice(totalAmount, currency)}
                </p>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Link
                href="/"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Continue Shopping
              </Link>
              <Link
                href="/profile"
                className="px-6 py-3 border border-border text-foreground rounded-lg hover:bg-muted transition"
              >
                View My Bookings
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ThemeRenderer component="header" showLocationFilter={false} showBookingsLink={false} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Progress Steps - Skip address step for tours */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {(tourBooking ? ['review', 'payment'] : ['review', 'address', 'payment']).map((step, index, arr) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isStepCompleted(step as CheckoutStep) || currentStep === step
                      ? 'bg-blue-600 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {isStepCompleted(step as CheckoutStep) ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <span className="ml-2 text-sm font-medium capitalize hidden sm:inline">
                    {step}
                  </span>
                </div>
                {index < arr.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    isStepCompleted(arr[index + 1] as CheckoutStep)
                      ? 'bg-blue-600'
                      : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {currentStep === 'review' && (
              <div className="bg-card rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <Calendar className="w-6 h-6" />
                  {tourBooking ? 'Tour Booking' : 'Review Your Bookings'}
                </h2>

                {tourBooking ? (
                  <div className="space-y-4">
                    <div className="flex gap-4 p-4 border border-border rounded-lg">
                      {tourBooking.productImage && (
                        <img
                          src={tourBooking.productImage}
                          alt={tourBooking.productName}
                          className="w-24 h-24 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{tourBooking.productName}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Users className="w-4 h-4" />
                          {tourBooking.numberOfGuests} {tourBooking.numberOfGuests === 1 ? 'Person' : 'People'}
                        </p>
                        {tourBooking.departureDate && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Departure: {new Date(tourBooking.departureDate).toLocaleDateString()}
                          </p>
                        )}
                        <p className="text-lg font-bold text-foreground mt-2">
                          {formatPrice(tourBooking.totalPrice, currency)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 p-4 border border-border rounded-lg bg-blue-50">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Select Departure Date <span className="text-red-500">*</span>
                        </label>
                        <p className="text-xs text-gray-600 mb-2">Choose from available departure dates</p>
                        {tourBooking.availableDepartures && tourBooking.availableDepartures.length > 0 ? (
                          <select
                            value={selectedDepartureId}
                            onChange={(e) => {
                              const departure = tourBooking.availableDepartures.find(d => d.id === e.target.value);
                              if (departure) {
                                setSelectedDepartureId(departure.id);
                                setBookingDate(departure.departureDate.split('T')[0]);
                              }
                            }}
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                          >
                            {tourBooking.availableDepartures.map((departure) => (
                              <option key={departure.id} value={departure.id}>
                                {new Date(departure.departureDate).toLocaleDateString('en-US', { 
                                  weekday: 'short',
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                })} - {departure.availableSeats} seats available
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div>
                            <input
                              type="date"
                              value={bookingDate}
                              onChange={(e) => setBookingDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                              required
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                            <p className="text-xs text-amber-600 mt-1">⚠️ No pre-scheduled departures. Please contact vendor to confirm availability.</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Special Requests (Optional)
                        </label>
                        <textarea
                          value={specialRequests}
                          onChange={(e) => setSpecialRequests(e.target.value)}
                          rows={3}
                          placeholder="Any special requirements..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <div key={booking.id} className="flex gap-4 p-4 border border-border rounded-lg">
                        <img
                          src={booking.product?.featuredImage || '/placeholder-image.svg'}
                          alt={booking.product?.name || 'Booking'}
                          className="w-24 h-24 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{booking.product?.name || 'Booking Service'}</h3>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(booking.bookingDate)}
                          </p>
                          {booking.startTime && booking.endTime && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {booking.startTime} - {booking.endTime}
                            </p>
                          )}
                          <p className="text-lg font-bold text-foreground mt-2">
                            {formatPrice(Number(booking.totalPrice), currency)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => tourBooking ? setCurrentStep('payment') : setCurrentStep('address')}
                  disabled={tourBooking && !bookingDate}
                  className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {tourBooking ? 'Proceed to Payment' : 'Proceed to Address'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {currentStep === 'address' && (
              <div className="bg-card rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <MapPin className="w-6 h-6" />
                  Service Address
                </h2>

                {!showAddressForm ? (
                  <div className="space-y-4">
                    {/* Saved Addresses */}
                    {addresses.length > 0 ? (
                      addresses.map((addr, index) => (
                        <label
                          key={index}
                          className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                            selectedAddress === addr
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                              : 'border-border hover:border-blue-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="address"
                            checked={selectedAddress === addr}
                            onChange={() => setSelectedAddress(addr)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-foreground">{addr.fullName}</p>
                              {addr.isDefault && (
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Default</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{addr.addressLine1}</p>
                            {addr.addressLine2 && (
                              <p className="text-sm text-muted-foreground">{addr.addressLine2}</p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              {addr.city}, {addr.state} - {addr.postalCode}
                            </p>
                            <p className="text-sm text-muted-foreground">Phone: {addr.phone}</p>
                          </div>
                        </label>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        No saved addresses. Add a new address to continue.
                      </p>
                    )}

                    {/* Add New Address Button */}
                    <button
                      onClick={() => {
                        setShowAddressForm(true);
                        setEditingAddress(null);
                        setAddressForm({
                          fullName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : '',
                          phone: user?.phone || '',
                          addressLine1: '',
                          addressLine2: '',
                          city: '',
                          state: '',
                          postalCode: '',
                          country: 'India',
                        });
                      }}
                      className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg hover:border-blue-500 hover:bg-muted transition text-muted-foreground"
                    >
                      <Plus className="w-5 h-5" />
                      Add New Address
                    </button>

                    {/* Navigation Buttons */}
                    <div className="flex gap-4 mt-6">
                      <button
                        onClick={() => setCurrentStep('review')}
                        className="flex-1 border border-border text-foreground py-3 rounded-lg hover:bg-muted transition flex items-center justify-center gap-2"
                      >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                      </button>
                      <button
                        onClick={() => {
                          if (!selectedAddress) {
                            alert('Please select or add an address');
                            return;
                          }
                          setCurrentStep('payment');
                        }}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                      >
                        Continue to Payment
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Address Form */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Full Name *</label>
                        <input
                          type="text"
                          value={addressForm.fullName}
                          onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Phone Number *</label>
                        <input
                          type="tel"
                          value={addressForm.phone}
                          onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Address Line 1 *</label>
                      <input
                        type="text"
                        value={addressForm.addressLine1}
                        onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                        placeholder="House No., Building Name"
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Address Line 2</label>
                      <input
                        type="text"
                        value={addressForm.addressLine2}
                        onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                        placeholder="Street, Area, Landmark"
                        className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">City *</label>
                        <input
                          type="text"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">State *</label>
                        <input
                          type="text"
                          value={addressForm.state}
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-2">Postal Code *</label>
                        <input
                          type="text"
                          value={addressForm.postalCode}
                          onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                          maxLength={6}
                          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                          required
                        />
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-4 mt-6">
                      <button
                        onClick={() => setShowAddressForm(false)}
                        className="flex-1 border border-border text-foreground py-3 rounded-lg hover:bg-muted transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          // Validate address
                          if (!addressForm.fullName || !addressForm.phone || !addressForm.addressLine1 || 
                              !addressForm.city || !addressForm.state || !addressForm.postalCode) {
                            alert('Please fill in all required fields');
                            return;
                          }
                          
                          // Add address to list
                          setAddresses([...addresses, { ...addressForm, isDefault: addresses.length === 0 }]);
                          setSelectedAddress(addressForm);
                          setShowAddressForm(false);
                        }}
                        className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition"
                      >
                        Save Address
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentStep === 'payment' && (
              <div className="bg-card rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <CreditCard className="w-6 h-6" />
                  Payment Method
                </h2>

                <div className="space-y-4">
                  <label className="flex items-center gap-3 p-4 border-2 border-border rounded-lg cursor-pointer hover:border-blue-500 transition">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="razorpay"
                      checked={paymentMethod === 'razorpay'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'razorpay' | 'cod')}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="font-semibold">Online Payment (Razorpay)</p>
                      <p className="text-sm text-muted-foreground">Pay securely with card/UPI/wallet</p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-4 border-2 border-border rounded-lg cursor-pointer hover:border-blue-500 transition">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value as 'razorpay' | 'cod')}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="font-semibold">Pay on Service</p>
                      <p className="text-sm text-muted-foreground">Pay when you arrive for your booking</p>
                    </div>
                  </label>
                </div>

                <div className="flex gap-4 mt-6">
                  <button
                    onClick={() => setCurrentStep('address')}
                    className="flex-1 border border-border text-foreground py-3 rounded-lg hover:bg-muted transition flex items-center justify-center gap-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Lock className="w-5 h-5" />
                    {loading ? 'Processing...' : 'Complete Booking'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-lg shadow-sm p-6 sticky top-24">
              <h3 className="text-lg font-bold text-foreground mb-4">
                {tourBooking ? 'Tour Summary' : 'Booking Summary'}
              </h3>
              
              {tourBooking ? (
                <div className="space-y-3 mb-4">
                  <div className="text-sm text-muted-foreground">
                    <strong>{tourBooking.productName}</strong>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Number of People</span>
                    <span className="font-semibold">{tourBooking.numberOfGuests}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price per Person</span>
                    <span className="font-semibold">{formatPrice(tourBooking.pricePerPerson, currency)}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bookings ({bookings.length})</span>
                    <span className="font-semibold">{formatPrice(totalAmount, currency)}</span>
                  </div>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-blue-600">{formatPrice(totalAmount, currency)}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-900 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Secure checkout powered by Razorpay
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <BookingCheckoutContent />
    </Suspense>
  );
}
