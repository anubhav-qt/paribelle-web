# Vendor Theme Debugging Guide

## Recent Changes

### 1. Added Console Logging
Added comprehensive console logging to track vendor theme application:

- **VendorContext.tsx**: Logs when provider renders, useEffect triggers, vendor data fetched, and CSS variables set
- **CategoryNav.tsx**: Logs when component renders with isVendorStore, vendor, and theme values  
- **Footer.tsx**: Logs when component renders with isVendorStore, vendor, and theme values

### 2. Improved useThemeClasses Hook
Modified `src/hooks/useThemeClasses.ts` to:
- Extract both `isVendorStore` and `vendor` from VendorContext
- Use `useMemo` to memoize the returned object
- Depend on both `isVendorStore` and `vendor?.id` to trigger re-computation when vendor loads

**Why**: This ensures components using the hook re-render when:
1. `vendorSlug` is extracted from subdomain (`isVendorStore` becomes true)
2. Vendor data is fetched and loaded (`vendor` changes from null to loaded)

## How Vendor Theme Works

### Architecture
1. **providers.tsx**: Extracts `vendorSlug` from subdomain via `useEffect`
2. **VendorContext**: 
   - Receives `vendorSlug` prop
   - Sets `isVendorStore = !!vendorSlug`
   - Fetches vendor data via API
   - Applies theme config to CSS variables on `:root`
3. **useThemeClasses**: Returns CSS class names based on `isVendorStore`
4. **Components**: Use `theme.combine()` to apply conditional CSS classes

### Rendering Timeline
```
Initial Render:
- vendorSlug: undefined
- isVendorStore: false  
- CSS classes: bg-secondary, text-foreground, etc.

After useEffect in providers.tsx:
- vendorSlug: "aniljoshi2" (extracted from subdomain)
- isVendorStore: true
- CSS classes: vendor-bg, vendor-text, etc.
- CSS variables: NOT SET YET (using fallbacks)

After vendor data fetched:
- vendor: { id, businessName, themeConfig, ... }
- CSS variables: SET (--vendor-primary, --vendor-bg, etc.)
- CSS classes: vendor-bg, vendor-text (now use custom colors)
```

### CSS Classes
All vendor theme CSS classes are defined in `src/app/globals.css`:

```css
.vendor-bg {
  background-color: var(--vendor-bg, hsl(var(--background)));
}

.vendor-text {
  color: var(--vendor-text, hsl(var(--foreground)));
}

.vendor-primary-bg {
  background-color: var(--vendor-primary, hsl(var(--primary)));
}

.vendor-border-primary {
  border-color: var(--vendor-primary, hsl(var(--primary)));
}
```

Each class uses CSS variables with fallbacks to the main theme.

## Testing Steps

### 1. Run the Dev Server
```bash
cd marketplace-web
npm run dev
```

### 2. Access Vendor Subdomain
Open browser to: `http://aniljoshi2.localhost:3000`

Replace `aniljoshi2` with the actual vendor slug in your database.

### 3. Check Console Logs
Open Browser DevTools Console and look for logs with emojis:

```
🟠 Providers: hostname: aniljoshi2.localhost
🟠 Providers: extracted vendorSlug from subdomain: aniljoshi2
🟡 VendorProvider render: vendorSlug: aniljoshi2 isVendorStore: true vendor: undefined
🟡 VendorProvider: useEffect triggered, vendorSlug: aniljoshi2
🟡 VendorProvider: Fetching vendor data for: aniljoshi2
🔴 CategoryNav render: isVendorStore: true vendor: undefined theme: {...}
🟢 Footer render: isVendorStore: true vendor: undefined theme: {...}
🟡 VendorProvider: Vendor data received: Anil Joshi
🟡 VendorProvider: Applying theme config: {...}
🟡 Set --vendor-primary: #ff6b6b
🟡 Set --vendor-bg: #ffffff
🟡 Set --vendor-text: #333333
🔴 CategoryNav render: isVendorStore: true vendor: Anil Joshi theme: {...}
🟢 Footer render: isVendorStore: true vendor: Anil Joshi theme: {...}
```

**Expected**: CategoryNav and Footer should re-render after vendor data is loaded.

### 4. Check CSS Variables in DevTools
In Elements tab, select the `<html>` element and check Computed styles:

Look for:
- `--vendor-primary`
- `--vendor-bg`
- `--vendor-text`
- `--vendor-secondary`
- `--vendor-accent`

**Expected**: These should be set to the vendor's theme colors.

### 5. Check Applied Classes
In Elements tab, inspect the CategoryNav and Footer elements:

CategoryNav should have:
```html
<div class="border-b sticky top-[76px] z-30 vendor-bg vendor-border-primary">
```

Footer should have:
```html
<div class="vendor-bg vendor-text">
```

### 6. Check Computed Colors
In Elements tab, inspect CategoryNav or Footer, and in Computed styles check:
- `background-color` should use vendor color (not default secondary color)
- `color` should use vendor text color
- `border-color` should use vendor primary color

## Troubleshooting

### Issue: Theme not applying at all
**Symptoms**: Colors remain default (secondary background, etc.)

**Debug**:
1. Check console logs - is `isVendorStore` true?
2. Check console logs - is vendor data being fetched?
3. Check console logs - are CSS variables being set?
4. Check DevTools Elements - are vendor CSS classes applied?
5. Check DevTools Computed - are CSS variables set on `:root`?

**Fix**:
- If `isVendorStore` is false: Check subdomain extraction in providers.tsx
- If vendor not fetched: Check API endpoint and network tab
- If CSS variables not set: Check VendorContext useEffect
- If classes not applied: Check component is using `theme.combine()`

### Issue: Theme applying to header but not navbar/footer
**Symptoms**: Header has correct vendor colors, but CategoryNav and Footer use default colors

**Debug**:
1. Check console logs for CategoryNav and Footer re-renders
2. They should render twice:
   - First with `vendor: undefined`
   - Second with `vendor: { ... }` (loaded data)
3. Check if all three components use the same pattern:
   ```tsx
   const theme = useThemeClasses();
   const { isVendorStore, vendor } = useVendorContext();
   className={theme.combine(...)}
   ```

**Fix**:
- If components don't re-render when vendor loads: The fix we just applied (memoizing useThemeClasses with vendor?.id dependency) should resolve this
- If they re-render but classes don't change: Check `isVendorStore` value in console logs
- If CSS variables aren't being used: Check CSS class definitions in globals.css

### Issue: Colors flash/change
**Symptoms**: Page initially shows default theme, then switches to vendor theme

**This is expected behavior** due to:
1. Initial render with no vendorSlug (uses default theme)
2. useEffect extracts vendorSlug from subdomain
3. Re-render with vendor theme classes
4. Vendor data fetched and CSS variables set

To minimize flash, we could:
- Use SSR to extract vendor from subdomain on server
- Add loading state to hide content until vendor loads
- Use CSS transitions for smooth color changes

## Next Steps

If the issue persists after these changes:

1. **Share console logs**: Copy all logs from browser console
2. **Share DevTools inspection**: Screenshot of:
   - Elements tab showing CategoryNav classes
   - Computed styles showing CSS variables on `:root`
   - Computed styles showing CategoryNav background-color
3. **Test with different vendors**: Try multiple vendor subdomains to see if it's vendor-specific

## Code Reference

Key files involved:
- `src/components/providers.tsx` - Extracts vendorSlug from subdomain
- `src/contexts/VendorContext.tsx` - Fetches vendor and applies theme
- `src/hooks/useThemeClasses.ts` - Returns theme-aware CSS classes
- `src/app/globals.css` - Defines vendor CSS classes
- `src/components/UnifiedHeader.tsx` - Header (WORKING)
- `src/components/CategoryNav.tsx` - Navbar (NEEDS TESTING)
- `src/components/Footer.tsx` - Footer (NEEDS TESTING)
