'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import ThemeRenderer from '@/components/ThemeRenderer';
import Footer from '@/components/Footer';
import { Calendar, MapPin, Users, Clock, Check, X, Info, Star, Phone, Mail, Share2, Loader } from 'lucide-react';
import { handleBookNow, handleEnquireNow, handleShare, handleEmail, handleCall } from '@/lib/utils/booking-actions';

interface TourProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  averageRating: number;
  reviewCount: number;
  productType: string;
  vendor?: {
    id: string;
    storeName: string;
    contactEmail: string;
    contactPhone: string;
  };
  attributes?: {
    tour?: {
      tourMode: boolean;
      departures: Array<{
        id: string;
        departureDate: string;
        returnDate: string;
        availableSeats: number;
        bookedSeats: number;
        pricePerPerson: number;
        status: string;
      }>;
      itinerary: Array<{
        day: number;
        title: string;
        description: string;
        activities: string[];
        meals: string[];
        accommodation?: string;
      }>;
      details: {
        destinations: string[];
        tourType: string;
        difficulty: string;
        groupSize: { min: number; max: number };
        inclusions: string[];
        exclusions: string[];
        pickupPoints: Array<{ location: string; time: string }>;
        dropPoints: Array<{ location: string; time: string }>;
        accommodation: string;
        transportation: string;
        languages: string[];
        ageRestriction?: string;
      };
    };
  };
}

export default function TourDetailsPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [tour, setTour] = useState<TourProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'inclusions' | 'info' | 'reviews'>('itinerary');
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  useEffect(() => {
    fetchTourData();
  }, [slug]);

  // Auto-scroll effect
  useEffect(() => {
    if (!isAutoPlaying || !tour || tour.images.length <= 1) return;

    const interval = setInterval(() => {
      setSelectedImage((prev) => (prev === tour.images.length - 1 ? 0 : prev + 1));
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, tour]);

  const fetchTourData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/slug/${slug}`
      );
      
      if (!response.ok) {
        notFound();
        return;
      }

      const data = await response.json();
      
      // Verify it's a tour product
      if (data.productType !== 'booking' || !data.attributes?.tour?.tourMode) {
        notFound();
        return;
      }

      setTour(data);
    } catch (error) {
      console.error('Error fetching tour:', error);
      notFound();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <ThemeRenderer component="header" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading tour details...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!tour || !tour.attributes?.tour) {
    return notFound();
  }

  const tourData = tour.attributes.tour;
  // Calculate duration from departure dates if available, otherwise use itinerary length
  let duration = tourData.itinerary.length;
  const nextDeparture = tourData.departures.find(d => d.status === 'available');
  
  if (nextDeparture && nextDeparture.departureDate && nextDeparture.returnDate) {
    const depDate = new Date(nextDeparture.departureDate);
    const retDate = new Date(nextDeparture.returnDate);
    const diffTime = Math.abs(retDate.getTime() - depDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end day
    if (diffDays > 0) duration = diffDays;
  }
  const discount = tour.compareAtPrice ? Math.round(((tour.compareAtPrice - tour.price) / tour.compareAtPrice) * 100) : 0;

  return (
    <>
      <ThemeRenderer component="header" />
      
      <main className="min-h-screen bg-gray-50">
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb */}
            <div className="text-sm text-gray-500 mb-4">
              Home / Tours / {tour.name}
            </div>

            {/* Title and Quick Info */}
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                {tour.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">{tour.averageRating}</span>
                  <span>({tour.reviewCount} reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{tourData.details.destinations.join(', ')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{duration} Days / {duration - 1} Nights</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{tourData.details.groupSize.min}-{tourData.details.groupSize.max} People</span>
                </div>
              </div>
            </div>

            {/* Image Gallery - Professional Layout */}
            <div className="mb-8">
              {/* Main Image */}
              <div className="relative mb-3 group cursor-pointer bg-gray-100 rounded-xl" onClick={() => setIsLightboxOpen(true)}>
                <img
                  src={tour.images[selectedImage] || tour.images[0]}
                  alt={tour.name}
                  className="w-full h-[500px] object-contain rounded-xl shadow-lg hover:shadow-2xl transition-shadow"
                />
                
                {/* Click to Zoom Indicator */}
                <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-medium backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                  Click to Zoom
                </div>
                
                {/* Image Counter and Auto-play Controls */}
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                  {tour.images.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAutoPlaying(!isAutoPlaying);
                      }}
                      className="bg-black/70 hover:bg-black/80 text-white p-2 rounded-lg transition backdrop-blur-sm"
                      aria-label={isAutoPlaying ? 'Pause slideshow' : 'Play slideshow'}
                    >
                      {isAutoPlaying ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                  )}
                  <div className="bg-black/70 text-white px-3 py-1.5 rounded-lg text-sm font-medium backdrop-blur-sm">
                    {selectedImage + 1} / {tour.images.length}
                  </div>
                </div>
                
                {/* Navigation Arrows */}
                {tour.images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAutoPlaying(false);
                        setSelectedImage(selectedImage === 0 ? tour.images.length - 1 : selectedImage - 1);
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition opacity-0 group-hover:opacity-100"
                      aria-label="Previous image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsAutoPlaying(false);
                        setSelectedImage(selectedImage === tour.images.length - 1 ? 0 : selectedImage + 1);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition opacity-0 group-hover:opacity-100"
                      aria-label="Next image"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
              
              {/* Thumbnail Gallery */}
              {tour.images.length > 1 && (
                <div className="grid grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {tour.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setIsAutoPlaying(false);
                        setSelectedImage(idx);
                      }}
                      className={`relative aspect-square rounded-lg overflow-hidden transition-all ${
                        selectedImage === idx 
                          ? 'ring-3 ring-blue-500 ring-offset-2 shadow-lg scale-105' 
                          : 'hover:ring-2 hover:ring-gray-300 hover:scale-105 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${tour.name} ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {selectedImage === idx && (
                        <div className="absolute inset-0 bg-blue-500/20"></div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Lightbox Modal */}
            {isLightboxOpen && (
              <div 
                className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
                onClick={() => {
                  setIsLightboxOpen(false);
                  setZoomLevel(1);
                }}
              >
                {/* Close Button */}
                <button
                  onClick={() => {
                    setIsLightboxOpen(false);
                    setZoomLevel(1);
                  }}
                  className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 p-3 rounded-full transition z-10"
                  aria-label="Close lightbox"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Zoom Controls */}
                <div className="absolute top-4 right-20 flex gap-2 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomLevel(Math.max(0.5, zoomLevel - 0.25));
                    }}
                    className="text-white bg-black/50 hover:bg-black/70 p-3 rounded-full transition"
                    aria-label="Zoom out"
                    disabled={zoomLevel <= 0.5}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                    </svg>
                  </button>
                  <div className="bg-black/70 text-white px-3 py-3 rounded-full text-sm font-medium backdrop-blur-sm min-w-[60px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomLevel(Math.min(3, zoomLevel + 0.25));
                    }}
                    className="text-white bg-black/50 hover:bg-black/70 p-3 rounded-full transition"
                    aria-label="Zoom in"
                    disabled={zoomLevel >= 3}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomLevel(1);
                    }}
                    className="text-white bg-black/50 hover:bg-black/70 px-4 py-3 rounded-full transition text-sm font-medium"
                    aria-label="Reset zoom"
                  >
                    Reset
                  </button>
                </div>

                {/* Image Counter */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm">
                  {selectedImage + 1} / {tour.images.length}
                </div>

                {/* Main Lightbox Image Container with Scroll */}
                <div 
                  className="relative max-w-7xl max-h-[90vh] w-full overflow-auto" 
                  onClick={(e) => e.stopPropagation()}
                  style={{ 
                    cursor: zoomLevel > 1 ? 'move' : 'default'
                  }}
                >
                  <img
                    src={tour.images[selectedImage]}
                    alt={tour.name}
                    className="mx-auto transition-transform duration-200"
                    style={{
                      transform: `scale(${zoomLevel})`,
                      transformOrigin: 'center center',
                      maxHeight: zoomLevel > 1 ? 'none' : '90vh'
                    }}
                  />
                </div>

                {/* Navigation Arrows */}
                {tour.images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(selectedImage === 0 ? tour.images.length - 1 : selectedImage - 1);
                        setZoomLevel(1);
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-4 rounded-full shadow-lg transition"
                      aria-label="Previous image"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImage(selectedImage === tour.images.length - 1 ? 0 : selectedImage + 1);
                        setZoomLevel(1);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-4 rounded-full shadow-lg transition"
                      aria-label="Next image"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </>
                )}

                {/* Thumbnail Strip at Bottom */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 max-w-4xl w-full px-4">
                  <div className="flex gap-2 overflow-x-auto pb-2 justify-center">
                    {tour.images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(idx);
                          setZoomLevel(1);
                        }}
                        className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all ${
                          selectedImage === idx 
                            ? 'ring-3 ring-white ring-offset-2 ring-offset-black scale-110' 
                            : 'opacity-50 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Tour Details */}
              <div className="lg:col-span-2">
                {/* Description */}
                {tour.shortDescription && (
                  <div className="mb-6">
                    <div 
                      className="text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: tour.shortDescription }}
                    />
                  </div>
                )}

                {/* Quick Highlights */}
                {tourData.details.inclusions.length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Tour Highlights</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {tourData.details.inclusions.slice(0, 8).map((highlight, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{highlight}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                  <div className="flex gap-8">
                    <button
                      onClick={() => setActiveTab('itinerary')}
                      className={`pb-4 px-2 font-semibold transition ${
                        activeTab === 'itinerary'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Itinerary
                    </button>
                    <button
                      onClick={() => setActiveTab('inclusions')}
                      className={`pb-4 px-2 font-semibold transition ${
                        activeTab === 'inclusions'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Inclusions
                    </button>
                    <button
                      onClick={() => setActiveTab('info')}
                      className={`pb-4 px-2 font-semibold transition ${
                        activeTab === 'info'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Important Info
                    </button>
                    <button
                      onClick={() => setActiveTab('reviews')}
                      className={`pb-4 px-2 font-semibold transition ${
                        activeTab === 'reviews'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Reviews
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                {activeTab === 'itinerary' && (
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-900">Detailed Itinerary</h2>
                    {tourData.itinerary.map((day, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                              {day.day}
                            </div>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{day.title}</h3>
                            <p className="text-gray-700 mb-4 leading-relaxed">{day.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                              <div>
                                <p className="text-sm font-semibold text-gray-600">Meals</p>
                                <p className="text-gray-900">{day.meals.join(', ')}</p>
                              </div>
                              {day.accommodation && (
                                <div>
                                  <p className="text-sm font-semibold text-gray-600">Accommodation</p>
                                  <p className="text-gray-900">{day.accommodation}</p>
                                </div>
                              )}
                            </div>

                            {day.activities.length > 0 && (
                              <div className="mt-4">
                                <p className="text-sm font-semibold text-gray-600 mb-2">Activities</p>
                                <div className="flex flex-wrap gap-2">
                                  {day.activities.map((activity, aIdx) => (
                                    <span
                                      key={aIdx}
                                      className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full"
                                    >
                                      {activity}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'inclusions' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Check className="w-6 h-6 text-green-600" />
                        What's Included
                      </h2>
                      <ul className="space-y-3">
                        {tourData.details.inclusions.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <X className="w-6 h-6 text-red-600" />
                        What's Not Included
                      </h2>
                      <ul className="space-y-3">
                        {tourData.details.exclusions.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'info' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Info className="w-6 h-6 text-blue-600" />
                        Tour Information
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-600">Tour Type</p>
                          <p className="text-gray-900 capitalize">{tourData.details.tourType}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-600">Difficulty</p>
                          <p className="text-gray-900 capitalize">{tourData.details.difficulty}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-600">Accommodation</p>
                          <p className="text-gray-900">{tourData.details.accommodation}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-600">Transportation</p>
                          <p className="text-gray-900">{tourData.details.transportation}</p>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-600">Languages</p>
                          <p className="text-gray-900">{tourData.details.languages.join(', ')}</p>
                        </div>
                        {tourData.details.ageRestriction && (
                          <div>
                            <p className="text-sm font-semibold text-gray-600">Age Restriction</p>
                            <p className="text-gray-900">{tourData.details.ageRestriction}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {tourData.details.pickupPoints.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Pickup Points</h2>
                        <ul className="space-y-2">
                          {tourData.details.pickupPoints.map((point, idx) => (
                            <li key={idx} className="flex items-center justify-between text-gray-700">
                              <span>📍 {point.location}</span>
                              <span className="text-sm text-gray-500">{point.time}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {tour.description && (
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Full Description</h2>
                        <div 
                          className="prose max-w-none text-gray-700"
                          dangerouslySetInnerHTML={{ __html: tour.description }}
                        />
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
                    <div className="text-center py-12 text-gray-500">
                      <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p>No reviews yet. Be the first to review this tour!</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Booking Card (Sticky) */}
              <div className="lg:col-span-1">
                <div className="sticky top-8 bg-white border-2 border-gray-200 rounded-lg p-6 shadow-lg">
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl font-bold text-gray-900">₹{tour.price.toLocaleString()}</span>
                      {tour.compareAtPrice && (
                        <span className="text-lg text-gray-500 line-through">₹{tour.compareAtPrice.toLocaleString()}</span>
                      )}
                    </div>
                    {discount > 0 && (
                      <p className="text-sm text-green-600 font-semibold">
                        Save ₹{(tour.compareAtPrice! - tour.price).toLocaleString()} ({discount}% Off)
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">Per person</p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="text-sm">{duration} Days / {duration - 1} Nights</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="text-sm">{tourData.details.groupSize.min}-{tourData.details.groupSize.max} People</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <span className="text-sm">{tourData.details.destinations[0]}</span>
                    </div>
                  </div>

                  {nextDeparture && (
                    <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Next Departure</p>
                      <p className="text-blue-600 font-semibold">{new Date(nextDeparture.departureDate).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {nextDeparture.availableSeats} seats available
                      </p>
                    </div>
                  )}

                  <button 
                    onClick={() => handleBookNow(tour.slug, !!nextDeparture)}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition mb-3"
                  >
                    Book Now
                  </button>
                  
                  <button 
                    onClick={() => handleEnquireNow(
                      { slug: tour.slug, name: tour.name },
                      `Hi, I'm interested in the ${tour.name} tour. Can you provide more details?`
                    )}
                    className="w-full bg-white text-blue-600 py-3 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition mb-4"
                  >
                    Enquire Now
                  </button>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleCall(tour.vendor?.contactPhone || '+91-1234567890', { slug: tour.slug, name: tour.name })}
                      className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      title={`Call ${tour.vendor?.storeName || 'us'}`}
                    >
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">Call</span>
                    </button>
                    <button 
                      onClick={() => handleEmail({ slug: tour.slug, name: tour.name }, tour.vendor?.contactEmail)}
                      className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      title={`Email ${tour.vendor?.storeName || 'us'}`}
                    >
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">Email</span>
                    </button>
                    <button 
                      onClick={() => handleShare(
                        { slug: tour.slug, name: tour.name },
                        tour.shortDescription
                      )}
                      className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                      title="Share tour"
                    >
                      <Share2 className="w-4 h-4" />
                      <span className="text-sm">Share</span>
                    </button>
                  </div>

                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-semibold text-green-800 mb-2">✓ Instant Confirmation</p>
                    <p className="text-sm font-semibold text-green-800 mb-2">✓ Best Price Guarantee</p>
                    <p className="text-sm font-semibold text-green-800">✓ 24/7 Customer Support</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
