'use client';

import { useState } from 'react';
import ThemeRenderer from '@/components/ThemeRenderer';
import Footer from '@/components/Footer';
import { Calendar, MapPin, Users, Clock, Check, X, Info, Star, Phone, Mail, Share2 } from 'lucide-react';

export default function TripTemplatePage() {
  const [activeTab, setActiveTab] = useState<'itinerary' | 'inclusions' | 'info' | 'reviews'>('itinerary');
  const [selectedImage, setSelectedImage] = useState(0);

  // Sample data - this would come from the product/trip API
  const tripData = {
    title: "Amazing Kashmir Tour Package - 7 Days / 6 Nights",
    shortDescription: "Experience the paradise on earth with our exclusive Kashmir tour package covering Srinagar, Gulmarg, Pahalgam, and Sonmarg",
    price: 24999,
    originalPrice: 29999,
    rating: 4.8,
    reviews: 156,
    duration: "7 Days / 6 Nights",
    groupSize: "2-15 People",
    location: "Kashmir, India",
    startingPoint: "Srinagar Airport",
    
    highlights: [
      "Shikara ride on Dal Lake",
      "Gondola cable car ride in Gulmarg",
      "Visit to Betaab Valley & Aru Valley in Pahalgam",
      "Scenic drive to Sonmarg - Meadow of Gold",
      "Stay in premium houseboats & hotels",
      "Traditional Kashmiri Wazwan dinner",
      "Visit Mughal Gardens",
      "Shopping in local markets"
    ],

    images: [
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800",
    ],

    itinerary: [
      {
        day: 1,
        title: "Arrival in Srinagar",
        description: "Arrive at Srinagar Airport where you'll be greeted by our representative. Transfer to your hotel/houseboat. After freshening up, visit the famous Mughal Gardens including Nishat Bagh and Shalimar Bagh. Evening Shikara ride on Dal Lake. Overnight stay in Srinagar.",
        meals: "Dinner",
        accommodation: "Hotel/Houseboat in Srinagar",
        activities: ["Airport pickup", "Mughal Gardens visit", "Shikara ride", "Dal Lake sunset"]
      },
      {
        day: 2,
        title: "Srinagar to Gulmarg (50 km / 2 hours)",
        description: "After breakfast, drive to Gulmarg - 'Meadow of Flowers'. Experience the Gondola cable car ride to Phase 1 and Phase 2 (at own cost). Enjoy activities like horse riding, snow sledging (seasonal). Return to Srinagar in the evening. Overnight stay in Srinagar.",
        meals: "Breakfast, Dinner",
        accommodation: "Hotel/Houseboat in Srinagar",
        activities: ["Drive to Gulmarg", "Gondola ride", "Horse riding", "Photography"]
      },
      {
        day: 3,
        title: "Srinagar to Pahalgam (95 km / 3 hours)",
        description: "Post breakfast, checkout and drive to Pahalgam - 'Valley of Shepherds'. En route visit Saffron fields and Awantipora ruins. On arrival, check into hotel. Evening at leisure to explore the local market. Overnight stay in Pahalgam.",
        meals: "Breakfast, Dinner",
        accommodation: "Hotel in Pahalgam",
        activities: ["Saffron fields", "Awantipora ruins", "Lidder River", "Local market"]
      },
      {
        day: 4,
        title: "Pahalgam Local Sightseeing",
        description: "After breakfast, visit Betaab Valley, Aru Valley, and Chandanwari (union point). These locations offer breathtaking views and are perfect for nature photography. Optional activities include river rafting and horse riding. Return to hotel. Overnight in Pahalgam.",
        meals: "Breakfast, Dinner",
        accommodation: "Hotel in Pahalgam",
        activities: ["Betaab Valley", "Aru Valley", "Chandanwari", "Nature photography"]
      },
      {
        day: 5,
        title: "Pahalgam to Srinagar via Sonmarg (160 km / 5 hours)",
        description: "Check out after breakfast and drive towards Srinagar via Sonmarg - 'Meadow of Gold'. Stop at Sonmarg for 3-4 hours. Visit Thajiwas Glacier (by pony/walking). Continue drive to Srinagar. Check into hotel. Overnight stay in Srinagar.",
        meals: "Breakfast, Dinner",
        accommodation: "Hotel/Houseboat in Srinagar",
        activities: ["Sonmarg visit", "Thajiwas Glacier", "Scenic drive", "Mountain views"]
      },
      {
        day: 6,
        title: "Srinagar Local Sightseeing",
        description: "After breakfast, visit Shankaracharya Temple, Hazratbal Shrine, and Pari Mahal. Afternoon shopping at Lal Chowk and Boulevard Road for Kashmiri handicrafts, Pashmina shawls, dry fruits, and saffron. Evening Shikara ride. Enjoy traditional Wazwan dinner. Overnight in Srinagar.",
        meals: "Breakfast, Dinner (Wazwan)",
        accommodation: "Hotel/Houseboat in Srinagar",
        activities: ["Temple visits", "Shopping", "Shikara ride", "Wazwan dinner"]
      },
      {
        day: 7,
        title: "Departure from Srinagar",
        description: "After breakfast, checkout from hotel. Our representative will drop you at Srinagar Airport for your onward journey. Tour ends with beautiful memories of Kashmir.",
        meals: "Breakfast",
        accommodation: "N/A",
        activities: ["Checkout", "Airport drop", "Departure"]
      }
    ],

    inclusions: [
      "Accommodation for 6 nights (3 nights in Srinagar, 2 nights in Pahalgam, 1 night in hotel/houseboat)",
      "Daily breakfast and dinner",
      "All transfers and sightseeing by AC vehicle (Swift Dzire/Etios/Similar)",
      "Shikara ride on Dal Lake",
      "Driver allowance, toll taxes, parking, fuel charges",
      "All applicable hotel taxes",
      "Airport pickup and drop"
    ],

    exclusions: [
      "Airfare / Train fare",
      "Gondola cable car tickets in Gulmarg (₹1,500 - ₹3,000)",
      "Entry fees to monuments and gardens",
      "Horse riding charges",
      "Lunch and any meals not mentioned",
      "Personal expenses (laundry, phone calls, tips)",
      "Travel insurance",
      "Any additional activities not mentioned",
      "GST 5%"
    ],

    importantInfo: [
      "Valid ID proof is mandatory for all guests",
      "Winter clothing is recommended (October to March)",
      "Gondola tickets in Gulmarg are subject to availability and weather conditions",
      "Itinerary is subject to change due to weather conditions or political situations",
      "Check-in time: 2:00 PM | Check-out time: 11:00 AM",
      "Early check-in or late check-out subject to availability",
      "Child below 5 years is complimentary (without extra bed)",
      "Child 5-12 years will be charged 50% of adult cost (with extra bed)",
      "Triple sharing discount available"
    ],

    thingsToCarry: [
      "Warm clothing (jacket, sweater, thermal wear)",
      "Comfortable walking shoes",
      "Sunglasses and sunscreen",
      "Personal medications",
      "Camera and chargers",
      "Valid ID proof (Aadhar/PAN/Passport)",
      "Umbrella or raincoat"
    ],

    bookingPolicy: [
      "25% advance payment required for booking confirmation",
      "Balance 75% payment before 7 days of travel",
      "Full payment if booking is made within 7 days of travel",
      "Payment modes: Bank transfer, UPI, Credit/Debit cards"
    ],

    cancellationPolicy: [
      "30+ days before travel: 10% cancellation fee",
      "15-30 days before travel: 25% cancellation fee",
      "7-14 days before travel: 50% cancellation fee",
      "Less than 7 days: No refund",
      "No show: No refund"
    ]
  };

  return (
    <>
      <ThemeRenderer component="header" />
      
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section with Image Gallery */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb */}
            <div className="text-sm text-gray-500 mb-4">
              Home / Tours / Kashmir Tours / {tripData.title}
            </div>

            {/* Title and Quick Info */}
            <div className="mb-6">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                {tripData.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">{tripData.rating}</span>
                  <span>({tripData.reviews} reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{tripData.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{tripData.duration}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{tripData.groupSize}</span>
                </div>
              </div>
            </div>

            {/* Image Gallery */}
            <div className="grid grid-cols-4 gap-2 mb-8">
              <div className="col-span-4 md:col-span-3 row-span-2">
                <img
                  src={tripData.images[selectedImage]}
                  alt="Main trip"
                  className="w-full h-[400px] object-cover rounded-lg"
                />
              </div>
              {tripData.images.slice(0, 4).map((img, idx) => (
                <div
                  key={idx}
                  className="cursor-pointer hover:opacity-80 transition"
                  onClick={() => setSelectedImage(idx)}
                >
                  <img
                    src={img}
                    alt={`Trip ${idx + 1}`}
                    className={`w-full h-[95px] object-cover rounded-lg ${
                      selectedImage === idx ? 'ring-2 ring-blue-500' : ''
                    }`}
                  />
                </div>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Trip Details */}
              <div className="lg:col-span-2">
                {/* Quick Highlights */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Tour Highlights</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tripData.highlights.map((highlight, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </div>

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
                    {tripData.itinerary.map((day, idx) => (
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
                                <p className="text-gray-900">{day.meals}</p>
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-600">Accommodation</p>
                                <p className="text-gray-900">{day.accommodation}</p>
                              </div>
                            </div>

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
                        Inclusions
                      </h2>
                      <ul className="space-y-3">
                        {tripData.inclusions.map((item, idx) => (
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
                        Exclusions
                      </h2>
                      <ul className="space-y-3">
                        {tripData.exclusions.map((item, idx) => (
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
                        Important Information
                      </h2>
                      <ul className="space-y-3">
                        {tripData.importantInfo.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="text-blue-600 font-bold">•</span>
                            <span className="text-gray-700">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Things to Carry</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {tripData.thingsToCarry.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-gray-700">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Policy</h2>
                      <ul className="space-y-2">
                        {tripData.bookingPolicy.map((item, idx) => (
                          <li key={idx} className="text-gray-700">• {item}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                      <h2 className="text-xl font-bold text-gray-900 mb-4">Cancellation Policy</h2>
                      <ul className="space-y-2">
                        {tripData.cancellationPolicy.map((item, idx) => (
                          <li key={idx} className="text-gray-700">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
                    <div className="text-center py-12 text-gray-500">
                      <p>Reviews section - integrate with your review system</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Booking Card (Sticky) */}
              <div className="lg:col-span-1">
                <div className="sticky top-8 bg-white border-2 border-gray-200 rounded-lg p-6 shadow-lg">
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl font-bold text-gray-900">₹{tripData.price.toLocaleString()}</span>
                      <span className="text-lg text-gray-500 line-through">₹{tripData.originalPrice.toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-green-600 font-semibold">
                      Save ₹{(tripData.originalPrice - tripData.price).toLocaleString()} ({Math.round(((tripData.originalPrice - tripData.price) / tripData.originalPrice) * 100)}% Off)
                    </p>
                    <p className="text-sm text-gray-600 mt-1">Per person (Twin sharing)</p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3 text-gray-700">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      <span className="text-sm">{tripData.duration}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span className="text-sm">{tripData.groupSize}</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-700">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <span className="text-sm">Starts from {tripData.startingPoint}</span>
                    </div>
                  </div>

                  <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition mb-3">
                    Book Now
                  </button>
                  
                  <button className="w-full bg-white text-blue-600 py-3 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition mb-4">
                    Enquire Now
                  </button>

                  <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">Call</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">Email</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
                      <Share2 className="w-4 h-4" />
                      <span className="text-sm">Share</span>
                    </button>
                  </div>

                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-semibold text-green-800 mb-2">✓ Instant Confirmation</p>
                    <p className="text-sm font-semibold text-green-800 mb-2">✓ Free Cancellation up to 30 days</p>
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
