'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Upload, Trash2 } from 'lucide-react';

interface VariationOption {
  value: string;
  label: string;
}

interface VariationTheme {
  id: string;
  label: string;
  options: VariationOption[];
}

interface Variation {
  attributes: Record<string, string>;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  images: string[];
  featuredImage?: string;
}

interface ProductVariationBuilderProps {
  categoryFilters: any[];
  basePrice: number;
  baseSKU: string;
  productName: string;
  onVariationsChange: (variations: Variation[]) => void;
  onVariationThemesChange: (themes: string[]) => void;
}

export default function ProductVariationBuilder({
  categoryFilters,
  basePrice,
  baseSKU,
  productName,
  onVariationsChange,
  onVariationThemesChange,
}: ProductVariationBuilderProps) {
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [themeOptions, setThemeOptions] = useState<Record<string, string[]>>({});
  const [variations, setVariations] = useState<Variation[]>([]);
  const [autoGenerate, setAutoGenerate] = useState(true);

  // Get available variation themes from category filters
  const availableThemes: VariationTheme[] = categoryFilters
    .filter(f => ['select', 'checkbox', 'multiselect'].includes(f.type))
    .map(f => ({
      id: f.id,
      label: f.label,
      options: f.options || [],
    }));

  // Generate all possible combinations
  const generateCombinations = () => {
    if (selectedThemes.length === 0) return [];

    const themesWithOptions = selectedThemes.map(themeId => ({
      id: themeId,
      options: themeOptions[themeId] || [],
    }));

    // Generate cartesian product
    const cartesian = (...arrays: string[][]) => 
      arrays.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())));

    const optionArrays = themesWithOptions.map(theme => theme.options);
    if (optionArrays.some(arr => arr.length === 0)) return [];

    const combinations = cartesian(...optionArrays);
    
    return combinations.map((combo, index) => {
      const comboArray = Array.isArray(combo[0]) ? combo : [combo];
      const attributes: Record<string, string> = {};
      
      selectedThemes.forEach((themeId, i) => {
        attributes[themeId] = comboArray[i];
      });

      const attrString = Object.values(attributes).join('-').toUpperCase().replace(/\s+/g, '');
      
      return {
        attributes,
        sku: `${baseSKU}-${attrString}`,
        price: basePrice,
        stockQuantity: 0,
        images: [],
      };
    });
  };

  // Handle theme selection
  const handleThemeToggle = (themeId: string) => {
    setSelectedThemes(prev => {
      const newThemes = prev.includes(themeId)
        ? prev.filter(id => id !== themeId)
        : [...prev, themeId];
      
      onVariationThemesChange(newThemes);
      return newThemes;
    });
  };

  // Handle option selection for a theme
  const handleOptionToggle = (themeId: string, option: string) => {
    setThemeOptions(prev => {
      const currentOptions = prev[themeId] || [];
      const newOptions = currentOptions.includes(option)
        ? currentOptions.filter(o => o !== option)
        : [...currentOptions, option];
      
      return { ...prev, [themeId]: newOptions };
    });
  };

  // Auto-generate variations when themes or options change
  useEffect(() => {
    if (autoGenerate && selectedThemes.length > 0) {
      const generated = generateCombinations();
      setVariations(generated);
      onVariationsChange(generated);
    }
  }, [selectedThemes, themeOptions, autoGenerate]);

  // Update a specific variation
  const updateVariation = (index: number, field: keyof Variation, value: any) => {
    const updated = [...variations];
    updated[index] = { ...updated[index], [field]: value };
    setVariations(updated);
    onVariationsChange(updated);
  };

  // Delete a variation
  const deleteVariation = (index: number) => {
    const updated = variations.filter((_, i) => i !== index);
    setVariations(updated);
    onVariationsChange(updated);
  };

  // Add custom variation
  const addCustomVariation = () => {
    const attributes: Record<string, string> = {};
    selectedThemes.forEach(theme => {
      attributes[theme] = '';
    });

    const newVariation: Variation = {
      attributes,
      sku: `${baseSKU}-CUSTOM-${Date.now()}`,
      price: basePrice,
      stockQuantity: 0,
      images: [],
    };

    setVariations([...variations, newVariation]);
    onVariationsChange([...variations, newVariation]);
  };

  const getThemeLabel = (themeId: string) => {
    return availableThemes.find(t => t.id === themeId)?.label || themeId;
  };

  return (
    <div className="space-y-6 border rounded-lg p-6 bg-gray-50">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Product Variations</h3>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={autoGenerate}
            onChange={(e) => setAutoGenerate(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Auto-generate combinations</span>
        </label>
      </div>

      {/* Theme Selection */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Select Variation Attributes
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {availableThemes.map(theme => (
            <label
              key={theme.id}
              className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition ${
                selectedThemes.includes(theme.id)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedThemes.includes(theme.id)}
                onChange={() => handleThemeToggle(theme.id)}
                className="rounded"
              />
              <span className="text-sm font-medium">{theme.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Options for each selected theme */}
      {selectedThemes.map(themeId => {
        const theme = availableThemes.find(t => t.id === themeId);
        if (!theme) return null;

        return (
          <div key={themeId} className="border-t pt-4">
            <label className="block text-sm font-medium mb-2">
              Select {theme.label} Options
            </label>
            <div className="flex flex-wrap gap-2">
              {theme.options.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionToggle(themeId, option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    (themeOptions[themeId] || []).includes(option.value)
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}

      {/* Generated Variations */}
      {variations.length > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">
              Generated Variations ({variations.length})
            </h4>
            {!autoGenerate && (
              <button
                type="button"
                onClick={addCustomVariation}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus size={16} />
                Add Custom
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {variations.map((variation, index) => (
              <div
                key={index}
                className="bg-white border rounded-lg p-4 grid grid-cols-1 md:grid-cols-5 gap-4"
              >
                {/* Attributes Display */}
                <div className="md:col-span-1">
                  <div className="text-xs text-gray-500 mb-1">Attributes</div>
                  <div className="space-y-1">
                    {Object.entries(variation.attributes).map(([key, value]) => (
                      <div key={key} className="text-sm">
                        <span className="font-medium">{getThemeLabel(key)}:</span>{' '}
                        {value || <span className="text-gray-400">Not set</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* SKU */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">SKU</label>
                  <input
                    type="text"
                    value={variation.sku}
                    onChange={(e) => updateVariation(index, 'sku', e.target.value)}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Price</label>
                  <input
                    type="number"
                    value={variation.price}
                    onChange={(e) => updateVariation(index, 'price', parseFloat(e.target.value))}
                    className="w-full px-2 py-1 text-sm border rounded"
                    step="0.01"
                  />
                </div>

                {/* Stock */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Stock</label>
                  <input
                    type="number"
                    value={variation.stockQuantity}
                    onChange={(e) => updateVariation(index, 'stockQuantity', parseInt(e.target.value))}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => deleteVariation(index)}
                    className="text-red-600 hover:text-red-700 p-2"
                    title="Delete variation"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedThemes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Select variation attributes above to start creating product variations
        </div>
      )}
    </div>
  );
}
