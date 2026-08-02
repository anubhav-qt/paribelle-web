'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, CheckCircle } from 'lucide-react';
import { Loader } from '@/components/ui/Loader';

interface HsnCode {
  id: string;
  code: string;
  description: string;
  recommendedGstRate: number;
  category: string;
}

interface HsnCodeAutocompleteProps {
  value: string;
  onSelect: (hsnCode: string, gstRate: number) => void;
  placeholder?: string;
}

export default function HsnCodeAutocomplete({
  value,
  onSelect,
  placeholder = 'Enter HSN code or search...',
}: HsnCodeAutocompleteProps) {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState<HsnCode[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedHsn, setSelectedHsn] = useState<HsnCode | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch HSN code details when value changes
  useEffect(() => {
    if (value && value !== query) {
      setQuery(value);
      fetchHsnDetails(value);
    }
  }, [value]);

  const fetchHsnDetails = async (code: string) => {
    if (!code) return;

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/v1/hsn-codes/${code}`);
      
      if (response.ok) {
        const hsn = await response.json();
        setSelectedHsn(hsn);
      }
    } catch (error) {
      console.error('Error fetching HSN details:', error);
    }
  };

  const searchHsnCodes = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(
        `${API_URL}/api/v1/hsn-codes/search?q=${encodeURIComponent(searchQuery)}&limit=10`
      );

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        setIsOpen(true);
      }
    } catch (error) {
      console.error('Error searching HSN codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setSelectedHsn(null);
    searchHsnCodes(newQuery);
  };

  const handleSelectHsn = (hsn: HsnCode) => {
    setQuery(hsn.code);
    setSelectedHsn(hsn);
    setIsOpen(false);
    onSelect(hsn.code, hsn.recommendedGstRate);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {selectedHsn && (
          <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
        )}
      </div>

      {/* Selected HSN Info */}
      {selectedHsn && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="font-medium text-green-900">
                {selectedHsn.code} - {selectedHsn.description}
              </p>
              <p className="text-sm text-green-700 mt-1">
                Category: {selectedHsn.category} | Recommended GST: {selectedHsn.recommendedGstRate}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dropdown Suggestions */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {suggestions.map((hsn) => (
            <button
              key={hsn.id}
              type="button"
              onClick={() => handleSelectHsn(hsn)}
              className="w-full text-left px-4 py-3 hover:bg-blue-50 transition border-b last:border-b-0"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{hsn.code}</p>
                  <p className="text-sm text-gray-600 mt-1">{hsn.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {hsn.category}
                    </span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      GST: {hsn.recommendedGstRate}%
                    </span>
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center">
          <Loader size="sm" />
          <p className="text-sm text-gray-600 mt-2">Searching HSN codes...</p>
        </div>
      )}

      {/* No Results */}
      {isOpen && !loading && query.length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center">
          <p className="text-sm text-gray-600">
            No HSN codes found for "{query}"
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Try searching by code number or product description
          </p>
        </div>
      )}

      {/* Help Text */}
      <p className="text-xs text-gray-500 mt-1">
        Examples: 6109 (T-shirts), 8517 (Smartphones), 4901 (Books)
      </p>
    </div>
  );
}
