'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { getCurrencySymbol } from '@/lib/currency';

interface TimeSlot {
  start: string;
  end: string;
}

interface AvailableTimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

interface BookingData {
  duration: number; // in minutes
  durationUnit: 'hours' | 'days' | 'sessions';
  bufferTime: number;
  availableDays: string[];
  timeSlots: TimeSlot[];
}

interface BookingCalendarProps {
  productId: string;
  bookingData: BookingData;
  price: number;
  onBookingSelect: (booking: {
    startDate: Date;
    endDate: Date;
    startTime?: string;
    endTime?: string;
    totalPrice: number;
    selectedSlots?: string[];
    selectedDates?: Date[]; // For multi-date selection
  } | null) => void;
}

export default function BookingCalendar({ productId, bookingData, price, onBookingSelect }: BookingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]); // For multi-date selection
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<AvailableTimeSlot[]>([]);
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [currency, setCurrency] = useState('INR');

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayMap: { [key: number]: string } = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
  };

  useEffect(() => {
    // Fetch currency setting
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/currency`)
      .then(res => res.json())
      .then(data => {
        setCurrency(data.value || 'INR');
      })
      .catch(err => console.error('Error fetching currency setting:', err));
    
    // Fetch unavailable dates for the current month
    if (bookingData.durationUnit === 'days') {
      fetchUnavailableDates();
    } else {
      // For hourly bookings, also fetch to check which dates have no available slots
      fetchUnavailableDates();
    }
  }, [currentMonth, bookingData, refreshKey]);

  useEffect(() => {
    if (selectedDate) {
      if (bookingData.durationUnit === 'days' && selectedDates.length > 0) {
        // For daily bookings with multiple dates, calculate booking
        calculateBooking();
      } else if (bookingData.durationUnit !== 'days') {
        // For hourly bookings, fetch available time slots
        fetchAvailableTimeSlots();
      }
    } else {
      onBookingSelect(null);
    }
  }, [selectedDate, selectedDates, bookingData, refreshKey]);

  useEffect(() => {
    if (selectedDate && selectedTimeSlots.length > 0 && bookingData.durationUnit !== 'days') {
      calculateBooking();
    } else if (selectedTimeSlots.length === 0 && bookingData.durationUnit !== 'days' && selectedDate) {
      // Clear booking selection if time slot not selected for hourly bookings
      onBookingSelect(null);
    }
  }, [selectedTimeSlots]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const isDateAvailable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date < today) return false;
    
    const dayName = dayMap[date.getDay()];
    const isWorkingDay = bookingData.availableDays.includes(dayName);
    
    if (!isWorkingDay) return false;
    
    // Check if the date has available slots (for both daily and hourly bookings)
    const dateStr = date.toISOString().split('T')[0];
    return !unavailableDates.has(dateStr);
  };

  const fetchUnavailableDates = async () => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const startDate = firstDay.toISOString().split('T')[0];
    const endDate = lastDay.toISOString().split('T')[0];
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/bookings/availability/${productId}?startDate=${startDate}&endDate=${endDate}`
      );
      
      if (response.ok) {
        const data = await response.json();
        const unavailable = new Set<string>();
        
        data.forEach((dateInfo: any) => {
          if (dateInfo.slots && dateInfo.slots.length > 0) {
            if (bookingData.durationUnit === 'days') {
              // For daily bookings, mark date as unavailable if the full-day slot is not available
              const fullDaySlot = dateInfo.slots.find((s: any) => s.startTime === 'full-day');
              if (fullDaySlot && !fullDaySlot.available) {
                unavailable.add(dateInfo.date);
              }
            } else {
              // For hourly bookings, mark date as unavailable if NO slots are available
              const hasAvailableSlot = dateInfo.slots.some((s: any) => s.available);
              if (!hasAvailableSlot) {
                unavailable.add(dateInfo.date);
              }
            }
          }
        });
        
        setUnavailableDates(unavailable);
      }
    } catch (error) {
      console.error('Failed to fetch unavailable dates:', error);
    }
  };

  const fetchAvailableTimeSlots = async () => {
    if (!selectedDate) return;
    
    setLoading(true);
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/bookings/availability/${productId}?startDate=${dateStr}&endDate=${dateStr}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.length > 0 && data[0].slots) {
          setAvailableTimeSlots(data[0].slots);
        } else {
          setAvailableTimeSlots([]);
        }
      } else {
        setAvailableTimeSlots([]);
      }
    } catch (error) {
      setAvailableTimeSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateBooking = () => {
    if (!selectedDate) return;

    let startDate = new Date(selectedDate);
    let endDate: Date;
    let startTime: string | undefined;
    let endTime: string | undefined;
    let totalPrice = price;

    if (bookingData.durationUnit === 'days') {
      if (selectedDates.length === 0) return;
      
      // Sort dates to get first and last
      const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime());
      startDate = sortedDates[0];
      endDate = sortedDates[sortedDates.length - 1];
      
      // Calculate price based on number of selected dates
      totalPrice = price * selectedDates.length;
    } else {
      if (selectedTimeSlots.length === 0) return;
      
      // For multiple slots, calculate total price
      totalPrice = price * selectedTimeSlots.length;
      
      // Use first slot for start/end time (for single slot compatibility)
      const [startTimeStr, endTimeStr] = selectedTimeSlots[0].split(' - ');
      startTime = startTimeStr.trim();
      endTime = endTimeStr.trim();
      
      endDate = new Date(startDate);
    }

    onBookingSelect({
      startDate,
      endDate,
      startTime,
      endTime,
      totalPrice,
      selectedSlots: bookingData.durationUnit !== 'days' ? selectedTimeSlots : undefined,
      selectedDates: bookingData.durationUnit === 'days' ? selectedDates : undefined,
    });
  };

  const handleDateClick = (date: Date) => {
    if (!isDateAvailable(date)) return;

    if (bookingData.durationUnit === 'days') {
      // For daily bookings, allow multiple date selection
      const dateStr = date.toDateString();
      const isAlreadySelected = selectedDates.some(d => d.toDateString() === dateStr);
      
      if (isAlreadySelected) {
        // Remove date from selection
        const newDates = selectedDates.filter(d => d.toDateString() !== dateStr);
        setSelectedDates(newDates);
        setSelectedDate(newDates.length > 0 ? newDates[0] : null);
      } else {
        // Add date to selection
        const newDates = [...selectedDates, date];
        setSelectedDates(newDates);
        setSelectedDate(date);
      }
    } else {
      setSelectedDate(date);
      setSelectedTimeSlots([]);
      // Increment refresh key to force availability check
      setRefreshKey(prev => prev + 1);
    }
  };

  const isDateSelected = (date: Date) => {
    if (bookingData.durationUnit === 'days') {
      return selectedDates.some(d => d.toDateString() === date.toDateString());
    }
    return selectedDate?.toDateString() === date.toDateString();
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const days = [];

    // Empty cells before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-12" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isAvailable = isDateAvailable(date);
      const isSelected = isDateSelected(date);

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(date)}
          disabled={!isAvailable}
          className={`
            h-12 rounded-lg text-sm font-medium transition-colors
            ${!isAvailable ? 'text-muted-foreground/30 cursor-not-allowed' : 'hover:bg-primary/10'}
            ${isSelected ? 'bg-primary text-primary-foreground hover:opacity-90' : ''}
            ${isAvailable && !isSelected ? 'text-foreground' : ''}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const getDurationText = () => {
    if (bookingData.durationUnit === 'days') {
      const days = Math.floor(bookingData.duration / 1440);
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (bookingData.durationUnit === 'hours') {
      const hours = Math.floor(bookingData.duration / 60);
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${bookingData.duration} minutes`;
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Select {bookingData.durationUnit === 'days' ? 'Dates' : 'Date & Time'}</h3>
        <p className="text-sm text-muted-foreground">
          {bookingData.durationUnit === 'days' 
            ? 'Select start and end dates for your booking'
            : 'Select a date and available time slot'}
        </p>
        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Duration: {getDurationText()}</span>
        </div>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={previousMonth}
          className="p-2 hover:bg-muted rounded-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold">
          {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h3>
        <button
          type="button"
          onClick={nextMonth}
          className="p-2 hover:bg-muted rounded-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {renderCalendar()}
      </div>

      {/* Time Slots (for hourly/session bookings) */}
      {bookingData.durationUnit !== 'days' && selectedDate && (
        <div>
          <h4 className="font-semibold mb-3">Available Time Slots {selectedTimeSlots.length > 0 && `(${selectedTimeSlots.length} selected)`}</h4>
          {loading ? (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : availableTimeSlots.length === 0 ? (
            <p className="text-sm text-muted-foreground">No time slots available for this date</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-2">Click slots to select multiple time slots</p>
              <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                {availableTimeSlots.map((slot) => {
                  const slotKey = `${slot.startTime} - ${slot.endTime}`;
                  const isSelected = selectedTimeSlots.includes(slotKey);
                  return (
                    <button
                      key={slotKey}
                      type="button"
                      onClick={() => {
                        if (!slot.available) return;
                        if (isSelected) {
                          setSelectedTimeSlots(selectedTimeSlots.filter(s => s !== slotKey));
                        } else {
                          setSelectedTimeSlots([...selectedTimeSlots, slotKey]);
                        }
                      }}
                      disabled={!slot.available}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium border transition-colors
                        ${!slot.available
                          ? 'bg-muted text-muted-foreground border-border cursor-not-allowed line-through'
                          : isSelected
                          ? 'bg-primary text-primary-foreground border-primary ring-2 ring-primary/30'
                          : 'bg-card text-foreground border-border hover:border-primary hover:bg-primary/10'
                        }
                      `}
                    >
                      {slotKey}
                    </button>
                  );
                })}
              </div>
              {selectedTimeSlots.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedTimeSlots([])}
                  className="mt-2 text-sm text-red-600 hover:text-red-800"
                >
                  Clear all selections
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Selected Booking Summary */}
      {((bookingData.durationUnit === 'days' && selectedDates.length > 0) ||
        (bookingData.durationUnit !== 'days' && selectedDate && selectedTimeSlots.length > 0)) && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <h4 className="font-semibold mb-2">Selected Booking</h4>
          <div className="text-sm space-y-1">
            {bookingData.durationUnit === 'days' ? (
              <>
                <p>Selected Dates ({selectedDates.length}):</p>
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {selectedDates.sort((a, b) => a.getTime() - b.getTime()).map((date, idx) => (
                    <p key={idx} className="text-xs">{date.toLocaleDateString()}</p>
                  ))}
                </div>
                <p className="font-semibold mt-2">
                  Total: {getCurrencySymbol(currency)}{(price * selectedDates.length).toLocaleString()}
                </p>
              </>
            ) : (
              <>
                <p>Date: {selectedDate?.toLocaleDateString()}</p>
                <div className="mt-2">
                  <p className="font-medium mb-1">Selected Slots ({selectedTimeSlots.length}):</p>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {selectedTimeSlots.map((slot, idx) => (
                      <p key={idx} className="text-xs bg-background px-2 py-1 rounded">{slot}</p>
                    ))}
                  </div>
                </div>
                <p className="font-semibold mt-2">
                  Total: {getCurrencySymbol(currency)}{(price * selectedTimeSlots.length).toLocaleString()}
                  {selectedTimeSlots.length > 1 && (
                    <span className="text-xs font-normal text-muted-foreground ml-2">
                      ({getCurrencySymbol(currency)}{price} × {selectedTimeSlots.length} slots)
                    </span>
                  )}
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
