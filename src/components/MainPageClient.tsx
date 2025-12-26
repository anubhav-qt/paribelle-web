'use client';

import ThemeSelector from '@/components/ThemeSelector';
import Header from '@/components/Header';
import HeroCarousel from '@/components/HeroCarousel';
import Footer from '@/components/Footer';
import HomepageContent from '@/components/HomepageContent';
import { Suspense, useEffect, useState } from 'react';
import GoogleAuthHandler from '@/components/GoogleAuthHandler';

interface Category {
  id: string;
  name: string;
  slug: string;
  children?: Category[];
}

interface MainPageClientProps {
  settings: {
    locationFilterEnabled: boolean;
    currency: string;
    categoryDisplayMode: 'top' | 'sidebar';
    marketplaceName: string;
  };
  categories: Category[];
  productsByCategory: Record<string, any[]>;
  uncategorizedProducts: any[];
  initialTheme?: any;
}

// Default theme for main marketplace (fallback) - matches current Tailwind settings
const defaultFallbackTheme = {
  primaryColor: '#3B82F6', // hsl(221.2 83.2% 53.3%) converted to hex
  secondaryColor: '#F1F5F9', // hsl(210 40% 96.1%) - secondary
  accentColor: '#F1F5F9', // hsl(210 40% 96.1%) - accent
  backgroundColor: '#FFFFFF', // hsl(0 0% 100%)
  textColor: '#0F172A', // hsl(222.2 84% 4.9%) - foreground
  fontFamily: 'Inter',
  headingFont: 'Inter',
  cardColor: '#FFFFFF', // hsl(0 0% 100%)
  borderColor: '#E2E8F0', // hsl(214.3 31.8% 91.4%)
};

export default function MainPageClient({
  settings,
  categories,
  productsByCategory,
  uncategorizedProducts,
  initialTheme,
}: MainPageClientProps) {
  const [defaultTheme, setDefaultTheme] = useState(initialTheme || defaultFallbackTheme);

  // Only fetch theme client-side if not provided from server
  useEffect(() => {
    if (initialTheme) {
      return; // Already have theme from server, no need to fetch
    }
    
    const fetchDefaultTheme = async () => {
      try {
        const url = '/api/theme';
        console.log('[Theme] Fetching default theme from:', url);
        
        const response = await fetch(url, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
          },
        });
        
        console.log('[Theme] Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('[Theme] Received data:', data);
          
          if (data.value) {
            try {
              const savedTheme = JSON.parse(data.value);
              console.log('[Theme] Parsed theme:', savedTheme);
              setDefaultTheme({ ...defaultFallbackTheme, ...savedTheme });
            } catch (parseError) {
              console.error('[Theme] Failed to parse theme JSON:', parseError);
            }
          } else {
            console.log('[Theme] No theme value found, using fallback');
          }
        } else {
          console.warn('[Theme] Failed to fetch theme, status:', response.status);
        }
      } catch (error) {
        console.error('[Theme] Error fetching default theme:', error);
        console.log('[Theme] Using fallback theme');
        // Use fallback theme - no need to do anything as it's already set
      }
    };

    fetchDefaultTheme();
  }, [initialTheme]);

  // Apply default theme to main marketplace
  useEffect(() => {
    const root = document.documentElement;
    
    // Convert hex to HSL for Tailwind CSS variables
    const hexToHSL = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return '0 0% 0%';
      
      let r = parseInt(result[1], 16) / 255;
      let g = parseInt(result[2], 16) / 255;
      let b = parseInt(result[3], 16) / 255;
      
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h = 0, s = 0, l = (max + min) / 2;
      
      if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        
        switch (max) {
          case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: h = ((b - r) / d + 2) / 6; break;
          case b: h = ((r - g) / d + 4) / 6; break;
        }
      }
      
      h = Math.round(h * 360);
      s = Math.round(s * 100);
      l = Math.round(l * 100);
      
      return `${h} ${s}% ${l}%`;
    };
    
    // Calculate if a color is light or dark to determine appropriate text color
    const getContrastColor = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) return '0 0% 98%'; // Default to white
      
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);
      
      // Calculate relative luminance
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      
      // If luminance > 0.5, background is light, use dark text
      // If luminance <= 0.5, background is dark, use light text
      return luminance > 0.5 ? '0 0% 10%' : '0 0% 98%';
    };
    
    // Apply theme colors to Tailwind CSS variables
    root.style.setProperty('--primary', hexToHSL(defaultTheme.primaryColor));
    root.style.setProperty('--primary-foreground', getContrastColor(defaultTheme.primaryColor));
    root.style.setProperty('--secondary', hexToHSL(defaultTheme.secondaryColor));
    root.style.setProperty('--secondary-foreground', getContrastColor(defaultTheme.secondaryColor));
    root.style.setProperty('--accent', hexToHSL(defaultTheme.accentColor));
    root.style.setProperty('--background', hexToHSL(defaultTheme.backgroundColor));
    root.style.setProperty('--foreground', hexToHSL(defaultTheme.textColor));
    root.style.setProperty('--card', hexToHSL(defaultTheme.cardColor || defaultTheme.backgroundColor));
    root.style.setProperty('--border', hexToHSL(defaultTheme.borderColor || '#E2E8F0'));
    
    // Set font family on root and body
    root.style.setProperty('--marketplace-font', defaultTheme.fontFamily);
    document.body.style.fontFamily = defaultTheme.fontFamily;
    
    // Also set marketplace-specific CSS variables for backward compatibility
    root.style.setProperty('--marketplace-primary', defaultTheme.primaryColor);
    root.style.setProperty('--marketplace-secondary', defaultTheme.secondaryColor);
    root.style.setProperty('--marketplace-accent', defaultTheme.accentColor);
    root.style.setProperty('--marketplace-bg', defaultTheme.backgroundColor);
    root.style.setProperty('--marketplace-text', defaultTheme.textColor);
    
    return () => {
      // Cleanup on unmount - restore original values
      root.style.removeProperty('--primary');
      root.style.removeProperty('--secondary');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--background');
      root.style.removeProperty('--foreground');
      root.style.removeProperty('--card');
      root.style.removeProperty('--border');
      root.style.removeProperty('--marketplace-primary');
      root.style.removeProperty('--marketplace-secondary');
      root.style.removeProperty('--marketplace-accent');
      root.style.removeProperty('--marketplace-bg');
      root.style.removeProperty('--marketplace-text');
      root.style.removeProperty('--marketplace-font');
    };
  }, [defaultTheme]);

  // Helper functions for initial render
  const hexToHSL = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '0 0% 0%';
    
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    
    return `${h} ${s}% ${l}%`;
  };

  const getContrastColor = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '0 0% 98%';
    
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '0 0% 10%' : '0 0% 98%';
  };

  // Generate inline CSS for immediate application (no flash)
  const themeCSS = `
    :root {
      --primary: ${hexToHSL(defaultTheme.primaryColor)};
      --primary-foreground: ${getContrastColor(defaultTheme.primaryColor)};
      --secondary: ${hexToHSL(defaultTheme.secondaryColor)};
      --secondary-foreground: ${getContrastColor(defaultTheme.secondaryColor)};
      --accent: ${hexToHSL(defaultTheme.accentColor)};
      --background: ${hexToHSL(defaultTheme.backgroundColor)};
      --foreground: ${hexToHSL(defaultTheme.textColor)};
      --card: ${hexToHSL(defaultTheme.cardColor || defaultTheme.backgroundColor)};
      --border: ${hexToHSL(defaultTheme.borderColor || '#E2E8F0')};
      --marketplace-primary: ${defaultTheme.primaryColor};
      --marketplace-secondary: ${defaultTheme.secondaryColor};
      --marketplace-accent: ${defaultTheme.accentColor};
      --marketplace-bg: ${defaultTheme.backgroundColor};
      --marketplace-text: ${defaultTheme.textColor};
      --marketplace-font: ${defaultTheme.fontFamily};
    }
    body {
      font-family: ${defaultTheme.fontFamily}, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    }
  `;

  return (
    <>
      {/* Inline CSS to prevent flash */}
      <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900" style={{
        fontFamily: defaultTheme.fontFamily,
      }}>
      <Suspense fallback={null}>
        <GoogleAuthHandler />
      </Suspense>
      <Header showLocationFilter={settings.locationFilterEnabled} />

      <HeroCarousel />

      <HomepageContent
        initialCategories={categories}
        initialProductsByCategory={productsByCategory}
        initialUncategorizedProducts={uncategorizedProducts}
        categoryDisplayMode={settings.categoryDisplayMode}
        currency={settings.currency}
        locationFilterEnabled={settings.locationFilterEnabled}
      />

      <Footer categories={categories} marketplaceName={settings.marketplaceName} />
      <ThemeSelector />
    </div>
    </>
  );
}
