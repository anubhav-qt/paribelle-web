'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';

interface ThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  headingFont?: string;
  layout?: string;
  templateId?: string;
  customCss?: string;
  showLogo?: boolean;
  showSearchBar?: boolean;
  footerText?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    linkedin?: string;
  };
}

interface Vendor {
  id: string;
  businessName: string;
  slug: string;
  logo?: string;
  description?: string;
  themeConfig?: ThemeConfig;
}

interface VendorContextType {
  vendor: Vendor | null;
  isVendorStore: boolean;
  themeConfig: ThemeConfig | null;
  isLoading: boolean;
}

const VendorContext = createContext<VendorContextType>({
  vendor: null,
  isVendorStore: false,
  themeConfig: null,
  isLoading: false,
});

export const useVendorContext = () => useContext(VendorContext);

interface VendorProviderProps {
  children: ReactNode;
  vendorSlug?: string;
  initialData?: Vendor | null;
}

export function VendorProvider({ children, vendorSlug, initialData }: VendorProviderProps) {
  const [vendor, setVendor] = useState<Vendor | null>(initialData || null);
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(initialData?.themeConfig || null);
  const [isLoading, setIsLoading] = useState(false);
  const isVendorStore = !!vendorSlug;

  console.log('🔵 VendorProvider initialized:', { vendorSlug, isVendorStore, hasInitialData: !!initialData });

  // Helper function to apply theme
  const applyTheme = (config: ThemeConfig) => {
    const root = document.documentElement;
    if (config.primaryColor) {
      console.log('🔵 Setting --vendor-primary to:', config.primaryColor);
      root.style.setProperty('--vendor-primary', config.primaryColor);
    }
    if (config.secondaryColor) {
      console.log('🔵 Setting --vendor-secondary to:', config.secondaryColor);
      root.style.setProperty('--vendor-secondary', config.secondaryColor);
    }
    if (config.accentColor) root.style.setProperty('--vendor-accent', config.accentColor);
    if (config.backgroundColor) {
      console.log('🔵 Setting --vendor-bg to:', config.backgroundColor);
      root.style.setProperty('--vendor-bg', config.backgroundColor);
    }
    if (config.textColor) {
      console.log('🔵 Setting --vendor-text to:', config.textColor);
      root.style.setProperty('--vendor-text', config.textColor);
    }
    if (config.fontFamily) root.style.setProperty('--vendor-font', config.fontFamily);
    if (config.headingFont) root.style.setProperty('--vendor-heading-font', config.headingFont);

    // Log actual computed values
    console.log('🔵 CSS Variables set on :root:', {
      '--vendor-primary': root.style.getPropertyValue('--vendor-primary'),
      '--vendor-secondary': root.style.getPropertyValue('--vendor-secondary'),
      '--vendor-bg': root.style.getPropertyValue('--vendor-bg'),
      '--vendor-text': root.style.getPropertyValue('--vendor-text'),
    });

    // Test if CSS classes work
    setTimeout(() => {
      const testDiv = document.createElement('div');
      testDiv.className = 'vendor-text';
      testDiv.style.display = 'none';
      document.body.appendChild(testDiv);
      const computedColor = window.getComputedStyle(testDiv).color;
      console.log('🔵 Test element with .vendor-text has computed color:', computedColor);
      console.log('🔵 Expected color:', config.textColor);
      document.body.removeChild(testDiv);
    }, 100);

    // Apply custom CSS
    if (config.customCss) {
      const styleId = 'vendor-custom-css';
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      styleElement.textContent = config.customCss;
    }
    console.log('🔵 Theme applied successfully');
  };

  // Apply theme immediately if we have initial data
  useEffect(() => {
    if (initialData?.themeConfig) {
      console.log('🔵 Applying initial theme from server data:', {
        templateId: initialData.themeConfig.templateId,
        primaryColor: initialData.themeConfig.primaryColor,
        fullConfig: initialData.themeConfig
      });
      applyTheme(initialData.themeConfig);
    }
  }, []);

  useEffect(() => {
    console.log('🔵 VendorProvider useEffect running:', { vendorSlug, isLoading, hasInitialData: !!initialData });
    
    if (!vendorSlug) {
      setVendor(null);
      setThemeConfig(null);
      setIsLoading(false);
      console.log('🔵 No vendor slug, clearing theme');
      // Clean up vendor CSS variables
      const root = document.documentElement;
      root.style.removeProperty('--vendor-primary');
      root.style.removeProperty('--vendor-secondary');
      root.style.removeProperty('--vendor-accent');
      root.style.removeProperty('--vendor-bg');
      root.style.removeProperty('--vendor-text');
      root.style.removeProperty('--vendor-font');
      root.style.removeProperty('--vendor-heading-font');
      return;
    }

    // If we have initial data and it matches the slug, don't fetch
    if (initialData && initialData.slug === vendorSlug) {
      console.log('🔵 Using initial data from server, skipping fetch');
      return;
    }

    // Prevent duplicate fetches
    if (isLoading) {
      console.log('🔵 Already loading, skipping');
      return;
    }

    setIsLoading(true);
    
    console.log('🔵 Fetching vendor data for:', vendorSlug);
    // Fetch vendor data
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorSlug}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        console.log('🔵 Vendor data received:', data);
        if (data) {
          setVendor(data);
          const config = data.themeConfig;
          setThemeConfig(config);
          setIsLoading(false);

          console.log('🔵 Theme config:', config);

          // Apply theme
          if (config) {
            applyTheme(config);
          } else {
            console.log('🔵 No theme config found in vendor data');
          }
        } else {
          console.log('🔵 No vendor data received');
        }
      })
      .catch(err => {
        console.error('🔴 Error fetching vendor:', err);
        setIsLoading(false);
      });

    return () => {
      // Cleanup
      const root = document.documentElement;
      root.style.removeProperty('--vendor-primary');
      root.style.removeProperty('--vendor-secondary');
      root.style.removeProperty('--vendor-accent');
      root.style.removeProperty('--vendor-bg');
      root.style.removeProperty('--vendor-text');
      root.style.removeProperty('--vendor-font');
      root.style.removeProperty('--vendor-heading-font');
      
      const styleElement = document.getElementById('vendor-custom-css');
      if (styleElement) styleElement.remove();
    };
  }, [vendorSlug]);

  const contextValue = useMemo(
    () => ({ vendor, isVendorStore, themeConfig, isLoading }),
    [vendor, isVendorStore, themeConfig, isLoading]
  );

  return (
    <VendorContext.Provider value={contextValue}>
      {children}
    </VendorContext.Provider>
  );
}

// Helper function to get theme class
export function getThemeClass(baseClass: string, vendorClass: string, isVendorStore: boolean): string {
  return isVendorStore ? vendorClass : baseClass;
}
