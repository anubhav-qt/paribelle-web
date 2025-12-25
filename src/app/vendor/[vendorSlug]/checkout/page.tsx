'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/currency';
import { useRazorpay } from '@/hooks/useRazorpay';
import VendorHeader from '@/components/VendorHeader';
import CategoryNav from '@/components/CategoryNav';
import { 
  ShoppingBag, 
  MapPin, 
  CreditCard, 
  CheckCircle, 
  ChevronRight,
  Edit2,
  Trash2,
  Lock,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

type CheckoutStep = 'cart' | 'address' | 'payment' | 'confirmation';

interface Address {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export default function VendorCheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const vendorSlug = params.vendorSlug as string;
  const { items, totalPrice, totalItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { createOrder: createRazorpayOrder, verifyPayment, openCheckout } = useRazorpay();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [vendorSettings, setVendorSettings] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const authCheckCompletedRef = useRef(false);
  
  // Address form
  const [address, setAddress] = useState<Address>({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });
  
  // Payment details
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('cod');
  const [orderId, setOrderId] = useState<string>('');

  // Filter items for this vendor
  const vendorItems = items.filter(item => item.vendorSlug === vendorSlug);
  const vendorTotalPrice = vendorItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const vendorTotalItems = vendorItems.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate shipping based on vendor settings
  const freeShippingThreshold = vendorSettings?.freeShippingThreshold || null;
  const baseShippingCost = vendorSettings?.shippingCost || 50;
  const shippingCost = freeShippingThreshold && vendorTotalPrice >= freeShippingThreshold ? 0 : baseShippingCost;
  const tax = vendorTotalPrice * 0.18; // 18% GST
  const finalTotal = vendorTotalPrice + shippingCost + tax;

  // All hooks must be called before any early returns
  const handleAddressChange = useCallback((field: keyof Address, value: string) => {
    setAddress(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleContinueToPayment = useCallback(() => {
    // Validate address
    if (!address.fullName || !address.phone || !address.addressLine1 || 
        !address.city || !address.state || !address.postalCode) {
      alert('Please fill in all required address fields');
      return;
    }
    
    // Validate phone
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(address.phone)) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }
    
    // Validate postal code
    const postalRegex = /^[1-9][0-9]{5}$/;
    if (!postalRegex.test(address.postalCode)) {
      alert('Please enter a valid 6-digit postal code');
      return;
    }
    
    setCurrentStep('payment');
  }, [address]);

  // Debug logging
  useEffect(() => {
    console.log('Checkout Debug:', {
      vendorSlug,
      totalItems: items.length,
      vendorItems: vendorItems.length,
      items: items.map(i => ({ name: i.name, vendorSlug: i.vendorSlug })),
      isAuthChecking,
      hasUser: !!user,
    });
  }, [items, vendorItems, vendorSlug, isAuthChecking, user]);

  useEffect(() => {
    // Only run if auth check hasn't been completed
    if (authCheckCompletedRef.current) {
      console.log('Auth check already completed (ref check), skipping');
      return;
    }

    // Fetch vendor settings
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorSlug}`)
      .then(res => res.json())
      .then(data => {
        setVendorSettings(data);
        setVendor(data); // Also set vendor for logo display
      })
      .catch(err => console.error('Error fetching vendor settings:', err));

    const checkAuth = async () => {
      console.log('=== CHECKOUT AUTH CHECK START ===');
      console.log('Current URL:', window.location.href);
      console.log('URL search params:', window.location.search);
      console.log('LocalStorage token:', !!localStorage.getItem('token'));
      console.log('LocalStorage user:', !!localStorage.getItem('user'));
      
      // FIRST: Check for authToken in URL (from login redirect)
      const urlParams = new URLSearchParams(window.location.search);
      const authTokenFromUrl = urlParams.get('authToken');
      
      console.log('authToken from URL:', authTokenFromUrl ? 'FOUND (length: ' + authTokenFromUrl.length + ')' : 'NOT FOUND');
      
      if (authTokenFromUrl) {
        console.log('✓ Auth token found in URL, storing and using it');
        localStorage.setItem('token', authTokenFromUrl);
        
        // Set cookie for this subdomain
        document.cookie = `token=${authTokenFromUrl}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
        
        // Remove token from URL for security
        urlParams.delete('authToken');
        const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
        window.history.replaceState({}, '', newUrl);
        
        // Fetch user data with the new token
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`, {
            headers: {
              'Authorization': `Bearer ${authTokenFromUrl}`,
            },
          });
          
          if (response.ok) {
            const userData = await response.json();
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('✓ User data stored from URL token:', userData.email);
            setUser(userData);
            
            // Pre-fill address if available
            if (userData.firstName && userData.lastName) {
              setAddress(prev => ({
                ...prev,
                fullName: `${userData.firstName} ${userData.lastName}`,
              }));
            }
            
            setIsAuthChecking(false);
            authCheckCompletedRef.current = true;
            console.log('=== AUTH CHECK END (from URL token) ===');
            return;
          } else {
            console.error('✗ Failed to fetch user with URL token');
          }
        } catch (error) {
          console.error('✗ Error fetching user data with URL token:', error);
        }
      }
      
      // Try to get token from localStorage
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      console.log('Token in localStorage:', !!token);
      console.log('User in localStorage:', !!userStr);
      
      if (!token) {
        console.log('✗ No token found - redirecting to login');
        authCheckCompletedRef.current = true; // Mark as completed to prevent re-running
        const currentUrl = window.location.href;
        const mainSiteUrl = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'http://localhost:3000';
        const loginUrl = `${mainSiteUrl}/login?returnUrl=${encodeURIComponent(currentUrl)}`;
        console.log('Redirecting to:', loginUrl);
        
        // Redirect after marking complete
        setTimeout(() => {
          window.location.href = loginUrl;
        }, 100);
        return;
      }
      
      console.log('✓ Token found, verifying with backend');
      
      try {
        // Get or fetch user data
        if (!userStr) {
          // If no user data in localStorage, fetch from backend
          console.log('No user data in localStorage, fetching from backend');
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`;
          const response = await fetch(apiUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!response.ok) {
            console.log('Token is invalid - clearing and redirecting');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            document.cookie = 'token=; path=/; max-age=0; domain=.localhost';
            
            const currentUrl = window.location.href;
            const mainSiteUrl = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'http://localhost:3000';
            window.location.href = `${mainSiteUrl}/login?returnUrl=${encodeURIComponent(currentUrl)}`;
            return;
          }

          const verifiedUser = await response.json();
          console.log('User data fetched from backend');
          localStorage.setItem('user', JSON.stringify(verifiedUser));
          setUser(verifiedUser);
          
          // Pre-fill address if available
          if (verifiedUser.firstName && verifiedUser.lastName) {
            setAddress(prev => ({
              ...prev,
              fullName: `${verifiedUser.firstName} ${verifiedUser.lastName}`,
            }));
          }
        } else {
          // Parse user data from localStorage
          const userData = JSON.parse(userStr);
          console.log('User data found:', userData.email);
          
          // Verify token is still valid
          const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/me`;
          console.log('Verifying token with backend:', apiUrl);
          
          const response = await fetch(apiUrl, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          console.log('Token verification response:', response.status);

          if (!response.ok) {
            console.log('Token is invalid - clearing and redirecting');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            document.cookie = 'token=; path=/; max-age=0; domain=.localhost';
            
            authCheckCompletedRef.current = true;
            const currentUrl = window.location.href;
            const mainSiteUrl = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'http://localhost:3000';
            setTimeout(() => {
              window.location.href = `${mainSiteUrl}/login?returnUrl=${encodeURIComponent(currentUrl)}`;
            }, 100);
            return;
          }

          const verifiedUser = await response.json();
          console.log('Token verified successfully');
          setUser(verifiedUser);
          
          // Pre-fill address if available
          if (verifiedUser.firstName && verifiedUser.lastName) {
            setAddress(prev => ({
              ...prev,
              fullName: `${verifiedUser.firstName} ${verifiedUser.lastName}`,
            }));
          }
        }
        
        setIsAuthChecking(false);
        authCheckCompletedRef.current = true;
      } catch (error) {
        console.error('Auth check error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        document.cookie = 'token=; path=/; max-age=0; domain=.localhost';
        
        authCheckCompletedRef.current = true;
        const currentUrl = window.location.href;
        const mainSiteUrl = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'http://localhost:3000';
        setTimeout(() => {
          window.location.href = `${mainSiteUrl}/login?returnUrl=${encodeURIComponent(currentUrl)}`;
        }, 100);
      }
      
      console.log('=== CHECKOUT AUTH CHECK END ===');
    };

    checkAuth();
  }, [vendorSlug]);

  useEffect(() => {
    // Redirect if cart is empty (but not during auth check or if already confirmed)
    if (!isAuthChecking && vendorItems.length === 0 && currentStep !== 'confirmation') {
      console.log('Redirecting to vendor store - no items in cart');
      router.push(`/vendor/${vendorSlug}`);
    }
  }, [vendorItems.length, currentStep, router, vendorSlug, isAuthChecking]);

  // Define all handlers before early returns
  const handleContinueToAddress = () => {
    setCurrentStep('address');
  };

  const handlePlaceOrder = useCallback(async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert('Please login to place order');
        router.push('/login');
        return;
      }

      // Create order
      const orderData = {
        items: vendorItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingAddress: address,
        paymentMethod,
        subtotal: vendorTotalPrice,
        shippingCost,
        tax,
        totalAmount: finalTotal,
      };

      console.log('Order data being sent:', orderData);
      console.log('Total calculations:', { vendorTotalPrice, shippingCost, tax, finalTotal });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create order');
      }

      const order = await response.json();
      const createdOrderId = order.orderNumber || order.id;
      setOrderId(createdOrderId);

      // If Razorpay, check if configured and initiate payment
      if (paymentMethod === 'razorpay') {
        // Check if Razorpay is configured
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        if (isDevelopment) {
          // In development, simulate successful payment for testing
          const simulatePayment = confirm(
            '🧪 Development Mode: Razorpay not configured.\n\n' +
            'Click OK to simulate successful payment\n' +
            'Click Cancel to cancel order'
          );
          
          if (simulatePayment) {
            // Simulate payment delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            clearCart();
            setCurrentStep('confirmation');
            alert('✅ Test payment successful! (No real payment processed)');
          } else {
            alert('Order created but payment cancelled. You can pay later.');
          }
          setLoading(false);
          return;
        }

        // Production: Real Razorpay payment
        try {
          await openCheckout(
            {
              order_id: createdOrderId,
              amount: finalTotal,
              currency: 'INR',
              name: 'Marketplace Order',
              description: `Order #${createdOrderId}`,
              prefill: {
                name: address.fullName,
                email: user?.email || '',
                contact: address.phone,
              },
            },
            async (paymentData) => {
              // Payment successful
              clearCart();
              setCurrentStep('confirmation');
              setLoading(false);
            },
            (error) => {
              // Payment failed or cancelled
              alert('Payment failed or cancelled. Your order has been created but not paid.');
              setLoading(false);
            }
          );
        } catch (error) {
          console.error('Error initiating Razorpay payment:', error);
          alert('Failed to initiate payment. Please try again or use Cash on Delivery.');
          setLoading(false);
        }
      } else {
        // COD payment - just complete the order
        clearCart();
        setCurrentStep('confirmation');
        setLoading(false);
      }
    } catch (error) {
      console.error('Order creation error:', error);
      alert(error instanceof Error ? error.message : 'Failed to create order');
      setLoading(false);
    }
  }, [vendorItems, address, paymentMethod, vendorTotalPrice, shippingCost, tax, finalTotal, router, user, openCheckout, clearCart]);

  // Define all component content with useMemo before early returns
  const StepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between max-w-3xl mx-auto">
        {[
          { step: 'cart', label: 'Cart', icon: ShoppingBag },
          { step: 'address', label: 'Address', icon: MapPin },
          { step: 'payment', label: 'Payment', icon: CreditCard },
          { step: 'confirmation', label: 'Confirmation', icon: CheckCircle },
        ].map((s, index) => {
          const Icon = s.icon;
          const isActive = currentStep === s.step;
          const isCompleted = 
            (s.step === 'cart' && ['address', 'payment', 'confirmation'].includes(currentStep)) ||
            (s.step === 'address' && ['payment', 'confirmation'].includes(currentStep)) ||
            (s.step === 'payment' && currentStep === 'confirmation');
          
          return (
            <div key={s.step} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : isCompleted
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                  {s.label}
                </span>
              </div>
              {index < 3 && (
                <ChevronRight
                  className={`w-6 h-6 mx-2 ${
                    isCompleted ? 'text-green-600' : 'text-gray-300'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  const AddressStepContent = useMemo(() => (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Shipping Address</h2>
        <button
          onClick={() => setCurrentStep('cart')}
          className="text-blue-600 hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Address Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={address.fullName}
                    onChange={(e) => handleAddressChange('fullName', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={address.phone}
                    onChange={(e) => handleAddressChange('phone', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="9876543210"
                    maxLength={10}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  value={address.addressLine1}
                  onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="House No, Building Name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={address.addressLine2}
                  onChange={(e) => handleAddressChange('addressLine2', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Road Name, Area"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={address.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Mumbai"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={address.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Maharashtra"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code *
                  </label>
                  <input
                    type="text"
                    value={address.postalCode}
                    onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="400001"
                    maxLength={6}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  value={address.country}
                  onChange={(e) => handleAddressChange('country', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                  placeholder="India"
                  readOnly
                />
              </div>
            </form>
          </div>
        </div>
      
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
            <h3 className="text-lg font-bold mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(vendorTotalPrice, 'INR')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost, 'INR')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>{formatPrice(tax, 'INR')}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(finalTotal, 'INR')}</span>
              </div>
            </div>
            
            <button
              onClick={handleContinueToPayment}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  ), [address, vendorTotalPrice, shippingCost, tax, finalTotal, handleAddressChange, handleContinueToPayment]);

  // Show loading while checking authentication
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Show error if not authenticated (shouldn't reach here due to redirect, but safety check)
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">
            Please log in to continue with checkout. Make sure you're logged in on the main site first.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                sessionStorage.removeItem('checkoutRedirectCount');
                const currentUrl = window.location.href;
                const mainSiteUrl = process.env.NEXT_PUBLIC_MAIN_SITE_URL || 'http://localhost:3000';
                window.location.href = `${mainSiteUrl}/login?returnUrl=${encodeURIComponent(currentUrl)}`;
              }}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Login
            </button>
            <Link
              href={`/vendor/${vendorSlug}`}
              className="block w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Back to Store
            </Link>
          </div>
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-left">
            <p className="text-sm text-yellow-800">
              <strong>Troubleshooting:</strong>
              <br />1. Make sure you're logged in on http://localhost:3000
              <br />2. Check that cookies are enabled in your browser
              <br />3. Clear your browser cache and try again
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show empty cart message if no vendor items
  if (vendorItems.length === 0 && currentStep !== 'confirmation') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-gray-600 mb-4">Add some items to checkout</p>
          <Link
            href={`/vendor/${vendorSlug}`}
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const CartStep = () => (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Shopping Cart ({vendorTotalItems} items)</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {vendorItems.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex gap-4">
                <img
                  src={item.image || '/placeholder-product.png'}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                
                <div className="flex-1">
                  <Link
                    href={`/products/${item.slug}`}
                    className="font-semibold text-gray-900 hover:text-blue-600 line-clamp-2"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm text-gray-500 mt-1">{item.vendorName}</p>
                  
                  {item.productType === 'booking' && (
                    <span className="inline-block text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded mt-2">
                      Booking
                    </span>
                  )}
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center border rounded hover:bg-gray-50"
                        disabled={
                          item.stockQuantity !== undefined && item.quantity >= item.stockQuantity
                        }
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatPrice(item.price * item.quantity, 'INR')}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatPrice(item.price, 'INR')} each
                      </p>
                    </div>
                  </div>
                  
                  {item.stockQuantity !== undefined && item.stockQuantity < 5 && (
                    <p className="text-xs text-orange-600 mt-2">
                      Only {item.stockQuantity} left in stock
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="p-2 hover:bg-red-50 rounded-full transition-colors h-fit"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-5 h-5 text-gray-400 hover:text-red-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
            <h3 className="text-lg font-bold mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal ({vendorTotalItems} items)</span>
                <span>{formatPrice(vendorTotalPrice, 'INR')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={shippingCost === 0 ? 'text-green-600' : ''}>
                  {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost, 'INR')}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax (GST 18%)</span>
                <span>{formatPrice(tax, 'INR')}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(finalTotal, 'INR')}</span>
              </div>
            </div>
            
            {freeShippingThreshold && vendorTotalPrice < freeShippingThreshold && (
              <p className="text-sm text-gray-600 mb-4 p-3 bg-blue-50 rounded">
                Add {formatPrice(freeShippingThreshold - vendorTotalPrice, 'INR')} more for FREE shipping!
              </p>
            )}
            
            <button
              onClick={handleContinueToAddress}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Continue to Address
            </button>
            
            <Link
              href={`/vendor/${vendorSlug}`}
              className="block text-center text-blue-600 hover:underline mt-4"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  const PaymentStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Payment Method</h2>
        <button
          onClick={() => setCurrentStep('address')}
          className="text-blue-600 hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Address
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Options */}
        <div className="lg:col-span-2 space-y-4">
          {/* Saved Address Summary */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Shipping Address</h3>
              <button
                onClick={() => setCurrentStep('address')}
                className="text-blue-600 hover:underline flex items-center gap-1 text-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            </div>
            <div className="text-gray-600">
              <p className="font-medium text-gray-900">{address.fullName}</p>
              <p>{address.addressLine1}</p>
              {address.addressLine2 && <p>{address.addressLine2}</p>}
              <p>{address.city}, {address.state} {address.postalCode}</p>
              <p>{address.country}</p>
              <p className="mt-2">Phone: {address.phone}</p>
            </div>
          </div>
          
          {/* Payment Methods */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold mb-4">Select Payment Method</h3>
            
            {/* Development Mode Info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>🔧 Development Mode:</strong> Use Cash on Delivery to test without configuring Razorpay. 
                  To enable online payments, add your Razorpay keys to backend .env file.
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              {/* Razorpay */}
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: paymentMethod === 'razorpay' ? '#3b82f6' : '#e5e7eb' }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="razorpay"
                  checked={paymentMethod === 'razorpay'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span className="font-medium">UPI / Card / Net Banking</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Pay securely via Razorpay (Credit/Debit Card, UPI, Wallets)
                  </p>
                </div>
              </label>
              
              {/* Cash on Delivery */}
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                style={{ borderColor: paymentMethod === 'cod' ? '#3b82f6' : '#e5e7eb' }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-4 h-4 text-blue-600"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">💵 Cash on Delivery</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Pay when you receive your order
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
            <h3 className="text-lg font-bold mb-4">Order Summary</h3>
            
            <div className="space-y-2 mb-4 text-sm">
              {vendorItems.slice(0, 3).map((item) => (
                <div key={item.id} className="flex justify-between text-gray-600">
                  <span className="truncate">{item.name} x{item.quantity}</span>
                  <span>{formatPrice(item.price * item.quantity, 'INR')}</span>
                </div>
              ))}
              {vendorItems.length > 3 && (
                <p className="text-gray-500 text-xs">
                  +{vendorItems.length - 3} more items
                </p>
              )}
            </div>
            
            <div className="border-t pt-3 space-y-2 mb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(vendorTotalPrice, 'INR')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost, 'INR')}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>{formatPrice(tax, 'INR')}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>{formatPrice(finalTotal, 'INR')}</span>
              </div>
            </div>
            
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Place Order
                </>
              )}
            </button>
            
            <p className="text-xs text-gray-500 text-center mt-3">
              🔒 Secure checkout powered by Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const ConfirmationStep = () => (
    <div className="max-w-2xl mx-auto text-center">
      <div className="bg-white rounded-lg shadow-sm border p-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for your order. We'll send you a confirmation email shortly.
        </p>
        
        {orderId && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 mb-1">Order Number</p>
            <p className="text-2xl font-bold text-blue-600">{orderId}</p>
          </div>
        )}
        
        <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
          <h3 className="font-semibold mb-3">Order Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount</span>
              <span className="font-semibold">{formatPrice(finalTotal, 'INR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method</span>
              <span className="font-semibold">
                {paymentMethod === 'razorpay' ? 'Online Payment' : 'Cash on Delivery'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery Address</span>
              <span className="font-semibold text-right">{address.city}, {address.state}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/vendor/${vendorSlug}/orders`}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            View Orders
          </Link>
          <Link
            href={`/vendor/${vendorSlug}`}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );

  // Show loading state while checking authentication
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <VendorHeader vendorSlug={vendorSlug} vendorId={vendor?.id} />

      <CategoryNav vendorId={vendor?.id} mode="navigation" />

      <div className="container mx-auto px-4 pt-8 pb-8">
        <StepIndicator />
        
        {currentStep === 'cart' && <CartStep />}
        {currentStep === 'address' && AddressStepContent}
        {currentStep === 'payment' && <PaymentStep />}
        {currentStep === 'confirmation' && <ConfirmationStep />}
      </div>
    </div>
  );
}
