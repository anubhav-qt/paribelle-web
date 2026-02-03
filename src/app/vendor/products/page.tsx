'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import ThemeRenderer from '@/components/ThemeRenderer';
import CategorySidebar from '@/components/CategorySidebar';
import ImageUpload from '@/components/ImageUpload';
import MultiImageUpload from '@/components/MultiImageUpload';
import { getCurrencySymbol } from '@/lib/currency';
import { getVendorId, isSuperAdmin } from '@/lib/auth';
import { handleSortChange, getSortIcon, compareValues, getSortableHeaderClass, SortOrder } from '@/lib/utils/sorting';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

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
  slug?: string;
  featuredImage?: string;
  images?: string[];
  productType: 'physical' | 'booking';
  categories?: Array<{ id: string; name: string }>;
  isTour?: boolean;
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
    tour?: {
      tourMode: boolean;
      departures: Array<{
        departureDate: string;
        returnDate: string;
        availableSeats: number;
        pricePerPerson: number;
        status: 'available' | 'soldOut' | 'cancelled';
      }>;
      itinerary: Array<{
        day: number;
        title: string;
        description: string;
        activities: string[];
        meals: string[];
        accommodation?: string;
      }>;
      details: {
        destinations: string[];
        tourType: string;
        difficulty: string;
        groupSize: { min: number; max: number };
        inclusions: string[];
        exclusions: string[];
        pickupPoints: Array<{ location: string; time: string }>;
        dropPoints: Array<{ location: string; time: string }>;
        accommodation: string;
        transportation: string;
        languages: string[];
        ageRestriction?: string;
      };
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
  
  // Vendor verification status
  const [vendorStatus, setVendorStatus] = useState<{
    kycStatus: string;
    storeName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    canAddProducts: boolean;
    blockReason: string | null;
  } | null>(null);
  
  // Filtering and sorting states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [customPages, setCustomPages] = useState<Array<{ id: string; title: string; slug: string }>>([]);
  const [linkableProducts, setLinkableProducts] = useState<Array<{ id: string; name: string; slug: string; productType: string; isTour: boolean }>>([]);
  
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
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
      tour: {
        tourMode: false,
        departures: [] as Array<{
          departureDate: string;
          returnDate: string;
          availableSeats: number;
          pricePerPerson: number;
          status: 'active' | 'full' | 'cancelled';
        }>,
        itinerary: [] as Array<{
          day: number;
          title: string;
          description: string;
          activities: string[];
          meals: string[];
          accommodation: string;
        }>,
        details: {
          destinations: [] as string[],
          tourType: '',
          difficulty: 'moderate' as 'easy' | 'moderate' | 'challenging' | 'difficult',
          groupSize: { min: 1, max: 20 },
          inclusions: [] as string[],
          exclusions: [] as string[],
          pickupPoints: [] as Array<{ location: string; time: string }>,
          dropPoints: [] as Array<{ location: string; time: string }>,
          accommodation: '',
          transportation: '',
          languages: [] as string[],
          ageRestriction: '',
        },
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
    
    fetchVendorStatus();
    fetchProducts();
    fetchCategories();
    fetchCustomPages();
    fetchLinkableProducts();
  }, []);

  const fetchVendorStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Super admins don't need vendor status check
      if (isSuperAdmin()) {
        setVendorStatus({
          kycStatus: 'approved',
          storeName: 'Platform Admin',
          contactEmail: 'admin@marketplace.com',
          contactPhone: '+1234567890',
          canAddProducts: true,
          blockReason: null
        });
        return;
      }
      
      const vendorId = getVendorId();
      if (!vendorId) return;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const vendor = await response.json();
        
        // Check if vendor can add products
        const hasBasicSetup = vendor.storeName && vendor.contactEmail && vendor.contactPhone;
        const kycApproved = vendor.kycStatus === 'approved';
        
        let blockReason = null;
        if (!hasBasicSetup) {
          blockReason = 'Please complete your store setup in Vendor Settings before adding products.';
        } else if (!kycApproved) {
          blockReason = `KYC verification required. Your status is: ${vendor.kycStatus}. Complete KYC verification to add products.`;
        }
        
        setVendorStatus({
          kycStatus: vendor.kycStatus,
          storeName: vendor.storeName,
          contactEmail: vendor.contactEmail,
          contactPhone: vendor.contactPhone,
          canAddProducts: hasBasicSetup && kycApproved,
          blockReason,
        });
      }
    } catch (error) {
      console.error('Error fetching vendor status:', error);
    }
  };

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

  const fetchCustomPages = async () => {
    try {
      const token = localStorage.getItem('token');
      const isAdmin = isSuperAdmin();
      
      // For admins, fetch marketplace pages; for vendors, fetch their own pages
      const endpoint = isAdmin 
        ? '/api/v1/marketplace/pages'
        : getVendorId() ? `/api/v1/vendors/${getVendorId()}/pages` : null;
      
      if (!endpoint) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        // Only show published pages
        const publishedPages = data.filter((p: any) => p.status === 'published');
        setCustomPages(publishedPages);
      }
    } catch (error) {
      console.error('Error fetching custom pages:', error);
    }
  };

  const fetchLinkableProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const isAdmin = isSuperAdmin();
      const PLATFORM_VENDOR_ID = '00000000-0000-0000-0000-000000000001';
      const vendorId = isAdmin ? PLATFORM_VENDOR_ID : getVendorId();
      if (!vendorId) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?vendorId=${vendorId}&limit=100&status=active`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        const products = data.products || data;
        const mappedProducts = products.map((p: any) => ({
          id: p.id,
          name: p.name,
          slug: p.slug,
          productType: p.productType,
          isTour: p.productType === 'booking' && p.attributes?.tour?.tourMode === true
        }));
        setLinkableProducts(mappedProducts);
      }
    } catch (error) {
      console.error('Error fetching linkable products:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return;
      }

      const isAdmin = isSuperAdmin();
      const PLATFORM_VENDOR_ID = '00000000-0000-0000-0000-000000000001';
      const vendorId = isAdmin ? PLATFORM_VENDOR_ID : getVendorId();
      
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
        console.log('🔍 Full product fetched:', fullProduct);
        console.log('🔍 Description:', fullProduct.description);
        console.log('🔍 Short Description:', fullProduct.shortDescription);
        setEditingProduct(fullProduct);
        setEditFormData({
          name: fullProduct.name,
          description: fullProduct.description || '',
          shortDescription: fullProduct.shortDescription || '',
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
            tour: {
              tourMode: fullProduct.attributes?.tour?.tourMode || false,
              departures: fullProduct.attributes?.tour?.departures || [],
              itinerary: fullProduct.attributes?.tour?.itinerary || [],
              details: {
                destinations: fullProduct.attributes?.tour?.details?.destinations || [],
                tourType: fullProduct.attributes?.tour?.details?.tourType || '',
                difficulty: fullProduct.attributes?.tour?.details?.difficulty || 'moderate',
                groupSize: fullProduct.attributes?.tour?.details?.groupSize || { min: 1, max: 20 },
                inclusions: fullProduct.attributes?.tour?.details?.inclusions || [],
                exclusions: fullProduct.attributes?.tour?.details?.exclusions || [],
                pickupPoints: fullProduct.attributes?.tour?.details?.pickupPoints || [],
                dropPoints: fullProduct.attributes?.tour?.details?.dropPoints || [],
                accommodation: fullProduct.attributes?.tour?.details?.accommodation || '',
                transportation: fullProduct.attributes?.tour?.details?.transportation || '',
                languages: fullProduct.attributes?.tour?.details?.languages || [],
                ageRestriction: fullProduct.attributes?.tour?.details?.ageRestriction || '',
              },
            },
          },
        });
      } else {
        // Fallback to the product data we already have
        setEditingProduct(product);
        setEditFormData({
          name: product.name,
          description: product.description || '',
          shortDescription: product.shortDescription || '',
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
            tour: {
              tourMode: product.attributes?.tour?.tourMode || false,
              departures: product.attributes?.tour?.departures || [],
              itinerary: product.attributes?.tour?.itinerary || [],
              details: {
                destinations: product.attributes?.tour?.details?.destinations || [],
                tourType: product.attributes?.tour?.details?.tourType || '',
                difficulty: product.attributes?.tour?.details?.difficulty || 'moderate',
                groupSize: product.attributes?.tour?.details?.groupSize || { min: 1, max: 20 },
                inclusions: product.attributes?.tour?.details?.inclusions || [],
                exclusions: product.attributes?.tour?.details?.exclusions || [],
                pickupPoints: product.attributes?.tour?.details?.pickupPoints || [],
                dropPoints: product.attributes?.tour?.details?.dropPoints || [],
                accommodation: product.attributes?.tour?.details?.accommodation || '',
                transportation: product.attributes?.tour?.details?.transportation || '',
                languages: product.attributes?.tour?.details?.languages || [],
                ageRestriction: product.attributes?.tour?.details?.ageRestriction || '',
              },
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
        description: product.description || '',
        shortDescription: product.shortDescription || '',
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
          tour: {
            tourMode: product.attributes?.tour?.tourMode || false,
            departures: product.attributes?.tour?.departures || [],
            itinerary: product.attributes?.tour?.itinerary || [],
            details: {
              destinations: product.attributes?.tour?.details?.destinations || [],
              tourType: product.attributes?.tour?.details?.tourType || '',
              difficulty: product.attributes?.tour?.details?.difficulty || 'moderate',
              groupSize: product.attributes?.tour?.details?.groupSize || { min: 1, max: 20 },
              inclusions: product.attributes?.tour?.details?.inclusions || [],
              exclusions: product.attributes?.tour?.details?.exclusions || [],
              pickupPoints: product.attributes?.tour?.details?.pickupPoints || [],
              dropPoints: product.attributes?.tour?.details?.dropPoints || [],
              accommodation: product.attributes?.tour?.details?.accommodation || '',
              transportation: product.attributes?.tour?.details?.transportation || '',
              languages: product.attributes?.tour?.details?.languages || [],
              ageRestriction: product.attributes?.tour?.details?.ageRestriction || '',
            },
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
      const updateData = {
        ...editFormData,
        status: editingProduct.status,
        slug: editingProduct.slug,
      };
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updateData),
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
      description: '',
      shortDescription: '',
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
        tour: {
          tourMode: false,
          departures: [],
          itinerary: [],
          details: {
            destinations: [],
            tourType: '',
            difficulty: 'moderate',
            groupSize: { min: 1, max: 20 },
            inclusions: [],
            exclusions: [],
            pickupPoints: [],
            dropPoints: [],
            accommodation: '',
            transportation: '',
            languages: [],
            ageRestriction: '',
          },
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
      
      const isAdmin = isSuperAdmin();
      const PLATFORM_VENDOR_ID = '00000000-0000-0000-0000-000000000001';
      const vendorId = isAdmin ? PLATFORM_VENDOR_ID : getVendorId();
      
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
      switch (sortBy) {
        case 'name':
          return compareValues(a.name, b.name, sortOrder);
        case 'price':
          return compareValues(a.price, b.price, sortOrder);
        case 'stock':
          return compareValues(a.stockQuantity, b.stockQuantity, sortOrder);
        default:
          return 0;
      }
    });

  const handleSort = (field: 'name' | 'price' | 'stock') => {
    const result = handleSortChange(sortBy, field, sortOrder);
    setSortBy(result.field);
    setSortOrder(result.order);
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
                  {vendorStatus && !vendorStatus.canAddProducts ? (
                    <div className="relative group">
                      <button
                        disabled
                        className="bg-gray-300 text-gray-500 px-6 py-3 rounded-lg cursor-not-allowed"
                      >
                        + Add Product
                      </button>
                      <div className="absolute right-0 top-full mt-2 w-80 bg-amber-50 border-2 border-amber-300 rounded-lg p-4 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <p className="text-sm text-amber-800 font-semibold mb-2">⚠️ Cannot Add Products</p>
                        <p className="text-sm text-amber-700">{vendorStatus.blockReason}</p>
                      </div>
                    </div>
                  ) : (
                    <Link
                      href="/vendor/products/add"
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                    >
                      + Add Product
                    </Link>
                  )}
                </div>
              </div>
              
              {/* KYC Warning Banner */}
              {vendorStatus && !vendorStatus.canAddProducts && (
                <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-amber-900 mb-1">Action Required</h3>
                      <p className="text-amber-800 mb-2">{vendorStatus.blockReason}</p>
                      <Link
                        href="/vendor/settings"
                        className="inline-block mt-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition"
                      >
                        Go to Settings
                      </Link>
                    </div>
                  </div>
                </div>
              )}
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
              {console.log('📝 Rendering edit modal with editFormData:', editFormData)}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Short Description
                  </label>
                  {console.log('📝 Short Description value:', editFormData.shortDescription)}
                  {typeof window !== 'undefined' ? (
                    <ReactQuill
                      theme="snow"
                      value={editFormData.shortDescription}
                      onChange={(value) => setEditFormData({ ...editFormData, shortDescription: value })}
                      className="bg-white"
                      placeholder="Brief product summary with links (e.g., See trip details, View itinerary)"
                    />
                  ) : (
                    <input
                      type="text"
                      value={editFormData.shortDescription}
                      onChange={(e) => setEditFormData({ ...editFormData, shortDescription: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description (1-2 sentences)"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Description
                  </label>
                  {console.log('📝 Full Description value:', editFormData.description)}
                  {console.log('📝 Window type:', typeof window)}
                  {typeof window !== 'undefined' ? (
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <ReactQuill
                        theme="snow"
                        value={editFormData.description || ''}
                        onChange={(content) => setEditFormData({ ...editFormData, description: content })}
                        modules={{
                          toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline', 'strike'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            [{ 'color': [] }, { 'background': [] }],
                            ['link'],
                            ['clean']
                          ],
                        }}
                        placeholder="Detailed product description with formatting"
                        className="bg-white"
                        style={{ minHeight: '300px' }}
                      />
                    </div>
                  ) : (
                    <textarea
                      value={editFormData.description || ''}
                      onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={6}
                      placeholder="Detailed product description"
                    />
                  )}
                </div>

                {/* Status and Slug */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      value={editingProduct?.status || 'active'}
                      onChange={(e) => {
                        if (editingProduct) {
                          setEditingProduct({ ...editingProduct, status: e.target.value });
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slug (URL)
                    </label>
                    <input
                      type="text"
                      value={editingProduct?.slug || ''}
                      onChange={(e) => {
                        if (editingProduct) {
                          setEditingProduct({ ...editingProduct, slug: e.target.value } as Product);
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="product-url-slug"
                    />
                  </div>
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
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                  >
                    <option value="physical">📦 Physical Product</option>
                    <option value="booking">📅 Booking/Service</option>
                  </select>
                  <p className="text-xs text-yellow-600 mt-1">
                    ⚠️ Product type cannot be changed after creation
                  </p>
                </div>

                {/* Booking Configuration - Only show for non-tour booking products */}
                {editFormData.productType === 'booking' && !editFormData.attributes.tour.tourMode && (
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
                                      ...editFormData.attributes,
                                      booking: {
                                        ...editFormData.attributes.booking,
                                        availableDays: editFormData.attributes.booking.availableDays.filter((d) => d !== day),
                                      },
                                      tour: editFormData.attributes.tour,
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

                {/* Tour Attributes - Show for tour products */}
                {editFormData.productType === 'booking' && editFormData.attributes.tour.tourMode && (
                  <div className="border-t pt-4 space-y-4">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-900 mb-2">🗺️ Tour Package Configuration</h4>
                      <p className="text-sm text-purple-700">Manage tour departures, itinerary, and details</p>
                    </div>

                    {/* Tour Departures */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">Tour Departures</label>
                          <div className="space-y-3">
                            {editFormData.attributes.tour.departures.map((departure, index) => (
                              <div key={index} className="grid grid-cols-5 gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Departure Date</label>
                                  <input
                                    type="date"
                                    value={departure.departureDate}
                                    onChange={(e) => {
                                      const newDepartures = [...editFormData.attributes.tour.departures];
                                      newDepartures[index].departureDate = e.target.value;
                                      setEditFormData({
                                        ...editFormData,
                                        attributes: {
                                          ...editFormData.attributes,
                                          tour: { ...editFormData.attributes.tour, departures: newDepartures },
                                        },
                                      });
                                    }}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Return Date</label>
                                  <input
                                    type="date"
                                    value={departure.returnDate}
                                    onChange={(e) => {
                                      const newDepartures = [...editFormData.attributes.tour.departures];
                                      newDepartures[index].returnDate = e.target.value;
                                      setEditFormData({
                                        ...editFormData,
                                        attributes: {
                                          ...editFormData.attributes,
                                          tour: { ...editFormData.attributes.tour, departures: newDepartures },
                                        },
                                      });
                                    }}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Seats</label>
                                  <input
                                    type="number"
                                    value={departure.availableSeats}
                                    onChange={(e) => {
                                      const newDepartures = [...editFormData.attributes.tour.departures];
                                      newDepartures[index].availableSeats = parseInt(e.target.value) || 0;
                                      setEditFormData({
                                        ...editFormData,
                                        attributes: {
                                          ...editFormData.attributes,
                                          tour: { ...editFormData.attributes.tour, departures: newDepartures },
                                        },
                                      });
                                    }}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                    min="1"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Price/Person</label>
                                  <input
                                    type="number"
                                    value={departure.pricePerPerson}
                                    onChange={(e) => {
                                      const newDepartures = [...editFormData.attributes.tour.departures];
                                      newDepartures[index].pricePerPerson = parseFloat(e.target.value) || 0;
                                      setEditFormData({
                                        ...editFormData,
                                        attributes: {
                                          ...editFormData.attributes,
                                          tour: { ...editFormData.attributes.tour, departures: newDepartures },
                                        },
                                      });
                                    }}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                    min="0"
                                    step="0.01"
                                  />
                                </div>
                                <div className="flex items-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newDepartures = editFormData.attributes.tour.departures.filter((_, i) => i !== index);
                                      setEditFormData({
                                        ...editFormData,
                                        attributes: {
                                          ...editFormData.attributes,
                                          tour: { ...editFormData.attributes.tour, departures: newDepartures },
                                        },
                                      });
                                    }}
                                    className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditFormData({
                                ...editFormData,
                                attributes: {
                                  ...editFormData.attributes,
                                  tour: {
                                    ...editFormData.attributes.tour,
                                    departures: [
                                      ...editFormData.attributes.tour.departures,
                                      { departureDate: '', returnDate: '', availableSeats: 20, pricePerPerson: editFormData.price, status: 'active' as const },
                                    ],
                                  },
                                },
                              });
                            }}
                            className="mt-3 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            + Add Departure
                          </button>
                        </div>

                        {/* Tour Itinerary */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-3">Day-by-Day Itinerary</label>
                          <div className="space-y-4">
                            {editFormData.attributes.tour.itinerary.map((day, index) => (
                              <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-semibold text-gray-900">Day {day.day}</h4>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newItinerary = editFormData.attributes.tour.itinerary.filter((_, i) => i !== index);
                                      const renumbered = newItinerary.map((d, i) => ({ ...d, day: i + 1 }));
                                      setEditFormData({
                                        ...editFormData,
                                        attributes: {
                                          ...editFormData.attributes,
                                          tour: { ...editFormData.attributes.tour, itinerary: renumbered },
                                        },
                                      });
                                    }}
                                    className="text-red-600 hover:text-red-800 text-sm"
                                  >
                                    Remove Day
                                  </button>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Day Title</label>
                                    <input
                                      type="text"
                                      value={day.title}
                                      onChange={(e) => {
                                        const newItinerary = [...editFormData.attributes.tour.itinerary];
                                        newItinerary[index].title = e.target.value;
                                        setEditFormData({
                                          ...editFormData,
                                          attributes: {
                                            ...editFormData.attributes,
                                            tour: { ...editFormData.attributes.tour, itinerary: newItinerary },
                                          },
                                        });
                                      }}
                                      placeholder="e.g., Arrival in Delhi"
                                      className="w-full px-3 py-2 border border-gray-300 rounded"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                                    <textarea
                                      value={day.description}
                                      onChange={(e) => {
                                        const newItinerary = [...editFormData.attributes.tour.itinerary];
                                        newItinerary[index].description = e.target.value;
                                        setEditFormData({
                                          ...editFormData,
                                          attributes: {
                                            ...editFormData.attributes,
                                            tour: { ...editFormData.attributes.tour, itinerary: newItinerary },
                                          },
                                        });
                                      }}
                                      placeholder="Describe the day's activities"
                                      rows={3}
                                      className="w-full px-3 py-2 border border-gray-300 rounded"
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditFormData({
                                ...editFormData,
                                attributes: {
                                  ...editFormData.attributes,
                                  tour: {
                                    ...editFormData.attributes.tour,
                                    itinerary: [
                                      ...editFormData.attributes.tour.itinerary,
                                      { day: editFormData.attributes.tour.itinerary.length + 1, title: '', description: '', activities: [], meals: [], accommodation: '' },
                                    ],
                                  },
                                },
                              });
                            }}
                            className="mt-3 text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            + Add Day
                          </button>
                        </div>

                        {/* Tour Details - Collapsed by default */}
                        <details className="border border-gray-200 rounded-lg">
                          <summary className="cursor-pointer p-3 bg-gray-50 hover:bg-gray-100 font-medium text-gray-900">
                            📋 Additional Tour Details (Click to expand)
                          </summary>
                          <div className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Destinations (comma-separated)</label>
                                <input
                                  type="text"
                                  value={editFormData.attributes.tour.details.destinations.join(', ')}
                                  onChange={(e) => {
                                    setEditFormData({
                                      ...editFormData,
                                      attributes: {
                                        ...editFormData.attributes,
                                        tour: {
                                          ...editFormData.attributes.tour,
                                          details: {
                                            ...editFormData.attributes.tour.details,
                                            destinations: e.target.value.split(',').map(d => d.trim()).filter(d => d),
                                          },
                                        },
                                      },
                                    });
                                  }}
                                  placeholder="e.g., Delhi, Agra, Jaipur"
                                  className="w-full px-3 py-2 border border-gray-300 rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Tour Type</label>
                                <input
                                  type="text"
                                  value={editFormData.attributes.tour.details.tourType}
                                  onChange={(e) => {
                                    setEditFormData({
                                      ...editFormData,
                                      attributes: {
                                        ...editFormData.attributes,
                                        tour: {
                                          ...editFormData.attributes.tour,
                                          details: { ...editFormData.attributes.tour.details, tourType: e.target.value },
                                        },
                                      },
                                    });
                                  }}
                                  placeholder="e.g., Adventure, Cultural"
                                  className="w-full px-3 py-2 border border-gray-300 rounded"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Difficulty Level</label>
                                <select
                                  value={editFormData.attributes.tour.details.difficulty}
                                  onChange={(e) => {
                                    setEditFormData({
                                      ...editFormData,
                                      attributes: {
                                        ...editFormData.attributes,
                                        tour: {
                                          ...editFormData.attributes.tour,
                                          details: { ...editFormData.attributes.tour.details, difficulty: e.target.value },
                                        },
                                      },
                                    });
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded"
                                >
                                  <option value="easy">Easy</option>
                                  <option value="moderate">Moderate</option>
                                  <option value="challenging">Challenging</option>
                                  <option value="difficult">Difficult</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Group Size</label>
                                <div className="flex gap-2 items-center">
                                  <input
                                    type="number"
                                    value={editFormData.attributes.tour.details.groupSize.min}
                                    onChange={(e) => {
                                      setEditFormData({
                                        ...editFormData,
                                        attributes: {
                                          ...editFormData.attributes,
                                          tour: {
                                            ...editFormData.attributes.tour,
                                            details: {
                                              ...editFormData.attributes.tour.details,
                                              groupSize: { ...editFormData.attributes.tour.details.groupSize, min: parseInt(e.target.value) || 1 },
                                            },
                                          },
                                        },
                                      });
                                    }}
                                    placeholder="Min"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded"
                                    min="1"
                                  />
                                  <span className="text-gray-500">to</span>
                                  <input
                                    type="number"
                                    value={editFormData.attributes.tour.details.groupSize.max}
                                    onChange={(e) => {
                                      setEditFormData({
                                        ...editFormData,
                                        attributes: {
                                          ...editFormData.attributes,
                                          tour: {
                                            ...editFormData.attributes.tour,
                                            details: {
                                              ...editFormData.attributes.tour.details,
                                              groupSize: { ...editFormData.attributes.tour.details.groupSize, max: parseInt(e.target.value) || 20 },
                                            },
                                          },
                                        },
                                      });
                                    }}
                                    placeholder="Max"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded"
                                    min="1"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </details>
                      </div>
                  </div>
                )}

                {/* Physical Product Specific Fields */}
                {editFormData.productType === 'physical' && (
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

                {/* Booking Product Info */}
                {editFormData.productType === 'booking' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>ℹ️ Booking Product:</strong> Stock quantity and SKU are not applicable for booking/tour products. 
                      Availability is managed through booking configuration and time slots.
                    </p>
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
  );
}
