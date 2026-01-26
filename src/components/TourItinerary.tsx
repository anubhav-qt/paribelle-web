'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coffee, Utensils, Hotel, MapPin } from 'lucide-react';

interface ItineraryDay {
  day: number;
  title: string;
  description: string;
  activities: string[];
  meals: string[];
  accommodation?: string;
}

interface TourItineraryProps {
  itinerary: ItineraryDay[];
}

export default function TourItinerary({ itinerary }: TourItineraryProps) {
  const getMealIcon = (meal: string) => {
    const mealLower = meal.toLowerCase();
    if (mealLower.includes('breakfast')) return <Coffee className="w-4 h-4" />;
    return <Utensils className="w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Day-by-Day Itinerary</h2>
      
      {itinerary.map((day, index) => (
        <Card key={day.day} className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <div className="flex items-start justify-between">
              <div>
                <Badge className="mb-2 bg-primary">Day {day.day}</Badge>
                <CardTitle className="text-xl">{day.title}</CardTitle>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            {/* Description */}
            <p className="text-gray-700 mb-4 leading-relaxed">
              {day.description}
            </p>

            {/* Activities */}
            {day.activities && day.activities.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Activities
                </h4>
                <ul className="space-y-1.5 ml-6">
                  {day.activities.map((activity, idx) => (
                    <li key={idx} className="text-gray-600 text-sm list-disc">
                      {activity}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Meals & Accommodation */}
            <div className="flex flex-wrap gap-4 pt-4 border-t">
              {/* Meals */}
              {day.meals && day.meals.length > 0 && (
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-gray-700">Meals:</span>
                  <div className="flex gap-2">
                    {day.meals.map((meal, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-amber-50 text-amber-700 text-xs">
                        {meal}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Accommodation */}
              {day.accommodation && (
                <div className="flex items-center gap-2">
                  <Hotel className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Stay:</span>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs">
                    {day.accommodation}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
