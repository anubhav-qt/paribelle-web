# Booking Actions Helper Functions

Reusable utility functions for handling booking, enquiry, sharing, and communication actions across the marketplace.

## Location
`@/lib/utils/booking-actions`

## Available Functions

### 1. `handleBookNow(productSlug, hasAvailability)`
Navigate to the booking page for a product/tour.

**Parameters:**
- `productSlug: string` - The product slug
- `hasAvailability: boolean` - Whether the product has availability (default: true)

**Example:**
```tsx
import { handleBookNow } from '@/lib/utils/booking-actions';

<button onClick={() => handleBookNow(product.slug, !!nextDeparture)}>
  Book Now
</button>
```

---

### 2. `handleEnquireNow(product, customMessage?)`
Navigate to contact/enquiry page with pre-filled information.

**Parameters:**
- `product: ProductInfo` - Product information object with `{ slug, name }`
- `customMessage?: string` - Optional custom message to pre-fill

**Example:**
```tsx
import { handleEnquireNow } from '@/lib/utils/booking-actions';

<button onClick={() => handleEnquireNow(
  { slug: product.slug, name: product.name },
  'Please provide more details about pricing and availability'
)}>
  Enquire Now
</button>
```

---

### 3. `handleShare(product, description?)`
Share product/tour via Web Share API or fallback to clipboard.

**Parameters:**
- `product: ProductInfo` - Product information object with `{ slug, name }`
- `description?: string` - Optional description for sharing

**Example:**
```tsx
import { handleShare } from '@/lib/utils/booking-actions';

<button onClick={() => handleShare(
  { slug: product.slug, name: product.name },
  product.shortDescription
)}>
  <Share2 className="w-4 h-4" />
  Share
</button>
```

---

### 4. `handleEmail(product, vendorEmail?, supportEmail?)`
Open email client with pre-filled subject and body.

**Parameters:**
- `product: ProductInfo` - Product information object with `{ slug, name }`
- `vendorEmail?: string` - Vendor email address (optional)
- `supportEmail?: string` - Support email (default: 'support@marketplace.com')

**Example:**
```tsx
import { handleEmail } from '@/lib/utils/booking-actions';

<button onClick={() => handleEmail(
  { slug: product.slug, name: product.name },
  'vendor@example.com'
)}>
  <Mail className="w-4 h-4" />
  Email
</button>
```

---

### 5. `handleCall(phoneNumber, product?)`
Initiate phone call to vendor/support.

**Parameters:**
- `phoneNumber: string` - Phone number to call
- `product?: ProductInfo` - Product information (optional, for tracking)

**Example:**
```tsx
import { handleCall } from '@/lib/utils/booking-actions';

<button onClick={() => handleCall('+911234567890', { 
  slug: product.slug, 
  name: product.name 
})}>
  <Phone className="w-4 h-4" />
  Call
</button>
```

---

### 6. `handleWhatsApp(phoneNumber, product)`
Open WhatsApp with pre-filled message.

**Parameters:**
- `phoneNumber: string` - WhatsApp number (with country code)
- `product: ProductInfo` - Product information object

**Example:**
```tsx
import { handleWhatsApp } from '@/lib/utils/booking-actions';

<button onClick={() => handleWhatsApp('+911234567890', {
  slug: product.slug,
  name: product.name
})}>
  <MessageCircle className="w-4 h-4" />
  WhatsApp
</button>
```

---

### 7. `handleAddToCart(productId, quantity)`
Add product to cart (for physical products).

**Parameters:**
- `productId: string` - Product ID
- `quantity: number` - Quantity to add (default: 1)

**Returns:** `Promise<boolean>`

**Example:**
```tsx
import { handleAddToCart } from '@/lib/utils/booking-actions';

<button onClick={async () => {
  const success = await handleAddToCart(product.id, 2);
  if (success) {
    alert('Added to cart!');
  }
}}>
  Add to Cart
</button>
```

---

### 8. `checkAvailability(productId, date)`
Check availability for booking products.

**Parameters:**
- `productId: string` - Product ID
- `date: string` - Selected date

**Returns:** `Promise<boolean>`

**Example:**
```tsx
import { checkAvailability } from '@/lib/utils/booking-actions';

const available = await checkAvailability(product.id, '2024-12-25');
if (available) {
  // Show booking form
}
```

---

### 9. `formatPhoneNumber(phoneNumber)`
Format phone number for display.

**Parameters:**
- `phoneNumber: string` - Raw phone number

**Returns:** `string` - Formatted phone number

**Example:**
```tsx
import { formatPhoneNumber } from '@/lib/utils/booking-actions';

const formatted = formatPhoneNumber('+911234567890');
// Returns: "+91 12345 67890"
```

---

## TypeScript Interface

```typescript
interface ProductInfo {
  id?: string;
  slug: string;
  name: string;
  price?: number;
}
```

## Usage in Components

### Complete Example - Product Card with All Actions

```tsx
'use client';

import { Phone, Mail, Share2, MessageCircle } from 'lucide-react';
import {
  handleBookNow,
  handleEnquireNow,
  handleShare,
  handleEmail,
  handleCall,
  handleWhatsApp
} from '@/lib/utils/booking-actions';

interface ProductActionsProps {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    shortDescription?: string;
  };
  hasAvailability: boolean;
  vendorEmail?: string;
  vendorPhone?: string;
  vendorWhatsApp?: string;
}

export default function ProductActions({ 
  product, 
  hasAvailability,
  vendorEmail,
  vendorPhone,
  vendorWhatsApp
}: ProductActionsProps) {
  return (
    <div className="space-y-4">
      {/* Primary Actions */}
      <button 
        onClick={() => handleBookNow(product.slug, hasAvailability)}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
      >
        Book Now
      </button>
      
      <button 
        onClick={() => handleEnquireNow(product)}
        className="w-full bg-white text-blue-600 py-3 rounded-lg font-semibold border-2 border-blue-600 hover:bg-blue-50 transition"
      >
        Enquire Now
      </button>

      {/* Secondary Actions */}
      <div className="flex gap-2">
        {vendorPhone && (
          <button 
            onClick={() => handleCall(vendorPhone, product)}
            className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <Phone className="w-4 h-4" />
            <span className="text-sm">Call</span>
          </button>
        )}
        
        <button 
          onClick={() => handleEmail(product, vendorEmail)}
          className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <Mail className="w-4 h-4" />
          <span className="text-sm">Email</span>
        </button>
        
        {vendorWhatsApp && (
          <button 
            onClick={() => handleWhatsApp(vendorWhatsApp, product)}
            className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">WhatsApp</span>
          </button>
        )}
        
        <button 
          onClick={() => handleShare(product, product.shortDescription)}
          className="flex-1 flex items-center justify-center gap-2 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm">Share</span>
        </button>
      </div>
    </div>
  );
}
```

## Benefits

✅ **Reusability** - Use the same functions across all product types (tours, bookings, physical products)  
✅ **Consistency** - Standardized behavior across the entire application  
✅ **Maintainability** - Update logic in one place, applies everywhere  
✅ **Type Safety** - Full TypeScript support with clear interfaces  
✅ **Fallbacks** - Built-in error handling and fallback mechanisms  
✅ **Mobile Support** - Handles Web Share API and mobile-specific features  

## Where to Use

- Product detail pages
- Tour detail pages
- Product cards
- Search results
- Category pages
- Cart pages
- Checkout pages
- Order confirmation pages
- Vendor product management

## Customization

You can customize the helper functions by:
1. Modifying default messages
2. Adding analytics tracking
3. Integrating with your API endpoints
4. Adding additional validation logic
5. Customizing error messages

## Notes

- The `handleShare` function automatically detects if Web Share API is available and falls back to clipboard copy
- Phone numbers are automatically cleaned (removing spaces, dashes, etc.)
- Email and enquiry functions use URL encoding to handle special characters
- All functions include basic error handling with user-friendly alerts
