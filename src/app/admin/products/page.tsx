'use client';

import { useEffect, useState, Fragment } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import JSZip from 'jszip';
import ImageUpload from '@/components/ImageUpload';
import MultiImageUpload from '@/components/MultiImageUpload';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useAdminProducts, useUpdateProductStatus, useDeleteProduct } from '@/hooks/useAdminProducts';
import ThemeRenderer from '@/components/ThemeRenderer';
import { handleSortChange, getSortIcon, compareValues, getSortableHeaderClass, SortOrder } from '@/lib/utils/sorting';
import { Product, ProductVariant } from '@/types/product';
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

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function AdminProductsPage() {
  const { isAuthenticated, loading: authLoading } = useAdminAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [groupBy, setGroupBy] = useState<'none' | 'vendor'>('vendor');
  const [collapsedVendors, setCollapsedVendors] = useState<Set<string>>(new Set());
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
    groupBy,
  });
  
  const products = productsData?.products || [];
  const totalProducts = productsData?.total || 0;
  
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
  const [vendors, setVendors] = useState<Array<{ id: string; storeName: string }>>([]);
  const [customPages, setCustomPages] = useState<Array<{ id: string; title: string; slug: string }>>([]);
  const [linkableProducts, setLinkableProducts] = useState<Array<{ id: string; name: string; slug: string; productType: string; isTour: boolean }>>([]);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
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
    fetchVendors();
    fetchCustomPages(); // Load marketplace pages by default
    fetchLinkableProducts(); // Load products for linking
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

  const fetchCustomPages = async (vendorId?: string) => {
    try {
      const token = localStorage.getItem('token');
      
      // For admin, fetch both marketplace pages and vendor pages if vendorId is provided
      const response = await fetch(
        vendorId 
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}/pages`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/v1/marketplace/pages`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        // Only show published pages
        const publishedPages = data.filter((p: any) => p.status === 'published');
        setCustomPages(publishedPages);
      }
    } catch (error) {
      console.error('Error fetching custom pages:', error);
      setCustomPages([]);
    }
  };

  const fetchLinkableProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?limit=100&status=active`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        const products = data.products || data;
        // Map products with tour detection
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await deleteProductMutation.mutateAsync(id);
      setSelectedProductIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      alert('Product deleted successfully!');
    } catch (error) {
      alert('Failed to delete product. Please try again.');
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
      alert('Please select at least one product to delete.');
      return;
    }

    const selectedIds = Array.from(selectedProductIds);
    const confirmed = confirm(
      `Are you sure you want to delete ${selectedIds.length} selected product${selectedIds.length > 1 ? 's' : ''}?`
    );
    if (!confirmed) return;

    setBulkDeleting(true);
    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) => deleteProductMutation.mutateAsync(id))
      );

      const successCount = results.filter((r) => r.status === 'fulfilled').length;
      const failedCount = results.length - successCount;

      setSelectedProductIds(new Set());

      if (failedCount === 0) {
        alert(`Deleted ${successCount} product${successCount !== 1 ? 's' : ''} successfully.`);
      } else {
        alert(`Deleted ${successCount} product${successCount !== 1 ? 's' : ''}. ${failedCount} failed.`);
      }
    } catch (error) {
      alert('Bulk delete failed. Please try again.');
    } finally {
      setBulkDeleting(false);
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
        // Fetch custom pages - vendor pages if product has vendor, otherwise marketplace pages
        fetchCustomPages(fullProduct.vendor?.id);
        setEditFormData(productToFormData(fullProduct));
      } else {
        setEditingProduct(product);
        // Fetch custom pages - vendor pages if product has vendor, otherwise marketplace pages
        fetchCustomPages(product.vendor?.id);
        setEditFormData(productToFormData(product));
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      // Fallback to using the product from the list
      setEditingProduct(product);
      // Fetch custom pages - vendor pages if product has vendor, otherwise marketplace pages
      fetchCustomPages(product.vendor?.id);
      setEditFormData(productToFormData(product));
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
    setEditFormData(getEmptyFormData());
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

  const groupProductsByVendor = () => {
    const grouped = new Map<string, { vendor: any; products: Product[] }>();

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

  const downloadTourTemplate = async () => {
    try {
      setExporting(true);
      
      // Create CSV content for tour template with local file references
      const csvContent = `Tour Name,Price,Compare At Price,Short Description,Description,Departure Date 1,Return Date 1,Available Seats 1,Price Per Person 1,Departure Date 2,Return Date 2,Available Seats 2,Price Per Person 2,Day 1 Title,Day 1 Description,Day 1 Activities,Day 1 Meals,Day 1 Accommodation,Day 2 Title,Day 2 Description,Day 2 Activities,Day 2 Meals,Day 2 Accommodation,Day 3 Title,Day 3 Description,Day 3 Activities,Day 3 Meals,Day 3 Accommodation,Destinations,Tour Type,Difficulty,Group Min,Group Max,Inclusions,Exclusions,Accommodation Type,Transportation,Languages,Age Restriction,Pickup Points,Drop Points,Featured Image,Image 1,Image 2,Image 3,Image 4
Golden Triangle Tour,25000,30000,"Explore Delhi Agra Jaipur in 5 days","<p>Experience the best of North India with our comprehensive Golden Triangle tour package.</p>",2024-12-01,2024-12-05,20,25000,2024-12-15,2024-12-19,20,25000,Arrival in Delhi,Welcome to Delhi! Check into hotel and evening at leisure,City orientation|Welcome dinner,Dinner,3-star hotel,Agra Sightseeing,Visit Taj Mahal and Agra Fort,Taj Mahal visit|Agra Fort tour|Local market,Breakfast|Lunch|Dinner,3-star hotel,Jaipur Exploration,Explore the Pink City,Amber Fort|City Palace|Hawa Mahal,Breakfast|Lunch|Dinner,3-star hotel,"Delhi, Agra, Jaipur",Cultural,Moderate,2,25,"Accommodation|Transportation|Tour guide|Entry fees|Breakfast and dinner","International flights|Personal expenses|Travel insurance|Lunch on some days",3-star hotels twin sharing,AC coach,English|Hindi,12+ years,"Delhi Airport|09:00|Connaught Place|10:00","Delhi Airport|18:00|Connaught Place|19:00",images/tour1.jpg,images/tour1-1.jpg,images/tour1-2.jpg,images/tour1-3.jpg,images/tour1-4.jpg
Himalayan Adventure Trek,35000,40000,"7-day trekking adventure in Himalayas","<p>Experience breathtaking mountain views and challenging trails in this week-long Himalayan adventure.</p>",2024-11-01,2024-11-07,15,35000,2024-11-15,2024-11-21,15,35000,Base Camp Arrival,Trek to base camp and acclimatization,Trek to base camp|Evening bonfire,Breakfast|Dinner,Camping,High Altitude Trek,Reach high altitude viewpoints,Mountain climbing|Photography,Breakfast|Packed lunch|Dinner,Camping,Summit Day,Early morning summit attempt,Summit climb|Sunrise viewing,Breakfast|Energy bars,Mountain hut,"Manali, Rohtang Pass, Solang Valley",Adventure,Challenging,4,15,"Camping equipment|Trekking guide|All meals|Safety equipment|Permits","Personal trekking gear|Insurance|Tips|Personal expenses",Camping and mountain huts,Jeep to base camp then trekking,English|Hindi,18+ years,"Manali Bus Stand|06:00","Manali Bus Stand|18:00",images/trek1.jpg,images/trek1-1.jpg,images/trek1-2.jpg,images/trek1-3.jpg,images/trek1-4.jpg`;

      // Create README with instructions
      const readmeContent = `# Tour Template Package

This package contains a CSV template and sample images for importing tours.

## How to Use

1. **Edit the CSV file**: Open tour-template.csv in Excel or any spreadsheet application
2. **Add Your Images**: Place your tour images in the 'images' folder
3. **Import Your Tours**: Go to Admin Products page and click "Import Tours" button

## CSV Column Reference

See TOUR_TEMPLATE_WITH_IMAGES.md for detailed documentation.

---
Generated by Marketplace Platform - Admin
`;

      // Create ZIP file
      const zip = new JSZip();
      zip.file('tour-template.csv', csvContent);
      zip.file('README.md', readmeContent);
      const imagesFolder = zip.folder('images');
      
      // Helper function to create placeholder image
      const createPlaceholderImage = (width: number, height: number, text: string, bgColor: string) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, width, height);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 48px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, width / 2, height / 2 - 30);
          ctx.font = '24px Arial';
          ctx.fillText(`${width}x${height}`, width / 2, height / 2 + 30);
        }
        return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      };
      
      // Add placeholder images
      const placeholderImages = [
        { name: 'tour1.jpg', text: 'Golden Triangle', color: '#3b82f6' },
        { name: 'tour1-1.jpg', text: 'Taj Mahal', color: '#8b5cf6' },
        { name: 'tour1-2.jpg', text: 'Agra Fort', color: '#ec4899' },
        { name: 'tour1-3.jpg', text: 'Jaipur Palace', color: '#f59e0b' },
        { name: 'tour1-4.jpg', text: 'Hawa Mahal', color: '#10b981' },
        { name: 'trek1.jpg', text: 'Himalayan Trek', color: '#6366f1' },
        { name: 'trek1-1.jpg', text: 'Base Camp', color: '#14b8a6' },
        { name: 'trek1-2.jpg', text: 'Mountain View', color: '#06b6d4' },
        { name: 'trek1-3.jpg', text: 'Summit', color: '#84cc16' },
        { name: 'trek1-4.jpg', text: 'Trek Path', color: '#f97316' },
      ];
      
      placeholderImages.forEach(img => {
        const imageData = createPlaceholderImage(1200, 800, img.text, img.color);
        imagesFolder?.file(img.name, imageData, { base64: true });
      });
      
      imagesFolder?.file('README.txt', 
        `Sample placeholder images included. Replace with your actual photos.\n\nSupported formats: JPG, PNG, WebP\nRecommended size: 1200x800px or larger\n\nReference them in the CSV as: images/filename.jpg`
      );
      
      // Generate ZIP
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tour-template-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setExporting(false);
    } catch (error) {
      console.error('Error creating tour template:', error);
      alert('Failed to generate tour template package');
      setExporting(false);
    }
  };

  const handleTourImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      setImporting(true);
      setImportMessage(null);
      
      const token = localStorage.getItem('token');
      const PLATFORM_VENDOR_ID = '00000000-0000-0000-0000-000000000001';
      
      // Separate CSV file and image files
      let csvFile: File | null = null;
      const imageFiles: { [key: string]: File } = {};
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.endsWith('.csv')) {
          csvFile = file;
        } else if (file.type.startsWith('image/')) {
          const normalizedName = file.name.toLowerCase().replace(/\\/g, '/');
          imageFiles[normalizedName] = file;
          imageFiles[`images/${normalizedName}`] = file;
        }
      }
      
      if (!csvFile) {
        setImportMessage({ type: 'error', text: 'No CSV file found. Please select a CSV file.' });
        setImporting(false);
        return;
      }

      // Using centralized uploadImage from @/lib/utils/upload
      const { uploadImage } = await import('@/lib/utils/upload');

      // Read CSV file
      const text = await csvFile.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',');
      
      let created = 0;
      let errors = [];

      // Process each tour (skip header)
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        try {
          const values = lines[i].split(',');
          const tour: any = {};
          
          headers.forEach((header, index) => {
            tour[header.trim()] = values[index]?.trim() || '';
          });

          // Build departures array
          const departures = [];
          for (let d = 1; d <= 10; d++) {
            const depDate = tour[`Departure Date ${d}`];
            const retDate = tour[`Return Date ${d}`];
            if (depDate && retDate) {
              departures.push({
                departureDate: depDate,
                returnDate: retDate,
                availableSeats: parseInt(tour[`Available Seats ${d}`]) || 20,
                pricePerPerson: parseFloat(tour[`Price Per Person ${d}`]) || parseFloat(tour.Price) || 0,
                status: 'active',
              });
            }
          }

          // Build itinerary array
          const itinerary = [];
          for (let day = 1; day <= 10; day++) {
            const title = tour[`Day ${day} Title`];
            if (title) {
              itinerary.push({
                day: day,
                title: title,
                description: tour[`Day ${day} Description`] || '',
                activities: tour[`Day ${day} Activities`] ? tour[`Day ${day} Activities`].split('|') : [],
                meals: tour[`Day ${day} Meals`] ? tour[`Day ${day} Meals`].split('|') : [],
                accommodation: tour[`Day ${day} Accommodation`] || '',
              });
            }
          }

          // Build images array - handle both URLs and local file references
          const images = [];
          const imageColumns = ['Featured Image', 'Featured Image URL'];
          for (let img = 1; img <= 10; img++) {
            imageColumns.push(`Image ${img}`, `Image ${img} URL`);
          }
          
          for (const col of imageColumns) {
            const imgPath = tour[col];
            if (!imgPath) continue;
            
            if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
              images.push(imgPath);
            } else {
              const normalizedPath = imgPath.toLowerCase().replace(/\\/g, '/');
              const fileName = normalizedPath.split('/').pop() || '';
              const matchedFile = imageFiles[normalizedPath] || imageFiles[fileName] || imageFiles[`images/${fileName}`];
              
              if (matchedFile) {
                try {
                  const uploadedUrl = await uploadImage(matchedFile, token || '');
                  images.push(uploadedUrl);
                  delete imageFiles[normalizedPath];
                  delete imageFiles[fileName];
                  delete imageFiles[`images/${fileName}`];
                } catch (uploadError) {
                  console.warn(`Failed to upload ${imgPath}:`, uploadError);
                }
              }
            }
          }

          // Build pickup/drop points
          const pickupPoints = tour['Pickup Points'] ? 
            tour['Pickup Points'].split('|').map((p: string) => {
              const [location, time] = p.split('|');
              return { location: location || p, time: time || '09:00' };
            }) : [];

          const dropPoints = tour['Drop Points'] ? 
            tour['Drop Points'].split('|').map((p: string) => {
              const [location, time] = p.split('|');
              return { location: location || p, time: time || '18:00' };
            }) : [];

          // Create product payload
          const productData = {
            name: tour['Tour Name'],
            price: parseFloat(tour.Price) || 0,
            compareAtPrice: tour['Compare At Price'] ? parseFloat(tour['Compare At Price']) : undefined,
            shortDescription: tour['Short Description'] || '',
            description: tour.Description || '',
            productType: 'booking',
            status: 'active',
            stockQuantity: 0,
            sku: `TOUR-${Date.now()}-${i}`,
            vendorId: PLATFORM_VENDOR_ID,
            images: images,
            attributes: {
              tour: {
                tourMode: true,
                departures: departures,
                itinerary: itinerary,
                details: {
                  destinations: tour.Destinations ? tour.Destinations.split('|') : [],
                  tourType: tour['Tour Type'] || '',
                  difficulty: tour.Difficulty || 'moderate',
                  groupSize: {
                    min: parseInt(tour['Group Min']) || 1,
                    max: parseInt(tour['Group Max']) || 20,
                  },
                  inclusions: tour.Inclusions ? tour.Inclusions.split('|') : [],
                  exclusions: tour.Exclusions ? tour.Exclusions.split('|') : [],
                  pickupPoints: pickupPoints,
                  dropPoints: dropPoints,
                  accommodation: tour['Accommodation Type'] || '',
                  transportation: tour.Transportation || '',
                  languages: tour.Languages ? tour.Languages.split('|') : [],
                  ageRestriction: tour['Age Restriction'] || '',
                },
              },
            },
          };

          // Submit to API
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(productData),
          });

          if (response.ok) {
            created++;
          } else {
            const errorData = await response.json();
            errors.push(`Row ${i + 1}: ${errorData.message || 'Failed'}`);
          }
        } catch (rowError) {
          console.error(`Error processing row ${i + 1}:`, rowError);
          const errorMessage = rowError instanceof Error ? rowError.message : 'Unknown error';
          errors.push(`Row ${i + 1}: ${errorMessage}`);
        }
      }

      // Show results
      if (created > 0) {
        setImportMessage({
          type: 'success',
          text: `Import successful! Created ${created} tour(s).${
            errors.length > 0 ? ` Errors: ${errors.length}` : ''
          }`,
        });
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setImportMessage({
          type: 'error',
          text: `Import failed. ${errors.length > 0 ? errors.join(', ') : 'No tours created.'}`,
        });
      }
    } catch (error) {
      console.error('Tour import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setImportMessage({ type: 'error', text: 'Failed to import tours: ' + errorMessage });
    } finally {
      setImporting(false);
      event.target.value = '';
    }
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
        window.location.reload();
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <ThemeRenderer component="header" />
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
            {/* Tour Import/Export Buttons */}
            <div className="flex gap-2 border-r pr-3">
              <button
                onClick={downloadTourTemplate}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
                title="Download tour template package with CSV and image folder"
                disabled={exporting}
              >
                <span>📦</span>
                <span>{exporting ? 'Creating...' : 'Tour Template'}</span>
              </button>
              <label className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 cursor-pointer text-sm flex items-center gap-2">
                <span>🗺️</span>
                <span>{importing ? 'Importing...' : 'Import Tours'}</span>
                <input
                  type="file"
                  accept=".csv,image/*"
                  onChange={handleTourImport}
                  disabled={importing}
                  className="hidden"
                  multiple
                  title="Select CSV file and image files together (Ctrl/Cmd + Click to select multiple)"
                />
              </label>
            </div>

            {/* Regular Product Import/Export Buttons */}
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
              {products.filter((p: Product) => p.status === 'active').length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Low Stock</div>
            <div className="text-2xl font-bold text-orange-600">
              {products.filter((p: Product) => (p.stockQuantity ?? 0) < 10 && (p.stockQuantity ?? 0) > 0).length}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Out of Stock</div>
            <div className="text-2xl font-bold text-red-600">
              {products.filter((p: Product) => (p.stockQuantity ?? 0) === 0).length}
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
                        <input
                          type="checkbox"
                          checked={areAllVisibleSelected}
                          onChange={(e) => handleSelectAllVisible(e.target.checked)}
                          disabled={bulkDeleting || deleteProductMutation.isPending}
                          aria-label="Select all products"
                        />
                      </th>
                      <th
                        className={getSortableHeaderClass(sortBy === 'name')}
                        onClick={() => {
                          const result = handleSortChange(sortBy, 'name', sortOrder);
                          setSortBy(result.field as 'name' | 'price' | 'stock' | 'status');
                          setSortOrder(result.order);
                        }}
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
                              <td colSpan={9} className="px-6 py-3">
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
                                  <input
                                    type="checkbox"
                                    checked={selectedProductIds.has(product.id)}
                                    onChange={() => toggleProductSelection(product.id)}
                                    disabled={bulkDeleting || deleteProductMutation.isPending}
                                    aria-label={`Select ${product.name}`}
                                  />
                                </td>
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
                      sortedProducts.map((product: Product) => (
                        <tr key={product.id} className="hover:bg-gray-50 border-b border-gray-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedProductIds.has(product.id)}
                              onChange={() => toggleProductSelection(product.id)}
                              disabled={bulkDeleting || deleteProductMutation.isPending}
                              aria-label={`Select ${product.name}`}
                            />
                          </td>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Short Description
                </label>
                {typeof window !== 'undefined' ? (
                  <ReactQuill
                    theme="snow"
                    value={editFormData.shortDescription}
                    onChange={(value) => setEditFormData({ ...editFormData, shortDescription: value })}
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
                                alert(`Link copied: ${link}\n\nYou can paste this in the description editor.`);
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
                                const link = product.isTour ? `/tours/${product.slug}` : `/products/${product.slug}`;
                                navigator.clipboard.writeText(link);
                                alert(`Link copied: ${link}\n\nYou can paste this in the description editor.`);
                              }}
                              className="text-xs px-2 py-1 bg-white border border-green-300 rounded hover:bg-green-100 transition"
                              title={`Click to copy link: ${product.isTour ? `/tours/${product.slug}` : `/products/${product.slug}`}`}
                            >
                              {product.isTour ? '🗺️' : '🛍️'} {product.name}
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
                    onChange={(value) => setEditFormData({ ...editFormData, description: value })}
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
              {editFormData.productType === 'booking' && !editFormData.attributes.tour?.tourMode && (
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
                              ...editFormData.attributes,
                              booking: {
                                ...editFormData.attributes.booking!,
                                durationUnit: unit.value as 'hours' | 'days' | 'sessions',
                                duration: unit.value === 'days' ? 1440 : unit.value === 'hours' ? 60 : 60,
                              },
                            },
                          })}
                          className={`p-3 border-2 rounded-lg text-left ${
                            editFormData.attributes.booking!.durationUnit === unit.value
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
                        {editFormData.attributes.booking!.durationUnit === 'days'
                          ? 'Duration (days) *'
                          : editFormData.attributes.booking!.durationUnit === 'hours'
                          ? 'Duration (hours) *'
                          : 'Duration (minutes) *'}
                      </label>
                      <input
                        type="number"
                        value={
                          editFormData.attributes.booking!.durationUnit === 'days'
                            ? Math.floor(editFormData.attributes.booking!.duration / 1440)
                            : editFormData.attributes.booking!.durationUnit === 'hours'
                            ? Math.floor(editFormData.attributes.booking!.duration / 60)
                            : editFormData.attributes.booking!.duration
                        }
                        onChange={(e) => {
                          const value = e.target.value === '' ? '' : parseInt(e.target.value);
                          if (value === '') {
                            setEditFormData({
                              ...editFormData,
                              attributes: {
                                ...editFormData.attributes,
                                booking: { ...editFormData.attributes.booking!, duration: 0 },
                              },
                            });
                          } else {
                            const minutes = editFormData.attributes.booking!.durationUnit === 'days'
                              ? value * 1440
                              : editFormData.attributes.booking!.durationUnit === 'hours'
                              ? value * 60
                              : value;
                            setEditFormData({
                              ...editFormData,
                              attributes: {
                                ...editFormData.attributes,
                                booking: { ...editFormData.attributes.booking!, duration: minutes },
                              },
                            });
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        min={editFormData.attributes.booking!.durationUnit === 'days' ? '1' : editFormData.attributes.booking!.durationUnit === 'hours' ? '1' : '15'}
                        step={editFormData.attributes.booking!.durationUnit === 'days' ? '1' : editFormData.attributes.booking!.durationUnit === 'hours' ? '1' : '15'}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Buffer Time (minutes)
                      </label>
                      <input
                        type="number"
                        value={editFormData.attributes.booking!.bufferTime}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          attributes: {
                            ...editFormData.attributes,
                            booking: { ...editFormData.attributes.booking!, bufferTime: parseInt(e.target.value) || 0 },
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
                              ...editFormData.attributes,
                              booking: {
                                ...editFormData.attributes.booking!,
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
                              ...editFormData.attributes,
                              booking: { ...editFormData.attributes.booking!, availableDays: [] },
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
                            checked={editFormData.attributes.booking!.availableDays.includes(day)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditFormData({
                                  ...editFormData,
                                  attributes: {
                                    ...editFormData.attributes,
                                    booking: {
                                      ...editFormData.attributes.booking!,
                                      availableDays: [...editFormData.attributes.booking!.availableDays, day],
                                    },
                                  },
                                });
                              } else {
                                setEditFormData({
                                  ...editFormData,
                                  attributes: {
                                    ...editFormData.attributes,
                                    booking: {
                                      ...editFormData.attributes.booking!,
                                      availableDays: editFormData.attributes.booking!.availableDays.filter((d) => d !== day),
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
                              ...editFormData.attributes,
                              booking: {
                                ...editFormData.attributes.booking!,
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
                    {editFormData.attributes.booking!.timeSlots.map((slot, index) => (
                      <div key={index} className="flex gap-4 mb-2 items-center">
                        <input
                          type="time"
                          value={slot.start}
                          onChange={(e) => {
                            const newSlots = [...editFormData.attributes.booking!.timeSlots];
                            newSlots[index].start = e.target.value;
                            setEditFormData({
                              ...editFormData,
                              attributes: {
                                ...editFormData.attributes,
                                booking: { ...editFormData.attributes.booking!, timeSlots: newSlots },
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
                            const newSlots = [...editFormData.attributes.booking!.timeSlots];
                            newSlots[index].end = e.target.value;
                            setEditFormData({
                              ...editFormData,
                              attributes: {
                                ...editFormData.attributes,
                                booking: { ...editFormData.attributes.booking!, timeSlots: newSlots },
                              },
                            });
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                          step="3600"
                        />
                        {editFormData.attributes.booking!.timeSlots.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newSlots = editFormData.attributes.booking!.timeSlots.filter((_, i) => i !== index);
                              setEditFormData({
                                ...editFormData,
                                attributes: {
                                  ...editFormData.attributes,
                                  booking: { ...editFormData.attributes.booking!, timeSlots: newSlots },
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
                            ...editFormData.attributes,
                            booking: {
                              ...editFormData.attributes.booking!,
                              timeSlots: [...editFormData.attributes.booking!.timeSlots, { start: '09:00', end: '17:00' }],
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
              {editFormData.productType === 'booking' && editFormData.attributes.tour?.tourMode && (
                <div className="border-t pt-4 space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 mb-2">🗺️ Tour Package Configuration</h4>
                    <p className="text-sm text-purple-700">Additional tour-specific attributes below</p>
                  </div>

                      {/* Tour Departures */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Tour Departures</label>
                        <div className="space-y-3">
                          {editFormData.attributes.tour!.departures.map((departure, index) => (
                            <div key={index} className="grid grid-cols-5 gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Departure Date</label>
                                <input
                                  type="date"
                                  value={departure.departureDate}
                                  onChange={(e) => {
                                    const newDepartures = [...editFormData.attributes.tour!.departures];
                                    newDepartures[index].departureDate = e.target.value;
                                    setEditFormData({
                                      ...editFormData,
                                      attributes: {
                                        ...editFormData.attributes,
                                        tour: { ...editFormData.attributes.tour!, departures: newDepartures },
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
                                    const newDepartures = [...editFormData.attributes.tour!.departures];
                                    newDepartures[index].returnDate = e.target.value;
                                    setEditFormData({
                                      ...editFormData,
                                      attributes: {
                                        ...editFormData.attributes,
                                        tour: { ...editFormData.attributes.tour!, departures: newDepartures },
                                      },
                                    });
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Available Seats</label>
                                <input
                                  type="number"
                                  value={departure.availableSeats}
                                  onChange={(e) => {
                                    const newDepartures = [...editFormData.attributes.tour!.departures];
                                    newDepartures[index].availableSeats = parseInt(e.target.value) || 0;
                                    setEditFormData({
                                      ...editFormData,
                                      attributes: {
                                        ...editFormData.attributes,
                                        tour: { ...editFormData.attributes.tour!, departures: newDepartures },
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
                                    const newDepartures = [...editFormData.attributes.tour!.departures];
                                    newDepartures[index].pricePerPerson = parseFloat(e.target.value) || 0;
                                    setEditFormData({
                                      ...editFormData,
                                      attributes: {
                                        ...editFormData.attributes,
                                        tour: { ...editFormData.attributes.tour!, departures: newDepartures },
                                      },
                                    });
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  step="0.01"
                                />
                              </div>
                              <div className="flex items-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newDepartures = editFormData.attributes.tour!.departures.filter((_, i) => i !== index);
                                    setEditFormData({
                                      ...editFormData,
                                      attributes: {
                                        ...editFormData.attributes,
                                        tour: { ...editFormData.attributes.tour!, departures: newDepartures },
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
                                  ...editFormData.attributes.tour!,
                                  departures: [
                                    ...editFormData.attributes.tour!.departures,
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
                        <label className="block text-sm font-medium text-gray-700 mb-3">Tour Itinerary</label>
                        <div className="space-y-3">
                          {editFormData.attributes.tour!.itinerary.map((day, index) => (
                            <div key={index} className="p-3 border border-gray-200 rounded-lg bg-white">
                              <div className="flex items-center justify-between mb-2">
                                <strong className="text-sm font-semibold">Day {day.day}</strong>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newItinerary = editFormData.attributes.tour!.itinerary.filter((_, i) => i !== index);
                                    const renumbered = newItinerary.map((d, i) => ({ ...d, day: i + 1 }));
                                    setEditFormData({
                                      ...editFormData,
                                      attributes: {
                                        ...editFormData.attributes,
                                        tour: { ...editFormData.attributes.tour!, itinerary: renumbered },
                                      },
                                    });
                                  }}
                                  className="text-red-600 hover:text-red-800 text-xs"
                                >
                                  Remove
                                </button>
                              </div>
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  placeholder="Day title"
                                  value={day.title}
                                  onChange={(e) => {
                                    const newItinerary = [...editFormData.attributes.tour!.itinerary];
                                    newItinerary[index].title = e.target.value;
                                    setEditFormData({
                                      ...editFormData,
                                      attributes: {
                                        ...editFormData.attributes,
                                        tour: { ...editFormData.attributes.tour!, itinerary: newItinerary },
                                      },
                                    });
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                                <textarea
                                  placeholder="Day description"
                                  value={day.description}
                                  onChange={(e) => {
                                    const newItinerary = [...editFormData.attributes.tour!.itinerary];
                                    newItinerary[index].description = e.target.value;
                                    setEditFormData({
                                      ...editFormData,
                                      attributes: {
                                        ...editFormData.attributes,
                                        tour: { ...editFormData.attributes.tour!, itinerary: newItinerary },
                                      },
                                    });
                                  }}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                  rows={2}
                                />
                                {day.activities.length > 0 && (
                                  <p className="text-xs text-gray-600">Activities: {day.activities.join(', ')}</p>
                                )}
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
                                  ...editFormData.attributes.tour!,
                                  itinerary: [
                                    ...editFormData.attributes.tour!.itinerary,
                                    { day: editFormData.attributes.tour!.itinerary.length + 1, title: '', description: '', activities: [], meals: [], accommodation: '' },
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

                      {/* Tour Details */}
                      <div>
                        <details className="border border-gray-200 rounded-lg">
                          <summary className="px-3 py-2 bg-gray-50 cursor-pointer hover:bg-gray-100 font-medium text-sm">
                            Tour Details & Specifications
                          </summary>
                          <div className="p-3 space-y-3 text-sm">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Destinations (comma-separated)</label>
                                <input
                                  type="text"
                                  value={editFormData.attributes.tour!.details.destinations.join(', ')}
                                  onChange={(e) => {
                                    setEditFormData({
                                      ...editFormData,
                                      attributes: {
                                        ...editFormData.attributes,
                                        tour: {
                                          ...editFormData.attributes.tour!,
                                          details: { ...editFormData.attributes.tour!.details, destinations: e.target.value.split(',').map((d) => d.trim()) },
                                        },
                                      },
                                    });
                                  }}
                                  placeholder="e.g., Paris, Rome, Barcelona"
                                  className="w-full px-3 py-2 border border-gray-300 rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Tour Type</label>
                                <input
                                  type="text"
                                  value={editFormData.attributes.tour!.details.tourType}
                                  onChange={(e) => {
                                    setEditFormData({
                                      ...editFormData,
                                      attributes: {
                                        ...editFormData.attributes,
                                        tour: {
                                          ...editFormData.attributes.tour!,
                                          details: { ...editFormData.attributes.tour!.details, tourType: e.target.value },
                                        },
                                      },
                                    });
                                  }}
                                  placeholder="e.g., Adventure, Cultural"
                                  className="w-full px-3 py-2 border border-gray-300 rounded"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Difficulty Level</label>
                                <select
                                  value={editFormData.attributes.tour!.details.difficulty}
                                  onChange={(e) => {
                                    setEditFormData({
                                      ...editFormData,
                                      attributes: {
                                        ...editFormData.attributes,
                                        tour: {
                                          ...editFormData.attributes.tour!,
                                          details: { ...editFormData.attributes.tour!.details, difficulty: e.target.value as 'easy' | 'moderate' | 'challenging' | 'difficult' },
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
                                    value={editFormData.attributes.tour!.details.groupSize.min}
                                    onChange={(e) => {
                                      setEditFormData({
                                        ...editFormData,
                                        attributes: {
                                          ...editFormData.attributes,
                                          tour: {
                                            ...editFormData.attributes.tour!,
                                            details: {
                                              ...editFormData.attributes.tour!.details,
                                              groupSize: { ...editFormData.attributes.tour!.details.groupSize, min: parseInt(e.target.value) || 1 },
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
                                    value={editFormData.attributes.tour!.details.groupSize.max}
                                    onChange={(e) => {
                                      setEditFormData({
                                        ...editFormData,
                                        attributes: {
                                          ...editFormData.attributes,
                                          tour: {
                                            ...editFormData.attributes.tour!,
                                            details: {
                                              ...editFormData.attributes.tour!.details,
                                              groupSize: { ...editFormData.attributes.tour!.details.groupSize, max: parseInt(e.target.value) || 20 },
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



