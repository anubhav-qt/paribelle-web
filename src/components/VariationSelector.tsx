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

  const attributesOf = (variation: any): Record<string, any> =>
    variation.variantAttributes || variation.variationAttributes || {};

  /** Attribute keys are hand-entered, so `Colour` and `colour` both occur. */
  const attributeOf = (variation: any, key: string): string | undefined => {
    const entry = Object.entries(attributesOf(variation)).find(
      ([k]) => k.toLowerCase() === key.toLowerCase(),
    );
    return entry ? String(entry[1]) : undefined;
  };

  const inStock = (v: any) =>
    !v.trackInventory || v.stockQuantity == null || v.stockQuantity > 0;

  /** Does any in-stock variation match every one of these attributes? */
  const hasMatch = (wanted: Record<string, string>) =>
    variations.some(
      (v) =>
        inStock(v) &&
        Object.entries(wanted).every(
          ([key, val]) => attributeOf(v, key)?.toLowerCase() === String(val).toLowerCase(),
        ),
    );

  /**
   * Every value this theme offers, marked unavailable only when no in-stock
   * variation carries it *at all*.
   *
   * Availability used to be judged against the other themes' current
   * selections, which meant a complete selection greyed out every alternative
   * in every theme — each one is only stocked next to a value the shopper
   * would have to change first, and there was no way to change it. Clashes are
   * resolved in `handleAttributeSelect` instead, by giving way on the older
   * choices rather than blocking the new one.
   */
  const getThemeOptions = (theme: string): VariationOption[] => {
    const uniqueValues: string[] = [];
    variations.forEach((variation) => {
      const value = attributeOf(variation, theme);
      if (value && !uniqueValues.some((v) => v.toLowerCase() === value.toLowerCase())) {
        uniqueValues.push(value);
      }
    });

    return uniqueValues.map((value) => ({
      value,
      label: value,
      available: hasMatch({ [theme]: value }),
    }));
  };

  // Update selected variation when attributes change
  useEffect(() => {
    const allChosen = variationThemes.every((theme) => selectedAttributes[theme]);

    if (allChosen) {
      const matchingVariation = variations.find((v) =>
        variationThemes.every(
          (theme) =>
            attributeOf(v, theme)?.toLowerCase() ===
            String(selectedAttributes[theme]).toLowerCase(),
        ),
      );

      // Report the miss too: leaving the previous variation selected meant the
      // buy button stayed armed for a combination that no longer applied.
      setSelectedVariation(matchingVariation ?? null);
      onVariationSelect(matchingVariation ?? null);
    } else {
      setSelectedVariation(null);
      onVariationSelect(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAttributes, variations, variationThemes]);

  /**
   * The clicked value always wins. Earlier choices that no longer lead to a
   * stocked variation are dropped so the shopper can pick them again, rather
   * than the click being refused.
   */
  const handleAttributeSelect = (theme: string, value: string) => {
    setSelectedAttributes((prev) => {
      const wanted = { ...prev, [theme]: value };
      if (hasMatch(wanted)) return wanted;

      const repaired: Record<string, string> = { [theme]: value };
      for (const other of variationThemes) {
        if (other === theme) continue;
        const previous = prev[other];
        if (previous && hasMatch({ ...repaired, [other]: previous })) {
          repaired[other] = previous;
        }
      }
      return repaired;
    });
  };

  const getThemeLabel = (theme: string) => {
    return theme.charAt(0).toUpperCase() + theme.slice(1);
  };

  // Calculate discount for a variation
  const getVariantDiscount = (price: number, compareAtPrice?: number) => {
    if (!compareAtPrice || compareAtPrice <= price) return null;
    return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
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
            <div className="text-right">
              <div className="text-lg font-bold text-green-900">
                {currency}{Number(selectedVariation.price).toFixed(2)}
              </div>
              {selectedVariation.compareAtPrice && Number(selectedVariation.compareAtPrice) > Number(selectedVariation.price) && (
                <div className="flex items-center gap-2 justify-end mt-1">
                  <span className="text-sm text-gray-500 line-through">
                    {currency}{Number(selectedVariation.compareAtPrice).toFixed(2)}
                  </span>
                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded">
                    {getVariantDiscount(Number(selectedVariation.price), Number(selectedVariation.compareAtPrice))}% OFF
                  </span>
                </div>
              )}
            </div>
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
