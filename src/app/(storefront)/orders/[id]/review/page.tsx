'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Package, Store, Loader2 } from 'lucide-react';
import Link from 'next/link';
import ReviewForm from '@/components/ReviewForm';
import ReviewCard from '@/components/ReviewCard';
import RatingDisplay from '@/components/RatingDisplay';
import { Order, OrderItem } from '@/types/common';

export default function OrderReviewPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewingItemId, setReviewingItemId] = useState<string | null>(null);
  const [reviewingVendor, setReviewingVendor] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      // Fetch order items with reviews
      const itemsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reviews/orders/${orderId}/items`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!itemsResponse.ok) throw new Error('Failed to fetch order items');
      const items = await itemsResponse.json();

      // Fetch vendor review
      let vendorReview = null;
      try {
        const vendorReviewResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reviews/orders/${orderId}/vendor-review`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (vendorReviewResponse.ok) {
          const text = await vendorReviewResponse.text();
          if (text) {
            const data = JSON.parse(text);
            // Handle both direct review object and { review: null } format
            vendorReview = data.review !== undefined ? data.review : data;
            // If vendorReview is { review: null }, set it to null
            if (vendorReview && vendorReview.review === null) {
              vendorReview = null;
            }
          }
        }
      } catch (err) {
        console.error('Error fetching vendor review:', err);
        // Continue without vendor review
      }

      // Fetch basic order info
      const orderResponse = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!orderResponse.ok) throw new Error('Failed to fetch order');
      const orderData = await orderResponse.json();

      setOrder({
        ...orderData,
        items,
        vendorReview,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitProductReview = async (data: any) => {
    const token = localStorage.getItem('token');
    const endpoint = reviewingItemId
      ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reviews/products`
      : '';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to submit review');
    }

    setReviewingItemId(null);
    await fetchOrderDetails();
  };

  const handleSubmitVendorReview = async (data: any) => {
    const token = localStorage.getItem('token');

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/reviews/vendors`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to submit review');
    }

    setReviewingVendor(false);
    await fetchOrderDetails();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-destructive">{error || 'Order not found'}</p>
          <Link
            href="/orders"
            className="mt-4 inline-block text-primary hover:underline"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  if (order.status !== 'delivered') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-muted-foreground">
            You can only review delivered orders.
          </p>
          <Link
            href="/orders"
            className="mt-4 inline-block text-primary hover:underline"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </Link>
            <h1 className="text-2xl font-bold text-foreground">
              Review Order #{order.orderNumber}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Share your experience to help other customers
            </p>
          </div>

          {/* Vendor Review Section */}
          <div className="bg-card rounded-lg border border-border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5 text-primary" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {order.vendor?.storeName || 'Unknown Vendor'}
                  </h2>
                  <p className="text-sm text-muted-foreground">Review this seller</p>
                </div>
              </div>
              {!order.vendorReview && !reviewingVendor && (
                <button
                  onClick={() => setReviewingVendor(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                >
                  Write Review
                </button>
              )}
            </div>

            {reviewingVendor && order.vendor && (
              <ReviewForm
                type="vendor"
                itemId={order.vendor.id || ''}
                itemName={order.vendor.storeName || 'Unknown Vendor'}
                orderId={order.id}
                onSubmit={handleSubmitVendorReview}
                onCancel={() => setReviewingVendor(false)}
              />
            )}

            {order.vendorReview && !reviewingVendor && (
              <ReviewCard
                review={order.vendorReview}
                type="vendor"
                productQualityRating={order.vendorReview.productQualityRating}
                shippingSpeedRating={order.vendorReview.shippingSpeedRating}
                customerServiceRating={order.vendorReview.customerServiceRating}
              />
            )}
          </div>

          {/* Product Reviews Section */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Package className="w-5 h-5" />
              Product Reviews
            </h2>

            {order.items.map((item) => (
              <div
                key={item.id}
                className="bg-card rounded-lg border border-border p-6"
              >
                {/* Product Info */}
                <div className="flex items-start gap-4 mb-4">
                  {item.productImage && (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="w-16 h-16 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">
                      {item.productName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity} × ₹{item.price}
                    </p>
                  </div>
                  {!item.review && reviewingItemId !== item.id && (
                    <button
                      onClick={() => setReviewingItemId(item.id)}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
                    >
                      Write Review
                    </button>
                  )}
                </div>

                {/* Review Form */}
                {reviewingItemId === item.id && (
                  <ReviewForm
                    type="product"
                    itemId={item.productId}
                    itemName={item.productName}
                    orderItemId={item.id}
                    onSubmit={handleSubmitProductReview}
                    onCancel={() => setReviewingItemId(null)}
                  />
                )}

                {/* Existing Review */}
                {item.review && reviewingItemId !== item.id && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Your Review
                      </h4>
                      <button
                        onClick={() => setReviewingItemId(item.id)}
                        className="text-sm text-primary hover:underline"
                      >
                        Edit Review
                      </button>
                    </div>
                    <ReviewCard review={item.review} type="product" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
