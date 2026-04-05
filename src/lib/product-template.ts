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
      { header: 'Attributes', key: 'attributes', width: 40 },
    ];

    // Add Electronics sheet
    const electronicsSheet = workbook.addWorksheet('Electronics');
    
    // Manually add header row
    const electronicsHeaderRow = electronicsSheet.getRow(1);
    electronicsHeaderRow.getCell(1).value = 'Product Name';
    electronicsHeaderRow.getCell(2).value = 'Description';
    electronicsHeaderRow.getCell(3).value = 'Images (comma-separated filenames)';
    electronicsHeaderRow.getCell(4).value = 'Has Variants';
    electronicsHeaderRow.getCell(5).value = 'Price';
    electronicsHeaderRow.getCell(6).value = 'Compare At Price (Optional)';
    electronicsHeaderRow.getCell(7).value = 'Stock Quantity';
    electronicsHeaderRow.getCell(8).value = 'Status (active/draft/archived)';
    electronicsHeaderRow.getCell(9).value = 'Variant Count';
    electronicsHeaderRow.getCell(10).value = 'HSN Code';
    electronicsHeaderRow.getCell(11).value = 'SAC Code';
    electronicsHeaderRow.getCell(12).value = 'GST Rate (%)';
    electronicsHeaderRow.getCell(13).value = 'Price Type';
    electronicsHeaderRow.getCell(14).value = 'Product Type';
    electronicsHeaderRow.getCell(15).value = 'Booking Duration';
    electronicsHeaderRow.getCell(16).value = 'Booking Duration Unit';
    electronicsHeaderRow.getCell(17).value = 'Booking Buffer Time';
    electronicsHeaderRow.getCell(18).value = 'Booking Available Days';
    electronicsHeaderRow.getCell(19).value = 'Booking Time Slots';
    electronicsHeaderRow.getCell(20).value = 'Attributes';
    
    // Style header row
    electronicsHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    electronicsHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    electronicsHeaderRow.commit();
    
    // Set column widths AFTER committing header
    electronicsSheet.getColumn(1).width = 30;
    electronicsSheet.getColumn(2).width = 50;
    electronicsSheet.getColumn(3).width = 35;
    electronicsSheet.getColumn(4).width = 15;
    electronicsSheet.getColumn(5).width = 15;
    electronicsSheet.getColumn(6).width = 20;
    electronicsSheet.getColumn(7).width = 15;
    electronicsSheet.getColumn(8).width = 25;
    electronicsSheet.getColumn(9).width = 15;
    electronicsSheet.getColumn(10).width = 15;
    electronicsSheet.getColumn(11).width = 15;
    electronicsSheet.getColumn(12).width = 15;
    electronicsSheet.getColumn(13).width = 20;
    electronicsSheet.getColumn(14).width = 15;
    electronicsSheet.getColumn(15).width = 18;
    electronicsSheet.getColumn(16).width = 22;
    electronicsSheet.getColumn(17).width = 20;
    electronicsSheet.getColumn(18).width = 35;
    electronicsSheet.getColumn(19).width = 30;
    electronicsSheet.getColumn(20).width = 40;

    // Add sample products - manually set each cell
    const electronicsRow2 = electronicsSheet.getRow(2);
    electronicsRow2.getCell(1).value = 'Wireless Headphones';
    electronicsRow2.getCell(2).value = 'Premium noise-cancelling wireless headphones with 30-hour battery life';
    electronicsRow2.getCell(3).value = 'headphones1.jpg, headphones2.jpg';
    electronicsRow2.getCell(4).value = 'NO';
    electronicsRow2.getCell(5).value = 2499;
    electronicsRow2.getCell(6).value = 3499;
    electronicsRow2.getCell(7).value = 50;
    electronicsRow2.getCell(8).value = 'active';
    electronicsRow2.getCell(10).value = '8518';
    electronicsRow2.getCell(12).value = 18;
    electronicsRow2.getCell(13).value = 'mrp_with_gst';
    electronicsRow2.getCell(14).value = 'physical';
    electronicsRow2.getCell(20).value = 'Brand: SoundMax, Connectivity: Bluetooth';
    electronicsRow2.commit();

    const electronicsRow3 = electronicsSheet.getRow(3);
    electronicsRow3.getCell(1).value = 'Conference Room - Per Day';
    electronicsRow3.getCell(2).value = 'Book our premium conference room for full day. Includes projector, whiteboard, and high-speed WiFi. Available 9 AM to 6 PM';
    electronicsRow3.getCell(3).value = 'conference1.jpg, conference2.jpg';
    electronicsRow3.getCell(4).value = 'NO';
    electronicsRow3.getCell(5).value = 2500;
    electronicsRow3.getCell(6).value = 3000;
    electronicsRow3.getCell(7).value = 0;
    electronicsRow3.getCell(8).value = 'active';
    electronicsRow3.getCell(11).value = '9996';
    electronicsRow3.getCell(12).value = 18;
    electronicsRow3.getCell(13).value = 'mrp_with_gst';
    electronicsRow3.getCell(14).value = 'booking';
    electronicsRow3.getCell(15).value = 1;
    electronicsRow3.getCell(16).value = 'days';
    electronicsRow3.getCell(17).value = 0;
    electronicsRow3.getCell(18).value = 'monday,tuesday,wednesday,thursday,friday';
    electronicsRow3.getCell(19).value = '09:00-18:00';
    electronicsRow3.commit();

    // Add Fashion sheet
    const fashionSheet = workbook.addWorksheet('Fashion');
    
    // Manually add header row
    const fashionHeaderRow = fashionSheet.getRow(1);
    fashionHeaderRow.getCell(1).value = 'Product Name';
    fashionHeaderRow.getCell(2).value = 'Description';
    fashionHeaderRow.getCell(3).value = 'Images (comma-separated filenames)';
    fashionHeaderRow.getCell(4).value = 'Has Variants';
    fashionHeaderRow.getCell(5).value = 'Price';
    fashionHeaderRow.getCell(6).value = 'Compare At Price (Optional)';
    fashionHeaderRow.getCell(7).value = 'Stock Quantity';
    fashionHeaderRow.getCell(8).value = 'Status (active/draft/archived)';
    fashionHeaderRow.getCell(9).value = 'Variant Count';
    fashionHeaderRow.getCell(10).value = 'HSN Code';
    fashionHeaderRow.getCell(11).value = 'SAC Code';
    fashionHeaderRow.getCell(12).value = 'GST Rate (%)';
    fashionHeaderRow.getCell(13).value = 'Price Type';
    fashionHeaderRow.getCell(14).value = 'Product Type';
    fashionHeaderRow.getCell(15).value = 'Booking Duration';
    fashionHeaderRow.getCell(16).value = 'Booking Duration Unit';
    fashionHeaderRow.getCell(17).value = 'Booking Buffer Time';
    fashionHeaderRow.getCell(18).value = 'Booking Available Days';
    fashionHeaderRow.getCell(19).value = 'Booking Time Slots';
    fashionHeaderRow.getCell(20).value = 'Attributes';
    
    // Style header row
    fashionHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    fashionHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    fashionHeaderRow.commit();
    
    // Set column widths AFTER committing header
    fashionSheet.getColumn(1).width = 30;
    fashionSheet.getColumn(2).width = 50;
    fashionSheet.getColumn(3).width = 35;
    fashionSheet.getColumn(4).width = 15;
    fashionSheet.getColumn(5).width = 15;
    fashionSheet.getColumn(6).width = 20;
    fashionSheet.getColumn(7).width = 15;
    fashionSheet.getColumn(8).width = 25;
    fashionSheet.getColumn(9).width = 15;
    fashionSheet.getColumn(10).width = 15;
    fashionSheet.getColumn(11).width = 15;
    fashionSheet.getColumn(12).width = 15;
    fashionSheet.getColumn(13).width = 20;
    fashionSheet.getColumn(14).width = 15;
    fashionSheet.getColumn(15).width = 18;
    fashionSheet.getColumn(16).width = 22;
    fashionSheet.getColumn(17).width = 20;
    fashionSheet.getColumn(18).width = 35;
    fashionSheet.getColumn(19).width = 30;
    fashionSheet.getColumn(20).width = 40;

    // Add sample product - manually set each cell
    const fashionRow2 = fashionSheet.getRow(2);
    fashionRow2.getCell(1).value = 'Cotton T-Shirt';
    fashionRow2.getCell(2).value = 'Premium cotton t-shirt available in multiple sizes and colors. 100% cotton, comfortable fit';
    fashionRow2.getCell(3).value = 'tshirt1.jpg, tshirt2.jpg';
    fashionRow2.getCell(4).value = 'YES';
    fashionRow2.getCell(5).value = '399 - 499';
    fashionRow2.getCell(6).value = 699;
    fashionRow2.getCell(7).value = 0;
    fashionRow2.getCell(8).value = 'active';
    fashionRow2.getCell(9).value = 5;
    fashionRow2.getCell(10).value = '6109';
    fashionRow2.getCell(12).value = 12;
    fashionRow2.getCell(13).value = 'mrp_with_gst';
    fashionRow2.getCell(14).value = 'physical';
    fashionRow2.getCell(20).value = 'Material: Cotton, Fit: Regular';
    fashionRow2.commit();

    // Add Product Variants sheet
    const variantsSheet = workbook.addWorksheet('Product Variants');
    
    // Manually add header row
    const variantsHeaderRow = variantsSheet.getRow(1);
    variantsHeaderRow.getCell(1).value = 'Product Name';
    variantsHeaderRow.getCell(2).value = 'Variant Name';
    variantsHeaderRow.getCell(3).value = 'SKU';
    variantsHeaderRow.getCell(4).value = 'Size';
    variantsHeaderRow.getCell(5).value = 'Color';
    variantsHeaderRow.getCell(6).value = 'Price';
    variantsHeaderRow.getCell(7).value = 'Compare At Price';
    variantsHeaderRow.getCell(8).value = 'Stock Quantity';
    variantsHeaderRow.getCell(9).value = 'Is Active';
    
    // Style header row
    variantsHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    variantsHeaderRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    variantsHeaderRow.commit();
    
    // Set column widths AFTER committing header
    variantsSheet.getColumn(1).width = 30;
    variantsSheet.getColumn(2).width = 30;
    variantsSheet.getColumn(3).width = 20;
    variantsSheet.getColumn(4).width = 15;
    variantsSheet.getColumn(5).width = 15;
    variantsSheet.getColumn(6).width = 15;
    variantsSheet.getColumn(7).width = 18;
    variantsSheet.getColumn(8).width = 15;
    variantsSheet.getColumn(9).width = 12;

    // Add variants - manually set cells
    const variantRow2 = variantsSheet.getRow(2);
    variantRow2.getCell(1).value = 'Cotton T-Shirt';
    variantRow2.getCell(2).value = 'Small - Red';
    variantRow2.getCell(3).value = 'TSHIRT-S-RED';
    variantRow2.getCell(4).value = 'S';
    variantRow2.getCell(5).value = 'Red';
    variantRow2.getCell(6).value = 399;
    variantRow2.getCell(7).value = 699;
    variantRow2.getCell(8).value = 10;
    variantRow2.getCell(9).value = 'YES';
    variantRow2.commit();

    const variantRow3 = variantsSheet.getRow(3);
    variantRow3.getCell(1).value = 'Cotton T-Shirt';
    variantRow3.getCell(2).value = 'Medium - Red';
    variantRow3.getCell(3).value = 'TSHIRT-M-RED';
    variantRow3.getCell(4).value = 'M';
    variantRow3.getCell(5).value = 'Red';
    variantRow3.getCell(6).value = 449;
    variantRow3.getCell(7).value = 699;
    variantRow3.getCell(8).value = 15;
    variantRow3.getCell(9).value = 'YES';
    variantRow3.commit();

    const variantRow4 = variantsSheet.getRow(4);
    variantRow4.getCell(1).value = 'Cotton T-Shirt';
    variantRow4.getCell(2).value = 'Large - Blue';
    variantRow4.getCell(3).value = 'TSHIRT-L-BLUE';
    variantRow4.getCell(4).value = 'L';
    variantRow4.getCell(5).value = 'Blue';
    variantRow4.getCell(6).value = 499;
    variantRow4.getCell(7).value = 699;
    variantRow4.getCell(8).value = 12;
    variantRow4.getCell(9).value = 'YES';
    variantRow4.commit();

    const variantRow5 = variantsSheet.getRow(5);
    variantRow5.getCell(1).value = 'Cotton T-Shirt';
    variantRow5.getCell(2).value = 'Large - Black';
    variantRow5.getCell(3).value = 'TSHIRT-L-BLACK';
    variantRow5.getCell(4).value = 'L';
    variantRow5.getCell(5).value = 'Black';
    variantRow5.getCell(6).value = 499;
    variantRow5.getCell(7).value = 699;
    variantRow5.getCell(8).value = 20;
    variantRow5.getCell(9).value = 'YES';
    variantRow5.commit();

    const variantRow6 = variantsSheet.getRow(6);
    variantRow6.getCell(1).value = 'Cotton T-Shirt';
    variantRow6.getCell(2).value = 'XL - Black';
    variantRow6.getCell(3).value = 'TSHIRT-XL-BLACK';
    variantRow6.getCell(4).value = 'XL';
    variantRow6.getCell(5).value = 'Black';
    variantRow6.getCell(6).value = 499;
    variantRow6.getCell(7).value = 699;
    variantRow6.getCell(8).value = 8;
    variantRow6.getCell(9).value = 'YES';
    variantRow6.commit();

    // Add Instructions sheet
    const instructionsSheet = workbook.addWorksheet('Instructions');
    
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
    
    // Set column width AFTER adding all rows
    instructionsSheet.getColumn(1).width = 100;

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
