'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
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
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { Loader } from '@/components/ui/Loader';

type CheckoutStep = 'cart' | 'address' | 'payment' | 'confirmation';

function CheckoutContent() {
  const router = useRouter();
  const { items, totalItems, updateQuantity, removeFromCart, clearCart } = useCart();
  const { createOrder: createRazorpayOrder, verifyPayment, openCheckout } = useRazorpay();
  const theme = useThemeClasses();

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('cart');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [marketplaceLogo, setMarketplaceLogo] = useState('');
  const [marketplaceName, setMarketplaceName] = useState('PariBelle');
  const [currency, setCurrency] = useState('INR');

  // Shipping Address form
  const [shippingAddress, setShippingAddress] = useState<Address>({
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
  const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<string | null>(null);
  
  // Billing Address form
  const [billingAddress, setBillingAddress] = useState<Address>({
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
  const [selectedBillingAddressId, setSelectedBillingAddressId] = useState<string | null>(null);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  
  // Payment details
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');
  const [orderId, setOrderId] = useState<string>('');
  const [authInitialized, setAuthInitialized] = useState(false);
  
  // Wallet balance
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWalletBalance, setUseWalletBalance] = useState(false);
  const [loadingWallet, setLoadingWallet] = useState(false);
  
  // Store order totals for confirmation page (before cart is cleared)
  const [confirmedOrderTotal, setConfirmedOrderTotal] = useState(0);
  const [confirmedSubtotal, setConfirmedSubtotal] = useState(0);
  const [confirmedTax, setConfirmedTax] = useState(0);
  const [confirmedShipping, setConfirmedShipping] = useState(0);
  

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await initAuthFromCookie();
        console.log('Checkout: Auth initialized, token:', token ? 'Found' : 'Not found');
        setAuthInitialized(true);
        
        // Fetch wallet balance
        if (token) {
          fetchWalletBalance(token);
        }
      } catch (error) {
        console.error('Checkout: Error initializing auth:', error);
        setAuthInitialized(true);
      }
    };
    initAuth();
  }, []);

  const fetchWalletBalance = async (token: string) => {
    setLoadingWallet(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders/wallet-balance`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setWalletBalance(data.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    } finally {
      setLoadingWallet(false);
    }
  };


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
      .then(data => setMarketplaceName(data.value || 'PariBelle'))
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
      
      // Pre-fill shipping address name if available
      if (parsedUser.firstName && parsedUser.lastName) {
        setShippingAddress(prev => ({
          ...prev,
          fullName: `${parsedUser.firstName} ${parsedUser.lastName}`,
          email: parsedUser.email || '',
          phone: parsedUser.phone || '',
        }));
        // Also pre-fill billing address since it defaults to same as shipping
        setBillingAddress(prev => ({
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

  // Sync billing address with shipping address when checkbox is checked
  useEffect(() => {
    if (billingSameAsShipping) {
      setBillingAddress(shippingAddress);
      setSelectedBillingAddressId(selectedShippingAddressId);
    }
  }, [billingSameAsShipping, shippingAddress, selectedShippingAddressId]);

  useEffect(() => {
    if (items.length === 0 && currentStep !== 'confirmation') {
      router.push('/');
    }
  }, [items.length, currentStep]);

  // Calculate tax by extracting GST from inclusive prices
  const calculateTaxBreakdown = () => {
    let totalBasePrice = 0;
    let totalTax = 0;
    let totalWithTax = 0; // Track the actual total including tax
    
    items.forEach(item => {
      const itemTotal = item.price * item.quantity;
      // Default to 18% GST if not specified
      const gstRate = (item.gstRate !== undefined && item.gstRate !== null) ? item.gstRate : 18;
      // Default to tax-inclusive if not specified
      const priceType = item.priceType || 'mrp_with_gst';
      
      if (priceType === 'mrp_with_gst') {
        // Price includes GST - extract the tax component
        // Prevent division by zero or invalid calculations
        if (gstRate > 0) {
          const basePrice = itemTotal / (1 + gstRate / 100);
          const taxAmount = itemTotal - basePrice;
          totalBasePrice += basePrice;
          totalTax += taxAmount;
          totalWithTax += itemTotal; // Price already includes tax
        } else {
          // If GST rate is 0, entire amount is base price
          totalBasePrice += itemTotal;
          totalWithTax += itemTotal;
        }
      } else {
        // Price excludes GST - add tax on top
        const taxAmount = itemTotal * (gstRate / 100);
        totalBasePrice += itemTotal;
        totalTax += taxAmount;
        totalWithTax += itemTotal + taxAmount; // Add tax to get total
      }
    });
    
    return { basePrice: totalBasePrice, tax: totalTax, totalWithTax };
  };
  
  const { basePrice: subtotalBeforeTax, tax: extractedTax, totalWithTax: subtotalWithTax } = calculateTaxBreakdown();
  
  const orderSubtotal = subtotalWithTax;
  const shippingCost = subtotalWithTax > 500 ? 0 : 50;
  const tax = extractedTax;
  const totalBeforeWallet = orderSubtotal + shippingCost; // Total before wallet discount
  const walletDiscount = useWalletBalance ? Math.min(walletBalance, totalBeforeWallet) : 0;
  const finalTotal = totalBeforeWallet - walletDiscount; // Final total after wallet discount

  const handleContinueToAddress = () => setCurrentStep('address');

  const handleContinueToPayment = useCallback(() => {
    // Validate shipping address (AddressManager handles detailed validation)
    if (!shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.addressLine1 || 
        !shippingAddress.city || !shippingAddress.state || !shippingAddress.postalCode) {
      alert('Please fill in all required shipping address fields');
      return;
    }
    
    // Validate billing address if different from shipping
    if (!billingSameAsShipping) {
      if (!billingAddress.fullName || !billingAddress.phone || !billingAddress.addressLine1 || 
          !billingAddress.city || !billingAddress.state || !billingAddress.postalCode) {
        alert('Please fill in all required billing address fields');
        return;
      }
    }
    
    setCurrentStep('payment');
  }, [shippingAddress, billingAddress, billingSameAsShipping]);


  const handlePlaceOrder = async () => {
    setLoading(true);
    
    try {
      let token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (!token) {
        token = await initAuthFromCookie();
      }
      
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

      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId || null,
          variantSku: item.variantSku || null,
          variantAttributes: item.variantAttributes || null,
          quantity: item.quantity,
          price: item.price,
        })),
        shippingAddress: shippingAddress,
        billingAddress: billingSameAsShipping ? shippingAddress : billingAddress,
        paymentMethod,
        subtotal: subtotalBeforeTax,
        shippingCost,
        tax,
        totalAmount: totalBeforeWallet,
        useWalletBalance,
      };

      console.log('Order data being sent:', orderData);
      console.log('Total calculations:', { subtotalWithTax, subtotalBeforeTax, shippingCost, tax, finalTotal });

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
      
      // Store order totals before clearing cart
      setConfirmedOrderTotal(finalTotal);
      setConfirmedSubtotal(subtotalBeforeTax); // Base price without tax
      setConfirmedTax(tax);
      setConfirmedShipping(shippingCost);

      // If Razorpay, check if configured and initiate payment
      if (paymentMethod === 'razorpay') {
        // Check if Razorpay is configured
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        if (isDevelopment) {
          // In development, simulate successful payment for testing
          const vendorCount = ordersArray.length;
          const simulatePayment = confirm(
            `🧪 Development Mode: Razorpay not configured.\n\n` +
            `${vendorCount} order${vendorCount > 1 ? 's' : ''} created\n` +
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
          name: 'PariBelle',
          description: `Order #${orderNumber}`,
          prefill: {
            name: shippingAddress.fullName,
            contact: shippingAddress.phone,
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

  const StepIndicator = () => {
    const canNavigateToStep = (step: CheckoutStep): boolean => {
      if (step === 'cart') return true;
      if (step === 'address') return items.length > 0;
      if (step === 'payment') {
        return items.length > 0 && Boolean(
          shippingAddress.fullName &&
          shippingAddress.phone &&
          shippingAddress.addressLine1 &&
          shippingAddress.city
        );
      }
      return false;
    };

    const handleStepClick = (step: CheckoutStep) => {
      if (canNavigateToStep(step) && currentStep !== step) {
        setCurrentStep(step);
      }
    };

    const steps = [
      { step: 'cart', label: 'Cart', icon: ShoppingBag },
      { step: 'address', label: 'Address', icon: MapPin },
      { step: 'payment', label: 'Payment', icon: CreditCard },
      { step: 'confirmation', label: 'Confirmation', icon: CheckCircle },
    ];

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {steps.map((s, index) => {
            const Icon = s.icon;
            const isActive = currentStep === s.step;
            
            const isCompleted =
              (s.step === 'cart' && ['address', 'payment', 'confirmation'].includes(currentStep)) ||
              (s.step === 'address' && ['payment', 'confirmation'].includes(currentStep)) ||
              (s.step === 'payment' && currentStep === 'confirmation');


            const isClickable = canNavigateToStep(s.step as CheckoutStep);
            
            return (
              <div key={s.step} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <button
                    onClick={() => handleStepClick(s.step as CheckoutStep)}
                    disabled={!isClickable}
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : isCompleted
                        ? 'bg-green-600 text-white'
                        : 'bg-muted text-muted-foreground'
                    } ${
                      isClickable && !isActive 
                        ? 'cursor-pointer hover:opacity-80 hover:scale-105' 
                        : isClickable && isActive
                        ? 'cursor-default'
                        : 'cursor-not-allowed opacity-50'
                    }`}
                    title={isClickable ? `Go to ${s.label}` : `Complete previous steps to access ${s.label}`}
                  >
                    <Icon className="w-6 h-6" />
                  </button>
                  <span 
                    className={`text-sm font-medium ${
                      isActive ? 'text-primary' : 'text-muted-foreground'
                    } ${isClickable && !isActive ? 'cursor-pointer' : ''}`}
                    onClick={() => isClickable && handleStepClick(s.step as CheckoutStep)}
                  >
                    {s.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
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
  };

  const AddressStepContent = useMemo(() => (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Delivery Address</h2>
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
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Shipping Address</h3>
            <AddressManager
              onAddressSelect={(addr) => {
                setShippingAddress(addr);
                setSelectedShippingAddressId(addr.id || null);
              }}
              selectedAddressId={selectedShippingAddressId}
              showSelection={true}
              compact={true}
            />
          </div>

          {/* Billing Address Section */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <div className="flex items-center gap-3 mb-4">
              <input
                type="checkbox"
                id="billingSameAsShipping"
                checked={billingSameAsShipping}
                onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
              />
              <label htmlFor="billingSameAsShipping" className="text-sm font-medium text-foreground cursor-pointer">
                Billing address is same as shipping address
              </label>
            </div>

            {!billingSameAsShipping && (
              <div className="mt-4 pt-4 border-t border-border">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Billing Address</h3>
                <AddressManager
                  onAddressSelect={(addr) => {
                    setBillingAddress(addr);
                    setSelectedBillingAddressId(addr.id || null);
                  }}
                  selectedAddressId={selectedBillingAddressId}
                  showSelection={true}
                  compact={true}
                />
              </div>
            )}
          </div>
        </div>
      
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-lg shadow-sm border border-border p-6 sticky top-4">
            <h3 className="text-lg font-bold mb-4 text-foreground">Order Summary</h3>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({totalItems} items)</span>
                <span>{formatPrice(orderSubtotal, currency)}</span>
              </div>
              {(
                <>
                  <div className="flex justify-between text-xs text-muted-foreground/70 -mt-1">
                    <span className="pl-4">• Base Price</span>
                    <span>{formatPrice(subtotalBeforeTax, 'INR')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground/70">
                    <span className="pl-4">• GST (included)</span>
                    <span>{formatPrice(tax, 'INR')}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost, 'INR')}</span>
                  </div>
                </>
              )}
              
              {/* Wallet Balance Section */}
              {walletBalance > 0 && useWalletBalance && walletDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Wallet Discount</span>
                  <span>-{formatPrice(walletDiscount, 'INR')}</span>
                </div>
              )}
              
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
  ), [shippingAddress, billingAddress, billingSameAsShipping, selectedShippingAddressId, selectedBillingAddressId, subtotalWithTax, subtotalBeforeTax, shippingCost, tax, finalTotal, walletBalance, useWalletBalance, walletDiscount, handleContinueToPayment]);


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
                  
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center border border-border rounded hover:bg-muted text-foreground"
                      >
                        -
                      </button>
                      <span className="w-12 text-center font-medium text-foreground">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
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
                  onClick={() => removeFromCart(item.id)}
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
                <span>{formatPrice(orderSubtotal, currency)}</span>
              </div>
              {(
                <>
                  <div className="flex justify-between text-xs text-muted-foreground/70 -mt-1">
                    <span className="pl-4">• Base Price</span>
                    <span>{formatPrice(subtotalBeforeTax, 'INR')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground/70">
                    <span className="pl-4">• GST</span>
                    <span>{formatPrice(tax, 'INR')}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className={shippingCost === 0 ? 'text-green-600' : ''}>
                      {shippingCost === 0 ? 'FREE' : formatPrice(shippingCost, 'INR')}
                    </span>
                  </div>
                </>
              )}
              
              {/* Wallet Balance Section */}
              {walletBalance > 0 && (
                <div className="border-t border-border pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useWalletBalance}
                        onChange={(e) => setUseWalletBalance(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium">Use Wallet Balance</span>
                    </label>
                    <span className="text-sm text-green-600 font-semibold">
                      ₹{walletBalance.toFixed(2)}
                    </span>
                  </div>
                  {useWalletBalance && walletDiscount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="pl-6">Wallet Discount</span>
                      <span>-{formatPrice(walletDiscount, 'INR')}</span>
                    </div>
                  )}
                </div>
              )}
              
              <div className="border-t border-border pt-3 flex justify-between font-bold text-lg text-foreground">
                <span>Total</span>
                <span>{formatPrice(finalTotal, 'INR')}</span>
              </div>
            </div>
            
            {subtotalWithTax < 500 && (
              <p className="text-sm text-muted-foreground mb-4 p-3 bg-primary/10 rounded">
                Add {formatPrice(500 - subtotalWithTax, 'INR')} more for FREE shipping!
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
              <p className="font-medium text-foreground">{shippingAddress.fullName}</p>
              <p>{shippingAddress.addressLine1}</p>
              {shippingAddress.addressLine2 && <p>{shippingAddress.addressLine2}</p>}
              <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
              <p>{shippingAddress.country}</p>
              {shippingAddress.email && <p>Email: {shippingAddress.email}</p>}
              <p className="mt-2">Phone: {shippingAddress.phone}</p>
              <p className="text-xs mt-2">
                Source: {selectedShippingAddressId ? 'Saved address selected' : 'Manual entry'}
              </p>
            </div>
          </div>

          {/* Billing Address Summary */}
          <div className="bg-card rounded-lg shadow-sm border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Billing Address</h3>
              <button
                onClick={() => setCurrentStep('address')}
                className="text-primary hover:underline flex items-center gap-1 text-sm"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
            </div>
            <div className="text-muted-foreground">
              <p className="font-medium text-foreground">
                {billingSameAsShipping ? shippingAddress.fullName : billingAddress.fullName}
              </p>
              <p>{billingSameAsShipping ? shippingAddress.addressLine1 : billingAddress.addressLine1}</p>
              {(billingSameAsShipping ? shippingAddress.addressLine2 : billingAddress.addressLine2) && (
                <p>{billingSameAsShipping ? shippingAddress.addressLine2 : billingAddress.addressLine2}</p>
              )}
              <p>
                {billingSameAsShipping ? shippingAddress.city : billingAddress.city}, {' '}
                {billingSameAsShipping ? shippingAddress.state : billingAddress.state} {' '}
                {billingSameAsShipping ? shippingAddress.postalCode : billingAddress.postalCode}
              </p>
              <p>{billingSameAsShipping ? shippingAddress.country : billingAddress.country}</p>
              {(billingSameAsShipping ? shippingAddress.email : billingAddress.email) && (
                <p>Email: {billingSameAsShipping ? shippingAddress.email : billingAddress.email}</p>
              )}
              <p className="mt-2">Phone: {billingSameAsShipping ? shippingAddress.phone : billingAddress.phone}</p>
              <p className="text-xs mt-2">
                Source: {billingSameAsShipping ? 'Same as shipping' : (selectedBillingAddressId ? 'Saved address selected' : 'Manual entry')}
              </p>
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
              
              {/* Cash on Delivery / Pay at Venue */}
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
                    <span className="font-medium text-foreground">
                      💵 Cash on Delivery
                    </span>
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
                <span>{formatPrice(orderSubtotal, currency)}</span>
              </div>
              {(
                <>
                  <div className="flex justify-between text-xs text-muted-foreground/70 -mt-1">
                    <span className="pl-4">• Base Price</span>
                    <span>{formatPrice(subtotalBeforeTax, 'INR')}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground/70">
                    <span className="pl-4">• GST (included)</span>
                    <span>{formatPrice(tax, 'INR')}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>{shippingCost === 0 ? 'FREE' : formatPrice(shippingCost, 'INR')}</span>
                  </div>
                </>
              )}
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
                  <Loader size="sm" />
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
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold text-foreground">{formatPrice(confirmedSubtotal, 'INR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Shipping</span>
              <span className="font-semibold text-foreground">{formatPrice(confirmedShipping, 'INR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span className="font-semibold text-foreground">{formatPrice(confirmedTax, 'INR')}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-2 mt-2">
              <span className="text-muted-foreground font-semibold">Total Amount</span>
              <span className="font-bold text-foreground">{formatPrice(confirmedOrderTotal, 'INR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="font-semibold text-foreground">
                {paymentMethod === 'razorpay' ? 'Online Payment' : 'Cash on Delivery'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Delivery Address</span>
              <span className="font-semibold text-right text-foreground">{shippingAddress.city}, {shippingAddress.state}</span>
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
        <Loader size="md" />
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

export default function Checkout() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader size="md" className="mx-auto mb-4" />
          <p className="text-muted-foreground">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
