'use client';

import { Star } from 'lucide-react';

interface RatingDisplayProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showNumber?: boolean;
  count?: number;
}

export default function RatingDisplay({
  rating,
  maxRating = 5,
  size = 'md',
  showNumber = true,
  count,
}: RatingDisplayProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="flex items-center gap-1">
      {/* Stars */}
      <div className="flex items-center gap-0.5">
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1;
          const fillPercentage = Math.min(Math.max(rating - index, 0), 1) * 100;

          return (
            <div key={index} className="relative">
              {/* Empty star */}
              <Star className={`${sizeClasses[size]} text-muted-foreground`} />
              {/* Filled star */}
              <div
                className="absolute top-0 left-0 overflow-hidden"
                style={{ width: `${fillPercentage}%` }}
              >
                <Star
                  className={`${sizeClasses[size]} text-yellow-500 fill-yellow-500`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Rating number */}
      {showNumber && (
        <span className={`${textSizes[size]} font-medium text-foreground`}>
          {rating.toFixed(1)}
        </span>
      )}

      {/* Review count */}
      {count !== undefined && (
        <span className={`${textSizes[size]} text-muted-foreground`}>
          ({count})
        </span>
      )}
    </div>
  );
}
