'use client';

import PhysicalProductCard from './PhysicalProductCard';
import BookingServiceCard from './BookingServiceCard';
import TourCard from './TourCard';
import { isTourProduct, isBookingProduct, isPhysicalProduct } from '@/lib/utils/product-types';

interface ProductCardProps {
  product: any; // Full product object
}

export default function ProductCard({ product }: ProductCardProps) {
  const {
    id,
    slug,
    name,
    shortDescription,
    featuredImage,
    images,
    price,
    compareAtPrice,
    stockQuantity,
    averageRating,
    reviewCount,
    productType,
    attributes,
    vendor,
  } = product;

  const vendorName = vendor?.businessName || vendor?.name;
  const vendorSlug = vendor?.slug || vendor?.subdomain;

  // Tour Product
  if (isTourProduct(productType, attributes)) {
    const tourData = attributes?.tour;
    
    // Find next available departure
    const now = new Date();
    const upcomingDepartures = tourData?.departures?.filter((dep: any) => 
      new Date(dep.departureDate) > now && dep.status === 'available'
    ).sort((a: any, b: any) => 
      new Date(a.departureDate).getTime() - new Date(b.departureDate).getTime()
    ) || [];

    const nextDeparture = upcomingDepartures[0];

    return (
      <TourCard
        id={id}
        slug={slug}
        name={name}
        shortDescription={shortDescription}
        featuredImage={featuredImage}
        images={images}
        price={price}
        nextDeparture={nextDeparture}
        upcomingDeparturesCount={upcomingDepartures.length}
        tourDetails={tourData?.details}
        vendorName={vendorName}
        vendorSlug={vendorSlug}
      />
    );
  }

  // Booking Service Product
  if (isBookingProduct(productType, attributes)) {
    return (
      <BookingServiceCard
        id={id}
        slug={slug}
        name={name}
        shortDescription={shortDescription}
        featuredImage={featuredImage}
        images={images}
        price={price}
        bookingAttributes={attributes?.booking}
        averageRating={averageRating}
        reviewCount={reviewCount}
        vendorName={vendorName}
        vendorSlug={vendorSlug}
        location={vendor?.city || vendor?.address}
      />
    );
  }

  // Physical Product (default)
  return (
    <PhysicalProductCard
      id={id}
      slug={slug}
      name={name}
      shortDescription={shortDescription}
      featuredImage={featuredImage}
      images={images}
      price={price}
      compareAtPrice={compareAtPrice}
      stockQuantity={stockQuantity}
      averageRating={averageRating}
      reviewCount={reviewCount}
      vendorName={vendorName}
      vendorSlug={vendorSlug}
    />
  );
}
