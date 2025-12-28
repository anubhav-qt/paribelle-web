'use client';

import { useState, useEffect } from 'react';

interface VariationOption {
  value: string;
  label: string;
  available: boolean;
}

interface VariationSelectorProps {
  variations: any[];
  variationThemes: string[];
  onVariationSelect: (variation: any) => void;
  currentPrice: number;
  currency: string;
}

export default function VariationSelector({
  variations,
  variationThemes,
  onVariationSelect,
  currentPrice,
  currency,
}: VariationSelectorProps) {
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedVariation, setSelectedVariation] = useState<any>(null);

  // Get unique values for each theme
  const getThemeOptions = (theme: string): VariationOption[] => {
    const uniqueValues = new Set<string>();
    variations.forEach(variation => {
      if (variation.variationAttributes && variation.variationAttributes[theme]) {
        uniqueValues.add(variation.variationAttributes[theme]);
      }
    });

    return Array.from(uniqueValues).map(value => {
      // Check if this option is available given current selections
      const isAvailable = variations.some(v => {
        if (!v.variationAttributes) return false;
        
        // Check if this variation matches the current selections + this option
        const matches = Object.entries(selectedAttributes).every(([key, val]) => {
          if (key === theme) return true; // Skip the current theme
          return v.variationAttributes[key] === val;
        });
        
        return matches && v.variationAttributes[theme] === value && v.stockQuantity > 0;
      });

      return {
        value,
        label: value,
        available: isAvailable,
      };
    });
  };

  // Update selected variation when attributes change
  useEffect(() => {
    if (Object.keys(selectedAttributes).length === variationThemes.length) {
      const matchingVariation = variations.find(v => {
        if (!v.variationAttributes) return false;
        return variationThemes.every(
          theme => v.variationAttributes[theme] === selectedAttributes[theme]
        );
      });

      setSelectedVariation(matchingVariation);
      if (matchingVariation) {
        onVariationSelect(matchingVariation);
      }
    } else {
      setSelectedVariation(null);
      onVariationSelect(null);
    }
  }, [selectedAttributes, variations, variationThemes]);

  const handleAttributeSelect = (theme: string, value: string) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [theme]: value,
    }));
  };

  const getThemeLabel = (theme: string) => {
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  };

  return (
    <div className="space-y-4">
      {variationThemes.map(theme => {
        const options = getThemeOptions(theme);
        const isColorTheme = theme.toLowerCase().includes('color') || theme.toLowerCase().includes('colour');

        return (
          <div key={theme}>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              {getThemeLabel(theme)}
              {selectedAttributes[theme] && (
                <span className="ml-2 text-gray-600 font-normal">
                  - {selectedAttributes[theme]}
                </span>
              )}
            </label>
            
            <div className="flex flex-wrap gap-2">
              {options.map(option => {
                const isSelected = selectedAttributes[theme] === option.value;
                
                if (isColorTheme) {
                  // Render as color swatches
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => option.available && handleAttributeSelect(theme, option.value)}
                      disabled={!option.available}
                      className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                        isSelected 
                          ? 'border-blue-500 ring-2 ring-blue-300' 
                          : option.available
                          ? 'border-gray-300 hover:border-gray-400'
                          : 'border-gray-200 opacity-50 cursor-not-allowed'
                      }`}
                      title={option.label}
                      style={{
                        backgroundColor: option.value.toLowerCase(),
                      }}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full border border-gray-300"></div>
                        </div>
                      )}
                      {!option.available && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-px h-full bg-red-500 transform rotate-45"></div>
                        </div>
                      )}
                    </button>
                  );
                }

                // Render as button for other attributes (size, etc.)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => option.available && handleAttributeSelect(theme, option.value)}
                    disabled={!option.available}
                    className={`px-4 py-2 border rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : option.available
                        ? 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                        : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Selected Variation Info */}
      {selectedVariation && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-green-900">
                Selected: {Object.values(selectedAttributes).join(' - ')}
              </div>
              <div className="text-xs text-green-700 mt-1">
                {selectedVariation.stockQuantity > 0 
                  ? `${selectedVariation.stockQuantity} in stock` 
                  : 'Out of stock'}
              </div>
            </div>
            {selectedVariation.price !== currentPrice && (
              <div className="text-lg font-bold text-green-900">
                {currency}{Number(selectedVariation.price).toFixed(2)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warning if not all selections made */}
      {Object.keys(selectedAttributes).length < variationThemes.length && (
        <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded p-3">
          Please select all options above
        </div>
      )}
    </div>
  );
}
