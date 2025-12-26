'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Settings, ChevronRight, Package } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  children?: Category[];
  filterConfig?: {
    filters: any[];
  };
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/root`);
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const hasFilters = category.filterConfig?.filters && category.filterConfig.filters.length > 0;
    
    return (
      <div key={category.id}>
        <div 
          className={`flex items-center justify-between p-4 border-b hover:bg-gray-50 transition-colors ${
            level > 0 ? 'bg-gray-50 ml-' + (level * 8) : ''
          }`}
        >
          <div className="flex items-center gap-3 flex-1">
            {level > 0 && (
              <div className="flex items-center text-gray-400">
                <ChevronRight className="w-4 h-4" />
              </div>
            )}
            <Package className={`w-5 h-5 ${level > 0 ? 'text-gray-400' : 'text-blue-600'}`} />
            <div>
              <h3 className={`font-medium ${level > 0 ? 'text-sm' : 'text-base'}`}>
                {category.name}
              </h3>
              <p className="text-xs text-gray-500">{category.slug}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasFilters ? (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                {category.filterConfig!.filters.length} filters
              </span>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                No filters
              </span>
            )}
            <Link
              href={`/admin/categories/${category.id}/filters`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Configure Filters
            </Link>
          </div>
        </div>
        
        {/* Render subcategories */}
        {category.children && category.children.length > 0 && (
          <div>
            {category.children.map((child) => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
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
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/admin"
                className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Categories Management</h1>
              <p className="text-gray-600 mt-1">Configure filters for each category</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/categories/manage"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Settings className="w-5 h-5" />
                Manage Categories
              </Link>
              <Link
                href="/admin"
                className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back to Admin
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold text-lg">All Categories</h2>
            <p className="text-sm text-gray-600 mt-1">
              Click "Configure Filters" to set up filtering options for products in each category
            </p>
          </div>
          
          {categories.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No categories found</p>
            </div>
          ) : (
            <div>
              {categories.map((category) => renderCategory(category))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
