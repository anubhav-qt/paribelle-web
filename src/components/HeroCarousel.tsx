'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';

interface HeroBanner {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  order: number;
}

export default function HeroCarousel() {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch hero banners from admin settings
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/hero_banners`;
    
    fetch(apiUrl)
      .then(res => res.json())
      .then(data => {
        if (data.value && Array.isArray(data.value) && data.value.length > 0) {
          setBanners(data.value.sort((a: HeroBanner, b: HeroBanner) => a.order - b.order));
        } else {
          // Default fallback banner
          setBanners([{
            id: 'default',
            imageUrl: '',
            title: 'Discover Amazing Products',
            subtitle: 'Shop from thousands of products across multiple categories. Best prices, fast delivery, and quality guaranteed.',
            order: 0
          }]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching hero banners:', err);
        // Default fallback banner
        setBanners([{
          id: 'default',
          imageUrl: '',
          title: 'Discover Amazing Products',
          subtitle: 'Shop from thousands of products across multiple categories. Best prices, fast delivery, and quality guaranteed.',
          order: 0
        }]);
        setLoading(false);
      });
  }, []);

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
      <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-sm opacity-75">Loading hero banners...</p>
        </div>
      </div>
    );
  }

  if (banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  return (
    <div 
      className="relative w-full overflow-hidden -mb-1"
      onMouseEnter={() => setIsAutoPlaying(false)}
      onMouseLeave={() => setIsAutoPlaying(true)}
    >
      {/* Slides Container */}
      <div className="relative h-[400px] md:h-[500px] lg:h-[600px]">
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
                  loading={index === 0 ? 'eager' : 'lazy'}
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
                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 drop-shadow-lg animate-fadeIn">
                    {banner.title}
                  </h1>
                )}
                {banner.subtitle && (
                  <p className="text-lg md:text-xl mb-6 text-white/90 drop-shadow-md animate-fadeIn animation-delay-200">
                    {banner.subtitle}
                  </p>
                )}
                {banner.ctaText && banner.ctaLink && (
                  <a
                    href={banner.ctaLink}
                    className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg animate-fadeIn animation-delay-400"
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
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white p-3 rounded-full shadow-lg transition-all hover:scale-110"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6 text-gray-800" />
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
