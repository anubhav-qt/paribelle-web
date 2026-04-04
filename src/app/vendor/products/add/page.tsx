'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import JSZip from 'jszip';
import ThemeRenderer from '@/components/ThemeRenderer';
import CategorySidebar from '@/components/CategorySidebar';
import ImageUpload from '@/components/ImageUpload';
import MultiImageUpload from '@/components/MultiImageUpload';
import ProductVariationBuilder from '@/components/ProductVariationBuilder';
import HsnCodeAutocomplete from '@/components/HsnCodeAutocomplete';
import ProductVariantManager, { VariantOption, VariantCombination } from '@/components/ProductVariantManager';
import { getVendorId, getUserId, isSuperAdmin, getProductVendorId } from '@/lib/auth';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

export default function VendorAddProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Array<{ id: string; name: string; level: number; parentId: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [productType, setProductType] = useState<'physical' | 'booking'>('physical');
  
  // Vendor verification status
  const [vendorStatus, setVendorStatus] = useState<{
    kycStatus: string;
    storeName: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    canAddProducts: boolean;
    blockReason: string | null;
  } | null>(null);
  
  // Category filters and product attributes
  const [categoryFilters, setCategoryFilters] = useState<any[]>([]);
  const [productAttributes, setProductAttributes] = useState<Record<string, any>>({});
  
  // Product variants
  const [hasCustomVariants, setHasCustomVariants] = useState(false);
  const [variantOptions, setVariantOptions] = useState<VariantOption[]>([]);
  const [variantCombinations, setVariantCombinations] = useState<VariantCombination[]>([]);
  
  // Help section 
  const [showHelp, setShowHelp] = useState(false);
  
  // Import/Export functionality
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: 'success' | 'error'; text: string; errors?: string[] } | null>(null);
  
  // Prevent hydration errors
  const [mounted, setMounted] = useState(false);
  
  // Custom pages for easy linking
  const [customPages, setCustomPages] = useState<Array<{ id: string; title: string; slug: string }>>([]);
  const [linkableProducts, setLinkableProducts] = useState<Array<{ id: string; name: string; slug: string; productType: string; isTour: boolean }>>([]);

  // All category filters are available since we only use custom variants now
  const availableAttributeFilters = useMemo(() => {
    return categoryFilters;
  }, [categoryFilters]);
  
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
    // GST fields
    hsnCode: '',
    gstRate: 18,
    priceType: 'selling_price_without_gst' as 'mrp_with_gst' | 'selling_price_without_gst',
    // Variants
    hasVariants: false,
  });

  // Booking-specific fields
  const [bookingData, setBookingData] = useState({
    duration: 60, // minutes
    durationUnit: 'hours' as 'hours' | 'days' | 'sessions',
    bufferTime: 0,
    availableDays: [] as string[],
    timeSlots: [{ start: '09:00', end: '17:00' }],
  });

  // Tour-specific fields
  const [tourMode, setTourMode] = useState(false);
  const [tourData, setTourData] = useState({
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
  });

  const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const DURATION_UNITS = [
    { value: 'hours', label: 'Hours', description: 'Hourly bookings (e.g., badminton court, meeting room)' },
    { value: 'days', label: 'Days', description: 'Full day bookings (e.g., marriage hall, event venue)' },
    { value: 'sessions', label: 'Sessions', description: 'Fixed sessions (e.g., spa treatment, class)' },
  ];

  useEffect(() => {
    fetchVendorStatus();
    fetchCategories();
    generateSKU();
    fetchCustomPages();
    fetchLinkableProducts();
    setMounted(true);
  }, []);

  const fetchCustomPages = async () => {
    try {
      const token = localStorage.getItem('token');
      const vendorId = getVendorId();
      const isAdmin = isSuperAdmin();
      
      // For admins, fetch marketplace pages; for vendors, fetch their own pages
      const endpoint = isAdmin 
        ? '/api/v1/marketplace/pages'
        : vendorId ? `/api/v1/vendors/${vendorId}/pages` : null;
      
      if (!endpoint) return;

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
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
      const vendorId = getVendorId();
      const isAdmin = isSuperAdmin();

      const url = isAdmin
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?limit=100&status=active`
        : vendorId
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?vendorId=${vendorId}&limit=100&status=active`
        : null;

      if (!url) return;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
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

  const fetchVendorStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      
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
      if (!vendorId) {
        router.push('/vendor/dashboard');
        return;
      }
      
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
        
        // Redirect if cannot add products
        if (!hasBasicSetup || !kycApproved) {
          setTimeout(() => {
            router.push('/vendor/products');
          }, 3000);
        }
        
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching vendor status:', error);
      setLoading(false);
    }
  };

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

  // Calculate GST breakdown
  const calculateGST = () => {
    const price = parseFloat(formData.price) || 0;
    const gstRate = formData.gstRate || 0;
    
    if (price === 0) return { basePrice: 0, gstAmount: 0, finalPrice: 0 };

    if (formData.priceType === 'mrp_with_gst') {
      // Price includes GST - extract base price
      const basePrice = price / (1 + gstRate / 100);
      const gstAmount = price - basePrice;
      return {
        basePrice: basePrice.toFixed(2),
        gstAmount: gstAmount.toFixed(2),
        finalPrice: price.toFixed(2),
      };
    } else {
      // Price doesn't include GST - calculate GST amount
      const gstAmount = price * gstRate / 100;
      const finalPrice = price + gstAmount;
      return {
        basePrice: price.toFixed(2),
        gstAmount: gstAmount.toFixed(2),
        finalPrice: finalPrice.toFixed(2),
      };
    }
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
      // Add timestamp to ensure uniqueness
      const baseSlug = formData.slug || 
        formData.name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      
      const slug = `${baseSlug}-${Date.now()}`;

      const productData: any = {
        ...formData,
        slug,
        price: parseFloat(formData.price) || 0,
        compareAtPrice: parseFloat(formData.compareAtPrice) || 0,
        hsnCode: formData.hsnCode || null,
        gstRate: formData.gstRate || 18,
        priceType: formData.priceType,
        basePrice: parseFloat(String(calculateGST().basePrice)),
        gstAmount: parseFloat(String(calculateGST().gstAmount)),
        stockQuantity: parseInt(formData.stockQuantity) || 0,
        vendorId,
        productType,
      };

      // Add custom variants if present
      if (hasCustomVariants && variantOptions.length > 0) {
        productData.hasVariants = true;
        productData.variantOptions = variantOptions;
        productData.variants = variantCombinations.filter(v => v.enabled).map(combo => ({
          attributes: combo.attributes,
          sku: combo.sku,
          price: combo.price,
          stock: combo.stock,
        }));
        // For products with custom variants, don't require parent stock
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
        if (tourMode) {
          // Tour product
          productData.attributes = {
            tour: {
              tourMode: true,
              departures: tourData.departures,
              itinerary: tourData.itinerary,
              details: tourData.details,
            },
          };
        } else {
          // Regular booking product
          productData.attributes = {
            booking: bookingData,
          };
        }
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
          type: result.success && result.errors?.length === 0 ? 'success' : 'error',
          text: result.message || (result.success ? 'Import complete' : 'Import failed'),
          errors: result.errors || [],
        });
        if (result.success && !result.errors?.length) {
          // Redirect only when fully successful (no row errors)
          setTimeout(() => {
            router.push('/vendor/products');
          }, 2000);
        }
      } else {
        const errors: string[] = result.errors?.length
          ? result.errors
          : result.message?.split('; ').filter(Boolean) || [];
        setImportMessage({
          type: 'error',
          text: result.message || 'Failed to import products',
          errors,
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      setImportMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to import products' });
    } finally {
      setImporting(false);
      // Reset file input
      event.target.value = '';
    }
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

1. **Edit the CSV file**:
   - Open tour-template.csv in Excel or any spreadsheet application
   - Modify the tour details, dates, prices, and itineraries
   - Keep the image filenames in the Image columns (or add your own)

2. **Add Your Images**:
   - Place your tour images in the 'images' folder
   - Reference them in the CSV using the format: images/your-image-name.jpg
   - Supported formats: JPG, PNG, WebP
   - Recommended size: 1200x800px or larger

3. **Import Your Tours**:
   - Go to the Vendor Products page
   - Click "Import Tours" button
   - Select both the CSV file AND image files together (use Ctrl/Cmd to select multiple files)
   - The system will automatically upload images and create tours

## CSV Column Reference

### Basic Information
- **Tour Name**: Name of your tour package
- **Price**: Base price per person
- **Compare At Price**: Original price (for showing discounts)
- **Short Description**: Brief summary (50-100 characters)
- **Description**: Full HTML description with formatting

### Departures (up to 10)
- **Departure Date X**: Format: YYYY-MM-DD
- **Return Date X**: Format: YYYY-MM-DD
- **Available Seats X**: Number of available seats
- **Price Per Person X**: Price for this specific departure

### Itinerary (up to 10 days)
- **Day X Title**: Day heading
- **Day X Description**: What happens this day
- **Day X Activities**: Pipe-separated list (Activity 1|Activity 2)
- **Day X Meals**: Pipe-separated (Breakfast|Lunch|Dinner)
- **Day X Accommodation**: Where guests stay

### Tour Details
- **Destinations**: Comma-separated cities/places
- **Tour Type**: Cultural, Adventure, Leisure, Wildlife, etc.
- **Difficulty**: Easy, Moderate, Challenging, Difficult
- **Group Min/Max**: Minimum and maximum group size
- **Inclusions**: Pipe-separated list of what's included
- **Exclusions**: Pipe-separated list of what's not included
- **Accommodation Type**: Description of hotels/camps
- **Transportation**: Type of transport provided
- **Languages**: Pipe-separated language list
- **Age Restriction**: e.g., "12+ years", "18+ years", "All ages"

### Pickup/Drop Points
- **Pickup Points**: Format: Location|Time|Location2|Time2
- **Drop Points**: Format: Location|Time|Location2|Time2

### Images
- **Featured Image**: Main tour image (appears first)
- **Image 1-4**: Additional gallery images
- **Format**: Either local path (images/file.jpg) or full URL

## Tips

1. Use relative paths for images: images/tour-name.jpg
2. Separate multiple values with | (pipe character)
3. Use HTML in Description for formatting: <p>, <b>, <ul>, <li>
4. Dates must be in YYYY-MM-DD format
5. Keep image files under 5MB for faster uploads

## Sample Images

This package includes placeholder images. Replace them with your actual tour photos before importing.

---
Generated by Marketplace Platform
`;

      // Create ZIP file
      const zip = new JSZip();
      
      // Add CSV file
      zip.file('tour-template.csv', csvContent);
      
      // Add README
      zip.file('README.md', readmeContent);
      
      // Create sample images folder with placeholder images
      const imagesFolder = zip.folder('images');
      
      // Helper function to create placeholder image
      const createPlaceholderImage = (width: number, height: number, text: string, bgColor: string) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Background
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, width, height);
          
          // Text
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 48px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(text, width / 2, height / 2 - 30);
          
          // Subtext
          ctx.font = '24px Arial';
          ctx.fillText(`${width}x${height}`, width / 2, height / 2 + 30);
        }
        return canvas.toDataURL('image/jpeg', 0.8).split(',')[1]; // Return base64 without prefix
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
      
      // Add a text file explaining about images
      imagesFolder?.file('README.txt', 
        `Sample placeholder images are included for demonstration.\n\n` +
        `Replace these with your actual tour photos before importing.\n\n` +
        `Supported formats: JPG, PNG, WebP\n` +
        `Recommended size: 1200x800px or larger\n` +
        `Keep filenames simple (no special characters)\n\n` +
        `Examples:\n` +
        `- tour1.jpg\n` +
        `- trek1-1.png\n` +
        `- beach-resort.jpg\n\n` +
        `Then reference them in the CSV as:\n` +
        `images/tour1.jpg\n` +
        `images/trek1-1.png\n` +
        `images/beach-resort.jpg`
      );
      
      // Generate ZIP
      const blob = await zip.generateAsync({ type: 'blob' });
      
      // Download ZIP
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
      const isAdmin = isSuperAdmin();
      const PLATFORM_VENDOR_ID = '00000000-0000-0000-0000-000000000001';
      const vendorId = isAdmin ? PLATFORM_VENDOR_ID : getVendorId();
      
      if (!vendorId) {
        setImportMessage({ type: 'error', text: 'Vendor ID not found' });
        setImporting(false);
        return;
      }

      // Separate CSV file and image files
      let csvFile: File | null = null;
      const imageFiles: { [key: string]: File } = {};
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.endsWith('.csv')) {
          csvFile = file;
        } else if (file.type.startsWith('image/')) {
          // Store with normalized path for matching
          const normalizedName = file.name.toLowerCase().replace(/\\/g, '/');
          imageFiles[normalizedName] = file;
          // Also store with images/ prefix for direct matching
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
          
          // Map CSV columns to tour object
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
            
            // Check if it's a URL (starts with http:// or https://)
            if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
              images.push(imgPath);
            } else {
              // It's a local file reference - try to find and upload it
              const normalizedPath = imgPath.toLowerCase().replace(/\\/g, '/');
              const fileName = normalizedPath.split('/').pop() || '';
              
              // Try multiple matching strategies
              const matchedFile = imageFiles[normalizedPath] || 
                                 imageFiles[fileName] || 
                                 imageFiles[`images/${fileName}`];
              
              if (matchedFile) {
                try {
                  const uploadedUrl = await uploadImage(matchedFile, token || '');
                  images.push(uploadedUrl);
                  // Remove from map to avoid uploading same file twice
                  delete imageFiles[normalizedPath];
                  delete imageFiles[fileName];
                  delete imageFiles[`images/${fileName}`];
                } catch (uploadError) {
                  console.warn(`Failed to upload ${imgPath}:`, uploadError);
                  // Continue without this image
                }
              } else {
                console.warn(`Image file not found: ${imgPath}`);
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
            vendorId: vendorId,
            userId: getUserId(),
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
        setTimeout(() => {
          router.push(isSuperAdmin() ? '/admin/products' : '/vendor/products');
        }, 2000);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <ThemeRenderer component="header" showLocationFilter={false} /> */}
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
            
        {/* KYC Blocking Banner */}
        {vendorStatus && !vendorStatus.canAddProducts && (
          <div className="mb-6 p-6 bg-red-50 border-2 border-red-300 rounded-lg">
            <div className="flex items-start gap-4">
              <span className="text-4xl">🚫</span>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-red-900 mb-2">Cannot Add Products</h2>
                <p className="text-red-800 mb-4 text-lg">{vendorStatus.blockReason}</p>
                <div className="flex gap-3">
                  <Link
                    href="/vendor/settings"
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                  >
                    Go to Settings
                  </Link>
                  <Link
                    href="/vendor/products"
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    Back to Products
                  </Link>
                </div>
                <p className="text-sm text-red-700 mt-4">
                  ⏱️ You will be redirected to the products page in 3 seconds...
                </p>
              </div>
            </div>
          </div>
        )}
            
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
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {exporting ? 'Exporting...' : '📥 Export to ZIP'}
              </button>
              <label className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 cursor-pointer text-sm disabled:opacity-50">
                {importing ? 'Importing...' : '📤 Import from ZIP'}
                <input
                  type="file"
                  accept=".zip"
                  onChange={handleImport}
                  disabled={importing}
                  className="hidden"
                />
              </label>
              
              {/* Tour Import/Export Buttons */}
              <div className="flex gap-2 border-l pl-3">
                <button
                  onClick={downloadTourTemplate}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
                  title="Download tour template package with CSV and image folder"
                  disabled={exporting}
                >
                  <span>📦</span>
                  <span>{exporting ? 'Creating...' : 'Export Template'}</span>
                </button>
                <label className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 cursor-pointer text-sm flex items-center gap-2">
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
            </div>
          </div>
          {importMessage && (
            <div className={`mt-4 p-4 rounded-lg ${
              importMessage.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium">{importMessage.text}</p>
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
              {/* Tour Products Guide */}
              <div className="bg-white rounded-lg p-6 shadow border-2 border-purple-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">🗺️</span>
                  Creating Tour & Travel Packages
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="bg-purple-50 border border-purple-200 rounded p-3 mb-3">
                    <strong>What are tours?</strong> Special booking products for travel packages with dates, itineraries, and multiple departures.
                  </div>
                  <div className="flex gap-2">
                    <span className="text-purple-600 font-bold">1.</span>
                    <div>
                      <strong>Quick Method - Import Tours:</strong> Click "Export Template" button to download a ZIP package with sample CSV and images.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-purple-600 font-bold">2.</span>
                    <div>
                      <strong>Edit the Template:</strong> Open the CSV in Excel, edit tour details (name, price, dates, itinerary).
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-purple-600 font-bold">3.</span>
                    <div>
                      <strong>Add Your Images:</strong> Replace sample images in the 'images' folder with your tour photos (1200x800px recommended).
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-purple-600 font-bold">4.</span>
                    <div>
                      <strong>Import Tours:</strong> Click "Import Tours" button, select CSV file + all images together (Ctrl/Cmd + Click).
                    </div>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded p-3 mt-3">
                    <strong>💡 Pro Tip:</strong> The ZIP template includes 10 sample placeholder images you can use for testing or replace with actual tour photos.
                  </div>
                </div>
              </div>

              {/* Manual Tour Creation */}
              <div className="bg-white rounded-lg p-6 shadow border-2 border-blue-200">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-2xl">✍️</span>
                  Manual Tour Creation
                </h3>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">1.</span>
                    <div>
                      <strong>Product Type:</strong> Select "Booking/Service" and enable "Tour Mode".
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">2.</span>
                    <div>
                      <strong>Basic Details:</strong> Enter tour name, description, and base price.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">3.</span>
                    <div>
                      <strong>Departures:</strong> Add specific departure dates with seats available and price per person.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">4.</span>
                    <div>
                      <strong>Day-by-Day Itinerary:</strong> Add each day with title, activities, meals, and accommodation details.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">5.</span>
                    <div>
                      <strong>Tour Details:</strong> Set destinations, tour type, difficulty, group size limits.
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">6.</span>
                    <div>
                      <strong>Inclusions/Exclusions:</strong> List what's included (accommodation, meals) and what's not (flights, insurance).
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-blue-600 font-bold">7.</span>
                    <div>
                      <strong>Pickup/Drop Points:</strong> Add locations and times for passenger pickup and drop-off.
                    </div>
                  </div>
                </div>
              </div>

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
                    <div><strong>Creating separate products for each size/color</strong> - Use "Custom Variants" instead to keep them under one product!</div>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-green-600">✓</span>
                    <div className="text-green-800"><strong>Correct:</strong> One product "T-Shirt" with XL, L, M variants</div>
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
                  <span className="text-purple-600 text-xl">🗺️</span>
                  <div>
                    <strong>For Tours:</strong> Use the Export/Import feature - it's the fastest way to add multiple tours with images!
                  </div>
                </div>
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
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 text-xl">📦</span>
                  <div>
                    <strong>Tour images:</strong> 1200x800px recommended, include destination highlights and activities
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-600 text-xl">📅</span>
                  <div>
                    <strong>Tour dates:</strong> Keep departure dates updated and mark sold-out tours as unavailable
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

            {/* Quick Links Section - Moved outside of description */}
            {(customPages.length > 0 || linkableProducts.length > 0) && (
              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                <p className="text-sm font-semibold text-gray-800 mb-2">🔗 Quick Links - Click to Copy</p>
                
                <div className="space-y-2">
                  {customPages.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Custom Pages:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {customPages.map((page) => (
                          <button
                            key={page.id}
                            type="button"
                            onClick={() => {
                              const link = `/${page.slug}`;
                              navigator.clipboard.writeText(link);
                              alert(`✓ Link copied: ${link}\n\nPaste it in your description using the link button in the editor.`);
                            }}
                            className="text-xs px-2.5 py-1 bg-white border border-blue-300 rounded hover:bg-blue-100 hover:border-blue-400 transition shadow-sm"
                            title={`Click to copy: /${page.slug}`}
                          >
                            📄 {page.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
                <span className="ml-2 text-xs font-normal text-gray-500">💡 Include features, materials, care instructions</span>
              </label>
              {mounted ? (
                <ReactQuill
                  theme="snow"
                  value={formData.description}
                  onChange={(value) => setFormData({ ...formData, description: value })}
                  className="bg-white min-h-[350px]"
                  placeholder="Example: This premium cotton t-shirt is made from 100% organic cotton. Features include a comfortable crew neck, reinforced stitching, and pre-shrunk fabric. Machine washable."
                />
              ) : (
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="Example: This premium cotton t-shirt is made from 100% organic cotton. Features include a comfortable crew neck, reinforced stitching, and pre-shrunk fabric. Machine washable."
                  required
                />
              )}
              <p className="text-xs text-gray-500 mt-1">💡 Tip: Good descriptions answer: What is it? What's it made of? How to use/care for it?</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories {tourMode && <span className="text-xs font-normal text-gray-500">(Optional for tours)</span>}
                <span className="ml-2 text-xs font-normal text-gray-500">💡 Choose the most specific category</span>
              </label>
              {tourMode && (
                <div className="mb-2 p-2 bg-purple-50 border border-purple-200 rounded text-xs text-gray-700">
                  <strong>💡 For Tours:</strong> Categories are optional. Tours are primarily filtered by destinations, tour type, and difficulty. Add a category if you want additional organization (e.g., "Adventure Tours", "Cultural Tours").
                </div>
              )}
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
            {productType === 'physical' && availableAttributeFilters.length > 0 && !hasCustomVariants && (
              <div className="border-t pt-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    📋 Product Attributes
                  </h3>
                  <p className="text-sm text-blue-700">
                    Fill in attributes like{' '}
                    <strong>
                      {availableAttributeFilters
                        .map(f => f.label)
                        .slice(0, 3)
                        .join(', ')}
                    </strong>
                    {availableAttributeFilters.length > 3 && ', etc.'} to help customers filter and find your product easily.
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
                    💡 <strong>Tip:</strong> Filling in these attributes makes your product easier to find when customers use filters!
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

            {/* Product Variants Section */}
            {productType === 'physical' && (
              <div className="border-t pt-6">
                <div className="mb-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasCustomVariants}
                      onChange={(e) => {
                        setHasCustomVariants(e.target.checked);
                        if (!e.target.checked) {
                          setVariantOptions([]);
                          setVariantCombinations([]);
                        }
                      }}
                      className="h-5 w-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                    />
                    <div>
                      <span className="text-lg font-semibold text-gray-900">
                        ✨ Add Product Variants
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        ✅ Perfect for sizes, colors, flavors, and any product variations
                      </p>
                    </div>
                  </label>
                </div>

                {hasCustomVariants && (
                  <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded mb-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">🎨</span>
                      <div className="text-sm text-purple-900">
                        <strong className="block mb-2">✅ How Product Variants Work:</strong>
                        <ol className="list-decimal list-inside space-y-1">
                          <li><strong>Use category suggestions</strong> or add custom variant types (e.g., Size, Color)</li>
                          <li><strong>Add values</strong> for each type (e.g., S, M, L, XL for Size)</li>
                          <li><strong>All combinations</strong> are auto-generated as variants under one product</li>
                          <li><strong>Set prices & stock</strong> for each variant individually</li>
                        </ol>
                        <p className="mt-2 text-purple-800">
                          <strong>💡 Example:</strong> T-Shirt with Color (Red, Blue) + Size (S, M, L) = 6 variants under one product!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {hasCustomVariants && (
                  <>
                    <div className="text-sm text-purple-900 mb-4">
                      <strong className="block mb-2">Product Variants Features:</strong>
                      <ul className="list-disc list-inside space-y-1">
                        <li><strong>Category suggestions:</strong> Click suggested variant types from your category (if available)</li>
                        <li><strong>Custom types:</strong> Add any variant type - Size, Color, Material, Packet Size, Weight, Flavor, etc.</li>
                        <li><strong>Multiple values:</strong> Each variant type can have unlimited options</li>
                        <li><strong>Auto-generate combinations:</strong> All possible combinations are created automatically</li>
                        <li><strong>Individual pricing:</strong> Set unique SKU, price, and stock for each combination</li>
                        <li><strong>Bulk updates:</strong> Apply price or stock to all variants at once</li>
                      </ul>
                      <p className="mt-2 text-purple-800">
                        <strong>💡 Example:</strong> Coffee → Color (suggested from category) + Roast (custom) + Size (custom) = Coffee-Black-Dark-500g, Coffee-Brown-Light-250g, etc.
                      </p>
                    </div>
                  </>
                )}

                {hasCustomVariants && (
                  <ProductVariantManager
                    onVariantsChange={(options, combinations) => {
                      setVariantOptions(options);
                      setVariantCombinations(combinations);
                      setFormData(prev => ({ ...prev, hasVariants: options.length > 0 }));
                    }}
                    initialOptions={variantOptions}
                    initialCombinations={variantCombinations}
                    categoryFilters={categoryFilters}
                    baseSKU={formData.sku}
                  />
                )}
              </div>
            )}

            {/* GST & Pricing Section */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>💰</span> Pricing & GST Configuration
              </h3>

              {/* Price Type Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Type *
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                    formData.priceType === 'mrp_with_gst' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'
                  }`}>
                    <input
                      type="radio"
                      name="priceType"
                      value="mrp_with_gst"
                      checked={formData.priceType === 'mrp_with_gst'}
                      onChange={(e) => setFormData({ ...formData, priceType: e.target.value as any })}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-gray-900">MRP (with GST)</p>
                      <p className="text-xs text-gray-600 mt-1">Price already includes GST. System will extract base price and tax amount.</p>
                      <p className="text-xs text-blue-600 mt-1">💡 Example: ₹1,180 → ₹1,000 + ₹180 GST @18%</p>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition ${
                    formData.priceType === 'selling_price_without_gst' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300'
                  }`}>
                    <input
                      type="radio"
                      name="priceType"
                      value="selling_price_without_gst"
                      checked={formData.priceType === 'selling_price_without_gst'}
                      onChange={(e) => setFormData({ ...formData, priceType: e.target.value as any })}
                      className="mt-1"
                    />
                    <div>
                      <p className="font-medium text-gray-900">Selling Price (without GST)</p>
                      <p className="text-xs text-gray-600 mt-1">Price excludes GST. System will add GST to calculate final price.</p>
                      <p className="text-xs text-blue-600 mt-1">💡 Example: ₹1,000 + ₹180 GST @18% → ₹1,180</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.priceType === 'mrp_with_gst' ? 'MRP (with GST)' : 'Selling Price (without GST)'} *
                    <span className="ml-2 text-xs font-normal text-gray-500">💡 Your price</span>
                  </label>
                  {hasCustomVariants ? (
                    <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500">
                      <p className="text-sm">Price set per variant</p>
                      <p className="text-xs mt-1">Configure prices in the variants table above</p>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Compare At Price
                    <span className="ml-2 text-xs font-normal text-gray-500">💡 Original price (for showing discounts)</span>
                  </label>
                  {hasCustomVariants ? (
                    <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500">
                      <p className="text-sm">Compare price set per variant</p>
                      <p className="text-xs mt-1">Configure in the variants table above</p>
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </div>
              </div>

              {/* GST Configuration */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HSN Code (Optional)
                    <span className="ml-2 text-xs font-normal text-gray-500">💡 For tax classification</span>
                  </label>
                  <HsnCodeAutocomplete
                    value={formData.hsnCode}
                    onSelect={(hsnCode, recommendedGstRate) => {
                      setFormData({
                        ...formData,
                        hsnCode,
                        gstRate: recommendedGstRate,
                      });
                    }}
                    placeholder="Search HSN code..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    GST Rate (%) *
                    <span className="ml-2 text-xs font-normal text-gray-500">💡 Tax percentage</span>
                  </label>
                  <select
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: parseFloat(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="0">0% - Essential Items (Books, Milk, Grains)</option>
                    <option value="5">5% - Basic Goods (Edible oil, Sugar, Apparel ≤₹1000)</option>
                    <option value="12">12% - Standard Items (Processed food, Computers)</option>
                    <option value="18">18% - Most Products (Default)</option>
                    <option value="28">28% - Luxury Items (Cars, Tobacco, AC)</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">📋 Auto-filled from HSN code. You can change if needed.</p>
                </div>
              </div>

              {/* GST Calculation Preview */}
              {formData.price && parseFloat(formData.price) > 0 && (
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <span>📊</span> GST Breakdown Preview
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded p-3 text-center">
                      <p className="text-xs text-gray-600 mb-1">Base Price</p>
                      <p className="text-lg font-bold text-gray-900">₹{calculateGST().basePrice}</p>
                    </div>
                    <div className="bg-white rounded p-3 text-center">
                      <p className="text-xs text-gray-600 mb-1">GST @ {formData.gstRate}%</p>
                      <p className="text-lg font-bold text-orange-600">₹{calculateGST().gstAmount}</p>
                    </div>
                    <div className="bg-white rounded p-3 text-center">
                      <p className="text-xs text-gray-600 mb-1">Final Price</p>
                      <p className="text-lg font-bold text-green-600">₹{calculateGST().finalPrice}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-3 text-center">
                    💡 {formData.priceType === 'mrp_with_gst' 
                      ? 'Customer pays ₹' + calculateGST().finalPrice + ' (includes ₹' + calculateGST().gstAmount + ' GST)'
                      : 'Customer pays ₹' + calculateGST().finalPrice + ' (₹' + calculateGST().basePrice + ' + ₹' + calculateGST().gstAmount + ' GST)'}
                  </p>
                </div>
              )}
            </div>

            {/* Physical Product Specific Fields */}
            {productType === 'physical' && (
              <div className="grid grid-cols-2 gap-4">
                {/* Hide stock quantity when variants are enabled */}
                {!hasCustomVariants && (
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

                <div className={hasCustomVariants ? 'col-span-2' : ''}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SKU {hasCustomVariants ? '(Base)' : '*'}
                    <span className="ml-2 text-xs font-normal text-gray-500">💡 Unique product code</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Auto-generated"
                      required={!hasCustomVariants}
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
                    {hasCustomVariants 
                      ? '📦 Base SKU for variant generation (e.g., SHIRT-BASE → SHIRT-RED-S, SHIRT-BLUE-M)' 
                      : (mounted && isSuperAdmin() ? 'Auto-generated with ADMIN prefix' : 'Auto-generated with vendor prefix')}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">ℹ️ What's a SKU? It's like a barcode - a unique ID to track this product</p>
                </div>
              </div>
            )}

            {/* Booking Product Specific Fields */}
            {productType === 'booking' && (
              <div className="space-y-6 border-t pt-6">
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Booking Configuration</h3>
                      <p className="text-sm text-gray-600 mt-1">Choose between regular bookings or tour packages</p>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer bg-white border-2 border-purple-400 rounded-lg px-4 py-3 hover:bg-purple-50 transition-all shadow-sm">
                      <input
                        type="checkbox"
                        checked={tourMode}
                        onChange={(e) => setTourMode(e.target.checked)}
                        className="w-6 h-6 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🗺️</span>
                        <div>
                          <span className="block text-base font-bold text-gray-900">Tour Package Mode</span>
                          <span className="block text-xs text-gray-600">Multi-day trips with itineraries</span>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {!tourMode && (
                  <>
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
                </>
                )}

                {/* Tour Mode Fields */}
                {tourMode && (
                  <div className="space-y-6 border-t pt-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-900 mb-2">🗺️ Tour Package Configuration</h4>
                      <p className="text-sm text-blue-700">Create comprehensive tour packages with itineraries, departures, and detailed information.</p>
                    </div>

                    {/* Tour Departures */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Tour Departures
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setTourData({
                              ...tourData,
                              departures: [
                                ...tourData.departures,
                                {
                                  departureDate: '',
                                  returnDate: '',
                                  availableSeats: 20,
                                  pricePerPerson: parseFloat(formData.price) || 0,
                                  status: 'active' as const,
                                },
                              ],
                            });
                          }}
                          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          + Add Departure
                        </button>
                      </div>
                      <div className="space-y-3">
                        {tourData.departures.map((departure, index) => (
                          <div key={index} className="grid grid-cols-5 gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Departure Date</label>
                              <input
                                type="date"
                                value={departure.departureDate}
                                onChange={(e) => {
                                  const newDepartures = [...tourData.departures];
                                  newDepartures[index].departureDate = e.target.value;
                                  setTourData({ ...tourData, departures: newDepartures });
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
                                  const newDepartures = [...tourData.departures];
                                  newDepartures[index].returnDate = e.target.value;
                                  setTourData({ ...tourData, departures: newDepartures });
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
                                  const newDepartures = [...tourData.departures];
                                  newDepartures[index].availableSeats = parseInt(e.target.value) || 0;
                                  setTourData({ ...tourData, departures: newDepartures });
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
                                  const newDepartures = [...tourData.departures];
                                  newDepartures[index].pricePerPerson = parseFloat(e.target.value) || 0;
                                  setTourData({ ...tourData, departures: newDepartures });
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
                                  const newDepartures = tourData.departures.filter((_, i) => i !== index);
                                  setTourData({ ...tourData, departures: newDepartures });
                                }}
                                className="text-red-600 hover:text-red-800 text-sm px-2 py-1"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                        {tourData.departures.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded">
                            No departures added yet. Click "+ Add Departure" to add tour dates.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Tour Itinerary */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="block text-sm font-medium text-gray-700">
                          Day-by-Day Itinerary
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setTourData({
                              ...tourData,
                              itinerary: [
                                ...tourData.itinerary,
                                {
                                  day: tourData.itinerary.length + 1,
                                  title: '',
                                  description: '',
                                  activities: [],
                                  meals: [],
                                  accommodation: '',
                                },
                              ],
                            });
                          }}
                          className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          + Add Day
                        </button>
                      </div>
                      <div className="space-y-4">
                        {tourData.itinerary.map((day, index) => (
                          <div key={index} className="p-4 border border-gray-200 rounded-lg bg-white">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-900">Day {day.day}</h4>
                              <button
                                type="button"
                                onClick={() => {
                                  const newItinerary = tourData.itinerary.filter((_, i) => i !== index);
                                  // Renumber remaining days
                                  const renumbered = newItinerary.map((d, i) => ({ ...d, day: i + 1 }));
                                  setTourData({ ...tourData, itinerary: renumbered });
                                }}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Remove Day
                              </button>
                            </div>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Day Title *</label>
                                <input
                                  type="text"
                                  value={day.title}
                                  onChange={(e) => {
                                    const newItinerary = [...tourData.itinerary];
                                    newItinerary[index].title = e.target.value;
                                    setTourData({ ...tourData, itinerary: newItinerary });
                                  }}
                                  placeholder="e.g., Arrival in Delhi"
                                  className="w-full px-3 py-2 border border-gray-300 rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Description *</label>
                                <textarea
                                  value={day.description}
                                  onChange={(e) => {
                                    const newItinerary = [...tourData.itinerary];
                                    newItinerary[index].description = e.target.value;
                                    setTourData({ ...tourData, itinerary: newItinerary });
                                  }}
                                  placeholder="Describe the day's activities and highlights"
                                  rows={3}
                                  className="w-full px-3 py-2 border border-gray-300 rounded"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Activities (comma-separated)</label>
                                <input
                                  type="text"
                                  value={day.activities.join(', ')}
                                  onChange={(e) => {
                                    const newItinerary = [...tourData.itinerary];
                                    newItinerary[index].activities = e.target.value.split(',').map(a => a.trim()).filter(a => a);
                                    setTourData({ ...tourData, itinerary: newItinerary });
                                  }}
                                  placeholder="e.g., Sightseeing, Museum visit, Local market"
                                  className="w-full px-3 py-2 border border-gray-300 rounded"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Meals (comma-separated)</label>
                                  <input
                                    type="text"
                                    value={day.meals.join(', ')}
                                    onChange={(e) => {
                                      const newItinerary = [...tourData.itinerary];
                                      newItinerary[index].meals = e.target.value.split(',').map(m => m.trim()).filter(m => m);
                                      setTourData({ ...tourData, itinerary: newItinerary });
                                    }}
                                    placeholder="e.g., Breakfast, Lunch, Dinner"
                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">Accommodation</label>
                                  <input
                                    type="text"
                                    value={day.accommodation}
                                    onChange={(e) => {
                                      const newItinerary = [...tourData.itinerary];
                                      newItinerary[index].accommodation = e.target.value;
                                      setTourData({ ...tourData, itinerary: newItinerary });
                                    }}
                                    placeholder="e.g., 3-star hotel"
                                    className="w-full px-3 py-2 border border-gray-300 rounded"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {tourData.itinerary.length === 0 && (
                          <p className="text-sm text-gray-500 text-center py-4 border border-dashed border-gray-300 rounded">
                            No itinerary added yet. Click "+ Add Day" to create day-by-day schedule.
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Tour Details */}
                    <div className="space-y-4 border-t pt-4">
                      <h4 className="font-semibold text-gray-900">Tour Details</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Destinations (comma-separated) *</label>
                          <input
                            type="text"
                            value={tourData.details.destinations.join(', ')}
                            onChange={(e) => {
                              setTourData({
                                ...tourData,
                                details: {
                                  ...tourData.details,
                                  destinations: e.target.value.split(',').map(d => d.trim()).filter(d => d),
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
                            value={tourData.details.tourType}
                            onChange={(e) => {
                              setTourData({
                                ...tourData,
                                details: { ...tourData.details, tourType: e.target.value },
                              });
                            }}
                            placeholder="e.g., Adventure, Cultural, Wildlife"
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Difficulty Level</label>
                          <select
                            value={tourData.details.difficulty}
                            onChange={(e) => {
                              setTourData({
                                ...tourData,
                                details: { ...tourData.details, difficulty: e.target.value as any },
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
                              value={tourData.details.groupSize.min}
                              onChange={(e) => {
                                setTourData({
                                  ...tourData,
                                  details: {
                                    ...tourData.details,
                                    groupSize: { ...tourData.details.groupSize, min: parseInt(e.target.value) || 1 },
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
                              value={tourData.details.groupSize.max}
                              onChange={(e) => {
                                setTourData({
                                  ...tourData,
                                  details: {
                                    ...tourData.details,
                                    groupSize: { ...tourData.details.groupSize, max: parseInt(e.target.value) || 20 },
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

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Inclusions (one per line)</label>
                        <textarea
                          value={tourData.details.inclusions.join('\n')}
                          onChange={(e) => {
                            setTourData({
                              ...tourData,
                              details: {
                                ...tourData.details,
                                inclusions: e.target.value.split('\n').map(i => i.trim()).filter(i => i),
                              },
                            });
                          }}
                          placeholder="e.g., Accommodation&#10;Transportation&#10;Tour guide&#10;Entry fees"
                          rows={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Exclusions (one per line)</label>
                        <textarea
                          value={tourData.details.exclusions.join('\n')}
                          onChange={(e) => {
                            setTourData({
                              ...tourData,
                              details: {
                                ...tourData.details,
                                exclusions: e.target.value.split('\n').map(i => i.trim()).filter(i => i),
                              },
                            });
                          }}
                          placeholder="e.g., International flights&#10;Personal expenses&#10;Travel insurance"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Accommodation</label>
                          <input
                            type="text"
                            value={tourData.details.accommodation}
                            onChange={(e) => {
                              setTourData({
                                ...tourData,
                                details: { ...tourData.details, accommodation: e.target.value },
                              });
                            }}
                            placeholder="e.g., 3-star hotels, twin sharing"
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Transportation</label>
                          <input
                            type="text"
                            value={tourData.details.transportation}
                            onChange={(e) => {
                              setTourData({
                                ...tourData,
                                details: { ...tourData.details, transportation: e.target.value },
                              });
                            }}
                            placeholder="e.g., AC coach, train"
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Languages (comma-separated)</label>
                          <input
                            type="text"
                            value={tourData.details.languages.join(', ')}
                            onChange={(e) => {
                              setTourData({
                                ...tourData,
                                details: {
                                  ...tourData.details,
                                  languages: e.target.value.split(',').map(l => l.trim()).filter(l => l),
                                },
                              });
                            }}
                            placeholder="e.g., English, Hindi, Spanish"
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Age Restriction</label>
                          <input
                            type="text"
                            value={tourData.details.ageRestriction}
                            onChange={(e) => {
                              setTourData({
                                ...tourData,
                                details: { ...tourData.details, ageRestriction: e.target.value },
                              });
                            }}
                            placeholder="e.g., 12+ years"
                            className="w-full px-3 py-2 border border-gray-300 rounded"
                          />
                        </div>
                      </div>

                      {/* Pickup Points */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-medium text-gray-600">Pickup Points</label>
                          <button
                            type="button"
                            onClick={() => {
                              setTourData({
                                ...tourData,
                                details: {
                                  ...tourData.details,
                                  pickupPoints: [...tourData.details.pickupPoints, { location: '', time: '' }],
                                },
                              });
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            + Add Pickup Point
                          </button>
                        </div>
                        <div className="space-y-2">
                          {tourData.details.pickupPoints.map((point, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="text"
                                value={point.location}
                                onChange={(e) => {
                                  const newPoints = [...tourData.details.pickupPoints];
                                  newPoints[index].location = e.target.value;
                                  setTourData({
                                    ...tourData,
                                    details: { ...tourData.details, pickupPoints: newPoints },
                                  });
                                }}
                                placeholder="Location"
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded"
                              />
                              <input
                                type="time"
                                value={point.time}
                                onChange={(e) => {
                                  const newPoints = [...tourData.details.pickupPoints];
                                  newPoints[index].time = e.target.value;
                                  setTourData({
                                    ...tourData,
                                    details: { ...tourData.details, pickupPoints: newPoints },
                                  });
                                }}
                                className="px-3 py-2 text-sm border border-gray-300 rounded"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newPoints = tourData.details.pickupPoints.filter((_, i) => i !== index);
                                  setTourData({
                                    ...tourData,
                                    details: { ...tourData.details, pickupPoints: newPoints },
                                  });
                                }}
                                className="text-red-600 hover:text-red-800 text-sm px-2"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Drop Points */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-medium text-gray-600">Drop Points</label>
                          <button
                            type="button"
                            onClick={() => {
                              setTourData({
                                ...tourData,
                                details: {
                                  ...tourData.details,
                                  dropPoints: [...tourData.details.dropPoints, { location: '', time: '' }],
                                },
                              });
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            + Add Drop Point
                          </button>
                        </div>
                        <div className="space-y-2">
                          {tourData.details.dropPoints.map((point, index) => (
                            <div key={index} className="flex gap-2">
                              <input
                                type="text"
                                value={point.location}
                                onChange={(e) => {
                                  const newPoints = [...tourData.details.dropPoints];
                                  newPoints[index].location = e.target.value;
                                  setTourData({
                                    ...tourData,
                                    details: { ...tourData.details, dropPoints: newPoints },
                                  });
                                }}
                                placeholder="Location"
                                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded"
                              />
                              <input
                                type="time"
                                value={point.time}
                                onChange={(e) => {
                                  const newPoints = [...tourData.details.dropPoints];
                                  newPoints[index].time = e.target.value;
                                  setTourData({
                                    ...tourData,
                                    details: { ...tourData.details, dropPoints: newPoints },
                                  });
                                }}
                                className="px-3 py-2 text-sm border border-gray-300 rounded"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const newPoints = tourData.details.dropPoints.filter((_, i) => i !== index);
                                  setTourData({
                                    ...tourData,
                                    details: { ...tourData.details, dropPoints: newPoints },
                                  });
                                }}
                                className="text-red-600 hover:text-red-800 text-sm px-2"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
