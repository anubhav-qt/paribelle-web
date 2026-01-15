'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import ThemeRenderer from '@/components/ThemeRenderer';
import CategorySidebar from '@/components/CategorySidebar';
import { Plus, Edit2, Trash2, ChevronRight, Folder, Settings } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  vendorId: string | null;
  children?: Category[];
}

export default function VendorCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    parentId: '',
    sortOrder: 0,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        router.push('/login');
        return;
      }
      
      const userData = JSON.parse(userStr);
      const vendorId = userData.vendorId;
      
      if (!vendorId) {
        alert('No vendor account found');
        router.push('/vendor/dashboard');
        return;
      }
      
      // Fetch vendor-specific categories (tree structure)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/vendor/${vendorId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
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

  // Flatten categories for parent selection dropdown
  const flattenCategories = (cats: Category[], result: Category[] = []): Category[] => {
    cats.forEach(cat => {
      result.push(cat);
      if (cat.children) {
        flattenCategories(cat.children, result);
      }
    });
    return result;
  };

  const allCategories = flattenCategories(categories);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!userStr) {
        router.push('/login');
        return;
      }
      
      const userData = JSON.parse(userStr);
      const vendorId = userData.vendorId;
      
      const url = editingCategory
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/${editingCategory.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories`;
      
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          vendorId, // Associate with vendor
          isActive: true,
        }),
      });
      
      if (response.ok) {
        setShowAddModal(false);
        setEditingCategory(null);
        setFormData({ name: '', slug: '', description: '', parentId: '', sortOrder: 0 });
        fetchCategories();
      } else {
        alert('Failed to save category');
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category');
    }
  };

  const handleEdit = (category: Category) => {
    // Only allow editing vendor's own categories (vendorId not null)
    if (!category.vendorId) {
      alert('You can only edit your own categories. Global categories cannot be modified.');
      return;
    }
    
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parentId: '',
      sortOrder: category.sortOrder,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    // Find the category to check if it's vendor-owned
    const findCategory = (cats: Category[]): Category | null => {
      for (const cat of cats) {
        if (cat.id === id) return cat;
        if (cat.children) {
          const found = findCategory(cat.children);
          if (found) return found;
        }
      }
      return null;
    };
    
    const categoryToDelete = findCategory(categories);
    if (!categoryToDelete?.vendorId) {
      alert('You can only delete your own categories. Global categories cannot be deleted.');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/categories/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        fetchCategories();
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const renderCategory = (category: Category, level: number = 0) => {
    const isVendorOwned = category.vendorId !== null;
    
    return (
      <div key={category.id} className="mb-2">
        <div
          className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
          style={{ marginLeft: `${level * 24}px` }}
        >
          <div className="flex items-center gap-3">
            <Folder className={`w-5 h-5 ${isVendorOwned ? 'text-blue-500' : 'text-gray-400'}`} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium">{category.name}</h3>
                {!isVendorOwned && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                    Global
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">{category.slug}</p>
              {category.description && (
                <p className="text-xs text-gray-400 mt-1">{category.description}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/vendor/categories/${category.id}/filters`}
              className={`p-2 rounded transition-colors ${
                isVendorOwned 
                  ? 'text-purple-600 hover:bg-purple-50' 
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              title={isVendorOwned ? "Manage Filters" : "Cannot modify global category filters"}
              onClick={(e) => !isVendorOwned && e.preventDefault()}
            >
              <Settings className="w-5 h-5" />
            </Link>
            <button
              onClick={() => handleEdit(category)}
              className={`p-2 rounded transition-colors ${
                isVendorOwned 
                  ? 'text-blue-600 hover:bg-blue-50' 
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              disabled={!isVendorOwned}
              title={isVendorOwned ? "Edit Category" : "Cannot edit global categories"}
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={() => handleDelete(category.id)}
              className={`p-2 rounded transition-colors ${
                isVendorOwned 
                  ? 'text-red-600 hover:bg-red-50' 
                  : 'text-gray-400 cursor-not-allowed'
              }`}
              disabled={!isVendorOwned}
              title={isVendorOwned ? "Delete Category" : "Cannot delete global categories"}
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
        {category.children && category.children.map(child => renderCategory(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ThemeRenderer component="header" showLocationFilter={false} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* <CategorySidebar /> */}
          <div className="flex-1 max-w-7xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Link
                  href="/vendor/dashboard"
                  className="text-blue-600 hover:text-blue-800 text-sm inline-block mb-2"
                >
                  ← Back to Dashboard
                </Link>
            <h1 className="text-3xl font-bold">My Categories</h1>
            <p className="text-gray-600 mt-1">
              Manage your custom categories and view global categories
            </p>
            <p className="text-sm text-gray-500 mt-1">
              💡 You can only edit/delete categories you created. Global categories are read-only.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingCategory(null);
              setFormData({ name: '', slug: '', description: '', parentId: '', sortOrder: 0 });
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Category
          </button>
        </div>

        {/* Help Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg mb-6">
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Beginner's Guide</h3>
                <p className="text-sm text-gray-600">Learn how to create and manage product categories</p>
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
              {/* What are Categories */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">📁</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">What are Categories?</h4>
                    <p className="text-gray-700 mb-3">
                      Categories help organize your products into logical groups, making it easier for customers to find what they need. 
                      Think of them like folders on your computer - you can have main categories and sub-categories within them.
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                      <p className="text-sm font-medium text-blue-800 mb-2">📝 Examples of Category Structures:</p>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li><strong>Clothing →</strong> Men's Wear → Shirts, Pants, Shoes</li>
                        <li><strong>Electronics →</strong> Mobile Phones, Laptops, Accessories</li>
                        <li><strong>Food →</strong> Snacks → Chips, Cookies, Candy</li>
                        <li><strong>Sports →</strong> Cricket → Bats, Balls, Protective Gear</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Global vs Custom Categories */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🌍</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Global vs Custom Categories</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded border border-gray-200">
                        <p className="font-medium text-gray-700 mb-2">🌐 Global Categories</p>
                        <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                          <li>Shared across all vendors</li>
                          <li>Cannot be edited or deleted by you</li>
                          <li>Marked with "Global" badge</li>
                          <li>Use these for standard product types</li>
                        </ul>
                      </div>
                      <div className="p-3 bg-blue-50 rounded border border-blue-200">
                        <p className="font-medium text-blue-700 mb-2">📋 Your Custom Categories</p>
                        <ul className="text-sm text-blue-600 space-y-1 list-disc list-inside">
                          <li>Created specifically for your store</li>
                          <li>Can edit, delete, and manage filters</li>
                          <li>Blue folder icon indicates yours</li>
                          <li>Perfect for unique product types</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Creating Categories */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">➕</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Creating a New Category</h4>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                        <p className="text-gray-700">Click the <strong>"+ Add Category"</strong> button in the top right</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                        <p className="text-gray-700">Enter a <strong>Name</strong> (e.g., "Custom T-Shirts"). The slug will auto-generate (e.g., "custom-t-shirts")</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                        <p className="text-gray-700"><strong>(Optional)</strong> Add a description to explain what products belong in this category</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                        <p className="text-gray-700"><strong>(Optional)</strong> Select a <strong>Parent Category</strong> to make this a subcategory (e.g., T-Shirts under Clothing)</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">5</span>
                        <p className="text-gray-700">Set <strong>Sort Order</strong> (lower numbers appear first, e.g., 1, 2, 3...)</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">6</span>
                        <p className="text-gray-700">Click <strong>"Create Category"</strong> or <strong>"Update Category"</strong></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Managing Filters */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">⚙️</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Managing Category Filters</h4>
                    <p className="text-gray-700 mb-3">
                      Filters help customers narrow down products within a category. For example, in a "Shirts" category, 
                      you might have filters for Size (S, M, L, XL), Color (Red, Blue, Green), and Brand.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                        <p className="text-gray-700">Click the <strong>⚙️ Settings</strong> icon next to your custom category</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                        <p className="text-gray-700">Add filter attributes (e.g., "Size", "Color", "Material")</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                        <p className="text-gray-700">For each attribute, add possible values (e.g., Size: Small, Medium, Large)</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="bg-purple-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                        <p className="text-gray-700">When adding products to this category, you can select these filter values</p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-amber-50 rounded border border-amber-200">
                      <p className="text-sm font-medium text-amber-800 mb-2">⚠️ Note:</p>
                      <p className="text-sm text-amber-700">You can only manage filters for YOUR custom categories. Global categories' filters are managed by administrators.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hierarchical Structure */}
              <div className="bg-white rounded-lg p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">🌲</span>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Creating Category Hierarchy</h4>
                    <p className="text-gray-700 mb-3">
                      You can nest categories to create a tree structure. This helps organize products logically and improves customer navigation.
                    </p>
                    <div className="p-3 bg-gray-50 rounded border border-gray-200 font-mono text-sm">
                      <div className="text-gray-700">
                        📁 <strong>Clothing</strong> (Main Category)<br />
                        &nbsp;&nbsp;└─ 📁 Men's Wear (Sub-category)<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─ 👕 Shirts (Sub-sub-category)<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─ 👖 Pants<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─ 👞 Shoes<br />
                        &nbsp;&nbsp;└─ 📁 Women's Wear<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─ 👗 Dresses<br />
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└─ 👠 Heels
                      </div>
                    </div>
                    <div className="mt-3 p-3 bg-green-50 rounded border border-green-200">
                      <p className="text-sm font-medium text-green-800 mb-2">💡 Best Practice:</p>
                      <p className="text-sm text-green-700">Keep hierarchy to 2-3 levels maximum. Too many levels make navigation confusing for customers.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Common Mistakes */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-5 border border-red-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span>⚠️</span> Common Mistakes to Avoid
                </h4>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Too many categories:</strong> Having 50+ categories overwhelms customers. Group similar items together.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Vague names:</strong> "Miscellaneous" or "Other" categories are not helpful. Be specific (e.g., "Office Supplies").</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Duplicate categories:</strong> Don't create "T-Shirts" and "Tshirts" separately. Use one consistent name.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Empty categories:</strong> Don't create categories you won't use. Create them as you add products.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">✗</span>
                    <span><strong>Ignoring sort order:</strong> Random ordering confuses customers. Use logical order (e.g., main categories first).</span>
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
                    <span>Start with broad categories, add subcategories later</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Use global categories when they fit your products</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Create custom categories for unique product types</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Add filters to help customers find products quickly</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Use descriptive, clear category names</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <span>Assign products to the most specific category</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <Folder className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Categories Yet</h3>
            <p className="text-gray-600 mb-4">Create your first category to organize your products</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Category
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {categories.map(category => renderCategory(category))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Category Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          name: e.target.value,
                          slug: generateSlug(e.target.value),
                        });
                      }}
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Electronics"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Slug *</label>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., electronics"
                    />
                    <p className="text-xs text-gray-500 mt-1">URL-friendly version of the name</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief description of the category..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Parent Category</label>
                    <select
                      value={formData.parentId}
                      onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None (Root Category)</option>
                      {allCategories
                        .filter(cat => cat.id !== editingCategory?.id) // Don't allow selecting itself
                        .map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.name}
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select a parent to create a subcategory
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sort Order</label>
                    <input
                      type="number"
                      value={formData.sortOrder}
                      onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Lower numbers appear first
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-6">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {editingCategory ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingCategory(null);
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
