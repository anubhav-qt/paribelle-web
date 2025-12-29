'use client';

import { useEffect, useState, Fragment } from 'react';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import MultiImageUpload from '@/components/MultiImageUpload';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminProducts, useUpdateProductStatus, useDeleteProduct } from '@/hooks/useAdminProducts';
import UnifiedHeader from '@/components/UnifiedHeader';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  status: string;
  sku: string;
  featuredImage?: string;
  images?: string[];
  productType: 'physical' | 'booking';
  categories: Array<{ id: string; name: string }>;
  vendor?: { 
    id: string; 
    storeName: string;
    businessName: string; 
    contactEmail: string;
  };
  createdAt: string;
  // Variation support
  isParent?: boolean;
  parentProductId?: string;
  variations?: Product[];
  variationAttributes?: Record<string, string>;
  variationThemes?: string[];
}

export default function AdminProductsPage() {
  const { isAuthenticated, loading: authLoading } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupBy, setGroupBy] = useState<'none' | 'vendor'>('vendor');
  const [collapsedVendors, setCollapsedVendors] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  
  // Use React Query for products
  const { data: productsData, isLoading: loading } = useAdminProducts({
    page: currentPage,
    limit: 20,
    status: statusFilter,
    search: searchTerm,
    groupBy,
  });
  
  const products = productsData?.products || [];
  const totalProducts = productsData?.total || 0;
  
  const updateStatusMutation = useUpdateProductStatus();
  const deleteProductMutation = useDeleteProduct();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; level: number }>>([]);
  const [vendors, setVendors] = useState<Array<{ id: string; storeName: string }>>([]);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    price: 0,
    compareAtPrice: 0,
    stockQuantity: 0,
    sku: '',
    featuredImage: '',
    images: [] as string[],
    productType: 'physical' as 'physical' | 'booking',
    hasVariants: false,
    variations: [] as any[],
    variationThemes: [] as string[],
  });
  const [newProductFormData, setNewProductFormData] = useState({
    name: '',
    slug: '',
    description: '',
    price: 0,
    compareAtPrice: 0,
    stockQuantity: 0,
    sku: '',
    status: 'draft',
    categoryIds: [] as string[],
    vendorId: '',
    featuredImage: '',
  });
  const itemsPerPage = 20;

  useEffect(() => {
    fetchCategories();
    fetchVendors();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/tree/all`);
      const data = await response.json();
      
      // Flatten the category tree for dropdown display with level info
      const flattenCategories = (categories: any[], level = 0): any[] => {
        let result: any[] = [];
        categories.forEach((cat) => {
          result.push({
            id: cat.id,
            name: cat.name,
            level: level,
          });
          if (cat.children && cat.children.length > 0) {
            result = result.concat(flattenCategories(cat.children, level + 1));
          }
        });
        return result;
      };
      
      setCategories(flattenCategories(data || []));
    } catch (error) {
      // Error handling
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors`);
      const data = await response.json();
      // API returns array directly
      setVendors(Array.isArray(data) ? data : []);
    } catch (error) {
      setVendors([]);
    }
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

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ productId: id, status: newStatus });
    } catch (error: any) {
      alert(`Failed to update status: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEdit = (product: Product) => {
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
      hasVariants: product.isParent || false,
      variations: product.variations || [],
      variationThemes: product.variationThemes || [],
    });
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editFormData),
      });
      
      if (response.ok) {
        alert('Product updated successfully!');
        setEditingProduct(null);
        fetchProducts();
      } else {
        const error = await response.json();
        alert(`Failed to update product: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
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
      hasVariants: false,
      variations: [],
      variationThemes: [],
    });
  };

  const handleOpenAddModal = () => {
    setShowAddModal(true);
    setNewProductFormData({
      name: '',
      slug: '',
      description: '',
      price: 0,
      compareAtPrice: 0,
      stockQuantity: 0,
      sku: '',
      status: 'draft',
      categoryIds: [],
      vendorId: '',
      featuredImage: '',
    });
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setNewProductFormData({
      name: '',
      slug: '',
      description: '',
      price: 0,
      compareAtPrice: 0,
      stockQuantity: 0,
      sku: '',
      status: 'draft',
      categoryIds: [],
      vendorId: '',
      featuredImage: '',
    });
  };

  const handleCreateProduct = async () => {
    try {
      // Validation
      if (!newProductFormData.name || !newProductFormData.description || !newProductFormData.sku) {
        alert('Please fill in all required fields (Name, Description, SKU)');
        return;
      }

      if (!newProductFormData.vendorId) {
        alert('Please select a vendor');
        return;
      }

      // Auto-generate slug from name if not provided
      const slug = newProductFormData.slug || 
        newProductFormData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const productData: any = {
        name: newProductFormData.name,
        slug,
        description: newProductFormData.description,
        price: parseFloat(newProductFormData.price.toString()),
        stockQuantity: parseInt(newProductFormData.stockQuantity.toString()),
        sku: newProductFormData.sku,
        status: newProductFormData.status,
        vendorId: newProductFormData.vendorId,
        featuredImage: newProductFormData.featuredImage || null,
      };

      if (newProductFormData.compareAtPrice) {
        productData.compareAtPrice = parseFloat(newProductFormData.compareAtPrice.toString());
      }

      if (newProductFormData.categoryIds.length > 0) {
        productData.categoryIds = newProductFormData.categoryIds;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || JSON.stringify(responseData));
      }

      handleCloseAddModal();
      fetchProducts();
      alert('Product created successfully!');
    } catch (error) {
      alert(`Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const groupProductsByVendor = () => {
    const grouped = new Map<string, { vendor: any; products: Product[] }>();
    
    products.forEach((product) => {
      const vendorId = product.vendor?.id || 'no-vendor';
      const vendorName = product.vendor?.storeName || product.vendor?.businessName || 'No Vendor Assigned';
      const vendorEmail = product.vendor?.contactEmail || '';
      
      if (!grouped.has(vendorId)) {
        grouped.set(vendorId, {
          vendor: { id: vendorId, name: vendorName, email: vendorEmail },
          products: [],
        });
      }
      
      grouped.get(vendorId)!.products.push(product);
    });
    
    return Array.from(grouped.values());
  };

  const toggleVendor = (vendorId: string) => {
    setCollapsedVendors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(vendorId)) {
        newSet.delete(vendorId);
      } else {
        newSet.add(vendorId);
      }
      return newSet;
    });
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('token');
      
      // For admin, export all products by using 'all' as vendor ID
      // The backend should handle this special case
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/export-zip/all`,
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
        a.download = `all-products-${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const error = await response.text();
        console.error('Export error:', error);
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

      const formData = new FormData();
      formData.append('file', file);

      // For admin, import all products by using 'all' as vendor ID
      // The backend should handle this special case
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/import-zip/all`,
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
        // Refresh products list after successful import
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

  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStockColor = (quantity: number) => {
    if (quantity === 0) return 'text-red-600 font-semibold';
    if (quantity < 10) return 'text-orange-600 font-semibold';
    return 'text-green-600';
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <UnifiedHeader />
      <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <Link
              href="/admin"
              className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Products Management</h1>
            <p className="text-gray-600 mt-2">Manage your product catalog</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={exporting || products.length === 0}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? 'Exporting...' : '📥 Export to ZIP'}
            </button>
            <label className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 cursor-pointer">
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
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition inline-block"
            >
              + Add New Product
            </Link>
          </div>
        </div>

        {/* Import Message */}
        {importMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            importMessage.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {importMessage.text}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Products</div>
            <div className="text-2xl font-bold text-gray-900">{totalProducts}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Active</div>
            <div className="text-2xl font-bold text-green-600">
              {products.filter((p) => p.status === 'active').length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Low Stock</div>
            <div className="text-2xl font-bold text-orange-600">
              {products.filter((p) => p.stockQuantity < 10 && p.stockQuantity > 0).length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Out of Stock</div>
            <div className="text-2xl font-bold text-red-600">
              {products.filter((p) => p.stockQuantity === 0).length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Products
              </label>
              <input
                type="text"
                placeholder="Search by name, SKU..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Group By
              </label>
              <select
                value={groupBy}
                onChange={(e) => {
                  setGroupBy(e.target.value as 'none' | 'vendor');
                  setCurrentPage(1); // Reset to page 1 when changing grouping
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="vendor">Vendor</option>
                <option value="none">None (Paginated)</option>
              </select>
              {groupBy === 'vendor' && (
                <p className="text-xs text-gray-500 mt-1">Showing all products grouped by vendor</p>
              )}
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setCurrentPage(1);
                }}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="text-gray-500">Loading products...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-500">No products found</div>
            </div>
          ) : (
            <>
              {/* Pagination - Top - Only show when NOT grouping by vendor */}
              {groupBy === 'none' && totalPages > 1 && (
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, totalProducts)} of {totalProducts}{' '}
                    products
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-4 py-2 rounded-lg ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Product
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Stock
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
                    {groupBy === 'vendor' ? (
                      groupProductsByVendor().map(({ vendor, products: vendorProducts }) => {
                        const isCollapsed = collapsedVendors.has(vendor.id);
                        return (
                          <Fragment key={vendor.id}>
                            {/* Vendor Header Row */}
                            <tr className="bg-gray-100 border-t-2 border-gray-300">
                              <td colSpan={8} className="px-6 py-3">
                                <button
                                  onClick={() => toggleVendor(vendor.id)}
                                  className="flex items-center gap-3 w-full text-left hover:opacity-80"
                                >
                                  <span className="text-lg">
                                    {isCollapsed ? '▶' : '▼'}
                                  </span>
                                  <div>
                                    <div className="font-semibold text-gray-900">
                                      {vendor.name}
                                    </div>
                                    {vendor.email && (
                                      <div className="text-sm text-gray-600">{vendor.email}</div>
                                    )}
                                  </div>
                                  <div className="ml-auto text-sm text-gray-600">
                                    {vendorProducts.length} product{vendorProducts.length !== 1 ? 's' : ''}
                                  </div>
                                </button>
                              </td>
                            </tr>
                            {/* Vendor Products */}
                            {!isCollapsed && vendorProducts.map((product) => (
                              <tr key={product.id} className="hover:bg-gray-50 border-b border-gray-200">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    {product.featuredImage ? (
                                      <img
                                        src={product.featuredImage}
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
                                      </div>
                                      <div className="text-xs text-gray-500">{product.slug}</div>
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
                                    ₹{Number(product.price).toFixed(2)}
                                  </div>
                                  {product.compareAtPrice && (
                                    <div className="text-xs text-gray-500 line-through">
                                      ₹{Number(product.compareAtPrice).toFixed(2)}
                                    </div>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`text-sm ${getStockColor(product.stockQuantity)}`}>
                                    {product.stockQuantity}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <select
                                    value={product.status}
                                    onChange={(e) => handleStatusChange(product.id, e.target.value)}
                                    className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusColor(
                                      product.status
                                    )} border-0 cursor-pointer`}
                                  >
                                    <option value="active">Active</option>
                                    <option value="draft">Draft</option>
                                    <option value="archived">Archived</option>
                                  </select>
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
                          </Fragment>
                        );
                      })
                    ) : (
                      products.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50 border-b border-gray-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {product.featuredImage ? (
                                <img
                                  src={product.featuredImage}
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
                                </div>
                                <div className="text-xs text-gray-500">{product.slug}</div>
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
                              ₹{Number(product.price).toFixed(2)}
                            </div>
                            {product.compareAtPrice && (
                              <div className="text-xs text-gray-500 line-through">
                                ₹{Number(product.compareAtPrice).toFixed(2)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm ${getStockColor(product.stockQuantity)}`}>
                              {product.stockQuantity}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={product.status}
                              onChange={(e) => handleStatusChange(product.id, e.target.value)}
                              className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusColor(
                                product.status
                              )} border-0 cursor-pointer`}
                            >
                              <option value="active">Active</option>
                              <option value="draft">Draft</option>
                              <option value="archived">Archived</option>
                            </select>
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
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination - Only show when NOT grouping by vendor */}
              {groupBy === 'none' && totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                    {Math.min(currentPage * itemsPerPage, totalProducts)} of {totalProducts}{' '}
                    products
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Previous
                    </button>
                    <div className="flex gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-4 py-2 rounded-lg ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

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
                    Price (₹)
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
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compare At Price (₹)
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
                                      {key}: {String(value)}
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

      {/* Add New Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Product</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={newProductFormData.name}
                  onChange={(e) => setNewProductFormData({ ...newProductFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug (auto-generated if empty)
                </label>
                <input
                  type="text"
                  value={newProductFormData.slug}
                  onChange={(e) => setNewProductFormData({ ...newProductFormData, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="product-slug"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={newProductFormData.description}
                  onChange={(e) => setNewProductFormData({ ...newProductFormData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Enter product description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categories
                </label>
                <div className="w-full px-4 py-3 border border-gray-300 rounded-lg max-h-48 overflow-y-auto bg-white">
                  {categories.length === 0 ? (
                    <p className="text-sm text-gray-500">Loading categories...</p>
                  ) : (
                    categories.map((category) => (
                      <label
                        key={category.id}
                        className="flex items-center py-1.5 hover:bg-gray-50 cursor-pointer rounded px-1"
                        style={{ marginLeft: `${category.level * 20}px` }}
                      >
                        <input
                          type="checkbox"
                          checked={newProductFormData.categoryIds.includes(category.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewProductFormData({
                                ...newProductFormData,
                                categoryIds: [...newProductFormData.categoryIds, category.id],
                              });
                            } else {
                              setNewProductFormData({
                                ...newProductFormData,
                                categoryIds: newProductFormData.categoryIds.filter((id) => id !== category.id),
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
                  {newProductFormData.categoryIds.length} categor{newProductFormData.categoryIds.length === 1 ? 'y' : 'ies'} selected
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vendor *
                </label>
                <select
                  value={newProductFormData.vendorId}
                  onChange={(e) => setNewProductFormData({ ...newProductFormData, vendorId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select vendor</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.storeName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={newProductFormData.price}
                    onChange={(e) => setNewProductFormData({ ...newProductFormData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compare At Price (₹)
                  </label>
                  <input
                    type="number"
                    value={newProductFormData.compareAtPrice}
                    onChange={(e) => setNewProductFormData({ ...newProductFormData, compareAtPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    value={newProductFormData.stockQuantity}
                    onChange={(e) => setNewProductFormData({ ...newProductFormData, stockQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU *
                  </label>
                  <input
                    type="text"
                    value={newProductFormData.sku}
                    onChange={(e) => setNewProductFormData({ ...newProductFormData, sku: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="PROD-001"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={newProductFormData.status}
                  onChange={(e) => setNewProductFormData({ ...newProductFormData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <ImageUpload
                label="Featured Image"
                value={newProductFormData.featuredImage}
                onChange={(url) => setNewProductFormData({ ...newProductFormData, featuredImage: url })}
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCreateProduct}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Create Product
              </button>
              <button
                onClick={handleCloseAddModal}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
