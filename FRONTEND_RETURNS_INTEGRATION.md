# Frontend Implementation Guide: Individual Item Returns

## Overview
This guide explains how to integrate the individual item returns feature into the existing orders page.

## Components Created

### 1. ReturnRequestModal.tsx
**Location:** `src/components/ReturnRequestModal.tsx`

**Purpose:** Modal for customers to request returns for individual items

**Features:**
- Select specific items from an order
- Choose quantity to return (partial returns supported)
- Multiple return reasons with "other" option
- Upload up to 5 images for defective/damaged items
- Additional notes field
- Shows available quantity for return
- Prevents returning already-returned items

**Props:**
```typescript
interface ReturnRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  items: OrderItem[];
  onSubmit: (returnData: {
    orderItemId: string;
    quantity: number;
    reason: string;
    customerNotes?: string;
    images?: string[];
  }) => Promise<void>;
}
```

### 2. OrderReturnsDisplay.tsx
**Location:** `src/components/OrderReturnsDisplay.tsx`

**Purpose:** Display all return requests for an order

**Features:**
- Shows return status with icons
- Displays refund amount
- Shows attached images
- Vendor notes/rejection reasons
- Return tracking number
- Timeline of return events

**Props:**
```typescript
interface OrderReturnsDisplayProps {
  returns: ReturnItem[];
}
```

## Integration Steps

### Step 1: Update Order Interface
Add return-related fields to the Order and OrderItem interfaces:

```typescript
// In src/app/orders/page.tsx

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  productImage?: string;
  // Add these:
  returnedQuantity?: number;
  returnStatus?: 'none' | 'partial' | 'full';
  product?: {
    id: string;
    slug: string;
    featuredImage?: string;
    vendor?: {
      id: string;
      slug: string;
      businessName: string;
      subdomain?: string;
    };
  };
}

interface Order {
  // ... existing fields
  items: OrderItem[];
  returns?: ReturnItem[]; // Add this
}

interface ReturnItem {
  id: string;
  returnNumber: string;
  orderItemId: string;
  productName: string;
  quantity: number;
  originalQuantity: number;
  refundAmount: number;
  refundTotal: number;
  reason: string;
  status: 'requested' | 'approved' | 'rejected' | 'received' | 'refunded' | 'cancelled';
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  refundedAt?: string;
  rejectionReason?: string;
  vendorNotes?: string;
  customerNotes?: string;
  trackingNumber?: string;
  images?: string[];
}
```

### Step 2: Add State for Return Modal

```typescript
// In src/app/orders/page.tsx

import ReturnRequestModal from '@/components/ReturnRequestModal';
import OrderReturnsDisplay from '@/components/OrderReturnsDisplay';

// Add state
const [showReturnItemModal, setShowReturnItemModal] = useState(false);
const [orderForReturn, setOrderForReturn] = useState<Order | null>(null);
```

### Step 3: Fetch Returns with Orders

Update the `fetchOrders` function to include returns:

```typescript
const fetchOrders = async () => {
  setLoading(true);
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      const ordersWithReturns = await Promise.all(
        data.orders.map(async (order: Order) => {
          // Fetch returns for this order
          try {
            const returnsResponse = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/returns/my-returns?orderId=${order.id}`,
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              }
            );
            if (returnsResponse.ok) {
              const returnsData = await returnsResponse.json();
              order.returns = returnsData.data || [];
            }
          } catch (error) {
            console.error('Error fetching returns for order:', order.id, error);
          }
          return order;
        })
      );
      setOrders(ordersWithReturns);
    }
  } catch (error) {
    console.error('Error fetching orders:', error);
  } finally {
    setLoading(false);
  }
};
```

### Step 4: Add Return Item Handler

```typescript
const handleReturnItem = async (returnData: {
  orderItemId: string;
  quantity: number;
  reason: string;
  customerNotes?: string;
  images?: string[];
}) => {
  if (!orderForReturn) return;

  try {
    const token = localStorage.getItem('token');
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/returns`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: orderForReturn.id,
          ...returnData
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      showToast('Return request submitted successfully!', 'success');
      setShowReturnItemModal(false);
      setOrderForReturn(null);
      fetchOrders(); // Refresh to show new return
    } else {
      const error = await response.json();
      showToast(error.message || 'Failed to submit return request', 'error');
    }
  } catch (error) {
    console.error('Error submitting return:', error);
    showToast('Failed to submit return request. Please try again.', 'error');
  }
};
```

### Step 5: Check Return Eligibility

Add a function to check if items can be returned:

```typescript
const canReturnItems = (order: Order): boolean => {
  // Order must be delivered
  if (order.status !== 'delivered') return false;
  
  // Check vendor return policy
  const allowReturns = order.returnPolicy?.allowReturns ?? true;
  const returnPolicyDays = order.returnPolicy?.returnPolicyDays ?? 7;
  
  if (!allowReturns || returnPolicyDays === 0) return false;
  
  // Check return window
  if (!order.deliveredAt) return false;
  
  const deliveryDate = new Date(order.deliveredAt);
  const currentDate = new Date();
  const daysSinceDelivery = Math.floor(
    (currentDate.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceDelivery > returnPolicyDays) return false;
  
  // Check if any items are available for return
  return order.items.some(item => {
    const returned = item.returnedQuantity || 0;
    return item.quantity > returned;
  });
};
```

### Step 6: Update UI - Add Return Button

In your order card/detail UI, add a "Return Item" button:

```tsx
{/* In your order rendering code */}
{order.status === 'delivered' && canReturnItems(order) && (
  <button
    onClick={() => {
      setOrderForReturn(order);
      setShowReturnItemModal(true);
    }}
    className={theme.combine(
      'px-4 py-2 rounded-lg border transition-colors',
      theme.border,
      theme.hover
    )}
  >
    Return Item
  </button>
)}
```

### Step 7: Display Returns

Add the returns display component in your order details:

```tsx
{/* In order detail section */}
{order.returns && order.returns.length > 0 && (
  <OrderReturnsDisplay returns={order.returns} />
)}
```

### Step 8: Add Modals to Page

At the end of your component, add the modal:

```tsx
{/* Return Item Modal */}
{orderForReturn && (
  <ReturnRequestModal
    isOpen={showReturnItemModal}
    onClose={() => {
      setShowReturnItemModal(false);
      setOrderForReturn(null);
    }}
    orderId={orderForReturn.id}
    orderNumber={orderForReturn.orderNumber}
    items={orderForReturn.items}
    onSubmit={handleReturnItem}
  />
)}
```

## API Endpoints Used

### Customer Endpoints

1. **Check Eligibility**
   ```
   POST /api/returns/check-eligibility
   Body: { orderId, orderItemId }
   ```

2. **Create Return**
   ```
   POST /api/returns
   Body: {
     orderId,
     orderItemId,
     quantity,
     reason,
     customerNotes?,
     images?
   }
   ```

3. **Get My Returns**
   ```
   GET /api/returns/my-returns?orderId={orderId}&status={status}
   ```

4. **Get Return Details**
   ```
   GET /api/returns/{returnId}
   ```

## Styling Notes

- All components use `useThemeClasses()` hook for consistent theming
- No inline styles - all styling through theme classes
- Responsive design with mobile-first approach
- Dark mode support via theme context
- Accessibility considerations (ARIA labels, keyboard navigation)

## Testing Checklist

- [ ] Can select different items from an order
- [ ] Can specify partial quantity returns
- [ ] All return reasons work correctly
- [ ] Image upload works (max 5 images)
- [ ] Form validation prevents invalid submissions
- [ ] Return requests appear immediately after submission
- [ ] Return status updates display correctly
- [ ] Vendor notes and rejection reasons show properly
- [ ] Cannot return same item twice
- [ ] Return button only shows for eligible orders
- [ ] Mobile responsive layout works
- [ ] Dark mode displays correctly

## Backend Requirements

Ensure backend has these endpoints implemented:
- ✅ POST /api/returns
- ✅ GET /api/returns/my-returns
- ✅ GET /api/returns/:returnId
- ✅ POST /api/returns/check-eligibility

Refer to `INDIVIDUAL_ITEM_RETURNS_FEATURE.md` in backend for full API documentation.

## Next Steps

1. Integrate components into orders page
2. Add image upload endpoint if not exists
3. Test with various scenarios
4. Add loading states and error handling
5. Implement real-time status updates (optional)
6. Add email notifications (backend)
7. Create admin/vendor panels for managing returns
