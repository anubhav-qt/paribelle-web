'use client';

import Link from 'next/link';
// // import { Card, CardContent } from '@/components/ui/card';
// // import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin } from 'lucide-react';
import {
  ProductCardImage,
  ProductCardBadge,
  ProductCardOverlay,
  ProductCardRating,
  ProductCardPrice,
  ProductCardVendor,
} from '@/components/common/ProductCardComponents';
import {
  getDurationDisplay,
  getPriceUnit,
  getDisplayImage,
  formatAvailableDays,
} from '@/lib/utils/product-card-helpers';

interface BookingServiceCardProps {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string;
  featuredImage?: string;
  images?: string[];
  price: number;
  bookingAttributes?: {
    duration?: number;
    durationUnit?: 'hours' | 'days' | 'sessions';
    availableDays?: string[];
  };
  averageRating?: number;
  reviewCount?: number;
  vendorName?: string;
  location?: string;
}

export default function BookingServiceCard({
  id,
  slug,
  name,
  shortDescription,
  featuredImage,
  images,
  price,
  bookingAttributes,
  averageRating = 0,
  reviewCount = 0,
  vendorName,
  location,
}: BookingServiceCardProps) {
  const displayImage = getDisplayImage(featuredImage, images) || '/placeholder-service.jpg';
  
  const duration = getDurationDisplay(
    bookingAttributes?.duration,
    bookingAttributes?.durationUnit
  );
  const priceUnit = getPriceUnit(bookingAttributes?.durationUnit);
  const { visible: visibleDays, remaining: remainingDays } = formatAvailableDays(
    bookingAttributes?.availableDays,
    3
  );

  return (
    <Link href={`/products/${slug}`}>
      <div className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full border rounded-lg">
        <ProductCardImage imageUrl={displayImage} alt={name}>
          {/* Type Badge */}
          <ProductCardBadge 
            text="📅 Service" 
            position="topLeft" 
            className="bg-green-600 text-white"
          />

          {/* Location Overlay */}
          {location && (
            <ProductCardOverlay 
              icon={<MapPin className="w-4 h-4 flex-shrink-0" />}
              text={location}
            />
          )}
        </ProductCardImage>

        <div className="p-4">
          {/* Service Name */}
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {name}
          </h3>

          {/* Short Description */}
          {shortDescription && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {shortDescription}
            </p>
          )}

          {/* Duration */}
          {duration && (
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{duration}</span>
            </div>
          )}

          {/* Available Days */}
          {visibleDays.length > 0 && (
            <div className="mb-3">
              <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                <Calendar className="w-3 h-3" />
                <span>Available:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {visibleDays.map((day) => (
                  <span key={day} className="text-xs bg-gray-200 px-2 py-1 rounded">
                    {day.slice(0, 3)}
                  </span>
                ))}
                {remainingDays > 0 && (
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                    +{remainingDays}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Rating */}
          <ProductCardRating 
            rating={averageRating} 
            reviewCount={reviewCount}
          />

          {/* Pricing */}
          <div className="flex items-center justify-between pt-3 border-t">
            <ProductCardPrice 
              price={price} 
              unit={priceUnit}
            />
            
            <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
              Book Now
            </button>
          </div>

          {/* Vendor Name */}
          <ProductCardVendor vendorName={vendorName} />
        </div>
      </div>
    </Link>
  );
}
