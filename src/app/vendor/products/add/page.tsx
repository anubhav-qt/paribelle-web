'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import MultiImageUpload from '@/components/MultiImageUpload';

export default function VendorAddProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Array<{ id: string; name: string; level: number; parentId: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [productType, setProductType] = useState<'physical' | 'booking'>('physical');
  
  // Category filters and product attributes
  const [categoryFilters, setCategoryFilters] = useState<any[]>([]);
  const [productAttributes, setProductAttributes] = useState<Record<string, any>>({});
  
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    categoryIds: [] as string[],
    price: '' as any,
    compareAtPrice: '' as any,
    stockQuantity: '' as any,
    sku: '',
    status: 'active',
    featuredImage: '',
    images: [] as string[],
  });

  // Booking-specific fields
  const [bookingData, setBookingData] = useState({
    duration: 60, // minutes
    durationUnit: 'hours' as 'hours' | 'days' | 'sessions',
    bufferTime: 0,
    availableDays: [] as string[],
    timeSlots: [{ start: '09:00', end: '17:00' }],
  });

  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const DURATION_UNITS = [
    { value: 'hours', label: 'Hours', description: 'Hourly bookings (e.g., badminton court, meeting room)' },
    { value: 'days', label: 'Days', description: 'Full day bookings (e.g., marriage hall, event venue)' },
    { value: 'sessions', label: 'Sessions', description: 'Fixed sessions (e.g., spa treatment, class)' },
  ];

  useEffect(() => {
    fetchCategories();
    generateSKU();
  }, []);

  // Fetch category filters when categories are selected
  useEffect(() => {
    if (formData.categoryIds.length > 0 && productType === 'physical') {
      fetchCategoryFilters(formData.categoryIds[0]); // Use first selected category
    } else {
      setCategoryFilters([]);
      setProductAttributes({});
    }
  }, [formData.categoryIds, productType]);

  const generateSKU = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const vendorPrefix = user.vendorId.substring(0, 8).toUpperCase();
      const timestamp = Date.now().toString().slice(-6);
      setFormData(prev => ({ ...prev, sku: `${vendorPrefix}-${timestamp}` }));
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/tree/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const flattenedCategories = flattenCategories(data);
        setCategories(flattenedCategories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryFilters = async (categoryId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/${categoryId}/filters`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Category filters:', data);
        console.log('Filter IDs:', data.filters?.map((f: any) => ({ id: f.id, label: f.label })));
        
        // Filter out price range before setting state
        const filteredFilters = (data.filters || []).filter((f: any) => f.id !== 'priceRange');
        console.log('Filtered filters (without price):', filteredFilters.map((f: any) => ({ id: f.id, label: f.label })));
        
        setCategoryFilters(filteredFilters);
        
        // Initialize attributes with empty values
        const initialAttrs: Record<string, any> = {};
        filteredFilters.forEach((filter: any) => {
          if (filter.type === 'checkbox' || filter.type === 'multiselect') {
            initialAttrs[filter.id] = '';
          } else if (filter.type === 'select') {
            initialAttrs[filter.id] = '';
          } else if (filter.type === 'range') {
            initialAttrs[filter.id] = filter.min || 0;
          }
        });
        setProductAttributes(initialAttrs);
      }
    } catch (error) {
      console.error('Error fetching category filters:', error);
      setCategoryFilters([]);
    }
  };

  const flattenCategories = (categories: any[], level = 0, parentId: string | null = null): Array<{ id: string; name: string; level: number; parentId: string | null }> => {
    let result: Array<{ id: string; name: string; level: number; parentId: string | null }> = [];
    
    categories.forEach((category) => {
      result.push({
        id: category.id,
        name: category.name,
        level,
        parentId,
      });
      
      if (category.children && category.children.length > 0) {
        result = result.concat(flattenCategories(category.children, level + 1, category.id));
      }
    });
    
    return result;
  };

  // Get all parent category IDs for a given category
  const getAllParents = (categoryId: string): string[] => {
    const parents: string[] = [];
    let currentCategory = categories.find(c => c.id === categoryId);
    
    while (currentCategory?.parentId) {
      parents.push(currentCategory.parentId);
      currentCategory = categories.find(c => c.id === currentCategory!.parentId);
    }
    
    return parents;
  };

  // Get all children category IDs for a given category
  const getAllChildren = (categoryId: string): string[] => {
    const children: string[] = [];
    const directChildren = categories.filter(c => c.parentId === categoryId);
    
    directChildren.forEach(child => {
      children.push(child.id);
      children.push(...getAllChildren(child.id));
    });
    
    return children;
  };

  // Handle category selection with parent auto-select and single path constraint
  const handleCategoryChange = (categoryId: string, isChecked: boolean) => {
    if (isChecked) {
      // Get all parents of this category
      const parents = getAllParents(categoryId);
      
      // Clear all previously selected categories (to enforce single path)
      // Then select the category and all its parents
      const newCategoryIds = [...parents, categoryId];
      
      setFormData({
        ...formData,
        categoryIds: newCategoryIds,
      });
    } else {
      // When unchecking, remove the category and all its children
      const children = getAllChildren(categoryId);
      const toRemove = [categoryId, ...children];
      
      setFormData({
        ...formData,
        categoryIds: formData.categoryIds.filter((id) => !toRemove.includes(id)),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        alert('Please login first');
        return;
      }

      const user = JSON.parse(userStr);

      // Auto-generate slug from name if not provided
      const slug = formData.slug || 
        formData.name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

      const productData: any = {
        ...formData,
        slug,
        price: parseFloat(formData.price) || 0,
        compareAtPrice: parseFloat(formData.compareAtPrice) || 0,
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        vendorId: user.vendorId,
        productType,
      };

      // Add attributes for physical products
      if (productType === 'physical' && Object.keys(productAttributes).length > 0) {
        // Process attributes and handle custom values
        const processedAttributes: Record<string, any> = {};
        const newFilterOptions: Record<string, { value: string; label: string }> = {};
        
        Object.entries(productAttributes).forEach(([key, value]) => {
          // Skip custom input fields and empty values
          if (key.endsWith('_custom') || value === '' || value === null || value === '__custom__') {
            return;
          }
          
          // Check if this is a custom value
          const customKey = `${key}_custom`;
          if (productAttributes[customKey]) {
            const customValue = productAttributes[customKey] as string;
            if (customValue.trim()) {
              // Generate slug for custom value
              const valueSlug = customValue.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              processedAttributes[key] = valueSlug;
              
              // Store new filter option to be added
              newFilterOptions[key] = {
                value: valueSlug,
                label: customValue.trim()
              };
            }
          } else {
            processedAttributes[key] = value;
          }
        });
        
        if (Object.keys(processedAttributes).length > 0) {
          productData.attributes = processedAttributes;
        }
        
        // If there are new custom filter options, include them
        if (Object.keys(newFilterOptions).length > 0) {
          productData.newFilterOptions = newFilterOptions;
          productData.categoryId = formData.categoryIds[0]; // To know which category to update
        }
      }

      // Add booking metadata if booking type
      if (productType === 'booking') {
        productData.attributes = {
          booking: bookingData,
        };
        // For bookings, stock is not relevant
        productData.stockQuantity = 0;
        productData.sku = formData.sku || `BOOKING-${Date.now()}`;
      }

      console.log('Submitting product with attributes:', productData.attributes);
      if (productData.newFilterOptions) {
        console.log('New filter options to add:', productData.newFilterOptions);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      if (response.ok) {
        alert('Product created successfully!');
        router.push('/vendor/products');
      } else {
        const error = await response.json();
        alert(`Failed to create product: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/vendor/products"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to Products
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
          <p className="text-gray-600 mt-2">Create a new product for your store</p>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Product Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Type *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setProductType('physical')}
                  className={`p-4 border-2 rounded-lg text-left ${
                    productType === 'physical'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold text-lg">📦 Physical Product</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Regular products with inventory (clothing, electronics, etc.)
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setProductType('booking')}
                  className={`p-4 border-2 rounded-lg text-left ${
                    productType === 'booking'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="font-semibold text-lg">📅 Booking/Appointment</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Hall booking, appointments, services with time slots
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter product name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug (auto-generated if empty)
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="product-slug"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Enter product description"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <div className="w-full px-4 py-3 border border-gray-300 rounded-lg max-h-48 overflow-y-auto bg-white">
                {loading ? (
                  <p className="text-sm text-gray-500">Loading categories...</p>
                ) : categories.length === 0 ? (
                  <p className="text-sm text-gray-500">No categories available</p>
                ) : (
                  categories.map((category) => {
                    const isSelected = formData.categoryIds.includes(category.id);
                    const isParentOfSelected = formData.categoryIds.some(selectedId => {
                      const parents = getAllParents(selectedId);
                      return parents.includes(category.id);
                    });
                    
                    return (
                      <label
                        key={category.id}
                        className={`flex items-center py-1.5 hover:bg-gray-50 cursor-pointer rounded px-1 ${
                          isParentOfSelected ? 'bg-blue-50' : ''
                        }`}
                        style={{ marginLeft: `${category.level * 20}px` }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                          className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className={`text-sm ${category.level === 0 ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                          {category.name}
                          {isParentOfSelected && !getAllChildren(category.id).some(childId => formData.categoryIds.includes(childId)) && (
                            <span className="ml-2 text-xs text-blue-600">(auto-selected)</span>
                          )}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {formData.categoryIds.length} categor{formData.categoryIds.length === 1 ? 'y' : 'ies'} selected. Select a specific category - parent categories will be auto-selected.
              </p>
            </div>

            {/* NEW: Dynamic Product Attributes Based on Category */}
            {productType === 'physical' && categoryFilters.length > 0 && (
              <div className="border-t pt-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    📋 Product Attributes
                  </h3>
                  <p className="text-sm text-blue-700">
                    {categoryFilters.length > 0 ? (
                      <>
                        Fill in attributes like{' '}
                        <strong>
                          {categoryFilters
                            .map(f => f.label)
                            .slice(0, 3)
                            .join(', ')}
                        </strong>
                        {categoryFilters.length > 3 && ', etc.'} to help customers filter and find your product easily.
                      </>
                    ) : (
                      'These attributes help customers filter and find your product. Fill in relevant details for better discoverability.'
                    )}
                  </p>
                </div>

                {categoryFilters.map((filter) => {
                  const isCustomValue = productAttributes[filter.id] === '__custom__';
                  
                  return (
                    <div key={filter.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {filter.label}
                        {filter.type !== 'range' && (
                          <span className="text-gray-400 font-normal ml-1">(optional)</span>
                        )}
                      </label>

                      {/* Select/Checkbox Filter */}
                      {(filter.type === 'select' || filter.type === 'checkbox' || filter.type === 'multiselect') && (
                        <div className="space-y-2">
                          <select
                            value={isCustomValue ? '__custom__' : (productAttributes[filter.id] || '')}
                            onChange={(e) => {
                              if (e.target.value === '__custom__') {
                                setProductAttributes({
                                  ...productAttributes,
                                  [filter.id]: '__custom__',
                                  [`${filter.id}_custom`]: ''
                                });
                              } else {
                                const newAttrs = { ...productAttributes };
                                delete newAttrs[`${filter.id}_custom`];
                                setProductAttributes({
                                  ...newAttrs,
                                  [filter.id]: e.target.value
                                });
                              }
                            }}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select {filter.label}</option>
                            {filter.options?.map((option: any) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                            <option value="__custom__">➕ Add custom value...</option>
                          </select>

                          {/* Custom Value Input */}
                          {isCustomValue && (
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={productAttributes[`${filter.id}_custom`] || ''}
                                onChange={(e) => setProductAttributes({
                                  ...productAttributes,
                                  [`${filter.id}_custom`]: e.target.value
                                })}
                                placeholder={`Enter custom ${filter.label.toLowerCase()}`}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newAttrs = { ...productAttributes };
                                  delete newAttrs[filter.id];
                                  delete newAttrs[`${filter.id}_custom`];
                                  setProductAttributes(newAttrs);
                                }}
                                className="px-3 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded-lg"
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Range Filter */}
                      {filter.type === 'range' && (
                        <div className="space-y-2">
                          <input
                            type="number"
                            value={productAttributes[filter.id] || filter.min || 0}
                            onChange={(e) => setProductAttributes({
                              ...productAttributes,
                              [filter.id]: parseInt(e.target.value) || 0
                            })}
                            min={filter.min || 0}
                            max={filter.max || 1000}
                            step={filter.step || 1}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <p className="text-xs text-gray-500">
                            Range: {filter.min} - {filter.max}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <p className="text-xs text-yellow-800">
                    💡 <strong>Tip:</strong> Filling in these attributes makes your product easier to find when customers use filters!
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  onFocus={(e) => e.target.value === '0' && setFormData({ ...formData, price: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compare At Price
                </label>
                <input
                  type="number"
                  value={formData.compareAtPrice}
                  onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                  onFocus={(e) => e.target.value === '0' && setFormData({ ...formData, compareAtPrice: '' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Physical Product Specific Fields */}
            {productType === 'physical' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
                    onFocus={(e) => e.target.value === '0' && setFormData({ ...formData, stockQuantity: '' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    placeholder="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Auto-generated"
                      required
                    />
                    <button
                      type="button"
                      onClick={generateSKU}
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      title="Generate new SKU"
                    >
                      🔄
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Auto-generated with vendor prefix</p>
                </div>
              </div>
            )}

            {/* Booking Product Specific Fields */}
            {productType === 'booking' && (
              <div className="space-y-6 border-t pt-6">
                <h3 className="text-lg font-semibold">Booking Configuration</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Booking Type *
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {DURATION_UNITS.map((unit) => (
                      <button
                        key={unit.value}
                        type="button"
                        onClick={() => {
                          setBookingData({ 
                            ...bookingData, 
                            durationUnit: unit.value as 'hours' | 'days' | 'sessions',
                            duration: unit.value === 'days' ? 1440 : unit.value === 'hours' ? 60 : 60
                          });
                        }}
                        className={`p-4 border-2 rounded-lg text-left ${
                          bookingData.durationUnit === unit.value
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <div className="font-semibold">{unit.label}</div>
                        <div className="text-xs text-gray-600 mt-1">{unit.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {bookingData.durationUnit === 'days' 
                        ? 'Duration (days) *' 
                        : bookingData.durationUnit === 'hours'
                        ? 'Duration (hours) *'
                        : 'Duration (minutes) *'}
                    </label>
                    <input
                      type="number"
                      value={
                        bookingData.durationUnit === 'days' 
                          ? Math.floor(bookingData.duration / 1440)
                          : bookingData.durationUnit === 'hours'
                          ? Math.floor(bookingData.duration / 60)
                          : bookingData.duration
                      }
                      onChange={(e) => {
                        const value = e.target.value === '' ? '' : parseInt(e.target.value);
                        if (value === '') {
                          setBookingData({ ...bookingData, duration: 0 });
                        } else {
                          const minutes = bookingData.durationUnit === 'days'
                            ? value * 1440
                            : bookingData.durationUnit === 'hours'
                            ? value * 60
                            : value;
                          setBookingData({ ...bookingData, duration: minutes });
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      min={bookingData.durationUnit === 'days' ? '1' : bookingData.durationUnit === 'hours' ? '1' : '15'}
                      step={bookingData.durationUnit === 'days' ? '1' : bookingData.durationUnit === 'hours' ? '1' : '15'}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {bookingData.durationUnit === 'days' 
                        ? 'Full day(s) booking' 
                        : bookingData.durationUnit === 'hours'
                        ? 'Hourly slot duration'
                        : 'Session duration'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {bookingData.durationUnit === 'days' 
                        ? 'Minimum Days' 
                        : 'Buffer Time (minutes)'}
                    </label>
                    <input
                      type="number"
                      value={bookingData.bufferTime}
                      onChange={(e) => setBookingData({ ...bookingData, bufferTime: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      min="0"
                      step={bookingData.durationUnit === 'days' ? '1' : '15'}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {bookingData.durationUnit === 'days' 
                        ? 'Minimum booking period' 
                        : 'Gap between bookings (cleanup/setup)'}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Available Days *
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setBookingData({ ...bookingData, availableDays: [...DAYS] })}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Select All
                      </button>
                      <span className="text-xs text-gray-400">|</span>
                      <button
                        type="button"
                        onClick={() => setBookingData({ ...bookingData, availableDays: [] })}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {DAYS.map((day) => (
                      <label
                        key={day}
                        className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={bookingData.availableDays.includes(day)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setBookingData({
                                ...bookingData,
                                availableDays: [...bookingData.availableDays, day],
                              });
                            } else {
                              setBookingData({
                                ...bookingData,
                                availableDays: bookingData.availableDays.filter((d) => d !== day),
                              });
                            }
                          }}
                          className="rounded"
                        />
                        <span className="text-sm capitalize">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Operating Hours (24-hour format)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setBookingData({
                          ...bookingData,
                          timeSlots: [{ start: '00:00', end: '23:59' }],
                        });
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
                    >
                      Set Full Day (00:00 - 23:59)
                    </button>
                  </div>
                  {bookingData.timeSlots.map((slot, index) => (
                    <div key={index} className="flex gap-4 mb-2 items-center">
                      <input
                        type="time"
                        value={slot.start}
                        onChange={(e) => {
                          const newSlots = [...bookingData.timeSlots];
                          newSlots[index].start = e.target.value;
                          setBookingData({ ...bookingData, timeSlots: newSlots });
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                        step="3600"
                      />
                      <span className="py-2 text-gray-500">to</span>
                      <input
                        type="time"
                        value={slot.end}
                        onChange={(e) => {
                          const newSlots = [...bookingData.timeSlots];
                          newSlots[index].end = e.target.value;
                          setBookingData({ ...bookingData, timeSlots: newSlots });
                        }}
                        className="px-4 py-2 border border-gray-300 rounded-lg"
                        step="3600"
                      />
                      {bookingData.timeSlots.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newSlots = bookingData.timeSlots.filter((_, i) => i !== index);
                            setBookingData({ ...bookingData, timeSlots: newSlots });
                          }}
                          className="text-red-600 hover:text-red-800 px-2"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setBookingData({
                        ...bookingData,
                        timeSlots: [...bookingData.timeSlots, { start: '09:00', end: '17:00' }],
                      });
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add Time Range
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Time slots are in 24-hour format (e.g., 09:00 for 9 AM, 18:00 for 6 PM)
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <MultiImageUpload
              label="Product Images"
              value={formData.images}
              onChange={(urls) => {
                setFormData({ ...formData, images: urls });
                // Auto-set featured image to first image if not set
                if (!formData.featuredImage && urls.length > 0) {
                  setFormData(prev => ({ ...prev, featuredImage: urls[0] }));
                }
              }}
              maxImages={10}
            />

            <ImageUpload
              label="Featured Image (Optional - uses first product image if not set)"
              value={formData.featuredImage}
              onChange={(url) => setFormData({ ...formData, featuredImage: url })}
            />

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Product'}
              </button>
              <Link
                href="/vendor/products"
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
