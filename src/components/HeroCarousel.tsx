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
  const [heroHeight, setHeroHeight] = useState<'compact' | 'standard' | 'tall'>('compact');

  const heroHeightClasses: Record<'compact' | 'standard' | 'tall', string> = {
    compact: 'h-[180px] md:h-[240px] lg:h-[300px]',
    standard: 'h-[240px] md:h-[320px] lg:h-[380px]',
    tall: 'h-[320px] md:h-[420px] lg:h-[520px]',
  };

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        const [bannersRes, heightRes] = await Promise.all([
          fetch(`${baseUrl}/api/v1/settings/hero_banners`),
          fetch(`${baseUrl}/api/v1/settings/hero_height`),
        ]);

        if (bannersRes.ok) {
          const bannersData = await bannersRes.json();
          if (bannersData.value && Array.isArray(bannersData.value) && bannersData.value.length > 0) {
            setBanners(bannersData.value.sort((a: HeroBanner, b: HeroBanner) => a.order - b.order));
          } else {
            setBanners([]);
          }
        }

        if (heightRes.ok) {
          const heightData = await heightRes.json();
          const value = String(heightData?.value || '').toLowerCase();
          if (value === 'compact' || value === 'standard' || value === 'tall') {
            setHeroHeight(value);
          }
        }
      } catch (err) {
        console.error('Error fetching hero data:', err);
        setBanners([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroData();
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
      <div className={`relative w-full ${heroHeightClasses[heroHeight]} bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center`}>
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
      <div className={`relative ${heroHeightClasses[heroHeight]}`}>
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
                  className="w-full h-full object-contain"
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
                    className="inline-block bg-white text-blue-600 px-5 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg animate-fadeIn animation-delay-400"
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
