'use client';

import { useEffect, useState, Fragment, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import JSZip from 'jszip';
import ImageUpload from '@/components/ImageUpload';
import MultiImageUpload from '@/components/MultiImageUpload';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminProducts, useAdminProductStats, useUpdateProductStatus, useDeleteProduct } from '@/hooks/useAdminProducts';
import { handleSortChange, getSortIcon, compareValues, getSortableHeaderClass, SortOrder } from '@/lib/utils/sorting';
import { Product, ProductVariant } from '@/types/product';
import { ImportMessage } from '@/types/common';
import { 
  productToFormData, 
  getEmptyFormData, 
  getStockColor, 
  getStatusColor, 
  getVariantPriceDisplay,
  calculateDiscount,
  priceToNumber 
} from '@/lib/product-form-utils';
import 'react-quill/dist/quill.snow.css';
import { Loader } from '@/components/ui/Loader';
import { api, ApiError, downloadBlob, errorMessage } from '@/lib/api';
import { showAlert, showConfirm } from '@/lib/dialog';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function AdminProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader size="md" /></div>}>
      <AdminProductsPageInner />
    </Suspense>
  );
}

function AdminProductsPageInner() {
  const { isAuthenticated, loading: authLoading } = useAdminAuth();
  const searchParams = useSearchParams();
  // A low-stock notification links here with `?search=<product name>` so the
  // click lands on the product it is about rather than page 1 of the whole
  // catalogue — see NotificationType.LOW_STOCK in the backend. Read once as
  // the initial value: the admin must stay free to clear or edit the box.
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  
  // Use React Query for products
  const { data: productsData, isLoading: loading } = useAdminProducts({
    page: currentPage,
    limit: 20,
    status: statusFilter,
    search: searchTerm,
  });
  
  const products = productsData?.products || [];
  const totalProducts = productsData?.total || 0;

  // Counted over the whole catalogue, not this one page — see useAdminProductStats.
  const { data: stats } = useAdminProductStats();

  // Sort products based on current sort settings
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return compareValues(a.name, b.name, sortOrder);
      case 'price':
        return compareValues(a.price, b.price, sortOrder);
      case 'stock':
        const aStock = a.hasVariants 
          ? (a.productVariants?.reduce((sum: number, v: ProductVariant) => sum + (v.stockQuantity || 0), 0) || 0)
          : (a.stockQuantity || 0);
        const bStock = b.hasVariants 
          ? (b.productVariants?.reduce((sum: number, v: ProductVariant) => sum + (v.stockQuantity || 0), 0) || 0)
          : (b.stockQuantity || 0);
        return compareValues(aStock, bStock, sortOrder);
      case 'status':
        return compareValues(a.status, b.status, sortOrder);
      default:
        return 0;
    }
  });
  
  const updateStatusMutation = useUpdateProductStatus();
  const deleteProductMutation = useDeleteProduct();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; level: number }>>([]);
  const [customPages, setCustomPages] = useState<Array<{ id: string; title: string; slug: string }>>([]);
  const [linkableProducts, setLinkableProducts] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [editCategoryFilters, setEditCategoryFilters] = useState<any[]>([]);
  const [editProductAttributes, setEditProductAttributes] = useState<Record<string, any>>({});
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importMessage, setImportMessage] = useState<ImportMessage | null>(null);
  const [editFormData, setEditFormData] = useState(getEmptyFormData());
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
    fetchCustomPages(); // Load marketplace pages by default
    fetchLinkableProducts(); // Load products for linking
  }, []);

  const fetchCategories = async () => {
    try {
      const data = await api.get<any[]>('/categories/tree/all');

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

  const fetchCustomPages = async (vendorId?: string) => {
    try {
      // For admin, fetch both marketplace pages and vendor pages if vendorId is provided
      const data = await api.get<any[]>(
        vendorId ? `/vendors/${vendorId}/pages` : '/marketplace/pages',
      );
      // Only show published pages
      setCustomPages((data || []).filter((p: any) => p.status === 'published'));
    } catch (error) {
      console.error('Error fetching custom pages:', error);
      setCustomPages([]);
    }
  };

  const fetchLinkableProducts = async () => {
    try {
      const data = await api.get<any>('/products', { params: { limit: 100, status: 'active' } });
      const products = data.products || data;
      // Map products with tour detection
      setLinkableProducts(
        products.map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
        })),
      );
    } catch (error) {
      console.error('Error fetching linkable products:', error);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await showConfirm({ message: 'Are you sure you want to delete this product?', confirmText: 'Delete', variant: 'danger' });
    if (!ok) return;

    try {
      const result = await deleteProductMutation.mutateAsync(id);
      // A product with order or booking history is archived rather than
      // deleted — a fixed "deleted successfully" here is how a no-op click on
      // an already-archived product with history looked like nothing happened
      // when it had in fact worked exactly as intended.
      setSelectedProductIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      showAlert(result?.message || 'Product deleted successfully!', 'success');
    } catch (error) {
      showAlert(`Failed to delete product: ${errorMessage(error)}`, 'error');
    }
  };

  const toggleProductSelection = (productId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleSelectAllVisible = (checked: boolean) => {
    if (checked) {
      setSelectedProductIds(new Set(sortedProducts.map((p) => p.id)));
      return;
    }
    setSelectedProductIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.size === 0) {
      showAlert('Please select at least one product to delete.', 'warning');
      return;
    }

    const selectedIds = Array.from(selectedProductIds);
    const confirmed = await showConfirm({
      message: `Are you sure you want to delete ${selectedIds.length} selected product${selectedIds.length > 1 ? 's' : ''}?`,
      confirmText: 'Delete',
      variant: 'danger',
    });
    if (!confirmed) return;

    setBulkDeleting(true);
    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) => deleteProductMutation.mutateAsync(id))
      );

      // A fulfilled request isn't necessarily a deletion — a product with
      // order or booking history archives instead, and that split has to be
      // reported separately or a bulk delete on a mix of products looks like
      // it silently did nothing for the ones with history.
      const fulfilled = results.filter(
        (r) => r.status === 'fulfilled',
      ) as PromiseFulfilledResult<{ message: string; outcome: string }>[];
      const deletedCount = fulfilled.filter((r) => r.value.outcome === 'deleted').length;
      const archivedCount = fulfilled.filter((r) => r.value.outcome !== 'deleted').length;
      const failedCount = results.length - fulfilled.length;

      setSelectedProductIds(new Set());

      const parts = [];
      if (deletedCount > 0) parts.push(`${deletedCount} deleted`);
      if (archivedCount > 0) parts.push(`${archivedCount} archived (order/booking history)`);
      if (failedCount > 0) parts.push(`${failedCount} failed`);
      showAlert(parts.join(', ') + '.', 'success');
    } catch (error) {
      showAlert('Bulk delete failed. Please try again.', 'error');
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ productId: id, status: newStatus });
    } catch (error: any) {
      showAlert(`Failed to update status: ${error.message || 'Unknown error'}`, 'error');
    }
  };

  const fetchEditCategoryFilters = async (categoryId: string, existingAttributes?: Record<string, any>) => {
    try {
      const data = await api.get<any>(`/categories/${categoryId}/filters`);
      const filteredFilters = (data.filters || []).filter(
        (f: any) => f.id !== 'priceRange' && f.id !== 'price' &&
          !['stock', 'stockQuantity', 'isActive', 'active', 'status', 'rating', 'variant attributes'].includes(f.id)
      );
      setEditCategoryFilters(filteredFilters);
      const attrs: Record<string, any> = {};
      filteredFilters.forEach((filter: any) => {
        attrs[filter.id] = existingAttributes?.[filter.id] ?? '';
      });
      setEditProductAttributes(attrs);
    } catch (error) {
      console.error('Error fetching category filters for edit:', error);
    }
  };

  const handleEdit = async (product: Product) => {
    // Fetch full product details including variants
    try {
      const fullProduct = await api.get<any>(`/products/${product.id}`);
      setEditingProduct(fullProduct);
      // Fetch custom pages - vendor pages if product has vendor, otherwise marketplace pages
      fetchCustomPages(fullProduct.vendor?.id);
      setEditFormData(productToFormData(fullProduct));
      // Load category filters and existing attributes for physical products
      if (fullProduct.categories?.length > 0) {
        fetchEditCategoryFilters(fullProduct.categories[0].id, fullProduct.attributes);
      } else {
        setEditCategoryFilters([]);
        setEditProductAttributes({});
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      // Fallback to using the product from the list
      setEditingProduct(product);
      // Fetch custom pages - vendor pages if product has vendor, otherwise marketplace pages
      fetchCustomPages(product.vendor?.id);
      setEditFormData(productToFormData(product));
      setEditCategoryFilters([]);
      setEditProductAttributes({});
    }
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;

    try {
      const updateData: Record<string, any> = { ...editFormData };

      // Process physical product attributes
      if (Object.keys(editProductAttributes).length > 0) {
        const processedAttributes: Record<string, any> = {};
        const newFilterOptions: Record<string, { value: string; label: string }> = {};

        Object.entries(editProductAttributes).forEach(([key, value]) => {
          if (key.endsWith('_custom') || value === '' || value === null) return;
          const customKey = `${key}_custom`;
          if (value === '__custom__' && editProductAttributes[customKey]) {
            const customValue = editProductAttributes[customKey] as string;
            if (customValue.trim()) {
              const valueSlug = customValue.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              processedAttributes[key] = valueSlug;
              newFilterOptions[key] = { value: valueSlug, label: customValue.trim() };
            }
          } else if (value !== '__custom__') {
            processedAttributes[key] = value;
          }
        });

        if (Object.keys(processedAttributes).length > 0) {
          updateData.attributes = { ...(editFormData.attributes || {}), ...processedAttributes };
        }
        if (Object.keys(newFilterOptions).length > 0) {
          updateData.newFilterOptions = newFilterOptions;
          updateData.categoryId = editFormData.categoryIds[0];
        }
      }

      await api.patch(`/products/${editingProduct.id}`, updateData);
      showAlert('Product updated successfully!', 'success');
      setEditingProduct(null);
      // Refetch products using React Query
      window.location.reload();
    } catch (error) {
      console.error('Save error:', error);
      showAlert(`Failed to update product: ${errorMessage(error)}`, 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingProduct(null);
    setEditFormData(getEmptyFormData());
    setEditCategoryFilters([]);
    setEditProductAttributes({});
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
        showAlert('Please fill in all required fields (Name, Description, SKU)', 'warning');
        return;
      }

      if (!newProductFormData.vendorId) {
        showAlert('Please select a vendor', 'warning');
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

      await api.post('/products', productData);

      handleCloseAddModal();
      window.location.reload();
      showAlert('Product created successfully!', 'success');
    } catch (error) {
      showAlert(`Failed to create product: ${errorMessage(error)}`, 'error');
    }
  };

  const downloadSimpleTemplate = async () => {
    try {
      setExporting(true);
      const response = await api.raw('GET', '/products/template-simple/download');
      await downloadBlob(response, 'paribelle-import-template.zip');
    } catch (error) {
      console.error('Error downloading simple template:', error);
      showAlert(`Failed to generate template: ${errorMessage(error)}`, 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleSimpleExport = async () => {
    try {
      setExporting(true);
      const ids = Array.from(selectedProductIds);
      const response = await api.raw('GET', '/products/export-simple/all', {
        params: { ids: ids.length > 0 ? ids.join(',') : undefined },
      });
      await downloadBlob(response, `products-physical-${Date.now()}.zip`);
    } catch (error) {
      console.error('Export error:', error);
      showAlert(`Export failed: ${errorMessage(error)}`, 'error');
    } finally {
      setExporting(false);
    }
  };

  const handleSimpleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    event.target.value = '';
    try {
      setImporting(true);
      setImportMessage(null);
      const formData = new FormData();
      formData.append('file', file);
      const result = await api.upload<any>('/products/import-simple/all', formData);
      setImportMessage({
        type: result.success && result.errors?.length === 0 ? 'success' : 'error',
        text: result.message || (result.success ? 'Import complete' : 'Import failed'),
        errors: result.errors || [],
      });
      if (result.success) setTimeout(() => window.location.reload(), 3000);
    } catch (error) {
      console.error('Import error:', error);
      const body = error instanceof ApiError ? (error.body as any) : null;
      setImportMessage({
        type: 'error',
        text: errorMessage(error, 'Import failed'),
        errors: body?.errors || [],
      });
    } finally {
      setImporting(false);
    }
  };


  const totalPages = Math.ceil(totalProducts / itemsPerPage);
  const selectedCount = selectedProductIds.size;
  const areAllVisibleSelected =
    sortedProducts.length > 0 && sortedProducts.every((p) => selectedProductIds.has(p.id));

  useEffect(() => {
    // Keep only selections that still exist in the current visible dataset.
    setSelectedProductIds((prev) => {
      if (prev.size === 0) return prev;

      const visibleIds = new Set(sortedProducts.map((p) => p.id));
      const next = new Set(Array.from(prev).filter((id) => visibleIds.has(id)));
      if (next.size === prev.size) return prev;
      return next;
    });
  }, [sortedProducts]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size="md" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto px-4">
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
            {/* Import / Export */}
            <div className="flex gap-2">
              <button
                onClick={downloadSimpleTemplate}
                disabled={exporting}
                className="bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 text-sm flex items-center gap-2"
                title="Download the product template ZIP (Products + Variants sheets, sample images)"
              >
                <span>📋</span>
                <span>{exporting ? 'Wait...' : 'Download Template'}</span>
              </button>
              <button
                onClick={handleSimpleExport}
                disabled={exporting || products.length === 0}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-2"
                title={selectedProductIds.size > 0 ? `Export ${selectedProductIds.size} selected product(s)` : 'Export all products'}
              >
                <span>📥</span>
                <span>
                  {exporting
                    ? 'Exporting...'
                    : selectedProductIds.size > 0
                    ? `Export ${selectedProductIds.size} Selected`
                    : 'Export'}
                </span>
              </button>
              <label className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 cursor-pointer text-sm flex items-center gap-2">
                <span>📤</span>
                <span>{importing ? 'Importing...' : 'Import'}</span>
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleSimpleImport}
                  disabled={importing}
                  className="hidden"
                />
              </label>
            </div>
            <Link
              href="/admin/products/add"
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
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <p className="font-medium">{importMessage.text}</p>
                {importMessage.type === 'success' && (
                  <p className="text-sm mt-1 opacity-75">Page will refresh in 3 seconds&hellip;</p>
                )}
                {importMessage.errors && importMessage.errors.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm list-disc list-inside">
                    {importMessage.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                onClick={() => setImportMessage(null)}
                className="shrink-0 text-sm underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards — counted over the whole catalogue via /products/admin/stats,
            not over whichever page of 20 happens to be loaded below. */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Products</div>
            <div className="text-2xl font-bold text-gray-900">{stats?.total ?? totalProducts}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Active</div>
            <div className="text-2xl font-bold text-green-600">{stats?.active ?? '…'}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Low Stock</div>
            <div className="text-2xl font-bold text-orange-600">{stats?.lowStock ?? '…'}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Out of Stock</div>
            <div className="text-2xl font-bold text-red-600">{stats?.outOfStock ?? '…'}</div>
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

        {/* Bulk actions */}
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-gray-700">
            {selectedCount > 0
              ? `${selectedCount} product${selectedCount !== 1 ? 's' : ''} selected`
              : 'No products selected'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSelectAllVisible(!areAllVisibleSelected)}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
              disabled={sortedProducts.length === 0 || bulkDeleting || deleteProductMutation.isPending}
            >
              {areAllVisibleSelected ? 'Unselect All' : 'Select All'}
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={selectedCount === 0 || bulkDeleting || deleteProductMutation.isPending}
            >
              {bulkDeleting ? 'Deleting...' : 'Delete Selected'}
            </button>
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
              {totalPages > 1 && (
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
                <table className="w-full min-w-[1100px]">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                        <input
                          type="checkbox"
                          checked={areAllVisibleSelected}
                          onChange={(e) => handleSelectAllVisible(e.target.checked)}
                          disabled={bulkDeleting || deleteProductMutation.isPending}
                          aria-label="Select all products"
                        />
                      </th>
                      <th
                        className={`${getSortableHeaderClass(sortBy === 'name')} sticky left-[52px] bg-gray-50 z-10`}
                        onClick={() => {
                          const result = handleSortChange(sortBy, 'name', sortOrder);
                          setSortBy(result.field as 'name' | 'price' | 'stock' | 'status');
                          setSortOrder(result.order);
                        }}
                      >
                        Product {getSortIcon(sortBy, 'name', sortOrder)}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th
                        className={getSortableHeaderClass(sortBy === 'price')}
                        onClick={() => {
                          const result = handleSortChange(sortBy, 'price', sortOrder);
                          setSortBy(result.field as 'name' | 'price' | 'stock' | 'status');
                          setSortOrder(result.order);
                        }}
                      >
                        Price {getSortIcon(sortBy, 'price', sortOrder)}
                      </th>
                      <th
                        className={getSortableHeaderClass(sortBy === 'stock')}
                        onClick={() => {
                          const result = handleSortChange(sortBy, 'stock', sortOrder);
                          setSortBy(result.field as 'name' | 'price' | 'stock' | 'status');
                          setSortOrder(result.order);
                        }}
                      >
                        Stock {getSortIcon(sortBy, 'stock', sortOrder)}
                      </th>
                      <th
                        className={getSortableHeaderClass(sortBy === 'status')}
                        onClick={() => {
                          const result = handleSortChange(sortBy, 'status', sortOrder);
                          setSortBy(result.field as 'name' | 'price' | 'stock' | 'status');
                          setSortOrder(result.order);
                        }}
                      >
                        Status {getSortIcon(sortBy, 'status', sortOrder)}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 bg-gray-50 z-10">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {sortedProducts.map((product: Product) => (
                        <tr key={product.id} className="group hover:bg-gray-50 border-b border-gray-200">
                          <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white group-hover:bg-gray-50 z-10">
                            <input
                              type="checkbox"
                              checked={selectedProductIds.has(product.id)}
                              onChange={() => toggleProductSelection(product.id)}
                              disabled={bulkDeleting || deleteProductMutation.isPending}
                              aria-label={`Select ${product.name}`}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap sticky left-[52px] bg-white group-hover:bg-gray-50 z-10">
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {product.sku}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {product.categories?.[0]?.name || 'Uncategorized'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              {getVariantPriceDisplay(product).display}
                            </div>
                            {product.compareAtPrice && (
                              <div className="text-xs text-gray-500 line-through">
                                ₹{Number(product.compareAtPrice).toFixed(2)}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm ${getStockColor(product.stockQuantity ?? 0)}`}>
                              {product.stockQuantity ?? 0}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={product.status || 'draft'}
                              onChange={(e) => handleStatusChange(product.id, e.target.value)}
                              className={`text-xs px-3 py-1 rounded-full font-semibold ${getStatusColor(
                                product.status || 'draft'
                              )} border-0 cursor-pointer`}
                            >
                              <option value="active">Active</option>
                              <option value="draft">Draft</option>
                              <option value="archived">Archived</option>
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium sticky right-0 bg-white group-hover:bg-gray-50 z-10">
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

              {/* Pagination - Only show when NOT grouping by vendor */}
              {totalPages > 1 && (
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] flex flex-col">
            <div className="p-8 border-b">
              <h2 className="text-2xl font-bold text-gray-900">Edit Product</h2>
            </div>
            <div className="p-8 overflow-y-auto flex-1">
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description
                </label>
                {typeof window !== 'undefined' ? (
                  <ReactQuill
                    theme="snow"
                    value={editFormData.shortDescription}
                    onChange={(value) => {
                      if (value !== editFormData.shortDescription) {
                        setEditFormData({ ...editFormData, shortDescription: value });
                      }
                    }}
                    className="bg-white"
                    placeholder="Brief product summary with links (e.g., See trip details, View itinerary)"
                  />
                ) : (
                  <textarea
                    value={editFormData.shortDescription}
                    onChange={(e) => setEditFormData({ ...editFormData, shortDescription: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Brief product summary (1-2 sentences)"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                {(customPages.length > 0 || linkableProducts.length > 0) && (
                  <div className="mb-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">📌 Quick Links:</p>
                    
                    {customPages.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Custom Pages:</p>
                        <div className="flex flex-wrap gap-2">
                          {customPages.map((page) => (
                            <button
                              key={page.id}
                              type="button"
                              onClick={() => {
                                const link = `/${page.slug}`;
                                navigator.clipboard.writeText(link);
                                showAlert(`Link copied: ${link}\n\nYou can paste this in the description editor.`, 'success');
                              }}
                              className="text-xs px-2 py-1 bg-white border border-blue-300 rounded hover:bg-blue-100 transition"
                              title={`Click to copy link: /${page.slug}`}
                            >
                              📄 {page.title}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {linkableProducts.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-600 mb-1">Products & Tours:</p>
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                          {linkableProducts.map((product) => (
                            <button
                              key={product.id}
                              type="button"
                              onClick={() => {
                                const link = `/products/${product.slug}`;
                                navigator.clipboard.writeText(link);
                                showAlert(`Link copied: ${link}\n\nYou can paste this in the description editor.`, 'success');
                              }}
                              className="text-xs px-2 py-1 bg-white border border-green-300 rounded hover:bg-green-100 transition"
                              title={`Click to copy link: /products/${product.slug}`}
                            >
                              🛍️ {product.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-2">💡 Click to copy link, then paste in the editor using the link button.</p>
                  </div>
                )}
                {typeof window !== 'undefined' ? (
                  <ReactQuill
                    theme="snow"
                    value={editFormData.description}
                    onChange={(value) => {
                      if (value !== editFormData.description) {
                        setEditFormData({ ...editFormData, description: value });
                      }
                    }}
                    className="bg-white"
                  />
                ) : (
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Detailed product description"
                  />
                )}
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


              {/* Tour Attributes - Show for tour products */}

              {(
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
                      <input
                        type="number"
                        value={editFormData.stockQuantity}
                        onChange={(e) => setEditFormData({ ...editFormData, stockQuantity: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
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
              )}



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

              {/* New Product Variants Display & Edit */}
              {editFormData.hasVariants && editFormData.productVariants && editFormData.productVariants.length > 0 && (
                <div className="border-t pt-4">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center gap-2">
                      <span>🎯</span> Product Variants
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">New System</span>
                    </h3>
                    <p className="text-sm text-blue-700 mb-3">
                      This product has {editFormData.productVariants.length} variants with Amazon-style selection. Edit prices and stock below.
                    </p>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white rounded-lg shadow-sm">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Variant Combination</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">SKU</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Price (₹)</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">
                              Compare Price (₹)
                              <span className="block text-xs font-normal text-gray-500 normal-case mt-1">For discount display</span>
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Stock</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Discount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {editFormData.productVariants.map((variant: ProductVariant, index: number) => {
                            const variantPrice = typeof variant.price === 'string' ? parseFloat(variant.price) : variant.price;
                            const variantComparePrice = typeof variant.compareAtPrice === 'string' ? parseFloat(variant.compareAtPrice) : variant.compareAtPrice;
                            const discount = variantComparePrice && variantComparePrice > variantPrice
                              ? Math.round(((variantComparePrice - variantPrice) / variantComparePrice) * 100)
                              : null;
                            
                            return (
                              <tr key={variant.id || index} className="hover:bg-blue-50 transition-colors">
                                <td className="px-4 py-3 text-sm">
                                  <div className="flex flex-wrap gap-1">
                                    {Object.entries(variant.variantAttributes).map(([key, value]) => (
                                      <span key={key} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                        {key}: {value}
                                      </span>
                                    ))}
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="text"
                                    value={variant.sku || ''}
                                    readOnly
                                    className="w-full px-2 py-1 text-xs border rounded bg-gray-50 text-gray-600"
                                    title="SKU cannot be edited"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="number"
                                    value={variant.price || ''}
                                    onChange={(e) => {
                                      const newVariants = [...editFormData.productVariants];
                                      newVariants[index] = { 
                                        ...newVariants[index], 
                                        price: e.target.value ? parseFloat(e.target.value) : undefined as any
                                      };
                                      setEditFormData({ ...editFormData, productVariants: newVariants });
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    step="0.01"
                                    placeholder="Required"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="number"
                                    value={variant.compareAtPrice || ''}
                                    onChange={(e) => {
                                      const newVariants = [...editFormData.productVariants];
                                      newVariants[index] = { 
                                        ...newVariants[index], 
                                        compareAtPrice: e.target.value ? parseFloat(e.target.value) : undefined 
                                      };
                                      setEditFormData({ ...editFormData, productVariants: newVariants });
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    step="0.01"
                                    placeholder="Optional"
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <input
                                    type="number"
                                    value={variant.stockQuantity || 0}
                                    onChange={(e) => {
                                      const newVariants = [...editFormData.productVariants];
                                      newVariants[index] = { ...newVariants[index], stockQuantity: parseInt(e.target.value) || 0 };
                                      setEditFormData({ ...editFormData, productVariants: newVariants });
                                    }}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {discount ? (
                                    <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">
                                      {discount}% OFF
                                    </span>
                                  ) : (
                                    <span className="text-xs text-gray-400">No discount</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-sm text-amber-800 flex items-center gap-2">
                        <span className="text-lg">💡</span>
                        <span><strong>Tip:</strong> Set "Compare Price" higher than "Price" to show discount badges on the product detail page (e.g., Price: ₹100, Compare Price: ₹150 = 33% OFF)</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Product Attributes - Physical products only */}
              {editCategoryFilters.length > 0 && (
                <div className="border-t pt-4 space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded p-3">
                    <h3 className="text-sm font-semibold text-blue-900 mb-1">📋 Product Attributes</h3>
                    <p className="text-xs text-blue-700">
                      Set attributes like {editCategoryFilters.map((f: any) => f.label).slice(0, 3).join(', ')}{editCategoryFilters.length > 3 ? ', etc.' : ''} to help customers filter this product.
                    </p>
                  </div>

                  {editCategoryFilters.map((filter: any) => {
                    const isCustomValue = editProductAttributes[filter.id] === '__custom__';
                    return (
                      <div key={filter.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {filter.label}
                          <span className="text-gray-400 font-normal ml-1">(optional)</span>
                        </label>
                        {(filter.type === 'select' || filter.type === 'checkbox' || filter.type === 'multiselect') && (
                          <div className="space-y-2">
                            <select
                              value={isCustomValue ? '__custom__' : (editProductAttributes[filter.id] || '')}
                              onChange={(e) => {
                                if (e.target.value === '__custom__') {
                                  setEditProductAttributes({
                                    ...editProductAttributes,
                                    [filter.id]: '__custom__',
                                    [`${filter.id}_custom`]: ''
                                  });
                                } else {
                                  const newAttrs = { ...editProductAttributes };
                                  delete newAttrs[`${filter.id}_custom`];
                                  setEditProductAttributes({ ...newAttrs, [filter.id]: e.target.value });
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                              <option value="">Select {filter.label}</option>
                              {filter.options?.map((option: any) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                              ))}
                              <option value="__custom__">➕ Add custom value...</option>
                            </select>
                            {isCustomValue && (
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={editProductAttributes[`${filter.id}_custom`] || ''}
                                  onChange={(e) => setEditProductAttributes({
                                    ...editProductAttributes,
                                    [`${filter.id}_custom`]: e.target.value
                                  })}
                                  placeholder={`Enter custom ${filter.label.toLowerCase()}`}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newAttrs = { ...editProductAttributes };
                                    delete newAttrs[filter.id];
                                    delete newAttrs[`${filter.id}_custom`];
                                    setEditProductAttributes(newAttrs);
                                  }}
                                  className="px-3 py-2 text-red-600 hover:text-red-800 border border-red-300 rounded-lg text-sm"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                        {filter.type === 'range' && (
                          <input
                            type="number"
                            value={editProductAttributes[filter.id] || filter.min || 0}
                            onChange={(e) => setEditProductAttributes({
                              ...editProductAttributes,
                              [filter.id]: parseInt(e.target.value) || 0
                            })}
                            min={filter.min || 0}
                            max={filter.max || 1000}
                            step={filter.step || 1}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Categories */}
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
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-3 sticky bottom-0">
              <button
                onClick={handleSaveEdit}
                disabled={editFormData.hasVariants && editFormData.productVariants.some(v => !v.price || Number(v.price) <= 0)}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                title={editFormData.hasVariants && editFormData.productVariants.some(v => !v.price || Number(v.price) <= 0) ? 'Please fill all variant prices' : ''}
              >
                Save Changes
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition font-semibold"
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



