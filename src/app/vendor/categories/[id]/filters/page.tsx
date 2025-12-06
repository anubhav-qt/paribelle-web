'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';

interface FilterOption {
  value: string;
  label: string;
}

interface Filter {
  id: string;
  label: string;
  type: 'select' | 'multiselect' | 'checkbox' | 'range';
  options?: FilterOption[];
  min?: number;
  max?: number;
  step?: number;
}

interface Category {
  id: string;
  name: string;
  vendorId: string | null;
  filterConfig?: {
    filters: Filter[];
  };
}

export default function VendorCategoryFiltersPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = params.id as string;
  
  const [category, setCategory] = useState<Category | null>(null);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategory();
  }, [categoryId]);

  const fetchCategory = async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        router.push('/login');
        return;
      }
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/${categoryId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        // Check if the category belongs to this vendor
        const userData = JSON.parse(userStr);
        const vendorId = userData.vendorId;
        
        if (!data.vendorId || data.vendorId !== vendorId) {
          alert('You can only configure filters for your own categories.');
          router.push('/vendor/categories');
          return;
        }
        
        setCategory(data);
        setFilters(data.filterConfig?.filters || []);
      }
    } catch (error) {
      console.error('Error fetching category:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/${categoryId}/filters`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ filters }),
        }
      );
      
      if (response.ok) {
        alert('Filters saved successfully!');
        router.push('/vendor/categories');
      } else {
        alert('Failed to save filters');
      }
    } catch (error) {
      console.error('Error saving filters:', error);
      alert('Error saving filters');
    } finally {
      setSaving(false);
    }
  };

  const addFilter = () => {
    const newFilter: Filter = {
      id: `filter_${Date.now()}`,
      label: 'New Filter',
      type: 'checkbox',
      options: [],
    };
    setFilters([...filters, newFilter]);
  };

  const updateFilter = (index: number, updates: Partial<Filter>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    setFilters(newFilters);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const addOption = (filterIndex: number) => {
    const newFilters = [...filters];
    if (!newFilters[filterIndex].options) {
      newFilters[filterIndex].options = [];
    }
    newFilters[filterIndex].options!.push({
      value: '',
      label: '',
    });
    setFilters(newFilters);
  };

  const updateOption = (filterIndex: number, optionIndex: number, field: 'value' | 'label', value: string) => {
    const newFilters = [...filters];
    newFilters[filterIndex].options![optionIndex][field] = value;
    setFilters(newFilters);
  };

  const removeOption = (filterIndex: number, optionIndex: number) => {
    const newFilters = [...filters];
    newFilters[filterIndex].options = newFilters[filterIndex].options!.filter((_, i) => i !== optionIndex);
    setFilters(newFilters);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/vendor/categories"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Categories
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Configure Filters</h1>
              <p className="text-gray-600 mt-1">
                Category: <span className="font-medium">{category?.name}</span>
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Filters'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {filters.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Filters Configured</h3>
              <p className="text-gray-600 mb-4">Add filters to help customers find products in this category</p>
              <button
                onClick={addFilter}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add First Filter
              </button>
            </div>
          ) : (
            <>
              {filters.map((filter, filterIndex) => (
                <div key={filter.id} className="bg-white rounded-lg border p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold">Filter #{filterIndex + 1}</h3>
                    <button
                      onClick={() => removeFilter(filterIndex)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Filter ID</label>
                      <input
                        type="text"
                        value={filter.id}
                        onChange={(e) => updateFilter(filterIndex, { id: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Label</label>
                      <input
                        type="text"
                        value={filter.label}
                        onChange={(e) => updateFilter(filterIndex, { label: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Filter Type</label>
                    <select
                      value={filter.type}
                      onChange={(e) => updateFilter(filterIndex, { type: e.target.value as Filter['type'] })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="checkbox">Checkbox</option>
                      <option value="select">Select (Single)</option>
                      <option value="multiselect">Multi-Select</option>
                      <option value="range">Range Slider</option>
                    </select>
                  </div>

                  {(filter.type === 'checkbox' || filter.type === 'select' || filter.type === 'multiselect') && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium">Options</label>
                        <button
                          onClick={() => addOption(filterIndex)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                        >
                          Add Option
                        </button>
                      </div>
                      <div className="space-y-2">
                        {filter.options?.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Value"
                              value={option.value}
                              onChange={(e) => updateOption(filterIndex, optionIndex, 'value', e.target.value)}
                              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              placeholder="Label"
                              value={option.label}
                              onChange={(e) => updateOption(filterIndex, optionIndex, 'label', e.target.value)}
                              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => removeOption(filterIndex, optionIndex)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {filter.type === 'range' && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Min Value</label>
                        <input
                          type="number"
                          value={filter.min || 0}
                          onChange={(e) => updateFilter(filterIndex, { min: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Max Value</label>
                        <input
                          type="number"
                          value={filter.max || 1000}
                          onChange={(e) => updateFilter(filterIndex, { max: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Step</label>
                        <input
                          type="number"
                          value={filter.step || 1}
                          onChange={(e) => updateFilter(filterIndex, { step: parseFloat(e.target.value) })}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <button
                onClick={addFilter}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add Another Filter
              </button>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Link
            href="/vendor/categories"
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Save Filters'}
          </button>
        </div>
      </div>
    </div>
  );
}
