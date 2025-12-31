'use client';

import { useState, useEffect } from 'react';

interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  variantAttributes: Record<string, string>;
  price: string | number;
  compareAtPrice?: string | number;
  stockQuantity: number;
  images?: string[];
  isActive: boolean;
}

interface VariantOption {
  id: string;
  name: string;
  values: string[];
}

interface ProductVariantSelectorProps {
  variantOptions: VariantOption[];
  productVariants: ProductVariant[];
  onVariantSelect: (variant: ProductVariant | null) => void;
  currency: string;
}

export default function ProductVariantSelector({
  variantOptions,
  productVariants,
  onVariantSelect,
  currency,
}: ProductVariantSelectorProps) {
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Get available values for a specific option based on current selections
  const getAvailableValues = (optionId: string, optionName: string): string[] => {
    const option = variantOptions.find(opt => opt.id === optionId);
    if (!option) return [];

    // Filter to only show values that have available variants
    return option.values.filter(value => {
      return productVariants.some(variant => {
        // Check if this variant has this value (case-insensitive comparison)
        const variantValue = variant.variantAttributes[optionName];
        if (!variantValue || variantValue.toLowerCase() !== value.toLowerCase()) return false;
        
        // Check if variant is in stock
        if (variant.stockQuantity <= 0) return false;
        
        // Check if variant matches other selected attributes
        const otherSelections = Object.entries(selectedAttributes).filter(
          ([key]) => key !== optionName
        );
        
        return otherSelections.every(([key, val]) => {
          const attrValue = variant.variantAttributes[key];
          return attrValue && attrValue.toLowerCase() === val.toLowerCase();
        });
      });
    });
  };

  // Update selected variant when attributes change
  useEffect(() => {
    // Check if all options are selected
    const allSelected = variantOptions.every(option => 
      selectedAttributes[option.name]
    );

    if (allSelected) {
      // Find matching variant (case-insensitive comparison)
      const matchingVariant = productVariants.find(variant => {
        return Object.entries(selectedAttributes).every(
          ([key, value]) => {
            const attrValue = variant.variantAttributes[key];
            return attrValue && attrValue.toLowerCase() === value.toLowerCase();
          }
        );
      });

      setSelectedVariant(matchingVariant || null);
      onVariantSelect(matchingVariant || null);
    } else {
      setSelectedVariant(null);
      onVariantSelect(null);
    }
  }, [selectedAttributes, productVariants, variantOptions, onVariantSelect]);

  const handleAttributeSelect = (optionName: string, value: string) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [optionName]: value,
    }));
  };

  const getCurrencySymbol = (curr: string) => {
    const symbols: Record<string, string> = {
      'INR': '₹',
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
    };
    return symbols[curr] || curr;
  };

  return (
    <div className="space-y-4">
      {/* Variant Options */}
      {variantOptions.map(option => {
        const availableValues = getAvailableValues(option.id, option.name);
        const selectedValue = selectedAttributes[option.name];

        return (
          <div key={option.id} className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              {option.name}: 
              {selectedValue && (
                <span className="ml-2 font-normal text-primary">{selectedValue}</span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {option.values.map(value => {
                const isAvailable = availableValues.includes(value);
                const isSelected = selectedValue === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => isAvailable && handleAttributeSelect(option.name, value)}
                    disabled={!isAvailable}
                    className={`
                      px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all
                      ${isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isAvailable
                        ? 'border-border hover:border-primary bg-card text-foreground'
                        : 'border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                      }
                    `}
                  >
                    {value}
                    {!isAvailable && (
                      <span className="ml-1 text-xs">(Out of Stock)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Selected Variant Info */}
      {selectedVariant && (
        <div className="mt-4 p-4 bg-accent/10 border border-primary rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Selected Variant</div>
              <div className="font-semibold text-foreground">
                {Object.entries(selectedVariant.variantAttributes)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(' • ')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                SKU: {selectedVariant.sku}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">
                {getCurrencySymbol(currency)}{Number(selectedVariant.price).toLocaleString()}
              </div>
              {selectedVariant.compareAtPrice && Number(selectedVariant.compareAtPrice) > Number(selectedVariant.price) && (
                <div className="text-sm">
                  <span className="line-through text-muted-foreground">
                    {getCurrencySymbol(currency)}{Number(selectedVariant.compareAtPrice).toLocaleString()}
                  </span>
                  <span className="ml-2 text-green-600 font-semibold">
                    {Math.round(((Number(selectedVariant.compareAtPrice) - Number(selectedVariant.price)) / Number(selectedVariant.compareAtPrice)) * 100)}% OFF
                  </span>
                </div>
              )}
              <div className="text-sm text-green-600 mt-1">
                {selectedVariant.stockQuantity} in stock
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
