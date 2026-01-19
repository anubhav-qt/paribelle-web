/**
 * Shared utility for downloading product import template
 * Used by both admin and vendor product pages
 */

export async function downloadProductTemplate() {
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

    // Column definitions for product sheets
    const productColumns = [
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

    // Add Electronics sheet
    const electronicsSheet = workbook.addWorksheet('Electronics');
    electronicsSheet.columns = productColumns;
    electronicsSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    electronicsSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

    electronicsSheet.addRow({
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

    electronicsSheet.addRow({
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

    // Add Fashion sheet
    const fashionSheet = workbook.addWorksheet('Fashion');
    fashionSheet.columns = productColumns;
    fashionSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    fashionSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };

    fashionSheet.addRow({
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
    throw error;
  }
}
