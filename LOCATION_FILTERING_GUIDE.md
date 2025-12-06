# Location-Based Product Filtering - Implementation Guide

## Overview
This feature allows vendors to specify their city and sub-location, and enables buyers to filter products based on location both on the main marketplace and vendor subdomain sites.

## What's Been Implemented

### Backend

#### 1. Location Module (`apps/backend/src/modules/locations/`)
- **Entities:**
  - `City` - Stores cities with state and country
  - `SubLocation` - Stores areas/localities within cities with optional zip codes

- **Services:**
  - Get all cities with sub-locations
  - Get sub-locations by city
  - Create/delete cities and sub-locations

- **Controller:**
  - `GET /api/v1/locations/cities` - Get all cities
  - `GET /api/v1/locations/cities/:id` - Get specific city
  - `GET /api/v1/locations/cities/:cityId/sub-locations` - Get sub-locations
  - `POST /api/v1/locations/cities` - Create city
  - `POST /api/v1/locations/sub-locations` - Create sub-location
  - `DELETE /api/v1/locations/cities/:id` - Delete city
  - `DELETE /api/v1/locations/sub-locations/:id` - Delete sub-location

#### 2. Vendor Entity Updates
- Added `locationCity` relation (ManyToOne to City)
- Added `locationSubLocation` relation (ManyToOne to SubLocation)
- Added `cityId` and `subLocationId` fields
- Kept existing `city`, `state`, `country` for backward compatibility

#### 3. Products Service Updates
- Added `cityId` and `subLocationId` parameters to `findAll()` method
- Filters products by vendor's location
- Joins location tables when filtering by location

#### 4. Products Controller Updates
- Added `cityId` and `subLocationId` query parameters
- Passes location filters to service

### Frontend

#### 1. LocationFilter Component (`apps/web/src/components/LocationFilter.tsx`)
- Reusable dropdown component for location filtering
- Cascading selects: City → Sub-location
- Auto-fetches sub-locations when city is selected
- Props:
  - `onFilterChange(cityId, subLocationId)` - Callback when filters change
  - `showLabel` - Show/hide labels (default: true)
  - `className` - Additional CSS classes

#### 2. Main Marketplace (`apps/web/src/app/page.tsx`)
- Location filter added below hero banner
- Filters all products across all categories by location
- Re-fetches products when location changes

#### 3. Vendor Subdomain Page (`apps/web/src/app/vendor/[vendorSlug]/page.tsx`)
- Location filter added above product grid
- Shows vendor's products filtered by location
- Useful for vendors with products in multiple locations

## Setup Instructions

### 1. Database Migration

Run the SQL migration to create location tables and add vendor location fields:

```bash
# Option 1: Manual SQL execution
# Connect to your PostgreSQL database and run:
psql -U admin -d marketplace -f apps/backend/database/migrations/add-locations.sql

# Option 2: TypeORM will auto-create tables if synchronize: true
# The entities will be created automatically on next server start
```

### 2. Seed Location Data

The system includes pre-populated data for major Indian cities:

```bash
cd apps/backend
npm run ts-node src/database/seed-locations-runner.ts
```

This will create:
- **7 Major Cities:** Mumbai, Delhi, Bangalore, Pune, Hyderabad, Chennai, Kolkata
- **35+ Sub-locations** across these cities with zip codes

### 3. Restart Backend

```bash
cd apps/backend
npm run build
npm run start:dev
```

### 4. Test the Feature

#### API Testing:
```bash
# Get all cities
curl http://localhost:3001/api/v1/locations/cities

# Get sub-locations for a city
curl http://localhost:3001/api/v1/locations/cities/{cityId}/sub-locations

# Filter products by city
curl "http://localhost:3001/api/v1/products?cityId={cityId}"

# Filter products by city and sub-location
curl "http://localhost:3001/api/v1/products?cityId={cityId}&subLocationId={subLocationId}"
```

#### Frontend Testing:
1. Open main marketplace: `http://localhost:3000`
2. Use location filter below hero banner
3. Open vendor page: `http://abc.localhost:3000`
4. Use location filter to see products from specific areas

## Usage Guide

### For Vendors

#### Assigning Location to Vendor:
When creating/updating a vendor, include location fields:

```typescript
// Example vendor creation with location
const vendorData = {
  storeName: "ABC Store",
  slug: "abc",
  businessName: "ABC Business",
  cityId: "uuid-of-mumbai",
  subLocationId: "uuid-of-andheri",
  // ... other fields
};
```

You can update the vendor registration form to include location dropdowns.

### For Buyers

#### Main Marketplace:
1. Visit homepage
2. Select city from dropdown
3. Optionally select sub-location
4. Products from all categories will be filtered by selected location

#### Vendor Site:
1. Visit vendor subdomain (e.g., `http://abc.localhost:3000`)
2. Use location filter to see products from specific areas
3. Useful if vendor operates in multiple cities

## Adding More Cities/Locations

### Via API:
```bash
# Add a new city
curl -X POST http://localhost:3001/api/v1/locations/cities \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ahmedabad",
    "state": "Gujarat",
    "country": "India"
  }'

# Add a sub-location
curl -X POST http://localhost:3001/api/v1/locations/sub-locations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Satellite",
    "cityId": "{city-uuid}",
    "zipCode": "380015"
  }'
```

### Via Admin Panel:
Create admin pages for managing cities and sub-locations.

## Database Schema

### Cities Table:
```sql
cities (
  id UUID PRIMARY KEY,
  name VARCHAR(255) UNIQUE,
  state VARCHAR(255),
  country VARCHAR(255) DEFAULT 'India',
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
)
```

### Sub-locations Table:
```sql
sub_locations (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  cityId UUID REFERENCES cities(id),
  zipCode VARCHAR(20),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
)
```

### Vendor Updates:
```sql
vendors (
  ...existing fields...
  cityId UUID REFERENCES cities(id),
  subLocationId UUID REFERENCES sub_locations(id)
)
```

## Benefits

✅ **Vendor Benefits:**
- Target specific geographic markets
- Show products relevant to buyer's location
- Better inventory management per location

✅ **Buyer Benefits:**
- Find products available in their area
- Filter by city or specific locality
- Better delivery estimates (future feature)

✅ **Platform Benefits:**
- Scalable location-based filtering
- Support for multi-city vendors
- Foundation for location-based features (delivery zones, local deals, etc.)

## Future Enhancements

1. **Geolocation Auto-detect:** Auto-select buyer's city based on IP/GPS
2. **Delivery Zones:** Show only products that deliver to buyer's location
3. **Location-based Pricing:** Different prices for different locations
4. **Local Deals:** Special promotions for specific cities/areas
5. **Multi-location Vendors:** Allow vendors to operate from multiple cities
6. **Distance Calculation:** Show distance from vendor to buyer
7. **Map Integration:** Show vendors on a map

## Troubleshooting

### Products not filtering by location:
- Ensure vendors have `cityId` and `subLocationId` set
- Check if location tables are properly seeded
- Verify API endpoints return location data

### Location dropdowns empty:
- Run seed script: `npm run ts-node src/database/seed-locations-runner.ts`
- Check API: `http://localhost:3001/api/v1/locations/cities`

### CORS errors:
- Already fixed in `main.ts` to support vendor subdomains
- Ensure backend is running on port 3001

## Files Modified/Created

### Backend:
- ✅ `apps/backend/src/modules/locations/` - Complete module
- ✅ `apps/backend/src/modules/vendors/vendor.entity.ts` - Added location relations
- ✅ `apps/backend/src/modules/products/products.service.ts` - Added location filtering
- ✅ `apps/backend/src/modules/products/products.controller.ts` - Added location params
- ✅ `apps/backend/src/app.module.ts` - Registered LocationsModule
- ✅ `apps/backend/src/database/seed-locations.ts` - Seed data
- ✅ `apps/backend/database/migrations/add-locations.sql` - Migration script

### Frontend:
- ✅ `apps/web/src/components/LocationFilter.tsx` - Reusable component
- ✅ `apps/web/src/app/page.tsx` - Main marketplace with location filter
- ✅ `apps/web/src/app/vendor/[vendorSlug]/page.tsx` - Vendor page with location filter

## Support

For issues or questions, check:
1. Backend logs for API errors
2. Browser console for frontend errors
3. Database for proper data seeding
