'use client';

import Link from 'next/link';
// import { Card, CardContent } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import {
  ProductCardImage,
  ProductCardBadge,
  ProductCardOverlay,
  ProductCardVendor,
} from '@/components/common/ProductCardComponents';
import {
  calculateAvailableSeats,
  getSeatsStatus,
  formatDestinations,
  capitalizeFirst,
  getDisplayImage,
} from '@/lib/utils/product-card-helpers';
import { calculateTourDuration, formatTourDuration } from '@/lib/utils/product-types';

interface TourCardProps {
  id: string;
  slug: string;
  name: string;
  shortDescription?: string;
  featuredImage?: string;
  images?: string[];
  price: number;
  nextDeparture?: {
    departureDate: string;
    returnDate: string;
    availableSeats: number;
    bookedSeats: number;
    pricePerPerson: number;
  };
  upcomingDeparturesCount?: number;
  tourDetails?: {
    destinations?: string[];
    tourType?: string;
    difficulty?: string;
    groupSize?: { min: number; max: number };
  };
  vendorName?: string;
  vendorSlug?: string;
}

export default function TourCard({
  id,
  slug,
  name,
  shortDescription,
  featuredImage,
  images,
  price,
  nextDeparture,
  upcomingDeparturesCount = 0,
  tourDetails,
  vendorName,
  vendorSlug,
}: TourCardProps) {
  const displayImage = getDisplayImage(featuredImage, images) || '/placeholder-tour.jpg';
  const destinations = formatDestinations(tourDetails?.destinations);
  
  // Calculate duration in days
  const duration = nextDeparture 
    ? calculateTourDuration(nextDeparture.departureDate, nextDeparture.returnDate)
    : null;

  const availableSeats = nextDeparture 
    ? calculateAvailableSeats(nextDeparture.availableSeats, nextDeparture.bookedSeats)
    : 0;
  
  const seatsStatus = getSeatsStatus(availableSeats);

  return (
    <Link href={`/tours/${slug}`}>
      <div className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full">
        <ProductCardImage imageUrl={displayImage} alt={name}>
          {/* Type Badge */}
          <ProductCardBadge 
            text="🎫 Tour Package" 
            position="topLeft" 
            className="bg-purple-600 text-white"
          />

          {/* Difficulty Badge */}
          {tourDetails?.difficulty && (
            <ProductCardBadge 
              text={capitalizeFirst(tourDetails.difficulty)} 
              position="topRight" 
              className="bg-white/90 text-gray-800"
            />
          )}

          {/* Destinations Overlay */}
          {destinations && (
            <ProductCardOverlay 
              icon={<MapPin className="w-4 h-4 flex-shrink-0" />}
              text={destinations}
            />
          )}
        </ProductCardImage>

        <div className="p-4">
          {/* Tour Name */}
          <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
            {name}
          </h3>

          {/* Short Description */}
          {shortDescription && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {shortDescription}
            </p>
          )}

          {/* Tour Details */}
          <div className="flex flex-wrap gap-3 mb-3 text-sm text-gray-600">
            {duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatTourDuration(duration)}</span>
              </div>
            )}
            
            {tourDetails?.groupSize && (
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{tourDetails.groupSize.min}-{tourDetails.groupSize.max}</span>
              </div>
            )}
          </div>

          {/* Next Departure */}
          {nextDeparture && (
            <div className="bg-blue-50 rounded-lg p-3 mb-3">
              <div className="flex items-center gap-2 text-sm mb-1">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-900">
                  Next: {new Date(nextDeparture.departureDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className={`${
                  seatsStatus.severity === 'danger' ? 'text-red-600 font-medium' : 
                  seatsStatus.severity === 'warning' ? 'text-orange-600 font-medium' : 
                  'text-gray-600'
                }`}>
                  {seatsStatus.text}
                </span>
                
                {upcomingDeparturesCount > 1 && (
                  <span className="text-blue-600">
                    +{upcomingDeparturesCount - 1} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div>
              <span className="text-2xl font-bold text-primary">
                ₹{nextDeparture?.pricePerPerson.toLocaleString('en-IN') || price.toLocaleString('en-IN')}
              </span>
              <span className="text-sm text-gray-500 ml-1">/person</span>
            </div>
            
            <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
              View Details
            </button>
          </div>

          {/* Vendor Name */}
          <ProductCardVendor vendorName={vendorName} vendorSlug={vendorSlug} />
        </div>
      </div>
    </Link>
  );
}
