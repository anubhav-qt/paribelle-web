'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { getImageUrl } from '@/lib/image-url';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  discount?: number | null;
  layout?: 'vertical' | 'horizontal';
}

export default function ProductImageGallery({ images, productName, discount, layout = 'vertical' }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const mediaItems = images && images.length > 0 
    ? images.map(img => getImageUrl(img)) 
    : ['/placeholder-image.jpg'];

  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? mediaItems.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev === mediaItems.length - 1 ? 0 : prev + 1));
  };

  const isVideo = (url: string) => {
    return url.includes('.mp4') || url.includes('.webm') || url.includes('video') || url.includes('youtube') || url.includes('vimeo');
  };

  return (
    <div className={layout === 'vertical' ? 'flex gap-4' : 'flex flex-col gap-4'}>
      {/* Thumbnail List - Vertical (Left Side) or Horizontal (Bottom) */}
      {mediaItems.length > 1 && layout === 'vertical' && (
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[600px] pr-2">
          {mediaItems.map((item, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`relative flex-shrink-0 w-12 h-12 rounded border-2 transition-all ${
                selectedIndex === index
                  ? 'border-orange-500 shadow-md'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {isVideo(item) ? (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <Play className="w-4 h-4 text-gray-600" />
                </div>
              ) : (
                <img
                  src={item}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main Image/Video Display */}
      <div className="flex-1 relative">
        <div className="sticky top-4">
          <div className="relative aspect-square bg-white rounded-lg overflow-hidden group border border-gray-200">
            {isVideo(mediaItems[selectedIndex]) ? (
              <div className="w-full h-full">
                {mediaItems[selectedIndex].includes('youtube') || mediaItems[selectedIndex].includes('vimeo') ? (
                  <iframe
                    src={mediaItems[selectedIndex]}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={mediaItems[selectedIndex]}
                    controls
                    className="w-full h-full object-contain"
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            ) : (
              <img
                src={mediaItems[selectedIndex]}
                alt={`${productName} - Image ${selectedIndex + 1}`}
                className={`w-full h-full object-contain transition-transform duration-300 p-4 ${isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'}`}
                onClick={() => setIsZoomed(!isZoomed)}
              />
            )}
            
            {discount && (
              <span className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-sm text-sm font-semibold z-10">
                -{discount}%
              </span>
            )}

            {/* Navigation Arrows - Show on hover */}
            {mediaItems.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-6 h-6 text-gray-700" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-6 h-6 text-gray-700" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Horizontal Thumbnail Strip (Bottom) */}
      {mediaItems.length > 1 && layout === 'horizontal' && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {mediaItems.map((item, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`relative flex-shrink-0 w-20 h-20 rounded border-2 transition-all ${
                selectedIndex === index
                  ? 'border-orange-500 shadow-md'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {isVideo(item) ? (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <Play className="w-6 h-6 text-gray-600" />
                </div>
              ) : (
                <img
                  src={item}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
