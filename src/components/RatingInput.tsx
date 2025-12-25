'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';

interface RatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  required?: boolean;
}

export default function RatingInput({
  value,
  onChange,
  maxRating = 5,
  size = 'md',
  label,
  required,
}: RatingInputProps) {
  const [hoveredRating, setHoveredRating] = useState(0);

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const displayRating = hoveredRating || value;

  return (
    <div className="space-y-1">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="flex items-center gap-1">
        {[...Array(maxRating)].map((_, index) => {
          const starValue = index + 1;
          const isFilled = starValue <= displayRating;

          return (
            <button
              key={index}
              type="button"
              onClick={() => onChange(starValue)}
              onMouseEnter={() => setHoveredRating(starValue)}
              onMouseLeave={() => setHoveredRating(0)}
              className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-ring rounded"
            >
              <Star
                className={`${sizeClasses[size]} transition-colors ${
                  isFilled
                    ? 'text-yellow-500 fill-yellow-500'
                    : 'text-muted-foreground'
                }`}
              />
            </button>
          );
        })}
        {value > 0 && (
          <span className="ml-2 text-sm text-muted-foreground">
            {value} out of {maxRating}
          </span>
        )}
      </div>
    </div>
  );
}
