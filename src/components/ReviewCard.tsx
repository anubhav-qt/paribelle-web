'use client';

import { useState } from 'react';
import RatingDisplay from './RatingDisplay';
import { formatDistanceToNow } from 'date-fns';
import { ThumbsUp, MessageSquare, CheckCircle } from 'lucide-react';

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    isVerifiedPurchase: boolean;
    vendorResponse?: string;
    vendorResponseDate?: string;
    user?: {
      firstName: string;
      lastName: string;
      avatar?: string;
    };
  };
  type?: 'product' | 'vendor';
  productQualityRating?: number;
  shippingSpeedRating?: number;
  customerServiceRating?: number;
}

export default function ReviewCard({
  review,
  type = 'product',
  productQualityRating,
  shippingSpeedRating,
  customerServiceRating,
}: ReviewCardProps) {
  const getUserInitials = () => {
    if (!review.user?.firstName || !review.user?.lastName) return 'U';
    return `${review.user.firstName[0]}${review.user.lastName[0]}`.toUpperCase();
  };

  return (
    <div className="border border-border rounded-lg p-4 space-y-3 bg-card">
      {/* User Info & Rating */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {review.user?.avatar ? (
              <img
                src={review.user.avatar}
                alt={`${review.user.firstName} ${review.user.lastName}`}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-medium">
                {getUserInitials()}
              </div>
            )}
          </div>

          {/* Name & Verified */}
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-foreground">
                {review.user ? `${review.user.firstName} ${review.user.lastName}` : 'Anonymous User'}
              </h4>
              {review.isVerifiedPurchase && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  <span>Verified Purchase</span>
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
            </div>
          </div>
        </div>

        {/* Overall Rating */}
        <RatingDisplay rating={review.rating} showNumber={false} size="sm" />
      </div>

      {/* Detailed Ratings (Vendor Reviews) */}
      {type === 'vendor' && (productQualityRating || shippingSpeedRating || customerServiceRating) && (
        <div className="flex flex-wrap gap-4 text-xs bg-accent/30 p-2 rounded">
          {productQualityRating && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Quality:</span>
              <RatingDisplay rating={productQualityRating} showNumber={false} size="sm" />
            </div>
          )}
          {shippingSpeedRating && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Shipping:</span>
              <RatingDisplay rating={shippingSpeedRating} showNumber={false} size="sm" />
            </div>
          )}
          {customerServiceRating && (
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Service:</span>
              <RatingDisplay rating={customerServiceRating} showNumber={false} size="sm" />
            </div>
          )}
        </div>
      )}

      {/* Comment */}
      <p className="text-sm text-foreground whitespace-pre-line">{review.comment}</p>

      {/* Vendor Response */}
      {review.vendorResponse && (
        <div className="mt-3 pl-4 border-l-2 border-primary bg-accent/20 p-3 rounded">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Vendor Response</span>
            {review.vendorResponseDate && (
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(review.vendorResponseDate), { addSuffix: true })}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{review.vendorResponse}</p>
        </div>
      )}
    </div>
  );
}
