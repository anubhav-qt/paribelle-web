'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ThemeRenderer from '@/components/ThemeRenderer';
import Footer from '@/components/Footer';
import { useRazorpay } from '@/hooks/useRazorpay';
import { Calendar, Users, CreditCard, Lock, ArrowLeft, Loader } from 'lucide-react';

interface BookingDetails {
  productId: string;
  productSlug: string;
  productName: string;
  numberOfGuests: number;
  pricePerPerson: number;
  totalPrice: number;
  departureId?: string;
  departureDate?: string;
  vendorId?: string;
}

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { createOrder, verifyPayment, openCheckout } = useRazorpay();

  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [user, setUser] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [bookingDate, setBookingDate] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  useEffect(() => {
    // Load booking details from sessionStorage
    const stored = sessionStorage.getItem('bookingDetails');
    if (stored) {
      const details = JSON.parse(stored);
      if (details.productSlug === slug) {
        setBookingDetails(details);
        // Set default booking date to departure date if available
        if (details.departureDate) {
          setBookingDate(details.departureDate.split('T')[0]);
        }
      } else {
        router.push(`/tours/${slug}`);
      }
    } else {
      router.push(`/tours/${slug}`);
    }

    // Load user info
    const token = localStorage.getItem('token');
    if (!token) {
      router.push(`/login?redirect=/booking/${slug}`);
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setUser(data))
    .catch(err => {
      console.error('Error fetching user:', err);
      router.push(`/login?redirect=/booking/${slug}`);
    });
  }, [slug, router]);

  const handlePayment = async () => {
    if (!bookingDetails || !user) return;

    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      
      // Create booking first
      const bookingResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/bookings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: bookingDetails.productId,
            userId: user.id,
            vendorId: bookingDetails.vendorId,
            bookingDate: bookingDate || new Date().toISOString().split('T')[0],
            numberOfGuests: bookingDetails.numberOfGuests,
            totalPrice: bookingDetails.totalPrice,
            specialRequests: specialRequests || null,
            status: 'pending',
          }),
        }
      );

      if (!bookingResponse.ok) {
        const errorData = await bookingResponse.json();
        throw new Error(errorData.message || 'Failed to create booking');
      }

      const booking = await bookingResponse.json();

      // Create Razorpay order
      const razorpayOrder = await createOrder(
        booking.id,
        bookingDetails.totalPrice
      );

      // Open Razorpay checkout
      openCheckout(
        {
          amount: bookingDetails.totalPrice * 100, // Razorpay expects amount in paise
          currency: 'INR',
          name: bookingDetails.productName,
          description: `Booking for ${bookingDetails.numberOfGuests} people`,
          order_id: razorpayOrder.id,
          prefill: {
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            contact: user.phone || '',
          },
          theme: {
            color: '#3B82F6',
          },
        },
        async (response) => {
          // Payment successful - verify it
          try {
            await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
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

            // Clear session storage
            sessionStorage.removeItem('bookingDetails');
            
            // Redirect to success page
            router.push(`/booking/success/${booking.id}`);
          } catch (error) {
            console.error('Payment verification failed:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        () => {
          setProcessing(false);
          alert('Payment cancelled');
        }
      );
    } catch (error) {
      console.error('Booking error:', error);
      alert(error instanceof Error ? error.message : 'Failed to process booking');
      setProcessing(false);
    }
  };

  if (!bookingDetails || !user) {
    return (
      <>
        <ThemeRenderer component="header" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader className="w-12 h-12 animate-spin text-blue-600" />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <ThemeRenderer component="header" />
      
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Tour</span>
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-8">Complete Your Booking</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Booking Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tour Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Tour Details</h2>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">{bookingDetails.productName}</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-700">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span>{bookingDetails.numberOfGuests} {bookingDetails.numberOfGuests === 1 ? 'Person' : 'People'}</span>
                  </div>
                  {bookingDetails.departureDate && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span>Departure: {new Date(bookingDetails.departureDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Traveler Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Traveler Information</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={`${user.firstName} ${user.lastName}`}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={user.phone || ''}
                      disabled
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Booking Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Special Requests (Optional)
                    </label>
                    <textarea
                      value={specialRequests}
                      onChange={(e) => setSpecialRequests(e.target.value)}
                      rows={4}
                      placeholder="Any dietary restrictions, accessibility needs, or special requests..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Price Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 bg-white border border-gray-200 rounded-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Price Summary</h2>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between text-gray-700">
                    <span>Price per person</span>
                    <span>₹{bookingDetails.pricePerPerson.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-gray-700">
                    <span>Number of people</span>
                    <span>× {bookingDetails.numberOfGuests}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-3 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ₹{bookingDetails.totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={processing || !bookingDate}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      <span>Proceed to Payment</span>
                    </>
                  )}
                </button>

                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-800 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    <span>Secure payment powered by Razorpay</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
