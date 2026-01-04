import { useVendorContext } from '@/contexts/VendorContext';
import { useMemo } from 'react';

/**
 * Hook to get theme-aware CSS classes that automatically switch between 
 * main marketplace theme and vendor theme based on context
 */
export function useThemeClasses() {
  const { isVendorStore, vendor } = useVendorContext();

  console.log('🟢 useThemeClasses:', { isVendorStore, vendorId: vendor?.id, vendorName: vendor?.businessName });

  return useMemo(() => ({
    // Background colors
    bg: isVendorStore ? 'vendor-bg' : 'bg-background',
    cardBg: isVendorStore ? 'vendor-bg' : 'bg-card',
    
    // Text colors
    text: isVendorStore ? 'vendor-text' : 'text-foreground',
    textMuted: isVendorStore ? 'vendor-text-80' : 'text-muted-foreground',
    
    // Primary colors
    primary: isVendorStore ? 'vendor-primary' : 'text-primary',
    primaryBg: isVendorStore ? 'vendor-primary-bg' : 'bg-primary',
    primaryFg: isVendorStore ? 'text-white' : 'text-primary-foreground',
    
    // Secondary
    secondaryBg: isVendorStore ? 'vendor-secondary-bg' : 'bg-secondary',
    
    // Accent
    accent: isVendorStore ? 'vendor-accent' : 'text-accent',
    
    // Borders
    border: isVendorStore ? 'vendor-border-primary' : 'border-border',
    borderLight: isVendorStore ? 'vendor-border-primary-30' : 'border-border',
    
    // Special classes
    heading: isVendorStore ? 'vendor-themed-heading' : 'text-foreground font-bold',
    link: isVendorStore ? 'vendor-themed-link' : 'text-primary hover:underline',
    productCard: isVendorStore ? 'vendor-product-card' : 'bg-card border border-border',
    productPrice: isVendorStore ? 'vendor-product-price' : 'text-primary font-semibold',
    
    // Button styles
    primaryButton: isVendorStore 
      ? 'vendor-primary-bg text-white hover:opacity-90' 
      : 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondaryButton: isVendorStore
      ? 'vendor-secondary-bg vendor-text hover:opacity-90'
      : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    
    // Input/Form styles
    input: isVendorStore
      ? 'vendor-bg vendor-text vendor-border-primary focus:ring-vendor-primary'
      : 'bg-background text-foreground border-input focus:ring-ring',
    card: isVendorStore
      ? 'vendor-bg vendor-border-primary'
      : 'bg-card border-border',
    
    // Helper to combine classes
    combine: (...classes: string[]) => classes.filter(Boolean).join(' '),
    
    // Check if vendor store
    isVendorStore,
  }), [isVendorStore, vendor?.id]); // Re-compute when vendor changes
}
