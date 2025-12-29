'use client';

import React, { useState } from 'react';

export interface VariantOption {
  id: string;
  name: string;
  values: string[];
}

export interface VariantCombination {
  id: string;
  attributes: { [key: string]: string };
  sku: string;
  price: number;
  stock: number;
  enabled: boolean;
}

interface ProductVariantManagerProps {
  onVariantsChange: (options: VariantOption[], combinations: VariantCombination[]) => void;
  initialOptions?: VariantOption[];
  initialCombinations?: VariantCombination[];
}

export default function ProductVariantManager({
  onVariantsChange,
  initialOptions = [],
  initialCombinations = [],
}: ProductVariantManagerProps) {
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>(initialOptions);
  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>(initialCombinations);
  const [newOptionName, setNewOptionName] = useState('');
  const [newOptionValues, setNewOptionValues] = useState<{ [key: string]: string }>({});

  // Add a new variant option type (e.g., Size, Color)
  const addVariantOption = () => {
    if (!newOptionName.trim()) return;

    const newOption: VariantOption = {
      id: `option_${Date.now()}`,
      name: newOptionName,
      values: [],
    };

    const updatedOptions = [...variantOptions, newOption];
    setVariantOptions(updatedOptions);
    setNewOptionName('');
    onVariantsChange(updatedOptions, variantCombinations);
  };

  // Add a value to a variant option (e.g., "Small", "Medium", "Large" to Size)
  const addValueToOption = (optionId: string) => {
    const value = newOptionValues[optionId]?.trim();
    if (!value) return;

    const updatedOptions = variantOptions.map((option) => {
      if (option.id === optionId && !option.values.includes(value)) {
        return { ...option, values: [...option.values, value] };
      }
      return option;
    });

    setVariantOptions(updatedOptions);
    setNewOptionValues({ ...newOptionValues, [optionId]: '' });

    // Regenerate combinations when values change
    regenerateCombinations(updatedOptions);
  };

  // Remove a value from a variant option
  const removeValueFromOption = (optionId: string, value: string) => {
    const updatedOptions = variantOptions.map((option) => {
      if (option.id === optionId) {
        return { ...option, values: option.values.filter((v) => v !== value) };
      }
      return option;
    });

    setVariantOptions(updatedOptions);
    regenerateCombinations(updatedOptions);
  };

  // Remove a variant option type
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

      return {
        id: existing?.id || `combo_${Date.now()}_${index}`,
        attributes,
        sku: existing?.sku || '',
        price: existing?.price || 0,
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
  const bulkUpdateCombinations = (field: 'price' | 'stock', value: number) => {
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
            Add variant options like Size, Color, Material, etc. and define pricing for each combination.
          </p>
        </div>
      </div>

      {/* Add Variant Option Type */}
      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add Variant Type
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newOptionName}
            onChange={(e) => setNewOptionName(e.target.value)}
            placeholder="e.g., Size, Color, Material, Packet Size"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && addVariantOption()}
          />
          <button
            type="button"
            onClick={addVariantOption}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Type
          </button>
        </div>
      </div>

      {/* Existing Variant Options */}
      {variantOptions.map((option) => (
        <div key={option.id} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-semibold text-gray-900">{option.name}</h4>
            <button
              type="button"
              onClick={() => removeVariantOption(option.id)}
              className="text-red-600 hover:text-red-700 text-sm"
            >
              Remove Type
            </button>
          </div>

          {/* Add Values to Option */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newOptionValues[option.id] || ''}
              onChange={(e) =>
                setNewOptionValues({ ...newOptionValues, [option.id]: e.target.value })
              }
              placeholder={`Add ${option.name} value (e.g., Small, Red, 500g)`}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyPress={(e) => e.key === 'Enter' && addValueToOption(option.id)}
            />
            <button
              type="button"
              onClick={() => addValueToOption(option.id)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Value
            </button>
          </div>

          {/* Display Values */}
          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => (
              <span
                key={value}
                className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {value}
                <button
                  type="button"
                  onClick={() => removeValueFromOption(option.id, value)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
            {option.values.length === 0 && (
              <span className="text-sm text-gray-500 italic">No values added yet</span>
            )}
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
