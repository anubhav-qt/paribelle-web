'use client';

import { useEffect, useState, Fragment } from 'react';
import Link from 'next/link';
import ImageUpload from '@/components/ImageUpload';
import MultiImageUpload from '@/components/MultiImageUpload';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminProducts, useUpdateProductStatus, useDeleteProduct } from '@/hooks/useAdminProducts';
import ThemeRenderer from '@/components/ThemeRenderer';
import { getImageUrl } from '@/lib/image-url';

interface ProductVariant {
  id: string;
  sku: string;
  variantAttributes: Record<string, string>;
  price: number;
  compareAtPrice?: number;
  stockQuantity: number;
  isActive: boolean;
}

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
  // Variation support (legacy)
  isParent?: boolean;
  parentProductId?: string;
  variations?: Product[];
  variationAttributes?: Record<string, string>;
  variationThemes?: string[];
  // Product variants support (new)
  hasVariants?: boolean;
  variantOptions?: any[];
  productVariants?: ProductVariant[];
}

export default function AdminProductsPage() {
  const { isAuthenticated, loading: authLoading } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupBy, setGroupBy] = useState<'none' | 'vendor'>('vendor');
  const [collapsedVendors, setCollapsedVendors] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  
  // Use React Query for products
  const { data: productsData, isLoading: loading, refetch: refetchProducts } = useAdminProducts({
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
  const [importMessageExpanded, setImportMessageExpanded] = useState(true);
  const [sortField, setSortField] = useState<'name' | 'price' | 'stockQuantity' | 'createdAt' | 'status'>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Listen for refetch event from import
  useEffect(() => {
    const handleRefetch = () => {
      refetchProducts();
    };
    window.addEventListener('refetchProducts', handleRefetch);
    return () => window.removeEventListener('refetchProducts', handleRefetch);
  }, [refetchProducts]);
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
    productVariants: [] as ProductVariant[],
    variantOptions: [] as any[],
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
        refetchProducts();
        setSelectedProducts(new Set());
      } else {
        const error = await response.json();
        alert(`Failed to delete product: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Failed to delete product. Please try again.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) {
      alert('Please select products to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedProducts.size} product(s)?`)) return;

    try {
      const token = localStorage.getItem('token');
      const promises = Array.from(selectedProducts).map(id =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
      );

      const results = await Promise.all(promises);
      const failed = results.filter(r => !r.ok).length;

      if (failed === 0) {
        alert(`Successfully deleted ${selectedProducts.size} product(s)`);
      } else {
        alert(`Deleted ${selectedProducts.size - failed} product(s), ${failed} failed`);
      }

      refetchProducts();
      setSelectedProducts(new Set());
      setSelectAll(false);
    } catch (error) {
      alert('Failed to delete products. Please try again.');
    }
  };

  const handleSelectProduct = (id: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedProducts(newSelected);
    setSelectAll(newSelected.size === products.length && products.length > 0);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts(new Set());
      setSelectAll(false);
    } else {
      setSelectedProducts(new Set(products.map((p: Product) => p.id)));
      setSelectAll(true);
    }
  };

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateStatusMutation.mutateAsync({ productId: id, status: newStatus });
    } catch (error: any) {
      alert(`Failed to update status: ${error.message || 'Unknown error'}`);
    }
  };

  const handleEdit = async (product: Product) => {
    // Fetch full product details including variants
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
        setEditFormData({
          name: fullProduct.name,
          price: fullProduct.price,
          compareAtPrice: fullProduct.compareAtPrice || 0,
          stockQuantity: fullProduct.stockQuantity,
          sku: fullProduct.sku,
          featuredImage: fullProduct.featuredImage || '',
          images: fullProduct.images || [],
          productType: fullProduct.productType || 'physical',
          hasVariants: fullProduct.hasVariants || fullProduct.isParent || false,
          variations: fullProduct.variations || [],
          variationThemes: fullProduct.variationThemes || [],
          productVariants: fullProduct.productVariants || [],
          variantOptions: fullProduct.variantOptions || [],
        });
      } else {
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
          hasVariants: product.hasVariants || product.isParent || false,
          variations: product.variations || [],
          variationThemes: product.variationThemes || [],
          productVariants: product.productVariants || [],
          variantOptions: product.variantOptions || [],
        });
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      // Fallback to using the product from the list
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
        hasVariants: product.hasVariants || product.isParent || false,
        variations: product.variations || [],
        variationThemes: product.variationThemes || [],
        productVariants: product.productVariants || [],
        variantOptions: product.variantOptions || [],
      });
    }
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
        // Refetch products using React Query
        window.location.reload();
      } else {
        const error = await response.json();
        alert(`Failed to update product: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Save error:', error);
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
      productVariants: [],
      variantOptions: [],
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
      window.location.reload();
      alert('Product created successfully!');
    } catch (error) {
      alert(`Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getSortedProducts = (productList: Product[]) => {
    return [...productList].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      // Handle special cases
      if (sortField === 'createdAt') {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      } else if (sortField === 'price' || sortField === 'stockQuantity') {
        aVal = Number(aVal) || 0;
        bVal = Number(bVal) || 0;
      } else if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal?.toLowerCase() || '';
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });
  };

  const groupProductsByVendor = () => {
    const grouped = new Map<string, { vendor: any; products: Product[] }>();

    const sortedProducts = getSortedProducts(products);

    sortedProducts.forEach((product: Product) => {
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

    // Reset file input
    event.target.value = '';

    try {
      setImporting(true);
      setImportMessage(null);
      
      const token = localStorage.getItem('token');

      const formData = new FormData();
      formData.append('file', file);

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
        // Build success message with details
        let successMsg = `Import successful! Created: ${result.created}, Updated: ${result.updated}`;
        
        // Add information about auto-created categories
        if (result.createdCategories && result.createdCategories.length > 0) {
          successMsg += `\nAuto-created categories: ${result.createdCategories.join(', ')}`;
        }
        
        // Add error details if any
        if (result.errors && result.errors.length > 0) {
          successMsg += `\n\nWarnings/Errors (${result.errors.length}):\n`;
          result.errors.slice(0, 10).forEach((err: any) => {
            // Handle both string errors and object errors
            const errorText = typeof err === 'string' ? err : (err.error || JSON.stringify(err));
            successMsg += `- ${errorText}\n`;
          });
          if (result.errors.length > 10) {
            successMsg += `... and ${result.errors.length - 10} more errors\n`;
          }
        }
        
        setImportMessage({
          type: 'success',
          text: successMsg,
        });
        
        // Refresh products list without page reload to keep message visible
        if (result.created > 0 || result.updated > 0) {
          // Refetch products data using React Query
          window.dispatchEvent(new Event('refetchProducts'));
        }
      } else {
        // Build detailed error message
        let errorMsg = result.message || 'Failed to import products';
        
        if (result.errors && result.errors.length > 0) {
          errorMsg += '\n\nDetailed Errors:\n';
          result.errors.slice(0, 15).forEach((err: any) => {
            // Handle both string errors and object errors
            if (typeof err === 'string') {
              errorMsg += `${err}\n`;
            } else {
              const sheetInfo = err.sheet ? `[${err.sheet}]` : '';
              const rowInfo = err.row ? ` Row ${err.row}` : '';
              errorMsg += `${sheetInfo}${rowInfo}: ${err.error || err.message || JSON.stringify(err)}\n`;
            }
          });
          if (result.errors.length > 15) {
            errorMsg += `\n... and ${result.errors.length - 15} more errors`;
          }
          errorMsg += '\n\nPlease correct these issues in your Excel file and try again.';
        }
        
        setImportMessage({
          type: 'error',
          text: errorMsg,
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setImportMessage({ 
        type: 'error', 
        text: `Failed to import products: ${errorMessage}\n\nPlease check the file format and try again.` 
      });
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const handleDownloadTemplate = async () => {
    // Create dummy images as base64-encoded PNGs (simple colored rectangles)
    const createDummyImage = (color: string, label: string): string => {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Fill background
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 800, 600);
        
        // Add label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 400, 300);
      }
      
      return canvas.toDataURL('image/jpeg', 0.8);
    };

    // Load required libraries from CDN
    const loadScript = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = false;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load ${src}`));
        document.head.appendChild(script);
      });
    };

    try {
      // Load JSZip and ExcelJS if not already loaded
      if (!(window as any).JSZip) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
      }
      if (!(window as any).ExcelJS) {
        await loadScript('https://cdn.jsdelivr.net/npm/exceljs@4.3.0/dist/exceljs.min.js');
      }

      const ExcelJS = (window as any).ExcelJS;
      const JSZip = (window as any).JSZip;

      // Create Excel workbook using ExcelJS
      const workbook = new ExcelJS.Workbook();

      // Add Electronics sheet
      const sampleSheet = workbook.addWorksheet('Electronics');
      sampleSheet.columns = [
        { header: 'Product Name', key: 'name', width: 30 },
        { header: 'Description', key: 'description', width: 50 },
        { header: 'Images (comma-separated filenames)', key: 'images', width: 35 },
        { header: 'Has Variants', key: 'hasVariants', width: 15 },
        { header: 'Price', key: 'price', width: 15 },
        { header: 'Compare At Price (Optional)', key: 'compareAtPrice', width: 20 },
        { header: 'Stock Quantity', key: 'stock', width: 15 },
        { header: 'Status (active/draft/archived)', key: 'status', width: 25 },
        { header: 'Variant Count', key: 'variantCount', width: 15 },
        { header: 'HSN Code', key: 'hsnCode', width: 15 },
        { header: 'SAC Code', key: 'sacCode', width: 15 },
        { header: 'GST Rate (%)', key: 'gstRate', width: 15 },
        { header: 'Price Type', key: 'priceType', width: 20 },
        { header: 'Product Type', key: 'productType', width: 15 },
        { header: 'Booking Duration', key: 'bookingDuration', width: 18 },
        { header: 'Booking Duration Unit', key: 'bookingDurationUnit', width: 22 },
        { header: 'Booking Buffer Time', key: 'bookingBufferTime', width: 20 },
        { header: 'Booking Available Days', key: 'bookingAvailableDays', width: 35 },
        { header: 'Booking Time Slots', key: 'bookingTimeSlots', width: 30 },
      ];

      // Style header row
      sampleSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      sampleSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

      // Add sample data
      sampleSheet.addRow({
        name: 'Wireless Headphones',
        description: 'Premium noise-cancelling wireless headphones with 30-hour battery life',
        images: 'headphones1.jpg, headphones2.jpg',
        hasVariants: 'NO',
        price: 2499,
        compareAtPrice: 3499,
        stock: 50,
        status: 'active',
        variantCount: '',
        hsnCode: '8518',
        sacCode: '',
        gstRate: 18,
        priceType: 'mrp_with_gst',
        productType: 'physical',
        bookingDuration: '',
        bookingDurationUnit: '',
        bookingBufferTime: '',
        bookingAvailableDays: '',
        bookingTimeSlots: '',
      });

      sampleSheet.addRow({
        name: 'Conference Room - Per Day',
        description: 'Book our premium conference room for full day. Includes projector, whiteboard, and high-speed WiFi. Available 9 AM to 6 PM',
        images: 'conference1.jpg, conference2.jpg',
        hasVariants: 'NO',
        price: 2500,
        compareAtPrice: 3000,
        stock: 0,
        status: 'active',
        variantCount: '',
        hsnCode: '',
        sacCode: '9996',
        gstRate: 18,
        priceType: 'mrp_with_gst',
        productType: 'booking',
        bookingDuration: 1,
        bookingDurationUnit: 'days',
        bookingBufferTime: 0,
        bookingAvailableDays: 'monday,tuesday,wednesday,thursday,friday',
        bookingTimeSlots: '09:00-18:00',
      });

      sampleSheet.addRow({
        name: 'Cotton T-Shirt',
        description: 'Premium cotton t-shirt available in multiple sizes and colors. 100% cotton, comfortable fit',
        images: 'tshirt1.jpg, tshirt2.jpg',
        hasVariants: 'YES',
        price: '399 - 499',
        compareAtPrice: 699,
        stock: 0,
        status: 'active',
        variantCount: 5,
        hsnCode: '6109',
        sacCode: '',
        gstRate: 12,
        priceType: 'mrp_with_gst',
        productType: 'physical',
        bookingDuration: '',
        bookingDurationUnit: '',
        bookingBufferTime: '',
        bookingAvailableDays: '',
        bookingTimeSlots: '',
      });

      // Add Product Variants sheet
      const variantsSheet = workbook.addWorksheet('Product Variants');
      variantsSheet.columns = [
        { header: 'Product Name', key: 'productName', width: 30 },
        { header: 'Variant Name', key: 'variantName', width: 30 },
        { header: 'SKU', key: 'sku', width: 20 },
        { header: 'Size', key: 'size', width: 15 },
        { header: 'Color', key: 'color', width: 15 },
        { header: 'Price', key: 'price', width: 15 },
        { header: 'Compare At Price', key: 'compareAtPrice', width: 18 },
        { header: 'Stock Quantity', key: 'stock', width: 15 },
        { header: 'Is Active', key: 'isActive', width: 12 },
      ];

      variantsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
      variantsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

      variantsSheet.addRows([
        { productName: 'Cotton T-Shirt', variantName: 'Small - Red', sku: 'TSHIRT-S-RED', size: 'S', color: 'Red', price: 399, compareAtPrice: 699, stock: 10, isActive: 'YES' },
        { productName: 'Cotton T-Shirt', variantName: 'Medium - Red', sku: 'TSHIRT-M-RED', size: 'M', color: 'Red', price: 449, compareAtPrice: 699, stock: 15, isActive: 'YES' },
        { productName: 'Cotton T-Shirt', variantName: 'Large - Blue', sku: 'TSHIRT-L-BLUE', size: 'L', color: 'Blue', price: 499, compareAtPrice: 699, stock: 12, isActive: 'YES' },
        { productName: 'Cotton T-Shirt', variantName: 'Large - Black', sku: 'TSHIRT-L-BLACK', size: 'L', color: 'Black', price: 499, compareAtPrice: 699, stock: 20, isActive: 'YES' },
        { productName: 'Cotton T-Shirt', variantName: 'XL - Black', sku: 'TSHIRT-XL-BLACK', size: 'XL', color: 'Black', price: 499, compareAtPrice: 699, stock: 8, isActive: 'YES' },
      ]);

      // Add Instructions sheet
      const instructionsSheet = workbook.addWorksheet('Instructions');
      instructionsSheet.columns = [{ header: 'Instructions', key: 'text', width: 100 }];
      
      const instructions = [
        '=== PRODUCT IMPORT TEMPLATE - COMPLETE GUIDE ===',
        '',
        '📦 WHAT YOU NEED TO CREATE:',
        '1. This Excel file (rename to "products.xlsx")',
        '2. A folder named "images" with your product photos',
        '3. A ZIP file containing both items above',
        '',
        '📋 COLUMN EXPLANATIONS:',
        '',
        'Product Name: Unique name for your product',
        'Description: Full product details (supports line breaks)',
        'Images: Comma-separated list of filenames from images folder',
        'Has Variants: "YES" for products with sizes/colors, "NO" for simple products',
        'Price: Selling price (or price range like "399 - 499" for variant products)',
        'Stock Quantity: Available stock (use 0 for booking products)',
        'Status: "active", "draft", or "archived"',
        'HSN Code: For goods - will auto-fill GST rate',
        'SAC Code: For services - will auto-fill GST rate',
        'GST Rate: Tax percentage (auto-filled from HSN/SAC if empty)',
        'Price Type: "mrp_with_gst", "selling_price_with_gst", or "selling_price_without_gst"',
        'Product Type: "physical" or "booking"',
        '',
        '🏨 BOOKING PRODUCT FIELDS (only for Product Type = "booking"):',
        'Booking Duration: Number (e.g., 1, 2, 60, 120)',
        'Booking Duration Unit: "minutes", "hours", or "days"',
        'Booking Buffer Time: Minutes between bookings (e.g., 15)',
        'Booking Available Days: Comma-separated: monday,tuesday,wednesday,thursday,friday,saturday,sunday',
        'Booking Time Slots: Format as "START-END" like "09:00-18:00" or "09:00-12:00,14:00-18:00" for multiple slots',
        '',
        '📦 PRODUCT TYPES IN DETAIL:',
        '',
        '1️⃣ SIMPLE PHYSICAL PRODUCT (Wireless Headphones):',
        '   ✓ Has Variants = NO',
        '   ✓ Product Type = physical',
        '   ✓ Fill Price and Stock Quantity',
        '   ✓ List image filenames: headphones1.jpg, headphones2.jpg',
        '',
        '2️⃣ BOOKING PRODUCT (Conference Room):',
        '   ✓ Has Variants = NO',
        '   ✓ Product Type = booking',
        '   ✓ Stock Quantity = 0 (bookings don\'t use stock)',
        '   ✓ Fill all "Booking" columns',
        '',
        '3️⃣ PRODUCT WITH VARIANTS (T-Shirt):',
        '   ✓ Has Variants = YES',
        '   ✓ Product Type = physical',
        '   ✓ Main row shows price range: "399 - 499"',
        '   ✓ Define variants in "Product Variants" sheet',
        '',
        '⚠️ IMPORTANT NOTES:',
        '• Excel filename MUST be "products.xlsx"',
        '• Images folder MUST be named "images" (lowercase)',
        '• Do NOT modify the _ID column (used for updates)',
        '• Sheet names become categories',
        '',
        '💡 PRO TIPS:',
        '✓ Export existing products first to see real examples',
        '✓ Test with 1-2 products first',
        '✓ Image sizes: 800x800px or larger recommended',
        '',
        'Need help? Export existing products to see more examples!',
      ];

      instructions.forEach(text => {
        const row = instructionsSheet.addRow({ text });
        if (text.includes('===') || text.includes('📦') || text.includes('🏨') || text.includes('1️⃣') || text.includes('2️⃣') || text.includes('3️⃣') || text.includes('⚠️') || text.includes('💡')) {
          row.font = { bold: true, color: { argb: 'FF2C5282' } };
        }
        row.alignment = { vertical: 'top', wrapText: true };
      });

      // Generate Excel buffer
      const excelBuffer = await workbook.xlsx.writeBuffer();

      // Create ZIP with Excel and images
      const zip = new JSZip();
      zip.file('products.xlsx', excelBuffer);

      // Create images folder and add dummy images
      const imagesFolder = zip.folder('images');
      
      const imageConfigs = [
        { name: 'headphones1.jpg', color: '#2196F3', label: 'Wireless Headphones' },
        { name: 'headphones2.jpg', color: '#1976D2', label: 'Headphones - Side View' },
        { name: 'conference1.jpg', color: '#4CAF50', label: 'Conference Room' },
        { name: 'conference2.jpg', color: '#388E3C', label: 'Conference Room Setup' },
        { name: 'tshirt1.jpg', color: '#FF5722', label: 'Cotton T-Shirt' },
        { name: 'tshirt2.jpg', color: '#E64A19', label: 'T-Shirt - Back View' },
      ];

      imageConfigs.forEach(img => {
        const dataUrl = createDummyImage(img.color, img.label);
        const base64Data = dataUrl.split(',')[1];
        imagesFolder?.file(img.name, base64Data, { base64: true });
      });

      // Generate ZIP and download
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'products-template.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert('✅ Template ZIP Downloaded!\n\n' +
        '📦 Package includes:\n' +
        '  • products.xlsx (proper Excel format)\n' +
        '  • images/ folder with 6 dummy photos\n' +
        '  • Complete instructions sheet\n\n' +
        '📋 READY TO IMPORT:\n' +
        '1. Extract the ZIP to review\n' +
        '2. Edit products.xlsx as needed\n' +
        '3. Replace dummy images with real photos (optional)\n' +
        '4. Re-zip if you made changes\n' +
        '5. Import via "Import from ZIP" button\n\n' +
        '💡 The Excel file is now in proper XLSX format!\n' +
        'Dummy images are colored placeholders - replace with real photos for best results.');
    } catch (error) {
      console.error('Error creating template:', error);
      alert('❌ Error creating template. Please try again or check browser console for details.');
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

  const getPriceDisplay = (product: Product) => {
    // If product has variants, show variant price range
    if (product.hasVariants && product.productVariants && product.productVariants.length > 0) {
      const prices = product.productVariants
        .map(v => v.price)
        .filter(p => p !== undefined && p !== null && p > 0);
      
      if (prices.length === 0) return { display: '₹0.00', isRange: false };
      
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      
      if (minPrice === maxPrice) {
        return { display: `₹${minPrice.toFixed(2)}`, isRange: false };
      }
      return { display: `₹${minPrice.toFixed(2)} - ₹${maxPrice.toFixed(2)}`, isRange: true };
    }
    
    // Regular product price
    return { display: `₹${Number(product.price || 0).toFixed(2)}`, isRange: false };
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
      <ThemeRenderer component="header" />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-[1800px] mx-auto">
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
              onClick={handleDownloadTemplate}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              📄 Download Template
            </button>
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
          <div className={`mb-6 rounded-lg border ${
            importMessage.type === 'success' 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between p-4">
              <div className={`font-semibold ${
                importMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {importMessage.type === 'success' ? '✓ Import Result' : '✗ Import Failed'}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setImportMessageExpanded(!importMessageExpanded)}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    importMessage.type === 'success'
                      ? 'bg-green-200 text-green-800 hover:bg-green-300'
                      : 'bg-red-200 text-red-800 hover:bg-red-300'
                  }`}
                  title={importMessageExpanded ? 'Collapse' : 'Expand'}
                >
                  {importMessageExpanded ? '▲' : '▼'}
                </button>
                <button
                  onClick={() => setImportMessage(null)}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    importMessage.type === 'success'
                      ? 'bg-green-200 text-green-800 hover:bg-green-300'
                      : 'bg-red-200 text-red-800 hover:bg-red-300'
                  }`}
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>
            {importMessageExpanded && (
              <div className={`px-4 pb-4 border-t ${
                importMessage.type === 'success' ? 'border-green-200 text-green-800' : 'border-red-200 text-red-800'
              }`}>
                <pre className="whitespace-pre-wrap font-sans text-sm mt-3">{importMessage.text}</pre>
              </div>
            )}
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
              {products.filter((p: Product) => p.status === 'active').length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Low Stock</div>
            <div className="text-2xl font-bold text-orange-600">
              {products.filter((p: Product) => p.stockQuantity < 10 && p.stockQuantity > 0).length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Out of Stock</div>
            <div className="text-2xl font-bold text-red-600">
              {products.filter((p: Product) => p.stockQuantity === 0).length}
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
              {/* Bulk Actions Bar */}
              {selectedProducts.size > 0 && (
                <div className="px-6 py-3 bg-blue-50 border-b border-blue-200 flex items-center justify-between">
                  <div className="text-sm text-blue-900">
                    {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected
                  </div>
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Delete Selected
                  </button>
                </div>
              )}

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
                <table className="min-w-full w-full border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-3 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          className="rounded border-gray-300"
                        />
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('name')}
                      >
                        <div className="flex items-center gap-1">
                          Product
                          {sortField === 'name' && (
                            <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('price')}
                      >
                        <div className="flex items-center gap-1">
                          Price
                          {sortField === 'price' && (
                            <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('stockQuantity')}
                      >
                        <div className="flex items-center gap-1">
                          Stock
                          {sortField === 'stockQuantity' && (
                            <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center gap-1">
                          Created Date
                          {sortField === 'createdAt' && (
                            <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center gap-1">
                          Status
                          {sortField === 'status' && (
                            <span className="text-blue-600">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                              <td colSpan={11} className="px-6 py-3">
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
                                <td className="px-3 py-4 whitespace-nowrap">
                                  <input
                                    type="checkbox"
                                    checked={selectedProducts.has(product.id)}
                                    onChange={() => handleSelectProduct(product.id)}
                                    className="rounded border-gray-300"
                                  />
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    {product.featuredImage ? (
                                      <img
                                        src={getImageUrl(product.featuredImage)}
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
                                    {getPriceDisplay(product).display}
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                  {new Date(product.createdAt).toLocaleDateString()}
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
                      products.map((product: Product) => (
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
                              {getPriceDisplay(product).display}
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(product.createdAt).toLocaleDateString()}
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
                            const discount = variant.compareAtPrice && variant.compareAtPrice > variant.price
                              ? Math.round(((variant.compareAtPrice - variant.price) / variant.compareAtPrice) * 100)
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
                disabled={editFormData.hasVariants && editFormData.productVariants.some(v => !v.price || v.price <= 0)}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                title={editFormData.hasVariants && editFormData.productVariants.some(v => !v.price || v.price <= 0) ? 'Please fill all variant prices' : ''}
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
