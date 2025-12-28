'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import UnifiedHeader from '@/components/UnifiedHeader';
import CategorySidebar from '@/components/CategorySidebar';
import ImageUpload from '@/components/ImageUpload';
import MultiImageUpload from '@/components/MultiImageUpload';
import ProductVariationBuilder from '@/components/ProductVariationBuilder';
import { getVendorId, getUserId, isSuperAdmin, getProductVendorId } from '@/lib/auth';

export default function VendorAddProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Array<{ id: string; name: string; level: number; parentId: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [productType, setProductType] = useState<'physical' | 'booking'>('physical');
  
  // Category filters and product attributes
  const [categoryFilters, setCategoryFilters] = useState<any[]>([]);
  const [productAttributes, setProductAttributes] = useState<Record<string, any>>({});
  
  // Product variations
  const [hasVariations, setHasVariations] = useState(false);
  const [variations, setVariations] = useState<any[]>([]);
  const [variationThemes, setVariationThemes] = useState<string[]>([]);
  
  // Help section
  const [showHelp, setShowHelp] = useState(false);
  
  // Import/Export functionality
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Prevent hydration errors
  const [mounted, setMounted] = useState(false);

  // Filter out attributes used in variations
  const availableAttributeFilters = useMemo(() => {
    const filtered = categoryFilters.filter(
      (filter) => !variationThemes.includes(filter.id)
    );
    console.log('Variation themes:', variationThemes);
    console.log('Category filters:', categoryFilters.map(f => f.id));
    console.log('Available attribute filters:', filtered.map(f => f.id));
    return filtered;
  }, [categoryFilters, variationThemes]);
  
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
    setMounted(true);
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
    const isAdmin = isSuperAdmin();
    const prefix = isAdmin ? 'ADMIN' : getVendorId()?.substring(0, 8).toUpperCase() || 'VENDOR';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    setFormData(prev => ({ ...prev, sku: `${prefix}-${timestamp}-${random}` }));
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
      
      if (!token) {
        alert('Please login first');
        return;
      }

      const vendorId = getProductVendorId();
      if (!vendorId) {
        alert(isSuperAdmin() ? 'User ID not found' : 'Vendor ID not found');
        return;
      }

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
        vendorId,
        productType,
      };

      // Add variations if present
      if (hasVariations && variations.length > 0) {
        productData.variations = variations;
        productData.variationThemes = variationThemes;
        // For parent products with variations, don't require stock
        productData.stockQuantity = 0;
      }

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
        router.push(isSuperAdmin() ? '/admin/products' : '/vendor/products');
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

  const handleExport = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('token');
      
      const vendorId = getVendorId();
      if (!vendorId) {
        alert('Vendor ID not found');
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/export-zip/${vendorId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products-${vendorId}-${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to export products');
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export products');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setImportMessage(null);
      
      const token = localStorage.getItem('token');
      
      const vendorId = getVendorId();
      if (!vendorId) {
        setImportMessage({ type: 'error', text: 'Vendor ID not found' });
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/import-zip/${vendorId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      const result = await response.json();

      if (response.ok) {
        setImportMessage({
          type: 'success',
          text: `Import successful! Created: ${result.created}, Updated: ${result.updated}${
            result.errors.length > 0 ? `, Errors: ${result.errors.length}` : ''
          }`,
        });
        // Optionally redirect to products list after successful import
        setTimeout(() => {
          router.push('/vendor/products');
        }, 2000);
      } else {
        setImportMessage({
          type: 'error',
          text: result.message || 'Failed to import products',
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportMessage({ type: 'error', text: 'Failed to import products' });
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <UnifiedHeader showLocationFilter={false} /> */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* <CategorySidebar /> */}
          <div className="flex-1 max-w-4xl">
            <Link
              href={mounted && isSuperAdmin() ? '/admin/products' : '/vendor/products'}
              className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
            >
              ← Back to Products
            </Link>
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Product</h1>
              <p className="text-gray-600 mt-2">
                {mounted ? (isSuperAdmin() 
                  ? 'Create and publish new products to the marketplace' 
                  : 'Showcase your products and grow your business')
                  : 'Showcase your products and grow your business'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {exporting ? 'Exporting...' : '📥 Export to ZIP'}
              </button>
              <label className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 cursor-pointer text-sm">
                {importing ? 'Importing...' : '📤 Import from ZIP'}
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleImport}
                  disabled={importing}
                  className="hidden"
                />
              </label>
            </div>
          </div>
          {importMessage && (
            <div className={`mt-4 p-4 rounded-lg ${
              importMessage.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {importMessage.text}
            </div>
          )}
        </div>
        <div className="mb-8">
          
          {/* Help Toggle Button */}
          <button
            type="button"
            onClick={() => setShowHelp(!showHelp)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
          >
            <span className="text-xl">💡</span>
            <span className="font-medium">{showHelp ? 'Hide' : 'Show'} Beginner's Guide</span>
          </button>
        </div>

        {/* Comprehensive Help Section */}
        {showHelp && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-8 border-2 border-blue-200">
            <div className="flex items-start gap-3 mb-6">
              <span className="text-4xl">📚</span>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Product Creation Guide</h2>
                <p className="text-gray-600">Follow this step-by-step guide to add your first product</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Basic Product Guide */}
              <div className="bg-white rounded-lg p-6 shadow">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">📦</span>
                  Creating a Basic Product
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    <div>
                      <strong>Product Name:</strong> Give your product a clear, descriptive name (e.g., "Men's Cotton T-Shirt" not just "T-Shirt")
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">2.</span>
                    <div>
                      <strong>Description:</strong> Write detailed information about your product. Include material, features, care instructions, etc.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">3.</span>
                    <div>
                      <strong>Categories:</strong> Select the most specific category. Parent categories are auto-selected.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">4.</span>
                    <div>
                      <strong>Price:</strong> Set your selling price. Add "Compare At Price" to show discounts.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">5.</span>
                    <div>
                      <strong>SKU:</strong> Auto-generated unique code for your product. You can customize it.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">6.</span>
                    <div>
                      <strong>Stock:</strong> Enter how many items you have available.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">7.</span>
                    <div>
                      <strong>Images:</strong> Upload clear, high-quality product photos. First image is your main image.
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Variations Guide */}
              <div className="bg-white rounded-lg p-6 shadow">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">🎨</span>
                  Creating Products with Variations
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                    <strong>What are variations?</strong> Use when your product comes in different colors, sizes, or styles - each with separate stock and possibly different prices.
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    <div>
                      <strong>Select Category:</strong> Choose a category that has attributes like "Color" or "Size" configured.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">2.</span>
                    <div>
                      <strong>Enable Variations:</strong> Check the "This product has multiple options" checkbox.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">3.</span>
                    <div>
                      <strong>Select Variation Types:</strong> Choose which attributes to use (e.g., Color + Size).
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">4.</span>
                    <div>
                      <strong>Pick Options:</strong> Select specific values (e.g., Red, Blue, Black for color; S, M, L for size).
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">5.</span>
                    <div>
                      <strong>Auto-Generation:</strong> System creates all combinations automatically (e.g., Red-S, Red-M, Blue-S, etc.).
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">6.</span>
                    <div>
                      <strong>Set Stock & Prices:</strong> For each variation, enter stock quantity. Adjust prices if needed (e.g., XL size costs more).
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded p-3 mt-3">
                    <strong>💡 Example:</strong> T-shirt in 3 colors × 4 sizes = 12 variations total
                  </div>
                </div>
              </div>

              {/* Product Attributes Guide */}
              <div className="bg-white rounded-lg p-6 shadow">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">🏷️</span>
                  Product Attributes (Filters)
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <p>
                    <strong>What are attributes?</strong> These help customers filter and find products easily.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <div><strong>Single-Value Attributes:</strong> Brand, Material, Style - used for filtering only</div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-green-600">✓</span>
                      <div><strong>Variation Attributes:</strong> Color, Size - used to create different product options</div>
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded p-3 mt-3">
                    <strong>💡 Tip:</strong> Fill in attributes even for basic products - it makes them easier to find!
                  </div>
                </div>
              </div>

              {/* Common Mistakes */}
              <div className="bg-white rounded-lg p-6 shadow">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">⚠️</span>
                  Common Mistakes to Avoid
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <span className="text-red-600">✗</span>
                    <div>Creating separate products for each color/size (use variations instead!)</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600">✗</span>
                    <div>Using generic names like "Product 1" or "Item"</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600">✗</span>
                    <div>Forgetting to add product images</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600">✗</span>
                    <div>Not setting stock quantity (shows as out of stock)</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600">✗</span>
                    <div>Skipping product description (customers need details!)</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600">✗</span>
                    <div>Not selecting the right category (affects visibility)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="mt-6 bg-white rounded-lg p-6 shadow">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                Quick Tips for Success
              </h3>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 text-xl">✓</span>
                  <div>
                    <strong>Use high-quality images:</strong> Clear, well-lit photos sell better
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 text-xl">✓</span>
                  <div>
                    <strong>Write detailed descriptions:</strong> Answer questions before customers ask
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 text-xl">✓</span>
                  <div>
                    <strong>Competitive pricing:</strong> Research similar products' prices
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 text-xl">✓</span>
                  <div>
                    <strong>Accurate stock:</strong> Keep inventory numbers up to date
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 text-xl">✓</span>
                  <div>
                    <strong>Use variations wisely:</strong> Great for similar items with different options
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 text-xl">✓</span>
                  <div>
                    <strong>Regular updates:</strong> Add new photos, update descriptions as needed
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
                <span className="ml-2 text-xs font-normal text-gray-500">💡 Be descriptive and specific</span>
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
                <span className="ml-2 text-xs font-normal text-gray-500">💡 Include features, materials, care instructions</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                placeholder="Example: This premium cotton t-shirt is made from 100% organic cotton. Features include a comfortable crew neck, reinforced stitching, and pre-shrunk fabric. Machine washable."
                required
              />
              <p className="text-xs text-gray-500 mt-1">💡 Tip: Good descriptions answer: What is it? What's it made of? How to use/care for it?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
                <span className="ml-2 text-xs font-normal text-gray-500">💡 Choose the most specific category</span>
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
              <p className="text-xs text-blue-600 mt-1">ℹ️ Categories with attributes (like Color, Size) enable product variations feature</p>
            </div>

            {/* NEW: Dynamic Product Attributes Based on Category */}
            {productType === 'physical' && availableAttributeFilters.length > 0 && (
              <div className="border-t pt-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    📋 Product Attributes
                  </h3>
                  <p className="text-sm text-blue-700">
                    {hasVariations && variationThemes.length > 0 ? (
                      <>
                        Fill in attributes that apply to <strong>all variations</strong> (like Brand, Material, Origin).
                        Variation-specific attributes ({variationThemes.map(id => 
                          categoryFilters.find(f => f.id === id)?.label || id
                        ).join(', ')}) are handled in the variation builder above.
                      </>
                    ) : (
                      <>
                        Fill in attributes like{' '}
                        <strong>
                          {availableAttributeFilters
                            .map(f => f.label)
                            .slice(0, 3)
                            .join(', ')}
                        </strong>
                        {availableAttributeFilters.length > 3 && ', etc.'} to help customers filter and find your product easily.
                      </>
                    )}
                  </p>
                </div>

                {availableAttributeFilters.map((filter) => {
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
                    💡 <strong>Tip:</strong> {hasVariations 
                      ? 'These attributes apply to all variations. Variation-specific details are set in the builder above.' 
                      : 'Filling in these attributes makes your product easier to find when customers use filters!'}
                  </p>
                </div>
              </div>
            )}

            {/* Variations Not Available Message */}
            {productType === 'physical' && categoryFilters.length === 0 && formData.categoryIds.length > 0 && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">ℹ️</span>
                  <div className="text-sm text-amber-900">
                    <strong className="block mb-1">Product Variations Not Available</strong>
                    <p>The selected category doesn't have attributes configured yet (like Color, Size, etc.).</p>
                    <p className="mt-2">
                      <strong>To use variations:</strong> Select a category that has filter attributes, or contact admin to add attributes to this category.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Product Variations Section */}
            {productType === 'physical' && categoryFilters.length > 0 && (
              <div className="border-t pt-6">
                <div className="mb-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasVariations}
                      onChange={(e) => {
                        setHasVariations(e.target.checked);
                        if (!e.target.checked) {
                          setVariations([]);
                          setVariationThemes([]);
                        }
                      }}
                      className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-lg font-semibold text-gray-900">
                        This product has multiple options (like colors or sizes)
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        Enable this to create variations with different attributes, prices, and stock levels
                      </p>
                    </div>
                  </label>
                </div>

                {/* Inline Help for Variations */}
                {hasVariations && (
                  <div className="mb-4 bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">ℹ️</span>
                      <div className="text-sm text-blue-900">
                        <strong className="block mb-2">How Product Variations Work:</strong>
                        <ol className="list-decimal list-inside space-y-1">
                          <li><strong>Select variation types</strong> below (e.g., Color, Size)</li>
                          <li><strong>Choose specific options</strong> for each type (e.g., Red, Blue for colors)</li>
                          <li><strong>System auto-generates</strong> all combinations (e.g., Red-S, Red-M, Blue-S, Blue-M)</li>
                          <li><strong>Set stock and prices</strong> for each variation individually</li>
                          <li><strong>No need to set base stock</strong> - each variation has its own inventory</li>
                        </ol>
                        <p className="mt-2 text-blue-800">
                          <strong>💡 Example:</strong> A shirt with 3 colors × 4 sizes = 12 separate products (variations) created automatically!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {hasVariations && (
                  <ProductVariationBuilder
                    categoryFilters={categoryFilters}
                    basePrice={parseFloat(formData.price) || 0}
                    baseSKU={formData.sku}
                    productName={formData.name}
                    onVariationsChange={setVariations}
                    onVariationThemesChange={(themes) => {
                      console.log('Parent received variation themes:', themes);
                      setVariationThemes(themes);
                    }}
                  />
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price *
                  <span className="ml-2 text-xs font-normal text-gray-500">💡 Your selling price</span>
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
                <p className="text-xs text-gray-500 mt-1">💰 Set competitive pricing based on market research</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compare At Price
                  <span className="ml-2 text-xs font-normal text-gray-500">💡 Original price (for showing discounts)</span>
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
                <p className="text-xs text-gray-500 mt-1">🏷️ Optional: Shows "X% OFF" badge if higher than price</p>
              </div>
            </div>

            {/* Physical Product Specific Fields */}
            {productType === 'physical' && (
              <div className="grid grid-cols-2 gap-4">
                {/* Hide stock quantity when variations are enabled */}
                {!hasVariations && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Quantity *
                      <span className="ml-2 text-xs font-normal text-gray-500">💡 How many do you have?</span>
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
                    <p className="text-xs text-gray-500 mt-1">📦 Available inventory. Shows "Out of Stock" if 0</p>
                  </div>
                )}

                <div className={hasVariations ? 'col-span-2' : ''}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU {hasVariations ? '(Base)' : '*'}
                    <span className="ml-2 text-xs font-normal text-gray-500">💡 Unique product code</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Auto-generated"
                      required={!hasVariations}
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
                  <p className="text-xs text-gray-500 mt-1">
                    {hasVariations 
                      ? '📦 Base SKU for variation generation (e.g., SHIRT-BASE → SHIRT-RED-S, SHIRT-BLUE-M)' 
                      : (mounted && isSuperAdmin() ? 'Auto-generated with ADMIN prefix' : 'Auto-generated with vendor prefix')}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">ℹ️ What's a SKU? It's like a barcode - a unique ID to track this product</p>
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
                href={mounted && isSuperAdmin() ? '/admin/products' : '/vendor/products'}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}
