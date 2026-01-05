'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeRenderer from '@/components/ThemeRenderer';
import CategorySidebar from '@/components/CategorySidebar';
import ImageUpload from '@/components/ImageUpload';
import MultiImageUpload from '@/components/MultiImageUpload';
import { getCurrencySymbol } from '@/lib/currency';
import { getVendorId } from '@/lib/auth';

interface Product {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  status: string;
  sku: string;
  featuredImage?: string;
  images?: string[];
  productType: 'physical' | 'booking';
  categories?: Array<{ id: string; name: string }>;
  // Variation support
  isParent?: boolean;
  parentProductId?: string;
  variations?: Product[];
  variationAttributes?: Record<string, string>;
  variationThemes?: string[];
  attributes?: {
    booking?: {
      duration: number;
      durationUnit: 'hours' | 'days' | 'sessions';
      bufferTime: number;
      availableDays: string[];
      timeSlots: Array<{ start: string; end: string }>;
    };
  };
}

export default function VendorProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; level: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currency, setCurrency] = useState('INR');
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  
  // Filtering and sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [editFormData, setEditFormData] = useState({
    name: '',
    price: 0,
    compareAtPrice: 0,
    stockQuantity: 0,
    sku: '',
    featuredImage: '',
    images: [] as string[],
    productType: 'physical' as 'physical' | 'booking',
    categoryIds: [] as string[],
    hasVariants: false,
    variations: [] as any[],
    variationThemes: [] as string[],
    attributes: {
      booking: {
        duration: 60,
        durationUnit: 'hours' as 'hours' | 'days' | 'sessions',
        bufferTime: 0,
        availableDays: [] as string[],
        timeSlots: [{ start: '09:00', end: '17:00' }],
      },
    },
  });

  useEffect(() => {
    // Fetch currency setting
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/currency`)
      .then(res => res.json())
      .then(data => {
        setCurrency(data.value || 'INR');
      })
      .catch(err => console.error('Error fetching currency setting:', err));
    
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/tree/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const flattenedCategories = flattenCategories(data);
        setCategories(flattenedCategories);
      }
    } catch (error) {
      // Error handling
    }
  };

  const flattenCategories = (categories: any[], level = 0): Array<{ id: string; name: string; level: number }> => {
    let result: Array<{ id: string; name: string; level: number }> = [];
    
    categories.forEach((category) => {
      result.push({ id: category.id, name: category.name, level });
      
      if (category.children && category.children.length > 0) {
        result = result.concat(flattenCategories(category.children, level + 1));
      }
    });
    
    return result;
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return;
      }

      const vendorId = getVendorId();
      if (!vendorId) {
        console.error('No vendorId found');
        return;
      }
      
      // Fetch products for this vendor
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?vendorId=${vendorId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(Array.isArray(data) ? data : data.products || []);
      }
    } catch (error) {
      // Error handling
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (product: Product) => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch full product details with variations
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${product.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const fullProduct = await response.json();
        setEditingProduct(fullProduct);
        setEditFormData({
          name: fullProduct.name,
          price: fullProduct.price,
          compareAtPrice: fullProduct.compareAtPrice || 0,
          stockQuantity: fullProduct.stockQuantity,
          sku: fullProduct.sku,
          featuredImage: fullProduct.featuredImage || '',
          images: fullProduct.images || [],
          productType: fullProduct.productType || 'physical',
          categoryIds: fullProduct.categories?.map((c: any) => c.id) || [],
          hasVariants: fullProduct.isParent || false,
          variations: fullProduct.variations || [],
          variationThemes: fullProduct.variationThemes || [],
          attributes: {
            booking: {
              duration: fullProduct.attributes?.booking?.duration || 60,
              durationUnit: fullProduct.attributes?.booking?.durationUnit || 'hours',
              bufferTime: fullProduct.attributes?.booking?.bufferTime || 0,
              availableDays: fullProduct.attributes?.booking?.availableDays || [],
              timeSlots: fullProduct.attributes?.booking?.timeSlots || [{ start: '09:00', end: '17:00' }],
            },
          },
        });
      } else {
        // Fallback to the product data we already have
        setEditingProduct(product);
        setEditFormData({
          name: product.name,
          price: product.price,
          compareAtPrice: product.compareAtPrice || 0,
          stockQuantity: product.stockQuantity,
          sku: product.sku,
          featuredImage: product.featuredImage || '',
          images: product.images || [],
          productType: product.productType || 'physical',
          categoryIds: product.categories?.map(c => c.id) || [],
          hasVariants: product.isParent || false,
          variations: product.variations || [],
          variationThemes: product.variationThemes || [],
          attributes: {
            booking: {
              duration: product.attributes?.booking?.duration || 60,
              durationUnit: product.attributes?.booking?.durationUnit || 'hours',
              bufferTime: product.attributes?.booking?.bufferTime || 0,
              availableDays: product.attributes?.booking?.availableDays || [],
              timeSlots: product.attributes?.booking?.timeSlots || [{ start: '09:00', end: '17:00' }],
            },
          },
        });
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      // Fallback to the product data we already have
      setEditingProduct(product);
      setEditFormData({
        name: product.name,
        price: product.price,
        compareAtPrice: product.compareAtPrice || 0,
        stockQuantity: product.stockQuantity,
        sku: product.sku,
        featuredImage: product.featuredImage || '',
        images: product.images || [],
        productType: product.productType || 'physical',
        categoryIds: product.categories?.map(c => c.id) || [],
        hasVariants: product.isParent || false,
        variations: product.variations || [],
        variationThemes: product.variationThemes || [],
        attributes: {
          booking: {
            duration: product.attributes?.booking?.duration || 60,
            durationUnit: product.attributes?.booking?.durationUnit || 'hours',
            bufferTime: product.attributes?.booking?.bufferTime || 0,
            availableDays: product.attributes?.booking?.availableDays || [],
            timeSlots: product.attributes?.booking?.timeSlots || [{ start: '09:00', end: '17:00' }],
          },
        },
      });
    }
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    try {
      const token = localStorage.getItem('token');
      
      // Update main product
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        alert(`Failed to update product: ${error.message || 'Unknown error'}`);
        return;
      }

      // If product has variants, update each variant
      if (editFormData.hasVariants && editFormData.variations && editFormData.variations.length > 0) {
        for (const variant of editFormData.variations) {
          if (variant.id) {
            const variantResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${variant.id}`, {
              method: 'PATCH',
              headers: { 
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                sku: variant.sku,
                price: variant.price,
                compareAtPrice: variant.compareAtPrice,
                stockQuantity: variant.stockQuantity,
              }),
            });
            
            if (!variantResponse.ok) {
              console.error(`Failed to update variant ${variant.id}`);
            }
          }
        }
      }
      
      alert('Product updated successfully!');
      setEditingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update product. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditFormData({
      name: '',
      price: 0,
      compareAtPrice: 0,
      stockQuantity: 0,
      sku: '',
      featuredImage: '',
      images: [],
      productType: 'physical',
      categoryIds: [],
      hasVariants: false,
      variations: [],
      variationThemes: [],
      attributes: {
        booking: {
          duration: 60,
          durationUnit: 'hours',
          bufferTime: 0,
          availableDays: [],
          timeSlots: [{ start: '09:00', end: '17:00' }],
        },
      },
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        alert('Product deleted successfully!');
        fetchProducts();
      } else {
        const error = await response.json();
        alert(`Failed to delete product: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to delete product. Please try again.');
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
        fetchProducts();
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

  // Filter and sort products
  const filteredAndSortedProducts = products
    .filter((product) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !product.name.toLowerCase().includes(query) &&
          !product.sku.toLowerCase().includes(query)
        ) {
          return false;
        }
      }
      // Status filter
      if (statusFilter !== 'all' && product.status !== statusFilter) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'all' && product.productType !== typeFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'all') {
        if (!product.categories?.some(c => c.id === categoryFilter)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'stock':
          comparison = a.stockQuantity - b.stockQuantity;
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleSort = (field: 'name' | 'price' | 'stock') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ThemeRenderer component="header" showLocationFilter={false} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* <CategorySidebar /> */}
          <div className="flex-1 max-w-7xl">
        <div className="mb-8">
          <Link
            href="/vendor/dashboard"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Products</h1>
              <p className="text-gray-600 mt-2">Manage your product catalog</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                disabled={exporting || products.length === 0}
                className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {exporting ? 'Exporting...' : '📥 Export to ZIP'}
              </button>
              <label className="bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 cursor-pointer">
                {importing ? 'Importing...' : '📤 Import from ZIP'}
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleImport}
                  disabled={importing}
                  className="hidden"
                />
              </label>
              <Link
                href="/vendor/products/add"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                + Add Product
              </Link>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg mb-6">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">ℹ️</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Need Help?</h3>
                <p className="text-sm text-gray-600">Learn how to add, import, and export products</p>
              </div>
            </div>
            <svg
              className={`w-6 h-6 text-gray-600 transition-transform ${showHelp ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showHelp && (
            <div className="px-6 pb-6 space-y-6">
              {/* Add Product Help */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">➕</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Add Product</h4>
                    <p className="text-gray-700 mb-3">
                      Click the <strong>"+ Add Product"</strong> button to create a new product in your catalog.
                    </p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><strong>Physical Products:</strong> Regular items with inventory tracking (e.g., clothing, electronics, books)</p>
                      <p><strong>Booking Products:</strong> Services or rentals with time slots (e.g., meeting rooms, sports courts, appointments)</p>
                    </div>
                    <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">Required Information:</p>
                      <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li>Product name and description</li>
                        <li>Price and optional compare-at price</li>
                        <li>SKU (Stock Keeping Unit)</li>
                        <li>Images (featured image + additional gallery images)</li>
                        <li>Category selection</li>
                        <li>For booking products: duration, available days, and time slots</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Help */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📥</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Export Products</h4>
                    <p className="text-gray-700 mb-3">
                      Click <strong>"📥 Export to ZIP"</strong> to download all your products and their images as a ZIP file.
                    </p>
                    <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
                      <p className="text-sm font-medium text-gray-700 mb-2">What's included:</p>
                      <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                        <li><strong>products.xlsx</strong> - Excel file with all product data organized by category (one sheet per category)</li>
                        <li><strong>images/</strong> - Flat folder with all product images (image1.jpg, image2.png, etc.)</li>
                        <li><strong>Instructions sheet</strong> - Built-in help on how to edit and re-import the Excel file</li>
                      </ul>
                      <p className="text-sm text-gray-600 mt-3">
                        <strong>Use cases:</strong> Backup your catalog, bulk edit products in Excel, or migrate to another system
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Import Help */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📤</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Import Products</h4>
                    <p className="text-gray-700 mb-3">
                      Click <strong>"📤 Import from ZIP"</strong> to upload a ZIP file containing an Excel file with products and images.
                    </p>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">ZIP Structure Required:</p>
                        <div className="text-sm text-gray-600 font-mono bg-white p-3 rounded border border-gray-300">
                          products.zip<br />
                          ├── products.xlsx&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;← Excel file with all products<br />
                          └── images/<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;├── image1.jpg<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;├── image2.png<br />
                          &nbsp;&nbsp;&nbsp;&nbsp;└── image3.webp&nbsp;&nbsp;&nbsp;← All images in flat folder
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Note: Images folder is flat - all images at the same level, not grouped by product
                        </p>
                      </div>

                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">Excel File Format:</p>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                          <li>Products organized by category (one sheet per category)</li>
                          <li>Columns: Product Name, Description, Images (comma-separated filenames), Price, Stock, Status, etc.</li>
                          <li>Category-specific attributes (Size, Color, Brand, etc.) shown as columns</li>
                          <li>Hidden _ID column tracks existing products for updates</li>
                          <li>Instructions sheet included with detailed help</li>
                        </ul>
                      </div>

                      <div className="p-3 bg-amber-50 rounded border border-amber-200">
                        <p className="text-sm font-medium text-amber-800 mb-2">⚠️ Important Notes:</p>
                        <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                          <li>Products with existing _ID will be <strong>updated</strong></li>
                          <li>Products without _ID (new rows) will be <strong>created</strong></li>
                          <li>In Images column, list filenames separated by commas (e.g., "photo1.jpg, photo2.png")</li>
                          <li>Images must be in the images/ folder with matching filenames</li>
                          <li>Supported formats: JPG, PNG, WEBP, GIF (max 5MB each)</li>
                          <li>Invalid entries will be skipped with error messages</li>
                        </ul>
                      </div>

                      <div className="p-3 bg-green-50 rounded border border-green-200">
                        <p className="text-sm font-medium text-green-800 mb-2">💡 Pro Tips:</p>
                        <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                          <li><strong>Export first</strong> to get the correct Excel format and existing images</li>
                          <li>Edit the Excel file - add/update products, change prices, etc.</li>
                          <li>Add new images to the images/ folder</li>
                          <li>Reference new images in the Images column using just the filename</li>
                          <li>Keep the ZIP structure intact when re-importing</li>
                          <li>Check the Instructions sheet in Excel for detailed editing guide</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-5 border border-purple-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>💡</span> Quick Tips
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Use unique SKUs for each product</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Add high-quality images for better sales</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Regular exports create automatic backups</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Test imports with a few products first</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Use categories to organize your products</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Set compare-at prices to show discounts</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Product name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="physical">Physical</option>
                <option value="booking">Booking</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {'  '.repeat(cat.level)}
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'stock')}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="stock">Stock</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                >
                  {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Results count */}
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredAndSortedProducts.length} of {products.length} products
          </div>
        </div>

        {importMessage && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              importMessage.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}
          >
            {importMessage.text}
            <button
              onClick={() => setImportMessage(null)}
              className="ml-4 text-sm underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">
              {products.length === 0 ? 'No products yet' : 'No products match your filters'}
            </p>
            {products.length === 0 ? (
              <Link
                href="/vendor/products/add"
                className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Add Your First Product
              </Link>
            ) : (
              <p className="text-gray-400 text-sm">Try adjusting your search or filter criteria</p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      Product {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('price')}
                    >
                      Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('stock')}
                    >
                      Stock {sortBy === 'stock' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredAndSortedProducts.map((product: any) => (
                    <tr key={product.id} className="hover:bg-gray-50 border-b border-gray-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {(product.images?.[0] || product.featuredImage) ? (
                            <img
                              src={(product.images?.[0] || product.featuredImage)?.startsWith('http') 
                                ? (product.images?.[0] || product.featuredImage)
                                : `${process.env.NEXT_PUBLIC_API_URL}${product.images?.[0] || product.featuredImage}`
                              }
                              alt={product.name}
                              className="h-10 w-10 rounded object-cover mr-3"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-gray-200 rounded mr-3 flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No img</span>
                            </div>
                          )}
                          <div className="max-w-xs">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {product.name}
                              {product.isParent && product.variations && (
                                <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                                  {product.variations.length} variants
                                </span>
                              )}
                              {product.parentProductId && (
                                <span className="ml-2 text-xs text-gray-500">
                                  (Variant)
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">{product.slug}</div>
                            {product.variationAttributes && (
                              <div className="text-xs text-gray-600 mt-0.5">
                                {Object.entries(product.variationAttributes).map(([key, value]) => (
                                  <span key={key} className="mr-2">
                                    {key}: <strong>{String(value)}</strong>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                          product.productType === 'booking' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {product.productType === 'booking' ? '📅 Booking' : '📦 Physical'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {product.categories?.[0]?.name || 'Uncategorized'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          {getCurrencySymbol(currency)}{Number(product.price).toFixed(2)}
                          {product.productType === 'booking' && product.attributes?.booking?.durationUnit && (
                            <span className="text-xs font-normal text-gray-600">
                              /{product.attributes.booking.durationUnit === 'hours' ? 'hr' : product.attributes.booking.durationUnit === 'days' ? 'day' : 'session'}
                            </span>
                          )}
                        </div>
                        {product.compareAtPrice && (
                          <div className="text-xs text-gray-500 line-through">
                            {getCurrencySymbol(currency)}{Number(product.compareAtPrice).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${
                          product.stockQuantity === 0 
                            ? 'text-red-600 font-semibold' 
                            : product.stockQuantity < 10 
                            ? 'text-orange-600 font-semibold' 
                            : 'text-green-600'
                        }`}>
                          {product.stockQuantity || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 text-xs rounded-full font-semibold ${
                          product.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : product.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {product.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleEdit(product)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editingProduct && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Product</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price
                    </label>
                    {editFormData.hasVariants ? (
                      <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500">
                        <p className="text-sm">Price set per variant</p>
                        <p className="text-xs mt-1">See variants table below</p>
                      </div>
                    ) : (
                      <input
                        type="number"
                        value={editFormData.price}
                        onChange={(e) => setEditFormData({ ...editFormData, price: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        step="0.01"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Compare At Price
                    </label>
                    {editFormData.hasVariants ? (
                      <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500">
                        <p className="text-sm">Compare price per variant</p>
                        <p className="text-xs mt-1">See variants table below</p>
                      </div>
                    ) : (
                      <input
                        type="number"
                        value={editFormData.compareAtPrice}
                        onChange={(e) => setEditFormData({ ...editFormData, compareAtPrice: parseFloat(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        step="0.01"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Type
                  </label>
                  <select
                    value={editFormData.productType}
                    onChange={(e) => setEditFormData({ ...editFormData, productType: e.target.value as 'physical' | 'booking' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="physical">📦 Physical Product</option>
                    <option value="booking">📅 Booking/Service</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {editFormData.productType === 'booking' 
                      ? 'For bookings, appointments, or reservations (e.g., halls, courts, services)'
                      : 'For physical products with inventory tracking'}
                  </p>
                </div>

                {/* Booking Configuration - Only show when productType is 'booking' */}
                {editFormData.productType === 'booking' && (
                  <div className="border-t pt-4 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Booking Configuration</h3>
                    
                    {/* Duration Unit */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Booking Type *
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'hours', label: 'Hours', desc: 'Hourly bookings' },
                          { value: 'days', label: 'Days', desc: 'Full day bookings' },
                          { value: 'sessions', label: 'Sessions', desc: 'Fixed sessions' },
                        ].map((unit) => (
                          <button
                            key={unit.value}
                            type="button"
                            onClick={() => setEditFormData({
                              ...editFormData,
                              attributes: {
                                booking: {
                                  ...editFormData.attributes.booking,
                                  durationUnit: unit.value as 'hours' | 'days' | 'sessions',
                                  duration: unit.value === 'days' ? 1440 : unit.value === 'hours' ? 60 : 60,
                                },
                              },
                            })}
                            className={`p-3 border-2 rounded-lg text-left ${
                              editFormData.attributes.booking.durationUnit === unit.value
                                ? 'border-blue-600 bg-blue-50'
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                          >
                            <div className="font-semibold text-sm">{unit.label}</div>
                            <div className="text-xs text-gray-600">{unit.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Duration and Buffer Time */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {editFormData.attributes.booking.durationUnit === 'days'
                            ? 'Duration (days) *'
                            : editFormData.attributes.booking.durationUnit === 'hours'
                            ? 'Duration (hours) *'
                            : 'Duration (minutes) *'}
                        </label>
                        <input
                          type="number"
                          value={
                            editFormData.attributes.booking.durationUnit === 'days'
                              ? Math.floor(editFormData.attributes.booking.duration / 1440)
                              : editFormData.attributes.booking.durationUnit === 'hours'
                              ? Math.floor(editFormData.attributes.booking.duration / 60)
                              : editFormData.attributes.booking.duration
                          }
                          onChange={(e) => {
                            const value = e.target.value === '' ? '' : parseInt(e.target.value);
                            if (value === '') {
                              setEditFormData({
                                ...editFormData,
                                attributes: {
                                  booking: { ...editFormData.attributes.booking, duration: 0 },
                                },
                              });
                            } else {
                              const minutes = editFormData.attributes.booking.durationUnit === 'days'
                                ? value * 1440
                                : editFormData.attributes.booking.durationUnit === 'hours'
                                ? value * 60
                                : value;
                              setEditFormData({
                                ...editFormData,
                                attributes: {
                                  booking: { ...editFormData.attributes.booking, duration: minutes },
                                },
                              });
                            }
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          min={editFormData.attributes.booking.durationUnit === 'days' ? '1' : editFormData.attributes.booking.durationUnit === 'hours' ? '1' : '15'}
                          step={editFormData.attributes.booking.durationUnit === 'days' ? '1' : editFormData.attributes.booking.durationUnit === 'hours' ? '1' : '15'}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Buffer Time (minutes)
                        </label>
                        <input
                          type="number"
                          value={editFormData.attributes.booking.bufferTime}
                          onChange={(e) => setEditFormData({
                            ...editFormData,
                            attributes: {
                              booking: { ...editFormData.attributes.booking, bufferTime: parseInt(e.target.value) || 0 },
                            },
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          min="0"
                          step="15"
                        />
                        <p className="text-xs text-gray-500 mt-1">Gap between bookings</p>
                      </div>
                    </div>

                    {/* Available Days */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Available Days *
                        </label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditFormData({
                              ...editFormData,
                              attributes: {
                                booking: {
                                  ...editFormData.attributes.booking,
                                  availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
                                },
                              },
                            })}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Select All
                          </button>
                          <span className="text-xs text-gray-400">|</span>
                          <button
                            type="button"
                            onClick={() => setEditFormData({
                              ...editFormData,
                              attributes: {
                                booking: { ...editFormData.attributes.booking, availableDays: [] },
                              },
                            })}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Deselect All
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                          <label
                            key={day}
                            className="flex items-center space-x-2 p-2 border rounded hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={editFormData.attributes.booking.availableDays.includes(day)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setEditFormData({
                                    ...editFormData,
                                    attributes: {
                                      booking: {
                                        ...editFormData.attributes.booking,
                                        availableDays: [...editFormData.attributes.booking.availableDays, day],
                                      },
                                    },
                                  });
                                } else {
                                  setEditFormData({
                                    ...editFormData,
                                    attributes: {
                                      booking: {
                                        ...editFormData.attributes.booking,
                                        availableDays: editFormData.attributes.booking.availableDays.filter((d) => d !== day),
                                      },
                                    },
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

                    {/* Time Slots */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Operating Hours (24-hour format)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setEditFormData({
                              ...editFormData,
                              attributes: {
                                booking: {
                                  ...editFormData.attributes.booking,
                                  timeSlots: [{ start: '00:00', end: '23:59' }],
                                },
                              },
                            });
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 border border-blue-300 rounded hover:bg-blue-50"
                        >
                          Set Full Day (00:00 - 23:59)
                        </button>
                      </div>
                      {editFormData.attributes.booking.timeSlots.map((slot, index) => (
                        <div key={index} className="flex gap-4 mb-2 items-center">
                          <input
                            type="time"
                            value={slot.start}
                            onChange={(e) => {
                              const newSlots = [...editFormData.attributes.booking.timeSlots];
                              newSlots[index].start = e.target.value;
                              setEditFormData({
                                ...editFormData,
                                attributes: {
                                  booking: { ...editFormData.attributes.booking, timeSlots: newSlots },
                                },
                              });
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                            step="3600"
                          />
                          <span className="flex items-center text-gray-500">to</span>
                          <input
                            type="time"
                            value={slot.end}
                            onChange={(e) => {
                              const newSlots = [...editFormData.attributes.booking.timeSlots];
                              newSlots[index].end = e.target.value;
                              setEditFormData({
                                ...editFormData,
                                attributes: {
                                  booking: { ...editFormData.attributes.booking, timeSlots: newSlots },
                                },
                              });
                            }}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                            step="3600"
                          />
                          {editFormData.attributes.booking.timeSlots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newSlots = editFormData.attributes.booking.timeSlots.filter((_, i) => i !== index);
                                setEditFormData({
                                  ...editFormData,
                                  attributes: {
                                    booking: { ...editFormData.attributes.booking, timeSlots: newSlots },
                                  },
                                });
                              }}
                              className="text-red-600 hover:text-red-800 px-3"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setEditFormData({
                            ...editFormData,
                            attributes: {
                              booking: {
                                ...editFormData.attributes.booking,
                                timeSlots: [...editFormData.attributes.booking.timeSlots, { start: '09:00', end: '17:00' }],
                              },
                            },
                          });
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        + Add Time Range
                      </button>
                      <p className="text-xs text-gray-500 mt-2">
                        Time slots are in 24-hour format (e.g., 09:00 for 9 AM, 18:00 for 6 PM)
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Quantity
                    </label>
                    {editFormData.hasVariants ? (
                      <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500">
                        <p className="text-sm">Stock set per variant</p>
                        <p className="text-xs mt-1">See variants table below</p>
                      </div>
                    ) : (
                      <>
                        <input
                          type="number"
                          value={editFormData.stockQuantity}
                          onChange={(e) => setEditFormData({ ...editFormData, stockQuantity: parseInt(e.target.value) || 0 })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          disabled={editFormData.productType === 'booking'}
                        />
                        {editFormData.productType === 'booking' && (
                          <p className="text-xs text-gray-500 mt-1">Stock not applicable for booking products</p>
                        )}
                      </>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      SKU
                    </label>
                    {editFormData.hasVariants ? (
                      <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500">
                        <p className="text-sm">SKU set per variant</p>
                        <p className="text-xs mt-1">See variants table below</p>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={editFormData.sku}
                        onChange={(e) => setEditFormData({ ...editFormData, sku: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  </div>
                </div>

                <MultiImageUpload
                  label="Product Images"
                  value={editFormData.images}
                  onChange={(urls) => {
                    setEditFormData({ ...editFormData, images: urls });
                    // Auto-set featured image to first image if not set
                    if (!editFormData.featuredImage && urls.length > 0) {
                      setEditFormData(prev => ({ ...prev, featuredImage: urls[0] }));
                    }
                  }}
                  maxImages={10}
                />

                <ImageUpload
                  label="Featured Image (Optional - uses first product image if not set)"
                  value={editFormData.featuredImage}
                  onChange={(url) => setEditFormData({ ...editFormData, featuredImage: url })}
                />

                {/* Variant Information Display */}
                {editFormData.hasVariants && editFormData.variations && editFormData.variations.length > 0 && (
                  <div className="border-t pt-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">
                        📦 Product Variants
                      </h3>
                      <p className="text-sm text-blue-700 mb-3">
                        This product has {editFormData.variations.length} variants. You can view and edit variant details below.
                      </p>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded border">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">Variant</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">SKU</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">Price</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">Compare Price</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase">Stock</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {editFormData.variations.map((variant: any, index: number) => (
                              <tr key={variant.id || index} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-sm">
                                  {variant.variationAttributes ? 
                                    Object.entries(variant.variationAttributes).map(([key, value]) => (
                                      <span key={key} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs mr-1">
                                        {key}: {value as string}
                                      </span>
                                    ))
                                    : 'N/A'}
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="text"
                                    value={variant.sku || ''}
                                    onChange={(e) => {
                                      const newVariations = [...editFormData.variations];
                                      newVariations[index] = { ...newVariations[index], sku: e.target.value };
                                      setEditFormData({ ...editFormData, variations: newVariations });
                                    }}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={variant.price || 0}
                                    onChange={(e) => {
                                      const newVariations = [...editFormData.variations];
                                      newVariations[index] = { ...newVariations[index], price: parseFloat(e.target.value) || 0 };
                                      setEditFormData({ ...editFormData, variations: newVariations });
                                    }}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                    step="0.01"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={variant.compareAtPrice || ''}
                                    onChange={(e) => {
                                      const newVariations = [...editFormData.variations];
                                      newVariations[index] = { ...newVariations[index], compareAtPrice: parseFloat(e.target.value) || undefined };
                                      setEditFormData({ ...editFormData, variations: newVariations });
                                    }}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                    step="0.01"
                                    placeholder="Optional"
                                  />
                                </td>
                                <td className="px-3 py-2">
                                  <input
                                    type="number"
                                    value={variant.stockQuantity || 0}
                                    onChange={(e) => {
                                      const newVariations = [...editFormData.variations];
                                      newVariations[index] = { ...newVariations[index], stockQuantity: parseInt(e.target.value) || 0 };
                                      setEditFormData({ ...editFormData, variations: newVariations });
                                    }}
                                    className="w-full px-2 py-1 text-xs border rounded"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <p className="text-xs text-amber-600 mt-3">
                        ⚠️ To add/remove variants or change variant types, please use the "Add Product" page to create a new product.
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categories
                  </label>
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg max-h-48 overflow-y-auto bg-white">
                    {categories.length === 0 ? (
                      <p className="text-sm text-gray-500">No categories available</p>
                    ) : (
                      categories.map((category) => (
                        <label
                          key={category.id}
                          className="flex items-center py-1.5 hover:bg-gray-50 cursor-pointer rounded px-1"
                          style={{ marginLeft: `${category.level * 20}px` }}
                        >
                          <input
                            type="checkbox"
                            checked={editFormData.categoryIds.includes(category.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditFormData({
                                  ...editFormData,
                                  categoryIds: [...editFormData.categoryIds, category.id],
                                });
                              } else {
                                setEditFormData({
                                  ...editFormData,
                                  categoryIds: editFormData.categoryIds.filter((id) => id !== category.id),
                                });
                              }
                            }}
                            className="mr-2 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                          />
                          <span className={`text-sm ${category.level === 0 ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                            {category.name}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {editFormData.categoryIds.length} categor{editFormData.categoryIds.length === 1 ? 'y' : 'ies'} selected
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
