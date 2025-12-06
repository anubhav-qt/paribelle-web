import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export const useRazorpay = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [razorpayKeyId, setRazorpayKeyId] = useState<string>('');

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setIsLoaded(true);
    document.body.appendChild(script);

    // Fetch Razorpay key
    fetchRazorpayKey();

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchRazorpayKey = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments/razorpay-key`
      );
      const data = await response.json();
      setRazorpayKeyId(data.keyId);
    } catch (error) {
      console.error('Error fetching Razorpay key:', error);
    }
  };

  const createOrder = async (orderId: string, amount: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments/create-order`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            orderId,
            amount,
            currency: 'INR',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create payment order');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  };

  const verifyPayment = async (
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    status: 'success' | 'failed' = 'success'
  ) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/payments/verify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            status,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Payment verification failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Error verifying payment:', error);
      throw error;
    }
  };

  const openCheckout = (
    options: Omit<RazorpayOptions, 'key' | 'handler'>,
    onSuccess: (response: RazorpayResponse) => void,
    onFailure: (error: any) => void
  ) => {
    if (!isLoaded) {
      console.error('Razorpay SDK not loaded');
      onFailure(new Error('Razorpay SDK not loaded'));
      return;
    }

    if (!razorpayKeyId) {
      console.error('Razorpay key not configured');
      onFailure(new Error('Razorpay key not configured'));
      return;
    }

    const rzp = new window.Razorpay({
      ...options,
      key: razorpayKeyId,
      handler: (response: RazorpayResponse) => {
        onSuccess(response);
      },
      modal: {
        ...options.modal,
        ondismiss: () => {
          if (options.modal?.ondismiss) {
            options.modal.ondismiss();
          }
          onFailure(new Error('Payment cancelled by user'));
        },
      },
    });

    rzp.on('payment.failed', (response: any) => {
      onFailure(response.error);
    });

    rzp.open();
  };

  return {
    isLoaded,
    razorpayKeyId,
    createOrder,
    verifyPayment,
    openCheckout,
  };
};
