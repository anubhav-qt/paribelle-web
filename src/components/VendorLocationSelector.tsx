'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Search } from 'lucide-react';

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

interface VendorLocationSelectorProps {
  initialCityId?: string;
  initialSubLocationId?: string;
  initialPincode?: string;
  onLocationChange: (data: {
    cityId: string | null;
    cityName?: string;
    state?: string;
    subLocationId: string | null;
    subLocationName?: string;
    pincode: string;
  }) => void;
}

export default function VendorLocationSelector({
  initialCityId,
  initialSubLocationId,
  initialPincode,
  onLocationChange,
}: VendorLocationSelectorProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [subLocations, setSubLocations] = useState<SubLocation[]>([]);
  const [selectedCity, setSelectedCity] = useState(initialCityId || '');
  const [selectedSubLocation, setSelectedSubLocation] = useState(initialSubLocationId || '');
  const [pincode, setPincode] = useState(initialPincode || '');
  
  // Manual entry states
  const [showAddCity, setShowAddCity] = useState(false);
  const [showAddSubLocation, setShowAddSubLocation] = useState(false);
  const [newCityName, setNewCityName] = useState('');
  const [newCityState, setNewCityState] = useState('');
  const [newSubLocationName, setNewSubLocationName] = useState('');
  
  // Search states
  const [citySearch, setCitySearch] = useState('');
  const [subLocationSearch, setSubLocationSearch] = useState('');

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

  useEffect(() => {
    // Notify parent of changes
    const cityData = cities.find(c => c.id === selectedCity);
    const subLocationData = subLocations.find(s => s.id === selectedSubLocation);
    
    onLocationChange({
      cityId: selectedCity || null,
      cityName: cityData?.name,
      state: cityData?.state,
      subLocationId: selectedSubLocation || null,
      subLocationName: subLocationData?.name,
      pincode,
    });
  }, [selectedCity, selectedSubLocation, pincode]);

  const fetchCities = async (search?: string) => {
    try {
      const url = search 
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/locations/cities?search=${search}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/locations/cities`;
      const response = await fetch(url);
      const data = await response.json();
      setCities(data);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchSubLocations = async (cityId: string, search?: string) => {
    try {
      const url = search
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/locations/cities/${cityId}/sub-locations?search=${search}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/locations/cities/${cityId}/sub-locations`;
      const response = await fetch(url);
      const data = await response.json();
      setSubLocations(data);
    } catch (error) {
      console.error('Error fetching sub-locations:', error);
    }
  };

  const handleAddCity = async () => {
    if (!newCityName.trim()) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/locations/find-or-create-city`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newCityName.trim(),
            state: newCityState.trim() || undefined,
            country: 'India',
          }),
        }
      );

      if (response.ok) {
        const newCity = await response.json();
        setCities([...cities, newCity]);
        setSelectedCity(newCity.id);
        setNewCityName('');
        setNewCityState('');
        setShowAddCity(false);
      }
    } catch (error) {
      console.error('Error creating city:', error);
      alert('Failed to add city. Please try again.');
    }
  };

  const handleAddSubLocation = async () => {
    if (!newSubLocationName.trim() || !selectedCity) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/locations/find-or-create-sub-location`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newSubLocationName.trim(),
            cityId: selectedCity,
            zipCode: pincode || undefined,
          }),
        }
      );

      if (response.ok) {
        const newSubLocation = await response.json();
        setSubLocations([...subLocations, newSubLocation]);
        setSelectedSubLocation(newSubLocation.id);
        setNewSubLocationName('');
        setShowAddSubLocation(false);
      }
    } catch (error) {
      console.error('Error creating sub-location:', error);
      alert('Failed to add area. Please try again.');
    }
  };

  const handleCitySearch = (query: string) => {
    setCitySearch(query);
    if (query.length > 2) {
      fetchCities(query);
    } else if (query.length === 0) {
      fetchCities();
    }
  };

  const handleSubLocationSearch = (query: string) => {
    setSubLocationSearch(query);
    if (query.length > 2 && selectedCity) {
      fetchSubLocations(selectedCity, query);
    } else if (query.length === 0 && selectedCity) {
      fetchSubLocations(selectedCity);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-blue-600 mb-4">
        <MapPin className="w-5 h-5" />
        <h3 className="font-semibold text-lg">Business Location</h3>
      </div>

      {/* City Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          City *
        </label>
        
        {!showAddCity ? (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search city..."
                value={citySearch}
                onChange={(e) => handleCitySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setSelectedSubLocation('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a city</option>
              {cities.map((city) => (
                <option key={city.id} value={city.id}>
                  {city.name}{city.state ? `, ${city.state}` : ''}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowAddCity(true)}
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <Plus className="w-4 h-4" />
              Can&apos;t find your city? Add it manually
            </button>
          </div>
        ) : (
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700">Add New City</p>
            <input
              type="text"
              placeholder="City Name *"
              value={newCityName}
              onChange={(e) => setNewCityName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              placeholder="State (Optional)"
              value={newCityState}
              onChange={(e) => setNewCityState(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddCity}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add City
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddCity(false);
                  setNewCityName('');
                  setNewCityState('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sub-Location Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Area / Locality *
        </label>
        
        {!showAddSubLocation ? (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search area..."
                value={subLocationSearch}
                onChange={(e) => handleSubLocationSearch(e.target.value)}
                disabled={!selectedCity}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              />
            </div>

            <select
              value={selectedSubLocation}
              onChange={(e) => setSelectedSubLocation(e.target.value)}
              disabled={!selectedCity}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
              required
            >
              <option value="">Select an area</option>
              {subLocations.map((subLocation) => (
                <option key={subLocation.id} value={subLocation.id}>
                  {subLocation.name}
                  {subLocation.zipCode ? ` (${subLocation.zipCode})` : ''}
                </option>
              ))}
            </select>

            {selectedCity && (
              <button
                type="button"
                onClick={() => setShowAddSubLocation(true)}
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                Can&apos;t find your area? Add it manually
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-gray-700">Add New Area</p>
            <input
              type="text"
              placeholder="Area / Locality Name *"
              value={newSubLocationName}
              onChange={(e) => setNewSubLocationName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddSubLocation}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Area
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddSubLocation(false);
                  setNewSubLocationName('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pincode */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pincode *
        </label>
        <input
          type="text"
          placeholder="Enter 6-digit pincode"
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> If you can&apos;t find your city or area in the dropdown, 
          you can add it manually. Your location will be saved to our database and 
          will be available for other vendors in the same area.
        </p>
      </div>
    </div>
  );
}
