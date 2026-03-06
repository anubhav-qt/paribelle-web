'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroBanner {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  order: number;
}

interface VendorHeroCarouselProps {
  vendorId: string;
  vendorName?: string;
  vendorDescription?: string;
}

export default function VendorHeroCarousel({ vendorId, vendorName, vendorDescription }: VendorHeroCarouselProps) {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch vendor-specific hero banners
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}/hero-banners`)
      .then(res => res.json())
      .then(data => {
        if (data.heroBanners && Array.isArray(data.heroBanners) && data.heroBanners.length > 0) {
          setBanners(data.heroBanners.sort((a: HeroBanner, b: HeroBanner) => a.order - b.order));
        } else {
          // Default fallback banner with vendor info
          setBanners([{
            id: 'default',
            imageUrl: '',
            title: vendorName || 'Welcome to Our Store',
            subtitle: vendorDescription || 'Discover our amazing products and exclusive deals',
            order: 0
          }]);
        }
      })
      .catch(err => {
        console.error('Error fetching vendor hero banners:', err);
        // Default fallback banner
        setBanners([{
          id: 'default',
          imageUrl: '',
          title: vendorName || 'Welcome to Our Store',
          subtitle: vendorDescription || 'Discover our amazing products and exclusive deals',
          order: 0
        }]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [vendorId, vendorName, vendorDescription]);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || banners.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide, banners.length]);

  if (loading) {
    return (
      <div className="relative w-full h-[240px] md:h-[320px] lg:h-[380px] bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  return (
    <div 
      className="relative w-full overflow-hidden"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Slides Container */}
      <div className="relative h-[240px] md:h-[320px] lg:h-[380px]">
        {banners.map((banner, index) => (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {/* Background Image or Gradient */}
            {banner.imageUrl ? (
              <div className="absolute inset-0">
                <img
                  src={banner.imageUrl}
                  alt={banner.title || 'Hero banner'}
                  className="w-full h-full object-cover"
                />
                {/* Overlay for better text readability */}
                <div className="absolute inset-0 bg-black bg-opacity-40"></div>
              </div>
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600"></div>
            )}

            {/* Content */}
            <div className="relative h-full container mx-auto px-4 flex items-center">
              <div className="max-w-3xl text-white">
                {banner.title && (
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 drop-shadow-lg animate-fadeIn">
                    {banner.title}
                  </h1>
                )}
                {banner.subtitle && (
                  <p className="text-sm md:text-base mb-4 text-white/90 drop-shadow-md animate-fadeIn animation-delay-200 line-clamp-2">
                    {banner.subtitle}
                  </p>
                )}
                {banner.ctaText && banner.ctaLink && (
                  <a
                    href={banner.ctaLink}
                    className="inline-block bg-card text-primary px-5 py-2 rounded-lg font-semibold hover:bg-muted transition-colors shadow-lg animate-fadeIn animation-delay-400"
                  >
                    {banner.ctaText}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Arrows */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-card/80 hover:bg-card p-3 rounded-full shadow-lg transition-all hover:scale-110"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-card/80 hover:bg-card p-3 rounded-full shadow-lg transition-all hover:scale-110"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-foreground" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
