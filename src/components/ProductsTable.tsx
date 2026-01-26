'use client';

import { useState } from 'react';
import { handleSortChange, getSortIcon, compareValues, getSortableHeaderClass, SortOrder } from '@/lib/utils/sorting';
import ProductEditModal from './ProductEditModal';
import { getCurrencySymbol } from '@/lib/currency';

interface Product {
  id: string;
  name: string;
  description?: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  status: string;
  sku: string;
  featuredImage?: string;
  images?: string[];
  productType: 'physical' | 'booking';
  categories?: Array<{ id: string; name: string }>;
  vendor?: {
    id: string;
    storeName: string;
    businessName: string;
  };
  isParent?: boolean;
  variations?: Product[];
}

interface ProductsTableProps {
  products: Product[];
  currency?: string;
  onEdit: (product: Product) => Promise<void>;
  onDelete: (productId: string) => Promise<void>;
  onStatusChange?: (productId: string, status: string) => Promise<void>;
  showVendor?: boolean;
  loading?: boolean;
}

export default function ProductsTable({
  products,
  currency = 'INR',
  onEdit,
  onDelete,
  onStatusChange,
  showVendor = false,
  loading = false,
}: ProductsTableProps) {
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const currencySymbol = getCurrencySymbol(currency);

  const handleSort = (field: 'name' | 'price' | 'stock' | 'status') => {
    const result = handleSortChange(sortBy, field, sortOrder);
    setSortBy(result.field);
    setSortOrder(result.order);
  };

  const filteredAndSortedProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return compareValues(a.name, b.name, sortOrder);
        case 'price':
          return compareValues(a.price, b.price, sortOrder);
        case 'stock':
          return compareValues(a.stockQuantity, b.stockQuantity, sortOrder);
        case 'status':
          return compareValues(a.status, b.status, sortOrder);
        default:
          return 0;
      }
    });

  const handleEditClick = async (product: Product) => {
    // Fetch full product details
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${product.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const fullProduct = await response.json();
        setEditingProduct(fullProduct);
      } else {
        setEditingProduct(product);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      setEditingProduct(product);
    }
  };

  const handleSaveEdit = async (formData: any) => {
    if (!editingProduct) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await onEdit(editingProduct);
        setEditingProduct(null);
        alert('Product updated successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to update: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Update error:', error);
      alert('Failed to update product. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th 
                  className={getSortableHeaderClass(sortBy === 'name')}
                  onClick={() => handleSort('name')}
                >
                  Product {getSortIcon(sortBy, 'name', sortOrder)}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                {showVendor && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th 
                  className={getSortableHeaderClass(sortBy === 'price')}
                  onClick={() => handleSort('price')}
                >
                  Price {getSortIcon(sortBy, 'price', sortOrder)}
                </th>
                <th 
                  className={getSortableHeaderClass(sortBy === 'stock')}
                  onClick={() => handleSort('stock')}
                >
                  Stock {getSortIcon(sortBy, 'stock', sortOrder)}
                </th>
                <th 
                  className={getSortableHeaderClass(sortBy === 'status')}
                  onClick={() => handleSort('status')}
                >
                  Status {getSortIcon(sortBy, 'status', sortOrder)}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAndSortedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {product.featuredImage && (
                        <img
                          src={product.featuredImage}
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded mr-3"
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        {product.isParent && (
                          <span className="text-xs text-blue-600">
                            {product.variations?.length || 0} variants
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.productType === 'booking' ? '📅 Booking' : '📦 Physical'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.sku || '-'}
                  </td>
                  {showVendor && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.vendor?.businessName || product.vendor?.storeName || '-'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.categories?.[0]?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {currencySymbol}{product.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {product.productType === 'booking' ? (
                      <span className="text-gray-400">N/A</span>
                    ) : (
                      <span className={product.stockQuantity < 10 ? 'text-red-600 font-semibold' : ''}>
                        {product.stockQuantity}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={product.status}
                      onChange={(e) => onStatusChange?.(product.id, e.target.value)}
                      className={`text-xs px-2 py-1 rounded-full border-0 font-semibold ${
                        product.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : product.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                      disabled={!onStatusChange}
                    >
                      <option value="active">Active</option>
                      <option value="draft">Draft</option>
                      <option value="archived">Archived</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditClick(product)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this product?')) {
                          onDelete(product.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAndSortedProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No products found</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingProduct && (
        <ProductEditModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleSaveEdit}
        />
      )}
    </>
  );
}
