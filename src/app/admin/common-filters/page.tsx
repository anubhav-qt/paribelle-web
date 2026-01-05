'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, Save, X, Copy } from 'lucide-react';
import ThemeRenderer from '@/components/ThemeRenderer';

type FilterType = 'CHECKBOX' | 'SELECT' | 'MULTISELECT' | 'RANGE';

interface FilterOption {
  label: string;
  value: string;
}

interface CommonFilter {
  id: string;
  label: string;
  type: FilterType;
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

const COMMON_FILTER_TEMPLATES: CommonFilter[] = [
  {
    id: 'price',
    label: 'Price Range',
    type: 'RANGE',
    min: 0,
    max: 100000,
    step: 100,
    description: 'Standard price filter with customizable range',
  },
  {
    id: 'brand',
    label: 'Brand',
    type: 'CHECKBOX',
    options: [],
    description: 'Brand filter - add specific brands per category',
  },
  {
    id: 'color',
    label: 'Color',
    type: 'CHECKBOX',
    options: [
      { label: 'Black', value: 'black' },
      { label: 'White', value: 'white' },
      { label: 'Red', value: 'red' },
      { label: 'Blue', value: 'blue' },
      { label: 'Green', value: 'green' },
      { label: 'Yellow', value: 'yellow' },
      { label: 'Pink', value: 'pink' },
      { label: 'Gray', value: 'gray' },
      { label: 'Brown', value: 'brown' },
      { label: 'Purple', value: 'purple' },
      { label: 'Orange', value: 'orange' },
    ],
    description: 'Standard color options',
  },
  {
    id: 'size',
    label: 'Clothing Size',
    type: 'CHECKBOX',
    options: [
      { label: 'XS', value: 'xs' },
      { label: 'S', value: 's' },
      { label: 'M', value: 'm' },
      { label: 'L', value: 'l' },
      { label: 'XL', value: 'xl' },
      { label: 'XXL', value: 'xxl' },
      { label: '3XL', value: '3xl' },
    ],
    description: 'Standard clothing sizes',
  },
  {
    id: 'rating',
    label: 'Customer Rating',
    type: 'CHECKBOX',
    options: [
      { label: '4★ & Above', value: '4' },
      { label: '3★ & Above', value: '3' },
      { label: '2★ & Above', value: '2' },
      { label: '1★ & Above', value: '1' },
    ],
    description: 'Customer rating filter',
  },
  {
    id: 'discount',
    label: 'Discount',
    type: 'CHECKBOX',
    options: [
      { label: '50% or more', value: '50' },
      { label: '40% or more', value: '40' },
      { label: '30% or more', value: '30' },
      { label: '20% or more', value: '20' },
      { label: '10% or more', value: '10' },
    ],
    description: 'Discount percentage ranges',
  },
  {
    id: 'availability',
    label: 'Availability',
    type: 'CHECKBOX',
    options: [
      { label: 'In Stock', value: 'in-stock' },
      { label: 'Out of Stock', value: 'out-of-stock' },
    ],
    description: 'Stock availability filter',
  },
  {
    id: 'condition',
    label: 'Condition',
    type: 'SELECT',
    options: [
      { label: 'New', value: 'new' },
      { label: 'Refurbished', value: 'refurbished' },
      { label: 'Used', value: 'used' },
    ],
    description: 'Product condition',
  },
  {
    id: 'warranty',
    label: 'Warranty',
    type: 'CHECKBOX',
    options: [
      { label: 'No Warranty', value: 'none' },
      { label: '6 Months', value: '6m' },
      { label: '1 Year', value: '1y' },
      { label: '2 Years', value: '2y' },
      { label: '3+ Years', value: '3y' },
    ],
    description: 'Warranty period options',
  },
  {
    id: 'material',
    label: 'Material',
    type: 'CHECKBOX',
    options: [
      { label: 'Wood', value: 'wood' },
      { label: 'Metal', value: 'metal' },
      { label: 'Plastic', value: 'plastic' },
      { label: 'Glass', value: 'glass' },
      { label: 'Fabric', value: 'fabric' },
      { label: 'Leather', value: 'leather' },
      { label: 'Cotton', value: 'cotton' },
    ],
    description: 'Product material options',
  },
  {
    id: 'gender',
    label: 'Gender',
    type: 'CHECKBOX',
    options: [
      { label: 'Men', value: 'men' },
      { label: 'Women', value: 'women' },
      { label: 'Unisex', value: 'unisex' },
      { label: 'Kids', value: 'kids' },
    ],
    description: 'Gender/target audience',
  },
  {
    id: 'ageGroup',
    label: 'Age Group',
    type: 'CHECKBOX',
    options: [
      { label: '0-2 years', value: '0-2' },
      { label: '3-5 years', value: '3-5' },
      { label: '6-8 years', value: '6-8' },
      { label: '9-12 years', value: '9-12' },
      { label: '13+ years', value: '13+' },
    ],
    description: 'Age group for toys/kids products',
  },
  {
    id: 'skinType',
    label: 'Skin Type',
    type: 'CHECKBOX',
    options: [
      { label: 'Oily', value: 'oily' },
      { label: 'Dry', value: 'dry' },
      { label: 'Combination', value: 'combination' },
      { label: 'Sensitive', value: 'sensitive' },
      { label: 'Normal', value: 'normal' },
      { label: 'All Skin Types', value: 'all' },
    ],
    description: 'Skin type for beauty products',
  },
  {
    id: 'dietary',
    label: 'Dietary',
    type: 'CHECKBOX',
    options: [
      { label: 'Organic', value: 'organic' },
      { label: 'Vegan', value: 'vegan' },
      { label: 'Vegetarian', value: 'vegetarian' },
      { label: 'Gluten Free', value: 'glutenfree' },
      { label: 'Sugar Free', value: 'sugarfree' },
      { label: 'Keto', value: 'keto' },
      { label: 'Low Carb', value: 'lowcarb' },
    ],
    description: 'Dietary preferences for food',
  },
  {
    id: 'petType',
    label: 'Pet Type',
    type: 'CHECKBOX',
    options: [
      { label: 'Dog', value: 'dog' },
      { label: 'Cat', value: 'cat' },
      { label: 'Bird', value: 'bird' },
      { label: 'Fish', value: 'fish' },
      { label: 'Small Pets', value: 'small-pets' },
    ],
    description: 'Pet type for pet supplies',
  },
];

export default function CommonFiltersPage() {
  const [commonFilters, setCommonFilters] = useState<CommonFilter[]>(COMMON_FILTER_TEMPLATES);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredFilters = commonFilters.filter((filter) => {
    const matchesSearch =
      filter.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      filter.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || filter.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleCopyConfig = (filter: CommonFilter) => {
    const config = JSON.stringify(filter, null, 2);
    navigator.clipboard.writeText(config);
    setCopiedId(filter.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeColor = (type: FilterType) => {
    switch (type) {
      case 'CHECKBOX':
        return 'bg-blue-100 text-blue-800';
      case 'SELECT':
        return 'bg-green-100 text-green-800';
      case 'MULTISELECT':
        return 'bg-purple-100 text-purple-800';
      case 'RANGE':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <ThemeRenderer component="header" />
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <Link
            href="/admin"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Common Filter Templates</h1>
          <p className="text-gray-600 mt-1">
            Reusable filter configurations for categories
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Info Banner */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-blue-600 text-xl">💡</div>
            <div>
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                How to Use Common Filters
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• These are predefined filter templates you can apply to any category</li>
                <li>• Go to Categories → Configure Filters to assign these to specific categories</li>
                <li>• Customize filter options per category (e.g., different brands for different categories)</li>
                <li>• Common filters ensure consistency across your marketplace</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-gray-900">{commonFilters.length}</div>
            <div className="text-sm text-gray-600">Total Templates</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-blue-600">
              {commonFilters.filter((f) => f.type === 'CHECKBOX').length}
            </div>
            <div className="text-sm text-gray-600">Checkbox Filters</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-orange-600">
              {commonFilters.filter((f) => f.type === 'RANGE').length}
            </div>
            <div className="text-sm text-gray-600">Range Filters</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="text-2xl font-bold text-green-600">
              {commonFilters.filter((f) => f.type === 'SELECT').length}
            </div>
            <div className="text-sm text-gray-600">Select Filters</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Filters
              </label>
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="CHECKBOX">Checkbox</option>
                <option value="SELECT">Select</option>
                <option value="MULTISELECT">Multiselect</option>
                <option value="RANGE">Range</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Templates Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredFilters.map((filter) => (
            <div
              key={filter.id}
              className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{filter.label}</h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(
                          filter.type
                        )}`}
                      >
                        {filter.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{filter.description}</p>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                      id: {filter.id}
                    </code>
                  </div>
                  <button
                    onClick={() => handleCopyConfig(filter)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Copy configuration"
                  >
                    {copiedId === filter.id ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Filter Details */}
                {filter.type === 'RANGE' && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Min:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          ₹{filter.min?.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Max:</span>
                        <span className="ml-2 font-semibold text-gray-900">
                          ₹{filter.max?.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Step:</span>
                        <span className="ml-2 font-semibold text-gray-900">{filter.step}</span>
                      </div>
                    </div>
                  </div>
                )}

                {filter.options && filter.options.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-600 mb-2 font-medium">
                      Options ({filter.options.length})
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {filter.options.map((option, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 text-xs bg-white border border-gray-200 text-gray-700 rounded-full"
                        >
                          {option.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(!filter.options || filter.options.length === 0) &&
                  filter.type !== 'RANGE' && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-xs text-yellow-800">
                        ⚠️ No default options - add specific options when assigning to categories
                      </p>
                    </div>
                  )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 px-6 py-3 bg-gray-50 rounded-b-lg">
                <div className="flex items-center justify-between">
                  <Link
                    href="/admin/categories"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Apply to Categories →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredFilters.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <div className="text-gray-400 text-lg mb-2">No filters found</div>
            <p className="text-gray-600 text-sm">Try adjusting your search or filter criteria</p>
          </div>
        )}

        {/* Usage Guide */}
        <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Start Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-bold mb-3">
                1
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Choose Templates</h4>
              <p className="text-sm text-gray-600">
                Browse the available filter templates and identify which ones suit your categories
              </p>
            </div>
            <div>
              <div className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-bold mb-3">
                2
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Apply to Categories</h4>
              <p className="text-sm text-gray-600">
                Go to Categories management and configure filters for each category
              </p>
            </div>
            <div>
              <div className="bg-blue-100 text-blue-600 w-8 h-8 rounded-full flex items-center justify-center font-bold mb-3">
                3
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Customize Options</h4>
              <p className="text-sm text-gray-600">
                Add category-specific options like brands, colors, or adjust price ranges
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
