'use client';

import React, { useState, useEffect } from 'react';
import { showAlert } from '@/lib/dialog';

export interface VariantOption {
  id: string;
  name: string;
  values: string[];
  isCategoryFilter?: boolean; // Track if this comes from category
  availableOptions?: { value: string; label: string }[]; // Available options from category
}

export interface VariantCombination {
  id: string;
  attributes: { [key: string]: string };
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  enabled: boolean;
}

interface ProductVariantManagerProps {
  onVariantsChange: (options: VariantOption[], combinations: VariantCombination[]) => void;
  initialOptions?: VariantOption[];
  initialCombinations?: VariantCombination[];
  categoryFilters?: any[]; // Category-suggested variant types (like Size, Color from category)
  baseSKU?: string; // Base SKU for auto-generating variant SKUs
}

export default function ProductVariantManager({
  onVariantsChange,
  initialOptions = [],
  initialCombinations = [],
  categoryFilters = [],
  baseSKU = '',
}: ProductVariantManagerProps) {
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>(initialOptions);
  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>(initialCombinations);
  const [newCustomVariantName, setNewCustomVariantName] = useState('');
  const [newCustomVariantValues, setNewCustomVariantValues] = useState('');

  // Initialize category filters as variant options on mount
  useEffect(() => {
    if (categoryFilters.length > 0 && initialOptions.length === 0) {
      const categoryOptions: VariantOption[] = categoryFilters.map(filter => ({
        id: filter.id,
        name: filter.label,
        values: [], // User will select which values to use
        isCategoryFilter: true,
        availableOptions: filter.options || [],
      }));
      setVariantOptions(categoryOptions);
    }
  }, [categoryFilters]);

  // Toggle a value for a category filter variant
  const toggleCategoryValue = (optionId: string, value: string) => {
    const updatedOptions = variantOptions.map((option) => {
      if (option.id === optionId) {
        const values = option.values.includes(value)
          ? option.values.filter((v) => v !== value)
          : [...option.values, value];
        return { ...option, values };
      }
      return option;
    });

    setVariantOptions(updatedOptions);
    regenerateCombinations(updatedOptions);
  };

  // Add custom variant (not from category)
  const addCustomVariant = () => {
    if (!newCustomVariantName.trim() || !newCustomVariantValues.trim()) {
      showAlert('Please enter variant name and values (comma-separated)', 'warning');
      return;
    }

    const values = newCustomVariantValues
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0);

    if (values.length === 0) {
      showAlert('Please enter at least one value', 'warning');
      return;
    }

    const newOption: VariantOption = {
      id: `custom_${Date.now()}`,
      name: newCustomVariantName,
      values,
      isCategoryFilter: false,
    };

    const updatedOptions = [...variantOptions, newOption];
    setVariantOptions(updatedOptions);
    setNewCustomVariantName('');
    setNewCustomVariantValues('');
    regenerateCombinations(updatedOptions);
  };

  // Remove a variant option
  const removeVariantOption = (optionId: string) => {
    const updatedOptions = variantOptions.filter((opt) => opt.id !== optionId);
    setVariantOptions(updatedOptions);
    regenerateCombinations(updatedOptions);
  };

  // Generate all possible combinations of variant options
  const regenerateCombinations = (options: VariantOption[]) => {
    if (options.length === 0 || options.some((opt) => opt.values.length === 0)) {
      setVariantCombinations([]);
      onVariantsChange(options, []);
      return;
    }

    // Generate cartesian product of all variant values
    const combinations = cartesianProduct(
      options.map((opt) => opt.values.map((val) => ({ name: opt.name, value: val })))
    );

    const newCombinations: VariantCombination[] = combinations.map((combo, index) => {
      const attributes: { [key: string]: string } = {};
      combo.forEach((attr) => {
        attributes[attr.name] = attr.value;
      });

      // Try to preserve existing combination data
      const existing = variantCombinations.find((vc) =>
        Object.keys(attributes).every((key) => vc.attributes[key] === attributes[key])
      );

      // Auto-generate SKU if not provided
      const autoSKU = baseSKU 
        ? `${baseSKU}-${Object.values(attributes).join('-').toUpperCase().replace(/\s+/g, '-')}`
        : `VAR-${Date.now()}-${index}`;

      return {
        id: existing?.id || `combo_${Date.now()}_${index}`,
        attributes,
        sku: existing?.sku || autoSKU,
        price: existing?.price || 0,
        compareAtPrice: existing?.compareAtPrice,
        stock: existing?.stock || 0,
        enabled: existing?.enabled ?? true,
      };
    });

    setVariantCombinations(newCombinations);
    onVariantsChange(options, newCombinations);
  };

  // Cartesian product helper
  const cartesianProduct = (arrays: any[][]): any[][] => {
    return arrays.reduce(
      (acc, curr) => {
        return acc.flatMap((a) => curr.map((b) => [...a, b]));
      },
      [[]] as any[][]
    );
  };

  // Update a specific combination
  const updateCombination = (id: string, field: keyof VariantCombination, value: any) => {
    const updated = variantCombinations.map((combo) => {
      if (combo.id === id) {
        return { ...combo, [field]: value };
      }
      return combo;
    });

    setVariantCombinations(updated);
    onVariantsChange(variantOptions, updated);
  };

  // Bulk update all combinations
  const bulkUpdateCombinations = (field: 'price' | 'stock' | 'compareAtPrice', value: number) => {
    const updated = variantCombinations.map((combo) => ({
      ...combo,
      [field]: value,
    }));

    setVariantCombinations(updated);
    onVariantsChange(variantOptions, updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Product Variants</h3>
          <p className="text-sm text-gray-600 mt-1">
            Select variant options from your category and add custom variants. Pricing rows will appear below.
          </p>
        </div>
      </div>

      {/* Category Filter Variants */}
      {variantOptions.filter(opt => opt.isCategoryFilter).map((option) => (
        <div key={option.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-md font-semibold text-blue-900 flex items-center gap-2">
                <span>📋</span> {option.name}
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">From Category</span>
              </h4>
              <p className="text-sm text-blue-700 mt-1">Select the values you want to offer:</p>
            </div>
            <button
              type="button"
              onClick={() => removeVariantOption(option.id)}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Remove
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {option.availableOptions?.map((availOption) => {
              const isSelected = option.values.includes(availOption.value);
              return (
                <label
                  key={availOption.value}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-blue-100 border-blue-500'
                      : 'bg-white border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCategoryValue(option.id, availOption.value)}
                    className="h-4 w-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-900">{availOption.label}</span>
                </label>
              );
            })}
          </div>

          {option.values.length > 0 && (
            <div className="mt-3 pt-3 border-t border-blue-200">
              <p className="text-sm text-blue-800">
                <strong>Selected ({option.values.length}):</strong> {option.values.join(', ')}
              </p>
            </div>
          )}
        </div>
      ))}

      {/* Add Custom Variant */}
      <div className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
        <h4 className="text-md font-semibold text-purple-900 mb-3 flex items-center gap-2">
          <span>➕</span> Add Custom Variant
        </h4>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Variant Name
            </label>
            <input
              type="text"
              value={newCustomVariantName}
              onChange={(e) => setNewCustomVariantName(e.target.value)}
              placeholder="e.g., Packet Size, Weight, Flavor, Style"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Values (comma-separated)
            </label>
            <input
              type="text"
              value={newCustomVariantValues}
              onChange={(e) => setNewCustomVariantValues(e.target.value)}
              placeholder="e.g., 250g, 500g, 1kg  OR  Vanilla, Chocolate, Strawberry"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <button
            type="button"
            onClick={addCustomVariant}
            className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
          >
            Add Custom Variant
          </button>
        </div>
      </div>

      {/* Custom Variants Display */}
      {variantOptions.filter(opt => !opt.isCategoryFilter).map((option) => (
        <div key={option.id} className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-md font-semibold text-purple-900 flex items-center gap-2">
                <span>🎨</span> {option.name}
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Custom</span>
              </h4>
              <p className="text-sm text-purple-700 mt-1">Values: {option.values.join(', ')}</p>
            </div>
            <button
              type="button"
              onClick={() => removeVariantOption(option.id)}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Remove
            </button>
          </div>
        </div>
      ))}

      {/* Variant Combinations Table */}
      {variantCombinations.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h4 className="text-md font-semibold text-gray-900">
                Variant Combinations ({variantCombinations.length})
              </h4>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Bulk price"
                  className="px-3 py-1 border border-gray-300 rounded text-sm w-28"
                  onBlur={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      bulkUpdateCombinations('price', value);
                      e.target.value = '';
                    }
                  }}
                />
                <input
                  type="number"
                  placeholder="Bulk compare price"
                  className="px-3 py-1 border border-gray-300 rounded text-sm w-32"
                  onBlur={(e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value > 0) {
                      bulkUpdateCombinations('compareAtPrice', value);
                      e.target.value = '';
                    }
                  }}
                />
                <input
                  type="number"
                  placeholder="Bulk stock"
                  className="px-3 py-1 border border-gray-300 rounded text-sm w-28"
                  onBlur={(e) => {
                    const value = parseInt(e.target.value);
                    if (!isNaN(value) && value >= 0) {
                      bulkUpdateCombinations('stock', value);
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Enabled
                  </th>
                  {variantOptions.map((opt) => (
                    <th
                      key={opt.id}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {opt.name}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price (₹)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compare Price (₹)
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {variantCombinations.map((combo) => (
                  <tr key={combo.id} className={!combo.enabled ? 'opacity-50' : ''}>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={combo.enabled}
                        onChange={(e) => updateCombination(combo.id, 'enabled', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    {variantOptions.map((opt) => (
                      <td key={opt.id} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {combo.attributes[opt.name]}
                      </td>
                    ))}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="text"
                        value={combo.sku}
                        onChange={(e) => updateCombination(combo.id, 'sku', e.target.value)}
                        placeholder="SKU-001"
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="number"
                        value={combo.price || ''}
                        onChange={(e) =>
                          updateCombination(combo.id, 'price', parseFloat(e.target.value) || 0)
                        }
                        placeholder="0.00"
                        step="0.01"
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="number"
                        value={combo.compareAtPrice || ''}
                        onChange={(e) =>
                          updateCombination(combo.id, 'compareAtPrice', parseFloat(e.target.value) || undefined)
                        }
                        placeholder="0.00"
                        step="0.01"
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="number"
                        value={combo.stock || ''}
                        onChange={(e) =>
                          updateCombination(combo.id, 'stock', parseInt(e.target.value) || 0)
                        }
                        placeholder="0"
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-full"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {variantOptions.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No variant types added yet.</p>
          <p className="text-xs mt-1">
            Add variant types above to create product variations with individual pricing and stock.
          </p>
        </div>
      )}
    </div>
  );
}
