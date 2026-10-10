'use client';

import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { useCities, useSubLocations } from '@/hooks/useLocations';
import { City, SubLocation } from '@/types/common';

interface LocationFilterProps {
  onFilterChange: (cityId: string | null, subLocationId: string | null) => void;
  showLabel?: boolean;
  className?: string;
}

export default function LocationFilter({ 
  onFilterChange, 
  showLabel = true,
  className = '' 
}: LocationFilterProps) {
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedSubLocation, setSelectedSubLocation] = useState<string>('');
  
  const { data: cities = [], isLoading: loadingCities } = useCities();
  const { data: subLocations = [], isLoading: loadingSubLocations } = useSubLocations(selectedCity);
  
  const loading = loadingCities || loadingSubLocations;

  useEffect(() => {
    // Reset sublocation when city changes
    if (selectedCity) {
      setSelectedSubLocation('');
    }
  }, [selectedCity]);

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityId = e.target.value;
    setSelectedCity(cityId);
    setSelectedSubLocation('');
    onFilterChange(cityId || null, null);
  };

  const handleSubLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const subLocationId = e.target.value;
    setSelectedSubLocation(subLocationId);
    onFilterChange(selectedCity, subLocationId || null);
  };

  return (
    <div className={`flex flex-col md:flex-row gap-2 ${className}`}>
      <div className="flex-1 min-w-[150px]">
        <select
          value={selectedCity}
          onChange={handleCityChange}
          disabled={loading}
          className="w-full px-3 py-2 bg-white border-2 border-blue-400 text-gray-900 font-medium rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-600 disabled:bg-gray-100 disabled:cursor-not-allowed shadow-sm"
        >
          <option value="">All Cities</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}{city.state ? `, ${city.state}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-[150px]">
        <select
          value={selectedSubLocation}
          onChange={handleSubLocationChange}
          disabled={!selectedCity || subLocations.length === 0}
          className="w-full px-3 py-2 bg-white border-2 border-blue-400 text-gray-900 font-medium rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-600 disabled:bg-gray-100 disabled:cursor-not-allowed shadow-sm"
        >
          <option value="">All Areas</option>
          {subLocations.map((subLocation) => (
            <option key={subLocation.id} value={subLocation.id}>
              {subLocation.name}
              {subLocation.zipCode ? ` (${subLocation.zipCode})` : ''}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
