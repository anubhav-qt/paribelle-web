'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/currency';
import { useRazorpay } from '@/hooks/useRazorpay';
import AddressManager, { Address } from '@/components/AddressManager';
import { initAuthFromCookie } from '@/lib/cross-domain-auth';
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
import { useThemeClasses } from '@/hooks/useThemeClasses';

type CheckoutStep = 'cart' | 'address' | 'payment' | 'confirmation';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, totalItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { createOrder: createRazorpayOrder, verifyPayment, openCheckout } = useRazorpay();
  const theme = useThemeClasses();
  
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [marketplaceLogo, setMarketplaceLogo] = useState('');
  const [marketplaceName, setMarketplaceName] = useState('GaliCart');
  
  // Address form
  const [address, setAddress] = useState<Address>({
    fullName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
  });
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  
  // Payment details
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [orderId, setOrderId] = useState<string>('');
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await initAuthFromCookie();
        console.log('Checkout: Auth initialized, token:', token ? 'Found' : 'Not found');
        setAuthInitialized(true);
      } catch (error) {
        console.error('Checkout: Error initializing auth:', error);
        setAuthInitialized(true);
      }
    };
    initAuth();
  }, []);

  useEffect((): void => {
    if (!authInitialized) {
      return;
    }

    // Fetch marketplace branding
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/settings/marketplace_logo`)
      .then(res => res.json())
      .then(data => setMarketplaceLogo(data.value || ''))
      .catch(err => console.error('Error fetching marketplace logo:', err));
    
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/settings/marketplace_name`)
      .then(res => res.json())
      .then(data => setMarketplaceName(data.value || 'GaliCart'))
      .catch(err => console.error('Error fetching marketplace name:', err));

    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      alert('Please login to continue checkout');
      router.push('/login');
      return;
    }
    
    try {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      
      // Pre-fill address name if available
      if (parsedUser.firstName && parsedUser.lastName) {
        setAddress(prev => ({
          ...prev,
          fullName: `${parsedUser.firstName} ${parsedUser.lastName}`,
          email: parsedUser.email || '',
          phone: parsedUser.phone || '',
        }));
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }, [authInitialized]);

  useEffect(() => {
    // Redirect if cart is empty
    if (items.length === 0 && currentStep !== 'confirmation') {
      router.push('/');
    }
  }, [items.length, currentStep]);

  const shippingCost = totalPrice > 500 ? 0 : 50;
  const tax = totalPrice * 0.18; // 18% GST
  const finalTotal = totalPrice + shippingCost + tax;

  const handleContinueToAddress = () => {
    setCurrentStep('address');
  };

  const handleContinueToPayment = useCallback(() => {
    // Basic address validation (AddressManager handles detailed validation)
    if (!address.fullName || !address.phone || !address.addressLine1 || 
        !address.city || !address.state || !address.postalCode) {
      alert('Please fill in all required address fields');
      return;
    }
    
    setCurrentStep('payment');
  }, [address]);

  const handlePlaceOrder = async () => {
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        alert('Please login to place order');
        router.push('/login');
        return;
      }

      // Verify user is still valid
      try {
        const user = JSON.parse(userStr);
        console.log('User from localStorage:', user);
        console.log('Token exists:', !!token);
        console.log('Token preview:', token.substring(0, 20) + '...');
      } catch (e) {
        console.error('Invalid user data in localStorage');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        alert('Session expired. Please login again.');
        router.push('/login');
        return;
      }

      // Create order
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingAddress: address,
        paymentMethod,
        subtotal: totalPrice,
        shippingCost,
        tax,
        totalAmount: finalTotal,
      };

      console.log('Order data being sent:', orderData);
      console.log('Total calculations:', { totalPrice, shippingCost, tax, finalTotal });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        let errorMessage = 'Failed to create order';
        try {
          const error = await response.json();
          errorMessage = error.message || errorMessage;
          console.error('Error response:', error);
        } catch (e) {
          console.error('Could not parse error response');
        }
        
        // If unauthorized, clear session and redirect to login
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          alert('Session expired. Please login again.');
          router.push('/login');
          return;
        }
        
        throw new Error(errorMessage);
      }

      const orders = await response.json();
      
      // Handle both single order (backward compatibility) and multiple orders
      const ordersArray = Array.isArray(orders) ? orders : [orders];
      
      console.log(`Created ${ordersArray.length} order(s):`, ordersArray.map(o => o.orderNumber));
      
      // Store order numbers for confirmation page
      const orderNumbers = ordersArray.map(o => o.orderNumber || o.id).join(', ');
      setOrderId(orderNumbers);

      // If Razorpay, check if configured and initiate payment
      if (paymentMethod === 'razorpay') {
        // Check if Razorpay is configured
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        if (isDevelopment) {
          // In development, simulate successful payment for testing
          const vendorCount = ordersArray.length;
          const simulatePayment = confirm(
            `🧪 Development Mode: Razorpay not configured.\n\n` +
            `${vendorCount} order${vendorCount > 1 ? 's' : ''} created (multi-vendor split)\n` +
            `Order${vendorCount > 1 ? 's' : ''}: ${orderNumbers}\n\n` +
            `Click OK to simulate successful payment\n` +
            `Click Cancel to cancel order`
          );
          
          if (simulatePayment) {
            // Simulate payment delay
            await new Promise(resolve => setTimeout(resolve, 1500));
            clearCart();
            setCurrentStep('confirmation');
            alert(`✅ Test payment successful for ${vendorCount} order${vendorCount > 1 ? 's' : ''}! (No real payment processed)`);
          } else {
            alert('Orders created but payment cancelled. You can pay later.');
          }
        } else {
          // Production - attempt real Razorpay payment (use first order for Razorpay)
          await handleRazorpayPayment(orderNumbers, ordersArray[0].id);
        }
      } else {
        // Cash on Delivery - orders placed
        clearCart();
        setCurrentStep('confirmation');
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert(error instanceof Error ? error.message : 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayPayment = async (orderNumber: string, orderId: string) => {
    try {
      setLoading(true);

      // Create Razorpay order
      const razorpayOrder = await createRazorpayOrder(orderId, finalTotal);

      // Open Razorpay checkout
      openCheckout(
        {
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          order_id: razorpayOrder.id,
          name: 'Marketplace',
          description: `Order #${orderNumber}`,
          prefill: {
            name: address.fullName,
            contact: address.phone,
          },
          theme: {
            color: getComputedStyle(document.documentElement).getPropertyValue('--marketplace-primary').trim() || '#FF9900',
          },
        },
        async (response) => {
          // Payment successful
          try {
            setLoading(true);
            await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
              'success'
            );
            
            clearCart();
            setCurrentStep('confirmation');
          } catch (error) {
            console.error('Payment verification failed:', error);
            alert('Payment verification failed. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        async (error) => {
          // Payment failed or cancelled
          console.error('Payment failed:', error);
          
          if (error?.message !== 'Payment cancelled by user') {
            alert('Payment failed. Please try again.');
          }
          
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error initiating Razorpay payment:', error);
      
      // Check if error is due to Razorpay not being configured
      if (error instanceof Error && error.message.includes('not configured')) {
        alert(
          '⚠️ Razorpay is not configured.\n\n' +
          'Please configure Razorpay keys in the backend .env file or use Cash on Delivery option.'
        );
      } else {
        alert('Failed to initiate payment. Please try again or use Cash on Delivery.');
      }
      
      setLoading(false);
    }
  };

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
                      ? 'bg-primary text-primary-foreground'
                      : isCompleted
                      ? 'bg-green-600 text-white'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className={`text-sm font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
              </div>
              {index < 3 && (
                <ChevronRight
                  className={`w-6 h-6 mx-2 ${
                    isCompleted ? 'text-green-600' : 'text-muted-foreground'
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
        <h2 className="text-2xl font-bold text-foreground">Shipping Address</h2>
        <button
          onClick={() => setCurrentStep('cart')}
          className="text-primary hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Cart
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Address Selection/Form */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <AddressManager
              onAddressSelect={(addr) => {
                setAddress(addr);
                setSelectedAddressId(addr.id || null);
              }}
              selectedAddressId={selectedAddressId}
              showSelection={true}
              compact={true}
            />
          </div>
        </div>
      
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg shadow-sm border border-border p-6 sticky top-4">
            <h3 className="text-lg font-bold mb-4 text-foreground">Order Summary</h3>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(totalPrice, 'INR')}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost, 'INR')}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>{formatPrice(tax, 'INR')}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between font-bold text-lg text-foreground">
                <span>Total</span>
                <span>{formatPrice(finalTotal, 'INR')}</span>
              </div>
            </div>
            
            <button
              onClick={handleContinueToPayment}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  ), [address, selectedAddressId, totalPrice, shippingCost, tax, finalTotal, handleContinueToPayment]);

  const CartStep = () => (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Shopping Cart ({totalItems} items)</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="bg-card rounded-lg shadow-sm border border-border p-4">
              <div className="flex gap-4">
                <img
                  src={item.image || '/placeholder-product.png'}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                
                <div className="flex-1">
                  <Link
                    href={`/products/${item.slug}`}
                    className="font-semibold text-foreground hover:text-primary line-clamp-2"
                  >
                    {item.name}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1">{item.vendorName}</p>
                  
                  {item.productType === 'booking' && (
                    <span className="inline-block text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded mt-2">
                      Booking
                    </span>
                  )}
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center border border-border rounded hover:bg-muted text-foreground"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-medium text-foreground">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center border border-border rounded hover:bg-muted text-foreground"
                        disabled={
                          item.stockQuantity !== undefined && item.quantity >= item.stockQuantity
                        }
                      >
                        +
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-foreground">
                        {formatPrice(item.price * item.quantity, 'INR')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatPrice(item.price, 'INR')} each
                      </p>
                    </div>
                  </div>
                  
                  {item.stockQuantity !== undefined && item.stockQuantity < 5 && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                      Only {item.stockQuantity} left in stock
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="p-2 hover:bg-destructive/10 rounded-full transition-colors h-fit"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-5 h-5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg shadow-sm border border-border p-6 sticky top-4">
            <h3 className="text-lg font-bold mb-4 text-foreground">Order Summary</h3>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({totalItems} items)</span>
                <span>{formatPrice(totalPrice, 'INR')}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className={shippingCost === 0 ? 'text-green-600' : ''}>
                  {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost, 'INR')}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax (GST 18%)</span>
                <span>{formatPrice(tax, 'INR')}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between font-bold text-lg text-foreground">
                <span>Total</span>
                <span>{formatPrice(finalTotal, 'INR')}</span>
              </div>
            </div>
            
            {totalPrice < 500 && (
              <p className="text-sm text-muted-foreground mb-4 p-3 bg-primary/10 rounded">
                Add {formatPrice(500 - totalPrice, 'INR')} more for FREE shipping!
              </p>
            )}
            
            <button
              onClick={handleContinueToAddress}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              Continue to Address
            </button>
            
            <Link
              href="/"
              className="block text-center text-primary hover:underline mt-4"
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
        <h2 className="text-2xl font-bold text-foreground">Payment Method</h2>
        <button
          onClick={() => setCurrentStep('address')}
          className="text-primary hover:underline flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Address
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Options */}
        <div className="lg:col-span-2 space-y-4">
          {/* Saved Address Summary */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Shipping Address</h3>
              <button
                onClick={() => setCurrentStep('address')}
                className="text-primary hover:underline flex items-center gap-1 text-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            </div>
            <div className="text-muted-foreground">
              <p className="font-medium text-foreground">{address.fullName}</p>
              <p>{address.addressLine1}</p>
              {address.addressLine2 && <p>{address.addressLine2}</p>}
              <p>{address.city}, {address.state} {address.postalCode}</p>
              <p>{address.country}</p>
              <p className="mt-2">Phone: {address.phone}</p>
            </div>
          </div>
          
          {/* Payment Methods */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <h3 className="font-semibold mb-4 text-foreground">Select Payment Method</h3>
            
            {/* Development Mode Info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-foreground">
                  <strong>🔧 Development Mode:</strong> Use Cash on Delivery to test without configuring Razorpay. 
                  To enable online payments, add your Razorpay keys to backend .env file.
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              {/* Razorpay */}
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                style={{ borderColor: paymentMethod === 'razorpay' ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="razorpay"
                  checked={paymentMethod === 'razorpay'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-4 h-4 text-primary"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">UPI / Card / Net Banking</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pay securely via Razorpay (Credit/Debit Card, UPI, Wallets)
                  </p>
                </div>
              </label>
              
              {/* Cash on Delivery */}
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                style={{ borderColor: paymentMethod === 'cod' ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-4 h-4 text-primary"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">💵 Cash on Delivery</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pay when you receive your order
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg shadow-sm border border-border p-6 sticky top-4">
            <h3 className="text-lg font-bold mb-4 text-foreground">Order Summary</h3>
            
            <div className="space-y-2 mb-4 text-sm">
              {items.slice(0, 3).map((item) => (
                <div key={item.id} className="flex justify-between text-muted-foreground">
                  <span className="truncate">{item.name} x{item.quantity}</span>
                  <span>{formatPrice(item.price * item.quantity, 'INR')}</span>
                </div>
              ))}
              {items.length > 3 && (
                <p className="text-muted-foreground text-xs">
                  +{items.length - 3} more items
                </p>
              )}
            </div>
            
            <div className="border-t border-border pt-3 space-y-2 mb-4">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(totalPrice, 'INR')}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost, 'INR')}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax</span>
                <span>{formatPrice(tax, 'INR')}</span>
              </div>
              <div className="border-t border-border pt-3 flex justify-between font-bold text-lg text-foreground">
                <span>Total</span>
                <span>{formatPrice(finalTotal, 'INR')}</span>
              </div>
            </div>
            
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            
            <p className="text-xs text-muted-foreground text-center mt-3">
              🔒 Secure checkout powered by Razorpay
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const ConfirmationStep = () => {
    const orderNumbers = orderId.split(', ');
    const hasMultipleOrders = orderNumbers.length > 1;
    
    return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="bg-card rounded-lg shadow-sm border border-border p-8">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>
        
        <h2 className="text-3xl font-bold text-foreground mb-2">
          {hasMultipleOrders ? 'Orders' : 'Order'} Placed Successfully!
        </h2>
        <p className="text-muted-foreground mb-6">
          Thank you for your order. We'll send you a confirmation email shortly.
        </p>
        
        {orderId && (
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-1">
              Order Number{hasMultipleOrders ? 's' : ''}
              {hasMultipleOrders && <span className="ml-2 text-xs">(Split by vendor)</span>}
            </p>
            {hasMultipleOrders ? (
              <div className="space-y-1">
                {orderNumbers.map((num, idx) => (
                  <p key={idx} className="text-lg font-bold text-primary">{num}</p>
                ))}
              </div>
            ) : (
              <p className="text-2xl font-bold text-primary">{orderId}</p>
            )}
          </div>
        )}
        
        <div className="bg-muted rounded-lg p-6 mb-6 text-left">
          <h3 className="font-semibold mb-3 text-foreground">Order Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Amount</span>
              <span className="font-semibold text-foreground">{formatPrice(finalTotal, 'INR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="font-semibold text-foreground">
                {paymentMethod === 'razorpay' ? 'Online Payment' : 'Cash on Delivery'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Address</span>
              <span className="font-semibold text-right text-foreground">{address.city}, {address.state}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/orders"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            View Orders
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-border text-foreground rounded-lg font-semibold hover:bg-muted transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )};


  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Simple Checkout Header */}
      <div className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center gap-2">
            {marketplaceLogo ? (
              <img 
                src={marketplaceLogo} 
                alt={marketplaceName} 
                className="h-8 object-contain"
              />
            ) : (
              <span className="text-xl font-bold text-foreground">{marketplaceName}</span>
            )}
          </Link>
        </div>
      </div>

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
