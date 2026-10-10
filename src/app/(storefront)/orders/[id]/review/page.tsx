'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ArrowLeft, Package, Loader2 } from 'lucide-react';
import Link from 'next/link';
import ReviewForm from '@/components/ReviewForm';
import ReviewCard from '@/components/ReviewCard';
import { api, errorMessage } from '@/lib/api';
import { Order, OrderItem } from '@/types/common';

type ReviewedItem = OrderItem & { review?: any };

export default function OrderReviewPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<ReviewedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingItemId, setReviewingItemId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [itemsBody, orderData] = await Promise.all([
        api.get<ReviewedItem[] | { items: ReviewedItem[] }>(`/reviews/orders/${orderId}/items`),
        api.get<Order>(`/orders/${orderId}`),
      ]);
      setItems(Array.isArray(itemsBody) ? itemsBody : itemsBody?.items ?? []);
      setOrder(orderData);
    } catch (err) {
      setError(errorMessage(err, 'Could not load this order.'));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitReview = async (item: ReviewedItem, data: { rating: number; comment: string }) => {
    if (item.review?.id) {
      await api.put(`/reviews/products/${item.review.id}`, data);
    } else {
      await api.post('/reviews/products', { ...data, productId: item.productId, orderItemId: item.id });
    }
    setReviewingItemId(null);
    await load();
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
          <Link href="/orders" className="mt-4 inline-block text-primary hover:underline">
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
          <p className="text-muted-foreground">You can only review delivered orders.</p>
          <Link href="/orders" className="mt-4 inline-block text-primary hover:underline">
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
          <div className="mb-6">
            <Link
              href="/orders"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Orders
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Review Order #{order.orderNumber}</h1>
            <p className="text-sm text-muted-foreground mt-1">Share your experience to help other customers</p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
              <Package className="w-5 h-5" />
              Product Reviews
            </h2>

            {items.map((item) => (
              <div key={item.id} className="bg-card rounded-lg border border-border p-6">
                <div className="flex items-start gap-4 mb-4">
                  {item.productImage && (
                    <img src={item.productImage} alt={item.productName} className="w-16 h-16 rounded object-cover" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{item.productName}</h3>
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

                {reviewingItemId === item.id && (
                  <ReviewForm
                    itemName={item.productName}
                    existingReview={item.review}
                    onSubmit={(data) => submitReview(item, data)}
                    onCancel={() => setReviewingItemId(null)}
                  />
                )}

                {item.review && reviewingItemId !== item.id && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-muted-foreground">Your Review</h4>
                      <button
                        onClick={() => setReviewingItemId(item.id)}
                        className="text-sm text-primary hover:underline"
                      >
                        Edit Review
                      </button>
                    </div>
                    <ReviewCard review={item.review} />
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
