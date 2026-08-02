'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Plus, Trash2, Save, ArrowLeft, Copy } from 'lucide-react';
import Link from 'next/link';

interface FilterOption {
  label: string;
  value: string;
}

interface CategoryFilter {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'checkbox' | 'range';
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
}

import { Category } from '@/types/product';
import { Loader } from '@/components/ui/Loader';

// Filter templates for the two live categories, Kurtis and Jewellery. Ids
// must match the keys used in the `Attributes` column of the product import
// sheet — a filter only narrows results if its id matches an attribute key
// products actually carry.
const COMMON_FILTER_TEMPLATES: CategoryFilter[] = [
  {
    id: 'price',
    label: 'Price Range',
    type: 'range',
    min: 0,
    max: 20000,
    step: 200,
  },
  {
    id: 'fabric',
    label: 'Fabric',
    type: 'checkbox',
    options: [
      { label: 'Cotton', value: 'cotton' },
      { label: 'Chanderi', value: 'chanderi' },
      { label: 'Silk', value: 'silk' },
      { label: 'Rayon', value: 'rayon' },
      { label: 'Georgette', value: 'georgette' },
      { label: 'Muslin', value: 'muslin' },
    ],
  },
  {
    id: 'colour',
    label: 'Colour',
    type: 'checkbox',
    options: [
      { label: 'Rose', value: 'rose' },
      { label: 'Ivory', value: 'ivory' },
      { label: 'Indigo', value: 'indigo' },
      { label: 'Black', value: 'black' },
      { label: 'Mustard', value: 'mustard' },
      { label: 'Green', value: 'green' },
      { label: 'Maroon', value: 'maroon' },
    ],
  },
  {
    id: 'size',
    label: 'Size',
    type: 'checkbox',
    options: [
      { label: 'XS', value: 'xs' },
      { label: 'S', value: 's' },
      { label: 'M', value: 'm' },
      { label: 'L', value: 'l' },
      { label: 'XL', value: 'xl' },
      { label: 'XXL', value: 'xxl' },
      { label: '3XL', value: '3xl' },
    ],
  },
  {
    id: 'sleeve',
    label: 'Sleeve',
    type: 'checkbox',
    options: [
      { label: 'Sleeveless', value: 'sleeveless' },
      { label: 'Short', value: 'short' },
      { label: 'Three-Quarter', value: 'three-quarter' },
      { label: 'Full', value: 'full' },
    ],
  },
  {
    id: 'type',
    label: 'Type',
    type: 'checkbox',
    options: [
      { label: 'Earrings', value: 'earrings' },
      { label: 'Necklace', value: 'necklace' },
      { label: 'Bangles', value: 'bangles' },
      { label: 'Ring', value: 'ring' },
      { label: 'Anklet', value: 'anklet' },
    ],
  },
  {
    id: 'finish',
    label: 'Finish',
    type: 'checkbox',
    options: [
      { label: 'Gold-tone', value: 'gold-tone' },
      { label: 'Silver-tone', value: 'silver-tone' },
      { label: 'Oxidised', value: 'oxidised' },
      { label: 'Rose Gold', value: 'rose-gold' },
    ],
  },
  {
    id: 'stone',
    label: 'Stone / Work',
    type: 'checkbox',
    options: [
      { label: 'Kundan', value: 'kundan' },
      { label: 'Meenakari', value: 'meenakari' },
      { label: 'Pearl', value: 'pearl' },
      { label: 'American Diamond', value: 'american-diamond' },
      { label: 'Beads', value: 'beads' },
    ],
  },
  {
    id: 'occasion',
    label: 'Occasion',
    type: 'checkbox',
    options: [
      { label: 'Everyday', value: 'everyday' },
      { label: 'Work', value: 'work' },
      { label: 'Festive', value: 'festive' },
      { label: 'Wedding', value: 'wedding' },
    ],
  },
  {
    id: 'rating',
    label: 'Customer Rating',
    type: 'checkbox',
    options: [
      { label: '4★ & Above', value: '4' },
      { label: '3★ & Above', value: '3' },
      { label: '2★ & Above', value: '2' },
      { label: '1★ & Above', value: '1' },
    ],
  },
  {
    id: 'discount',
    label: 'Discount',
    type: 'checkbox',
    options: [
      { label: '50% or more', value: '50' },
      { label: '40% or more', value: '40' },
      { label: '30% or more', value: '30' },
      { label: '20% or more', value: '20' },
      { label: '10% or more', value: '10' },
    ],
  },
];

export default function CategoryFiltersPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [filters, setFilters] = useState<CategoryFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    fetchCategory();
  }, [categoryId]);

  const fetchCategory = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/${categoryId}`);
      if (response.ok) {
        const data = await response.json();
        setCategory(data);
        setFilters(data.filterConfig?.filters || []);
      }
    } catch (error) {
      console.error('Error fetching category:', error);
      setError('Failed to load category');
    } finally {
      setLoading(false);
    }
  };

  const addFilter = () => {
    const newFilter: CategoryFilter = {
      id: `filter_${Date.now()}`,
      label: '',
      type: 'checkbox',
      options: [],
    };
    setFilters([...filters, newFilter]);
    setShowTemplates(false);
  };

  const addFilterFromTemplate = (template: CategoryFilter) => {
    // Create a deep copy of the template
    const newFilter: CategoryFilter = {
      ...template,
      id: template.id,
      options: template.options ? [...template.options] : undefined,
    };
    setFilters([...filters, newFilter]);
    setShowTemplates(false);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, field: keyof CategoryFilter, value: any) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [field]: value };
    
    // Clear options if changing from checkbox/select to range
    if (field === 'type' && value === 'range') {
      newFilters[index].options = undefined;
      newFilters[index].min = 0;
      newFilters[index].max = 10000;
      newFilters[index].step = 100;
    }
    
    // Clear range values if changing to checkbox/select
    if (field === 'type' && (value === 'checkbox' || value === 'select' || value === 'multiselect')) {
      newFilters[index].min = undefined;
      newFilters[index].max = undefined;
      newFilters[index].step = undefined;
      if (!newFilters[index].options) {
        newFilters[index].options = [];
      }
    }
    
    setFilters(newFilters);
  };

  const addOption = (filterIndex: number) => {
    const newFilters = [...filters];
    if (!newFilters[filterIndex].options) {
      newFilters[filterIndex].options = [];
    }
    newFilters[filterIndex].options!.push({ label: '', value: '' });
    setFilters(newFilters);
  };

  const removeOption = (filterIndex: number, optionIndex: number) => {
    const newFilters = [...filters];
    newFilters[filterIndex].options = newFilters[filterIndex].options!.filter((_, i) => i !== optionIndex);
    setFilters(newFilters);
  };

  const updateOption = (filterIndex: number, optionIndex: number, field: 'label' | 'value', value: string) => {
    const newFilters = [...filters];
    newFilters[filterIndex].options![optionIndex][field] = value;
    setFilters(newFilters);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/${categoryId}/filters`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters }),
      });

      if (response.ok) {
        setSuccess('Filters saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to save filters');
      }
    } catch (error) {
      console.error('Error saving filters:', error);
      setError('Failed to save filters');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size="md" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left Sidebar - Common Filter Templates */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <h2 className="font-semibold text-gray-900 mb-2">Common Filter Templates</h2>
          <p className="text-xs text-gray-600">Click to add to category</p>
        </div>
        
        <div className="p-4 space-y-2">
          {COMMON_FILTER_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => addFilterFromTemplate(template)}
              className="w-full text-left p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 group-hover:text-blue-700">
                    {template.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-gray-700 mr-1">
                      {template.type}
                    </span>
                    {template.options && template.options.length > 0 && (
                      <span className="text-gray-600">{template.options.length} options</span>
                    )}
                    {template.type === 'range' && (
                      <span className="text-gray-600">₹{template.min?.toLocaleString()}-₹{template.max?.toLocaleString()}</span>
                    )}
                  </div>
                </div>
                <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0 ml-2" />
              </div>
            </button>
          ))}
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <Link
            href="/admin/common-filters"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View All Templates →
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href="/admin/categories"
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Back to Categories"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                  <Link
                    href="/admin"
                    className="text-blue-600 hover:text-blue-800 text-sm inline-block mb-1"
                  >
                    ← Back to Dashboard
                  </Link>
                  <h1 className="text-2xl font-bold text-gray-900">Configure Filters</h1>
                  <p className="text-gray-600">Category: {category?.name}</p>
                </div>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Filters'}
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Messages */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              {success}
            </div>
          )}

          {/* Filters List */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Active Filters</h2>
              <button
                onClick={addFilter}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Custom Filter
              </button>
            </div>

          {filters.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No filters configured yet.</p>
              <p className="text-sm mt-2">Click "Add Filter" to create your first filter.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filters.map((filter, filterIndex) => (
                <div key={filter.id} className="border rounded-lg p-6 bg-gray-50">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="font-semibold text-lg">Filter #{filterIndex + 1}</h3>
                    <button
                      onClick={() => removeFilter(filterIndex)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Filter ID (used in API)
                      </label>
                      <input
                        type="text"
                        value={filter.id}
                        onChange={(e) => updateFilter(filterIndex, 'id', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., brand, color, size"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Display Label
                      </label>
                      <input
                        type="text"
                        value={filter.label}
                        onChange={(e) => updateFilter(filterIndex, 'label', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Brand, Color, Size"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter Type
                    </label>
                    <select
                      value={filter.type}
                      onChange={(e) => updateFilter(filterIndex, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="checkbox">Checkbox (Multiple selection)</option>
                      <option value="select">Select (Single selection)</option>
                      <option value="multiselect">Multi-Select</option>
                      <option value="range">Range (Price, Size, etc.)</option>
                    </select>
                  </div>

                  {/* Options for checkbox/select */}
                  {(filter.type === 'checkbox' || filter.type === 'select' || filter.type === 'multiselect') && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Options
                        </label>
                        <button
                          onClick={() => addOption(filterIndex)}
                          className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Add Option
                        </button>
                      </div>
                      <div className="space-y-2">
                        {filter.options?.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex gap-2">
                            <input
                              type="text"
                              value={option.label}
                              onChange={(e) => updateOption(filterIndex, optionIndex, 'label', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Display Label (e.g., Nike)"
                            />
                            <input
                              type="text"
                              value={option.value}
                              onChange={(e) => updateOption(filterIndex, optionIndex, 'value', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Value (e.g., nike)"
                            />
                            <button
                              onClick={() => removeOption(filterIndex, optionIndex)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Range configuration */}
                  {filter.type === 'range' && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Min Value
                        </label>
                        <input
                          type="number"
                          value={filter.min || 0}
                          onChange={(e) => updateFilter(filterIndex, 'min', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Value
                        </label>
                        <input
                          type="number"
                          value={filter.max || 10000}
                          onChange={(e) => updateFilter(filterIndex, 'max', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Step
                        </label>
                        <input
                          type="number"
                          value={filter.step || 100}
                          onChange={(e) => updateFilter(filterIndex, 'step', Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  );
}
