'use client';

import { useState } from 'react';
import { Calendar, Users, AlertCircle } from 'lucide-react';

interface Departure {
  id: string;
  departureDate: string;
  returnDate: string;
  availableSeats: number;
  bookedSeats: number;
  pricePerPerson: number;
  status: 'available' | 'soldOut' | 'cancelled';
}

interface TourDepartureSelectorProps {
  departures: Departure[];
  onSelectDeparture: (departure: Departure) => void;
  selectedDepartureId?: string;
}

export default function TourDepartureSelector({
  departures,
  onSelectDeparture,
  selectedDepartureId,
}: TourDepartureSelectorProps) {
  const [selected, setSelected] = useState<string | undefined>(selectedDepartureId);

  const handleSelect = (departure: Departure) => {
    if (departure.status === 'available') {
      setSelected(departure.id);
      onSelectDeparture(departure);
    }
  };

  const getAvailableSeats = (departure: Departure) => {
    return departure.availableSeats - departure.bookedSeats;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getDuration = (departure: Departure) => {
    const start = new Date(departure.departureDate);
    const end = new Date(departure.returnDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return { days, nights: days - 1 };
  };

  if (departures.length === 0) {
    return (
      <div className="border border-orange-200 bg-orange-50 rounded-lg">
        <div className="p-6">
          <div className="flex items-center gap-3 text-orange-800">
            <AlertCircle className="w-5 h-5" />
            <div>
              <h4 className="font-semibold">No Upcoming Departures</h4>
              <p className="text-sm">Check back later for new tour dates.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Select Your Departure Date</h3>
      
      {departures.map((departure) => {
        const availableSeats = getAvailableSeats(departure);
        const { days, nights } = getDuration(departure);
        const isSelected = selected === departure.id;
        const isSoldOut = departure.status === 'soldOut' || availableSeats === 0;
        const isCancelled = departure.status === 'cancelled';
        const isLowSeats = availableSeats > 0 && availableSeats < 5;

        return (
          <div
            key={departure.id}
            className={`border rounded-lg cursor-pointer transition-all ${
              isSelected
                ? 'ring-2 ring-blue-500 border-blue-500'
                : isSoldOut || isCancelled
                ? 'opacity-50 cursor-not-allowed bg-gray-50'
                : 'hover:shadow-md hover:border-blue-400 bg-white'
            }`}
            onClick={() => handleSelect(departure)}
          >
            <div className="p-4">
              <div className="flex items-start justify-between gap-4">
                {/* Date and Duration Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-semibold text-lg">
                        {formatDate(departure.departureDate)}
                      </div>
                      <div className="text-sm text-gray-600">
                        Returns: {formatDate(departure.returnDate)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                      {days}D / {nights}N
                    </span>

                    {/* Booking Count Display */}
                    {departure.bookedSeats > 0 && !isCancelled && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        📊 {departure.bookedSeats} booked
                      </span>
                    )}

                    {/* Seats Status */}
                    {isCancelled ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        ❌ Cancelled
                      </span>
                    ) : isSoldOut ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        ❌ Sold Out
                      </span>
                    ) : isLowSeats ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        ⚠️ Only {availableSeats} seats left
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4" />
                        <span>{availableSeats} seats available</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Price and Action */}
                <div className="text-right">
                  <div className="mb-2">
                    <div className="text-2xl font-bold text-blue-600">
                      ₹{departure.pricePerPerson.toLocaleString('en-IN')}
                    </div>
                    <div className="text-xs text-gray-500">per person</div>
                  </div>

                  {isSelected ? (
                    <span className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium bg-green-600 text-white">
                      ✓ Selected
                    </span>
                  ) : (
                    <button
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        isSoldOut || isCancelled
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                      disabled={isSoldOut || isCancelled}
                    >
                      {isSoldOut || isCancelled ? 'Unavailable' : 'Select'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {selected && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Departure date selected. Proceed to booking.</span>
          </div>
        </div>
      )}
    </div>
  );
}
