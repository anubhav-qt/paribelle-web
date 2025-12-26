'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Play, ZoomIn, X } from 'lucide-react';
import { getImageUrl } from '@/lib/image-url';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
  discount?: number | null;
  layout?: 'vertical' | 'horizontal';
}

export default function ProductImageGallery({ images, productName, discount, layout = 'vertical' }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    <>
      <div className="flex gap-3">
        {/* Thumbnail List - Vertical (Left Side) */}
        {mediaItems.length > 1 && (
          <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
            {mediaItems.map((item, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={`relative flex-shrink-0 w-16 h-16 rounded border-2 transition-all ${
                  selectedIndex === index
                    ? 'border-orange-500 ring-2 ring-orange-200'
                    : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                {isVideo(item) ? (
                  <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                    <Play className="w-5 h-5 text-gray-500" />
                  </div>
                ) : (
                  <img
                    src={item}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Main Image/Video Display */}
        <div className="flex-1">
          <div className="relative bg-white rounded-lg overflow-hidden group border border-gray-200">
            <div className="aspect-square flex items-center justify-center p-8 bg-white">
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
                <div className="relative w-full h-full cursor-pointer" onClick={() => setIsModalOpen(true)}>
                  <img
                    src={mediaItems[selectedIndex]}
                    alt={`${productName} - Image ${selectedIndex + 1}`}
                    className="w-full h-full object-contain"
                  />
                  
                  {/* Click to zoom indicator */}
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 text-sm text-gray-700">
                    <ZoomIn className="w-4 h-4" />
                    Click to view larger
                  </div>
                </div>
              )}
            </div>
            
            {discount && (
              <div className="absolute top-4 left-4 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-bold shadow-md z-10">
                {discount}% OFF
              </div>
            )}

            {/* Navigation Arrows */}
            {mediaItems.length > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 p-2 rounded-full shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-700" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-50 p-2 rounded-full shadow-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                  aria-label="Next image"
                >
                  <ChevronRight className="w-5 h-5 text-gray-700" />
                </button>
              </>
            )}

            {/* Image counter */}
            {mediaItems.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-medium">
                {selectedIndex + 1} / {mediaItems.length}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popup Modal */}
      {isModalOpen && !isVideo(mediaItems[selectedIndex]) && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[75vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 bg-white hover:bg-gray-100 rounded-full p-2 shadow-lg z-10 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
            
            <div className="relative h-[70vh] flex items-center justify-center p-8 bg-white">
              <img
                src={mediaItems[selectedIndex]}
                alt={`${productName} - Full size`}
                className="max-w-full max-h-full object-contain"
              />

              {mediaItems.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-100 p-3 rounded-full shadow-lg transition-all"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-100 p-3 rounded-full shadow-lg transition-all"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-700" />
                  </button>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-4 py-2 rounded-full text-sm font-medium">
                    {selectedIndex + 1} / {mediaItems.length}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
