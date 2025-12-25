'use client';

import { useState } from 'react';
import RatingInput from './RatingInput';
import { Loader2, X } from 'lucide-react';

interface ReviewFormProps {
  type: 'product' | 'vendor';
  itemId: string;
  itemName: string;
  orderItemId?: string;
  orderId?: string;
  existingReview?: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function ReviewForm({
  type,
  itemId,
  itemName,
  orderItemId,
  orderId,
  existingReview,
  onSubmit,
  onCancel,
}: ReviewFormProps) {
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [productQualityRating, setProductQualityRating] = useState(
    existingReview?.productQualityRating || 0
  );
  const [shippingSpeedRating, setShippingSpeedRating] = useState(
    existingReview?.shippingSpeedRating || 0
  );
  const [customerServiceRating, setCustomerServiceRating] = useState(
    existingReview?.customerServiceRating || 0
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (comment.trim().length < 10) {
      setError('Review must be at least 10 characters long');
      return;
    }

    setIsSubmitting(true);

    try {
      const data: any = {
        rating,
        comment,
      };

      if (type === 'product') {
        data.productId = itemId;
        if (orderItemId) {
          data.orderItemId = orderItemId;
        }
      } else {
        data.vendorId = itemId;
        if (orderId) {
          data.orderId = orderId;
        }
        if (productQualityRating > 0) {
          data.productQualityRating = productQualityRating;
        }
        if (shippingSpeedRating > 0) {
          data.shippingSpeedRating = shippingSpeedRating;
        }
        if (customerServiceRating > 0) {
          data.customerServiceRating = customerServiceRating;
        }
      }

      await onSubmit(data);
    } catch (err: any) {
      setError(err.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          {existingReview ? 'Edit Review' : 'Write a Review'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 hover:bg-accent rounded-md transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Item name */}
      <div className="text-sm text-muted-foreground">
        Reviewing: <span className="font-medium text-foreground">{itemName}</span>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive rounded-md text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Overall Rating */}
      <RatingInput
        label="Overall Rating"
        value={rating}
        onChange={setRating}
        required
      />

      {/* Vendor-specific ratings */}
      {type === 'vendor' && (
        <div className="space-y-3 p-4 bg-accent/50 rounded-lg">
          <h4 className="text-sm font-medium text-foreground">Detailed Ratings (Optional)</h4>
          
          <RatingInput
            label="Product Quality"
            value={productQualityRating}
            onChange={setProductQualityRating}
            size="sm"
          />

          <RatingInput
            label="Shipping Speed"
            value={shippingSpeedRating}
            onChange={setShippingSpeedRating}
            size="sm"
          />

          <RatingInput
            label="Customer Service"
            value={customerServiceRating}
            onChange={setCustomerServiceRating}
            size="sm"
          />
        </div>
      )}

      {/* Comment */}
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">
          Your Review
          <span className="text-red-500 ml-1">*</span>
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={`Share your experience with this ${type}...`}
          className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
          required
        />
        <div className="text-xs text-muted-foreground">
          {comment.length} characters (minimum 10)
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-input bg-background text-foreground rounded-md hover:bg-accent transition-colors"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || rating === 0}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {existingReview ? 'Update Review' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
}
