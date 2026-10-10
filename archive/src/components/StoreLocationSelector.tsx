'use client';

import { useState, useEffect } from 'react';
import { MapPin, Plus, Search } from 'lucide-react';
import { City, SubLocation } from '@/types/common';
import { api, errorMessage } from '@/lib/api';
import { showAlert } from '@/lib/dialog';

interface StoreLocationSelectorProps {
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

export default function StoreLocationSelector({
  initialCityId,
  initialSubLocationId,
  initialPincode,
  onLocationChange,
}: StoreLocationSelectorProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [subLocations, setSubLocations] = useState<SubLocation[]>([]);
  const [selectedCity, setSelectedCity] = useState(initialCityId || '');
  const [selectedSubLocation, setSelectedSubLocation] = useState(initialSubLocationId || '');
  const [pincode, setPincode] = useState(initialPincode || '');
  const [isInitialized, setIsInitialized] = useState(false);
  
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
    // Update local state when initial props change (when parent's formData is populated)
    if (initialCityId && initialCityId !== selectedCity) {
      setSelectedCity(initialCityId);
    }
    if (initialSubLocationId && initialSubLocationId !== selectedSubLocation) {
      setSelectedSubLocation(initialSubLocationId);
    }
    if (initialPincode && initialPincode !== pincode) {
      setPincode(initialPincode);
    }
  }, [initialCityId, initialSubLocationId, initialPincode]);

  useEffect(() => {
    // Mark as initialized after first render
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    // Only notify parent after initialization and if we have actual changes
    // Skip the initial notification to prevent overwriting parent's formData
    if (!isInitialized) {
      return;
    }
    
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
  }, [selectedCity, selectedSubLocation, pincode, cities, subLocations, isInitialized]);

  const fetchCities = async (search?: string) => {
    try {
      const data = await api.get<City[]>('/locations/cities', { params: { search } });
      setCities(data);
    } catch (error) {
      console.error('Error fetching cities:', error);
    }
  };

  const fetchSubLocations = async (cityId: string, search?: string) => {
    try {
      const data = await api.get<SubLocation[]>(`/locations/cities/${cityId}/sub-locations`, {
        params: { search },
      });
      setSubLocations(data);
    } catch (error) {
      console.error('Error fetching sub-locations:', error);
    }
  };

  const handleAddCity = async () => {
    if (!newCityName.trim()) return;

    try {
      const newCity = await api.post<City>('/locations/find-or-create-city', {
        name: newCityName.trim(),
        state: newCityState.trim() || undefined,
        country: 'India',
      });

      setCities([...cities, newCity]);
      setSelectedCity(newCity.id);
      setNewCityName('');
      setNewCityState('');
      setShowAddCity(false);
    } catch (error) {
      console.error('Error creating city:', error);
      showAlert(errorMessage(error, 'Failed to add city. Please try again.'), 'error');
    }
  };

  const handleAddSubLocation = async () => {
    if (!newSubLocationName.trim() || !selectedCity) return;

    try {
      const newSubLocation = await api.post<SubLocation>('/locations/find-or-create-sub-location', {
        name: newSubLocationName.trim(),
        cityId: selectedCity,
        zipCode: pincode || undefined,
      });

      setSubLocations([...subLocations, newSubLocation]);
      setSelectedSubLocation(newSubLocation.id);
      setNewSubLocationName('');
      setShowAddSubLocation(false);
    } catch (error) {
      console.error('Error creating sub-location:', error);
      showAlert(errorMessage(error, 'Failed to add area. Please try again.'), 'error');
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
      <div className="flex items-center gap-2 text-primary mb-4">
        <MapPin className="w-5 h-5" />
        <h3 className="font-semibold text-lg">Business Location</h3>
      </div>

      {/* City Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          City *
        </label>
        
        {!showAddCity ? (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search city..."
                value={citySearch}
                onChange={(e) => handleCitySearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setSelectedSubLocation('');
              }}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
              className="flex items-center gap-2 text-sm text-primary hover:text-primary/80"
            >
              <Plus className="w-4 h-4" />
              Can&apos;t find your city? Add it manually
            </button>
          </div>
        ) : (
          <div className="space-y-3 p-4 bg-primary/5 rounded-lg">
            <p className="text-sm font-medium text-foreground">Add New City</p>
            <input
              type="text"
              placeholder="City Name *"
              value={newCityName}
              onChange={(e) => setNewCityName(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            />
            <input
              type="text"
              placeholder="State (Optional)"
              value={newCityState}
              onChange={(e) => setNewCityState(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddCity}
                className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors"
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
                className="flex-1 bg-muted text-foreground py-2 rounded-lg hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sub-Location Selection */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Area / Locality *
        </label>
        
        {!showAddSubLocation ? (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search area..."
                value={subLocationSearch}
                onChange={(e) => handleSubLocationSearch(e.target.value)}
                disabled={!selectedCity}
                className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted"
              />
            </div>

            <select
              value={selectedSubLocation}
              onChange={(e) => setSelectedSubLocation(e.target.value)}
              disabled={!selectedCity}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-muted"
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
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80"
              >
                <Plus className="w-4 h-4" />
                Can&apos;t find your area? Add it manually
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3 p-4 bg-primary/5 rounded-lg">
            <p className="text-sm font-medium text-foreground">Add New Area</p>
            <input
              type="text"
              placeholder="Area / Locality Name *"
              value={newSubLocationName}
              onChange={(e) => setNewSubLocationName(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddSubLocation}
                className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Add Area
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddSubLocation(false);
                  setNewSubLocationName('');
                }}
                className="flex-1 bg-muted text-foreground py-2 rounded-lg hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pincode */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Pincode *
        </label>
        <input
          type="text"
          placeholder="Enter 6-digit pincode"
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          required
        />
      </div>

      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:border-yellow-800">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Note:</strong> If you can&apos;t find your city or area in the dropdown, 
          you can add it manually. Your location will be saved to our database and 
          will be available for other vendors in the same area.
        </p>
      </div>
    </div>
  );
}
