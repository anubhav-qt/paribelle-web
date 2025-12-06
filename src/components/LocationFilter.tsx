'use client';

import { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';

interface City {
  id: string;
  name: string;
  state?: string;
}

interface SubLocation {
  id: string;
  name: string;
  zipCode?: string;
}

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
  const [cities, setCities] = useState<City[]>([]);
  const [subLocations, setSubLocations] = useState<SubLocation[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedSubLocation, setSelectedSubLocation] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCities();
  }, []);

  useEffect(() => {
    if (selectedCity) {
      fetchSubLocations(selectedCity);
    } else {
      setSubLocations([]);
      setSelectedSubLocation('');
    }
  }, [selectedCity]);

  const fetchCities = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/locations/cities`
      );
      if (response.ok) {
        const data = await response.json();
        setCities(data);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubLocations = async (cityId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/locations/cities/${cityId}/sub-locations`
      );
      if (response.ok) {
        const data = await response.json();
        setSubLocations(data);
      }
    } catch (error) {
      console.error('Error fetching sub-locations:', error);
    }
  };

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
