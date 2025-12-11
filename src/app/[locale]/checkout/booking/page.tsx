'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatPrice } from '@/lib/currency';
import { useRazorpay } from '@/hooks/useRazorpay';
import Header from '@/components/Header';
import { 
  Calendar, 
  MapPin, 
  CreditCard, 
  CheckCircle, 
  ChevronRight,
  Lock,
  ArrowLeft,
  Clock
} from 'lucide-react';
import Link from 'next/link';
import { useLocale } from 'next-intl';

type CheckoutStep = 'review' | 'payment' | 'confirmation';

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
  const locale = useLocale();
  const { createOrder: createRazorpayOrder, verifyPayment, openCheckout } = useRazorpay();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('review');
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [user, setUser] = useState<any>(null);
  const [marketplaceLogo, setMarketplaceLogo] = useState('');
  const [marketplaceName, setMarketplaceName] = useState('Marketplace');
  const [currency, setCurrency] = useState('INR');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [orderId, setOrderId] = useState<string>('');

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

    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/settings/currency`)
      .then(res => res.json())
      .then(data => setCurrency(data.value || 'INR'))
      .catch(err => console.error('Error fetching currency:', err));

    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      alert('Please login to continue');
      router.push(`/${locale}/login`);
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      
      // Fetch bookings
      const bookingIds = searchParams.get('bookingIds')?.split(',') || [];
      if (bookingIds.length === 0) {
        alert('No bookings found');
        router.push(`/${locale}`);
        return;
      }
      
      fetchBookings(bookingIds, token);
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }, [router, searchParams, locale]);

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

  const totalAmount = bookings.reduce((sum, booking) => sum + Number(booking.totalPrice), 0);

  const handlePayment = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (paymentMethod === 'razorpay') {
        // Create Razorpay order using the first booking ID
        const razorpayOrder = await createRazorpayOrder(bookings[0].id, totalAmount);
        
        // Open Razorpay checkout
        openCheckout(
          {
            order_id: razorpayOrder.id,
            amount: totalAmount * 100, // Razorpay expects amount in paise
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
            // onSuccess callback - response contains razorpay_order_id, razorpay_payment_id, razorpay_signature
            try {
              // Verify payment
              const verified = await verifyPayment(
                response.razorpay_order_id,
                response.razorpay_payment_id,
                response.razorpay_signature,
                'success'
              );

              if (verified) {
                // Create payment record and update bookings
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
            // onFailure callback
            console.error('Payment failed:', error);
            alert('Payment failed. Please try again.');
            setLoading(false);
          }
        );
      } else {
        // COD - just confirm bookings
        await confirmBookings();
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
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
    const steps: CheckoutStep[] = ['review', 'payment', 'confirmation'];
    return steps.indexOf(step) + 1;
  };

  const isStepCompleted = (step: CheckoutStep): boolean => {
    return getStepNumber(step) < getStepNumber(currentStep);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header showLocationFilter={false} showBookingsLink={false} />
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
        <Header showLocationFilter={false} showBookingsLink={false} />
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
              {bookings.map((booking, index) => (
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
              ))}
              <div className="pt-4 border-t border-border">
                <p className="text-lg font-bold text-foreground">
                  Total: {formatPrice(totalAmount, currency)}
                </p>
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Link
                href={`/${locale}`}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Continue Shopping
              </Link>
              <Link
                href={`/${locale}/orders`}
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
      <Header showLocationFilter={false} showBookingsLink={false} />
      
      <div className="container mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {(['review', 'payment'] as CheckoutStep[]).map((step, index) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isStepCompleted(step) || currentStep === step
                      ? 'bg-blue-600 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {isStepCompleted(step) ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>
                  <span className="ml-2 text-sm font-medium capitalize hidden sm:inline">
                    {step}
                  </span>
                </div>
                {index < 1 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    isStepCompleted((['review', 'payment'] as CheckoutStep[])[index + 1])
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
                  Review Your Bookings
                </h2>

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

                <button
                  onClick={() => setCurrentStep('payment')}
                  className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  Proceed to Payment
                  <ChevronRight className="w-5 h-5" />
                </button>
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
                    onClick={() => setCurrentStep('review')}
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
              <h3 className="text-lg font-bold text-foreground mb-4">Booking Summary</h3>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bookings ({bookings.length})</span>
                  <span className="font-semibold">{formatPrice(totalAmount, currency)}</span>
                </div>
              </div>

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
