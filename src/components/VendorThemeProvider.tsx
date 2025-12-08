'use client';

import { useEffect, ReactNode } from 'react';

interface ThemeConfig {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  headingFont?: string;
  layout?: 'modern' | 'classic' | 'minimal' | 'bold';
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

interface VendorThemeProviderProps {
  themeConfig?: ThemeConfig;
  children: ReactNode;
}

export default function VendorThemeProvider({ themeConfig, children }: VendorThemeProviderProps) {
  useEffect(() => {
    if (!themeConfig) return;

    // Apply CSS custom properties
    const root = document.documentElement;
    
    if (themeConfig.primaryColor) {
      root.style.setProperty('--vendor-primary', themeConfig.primaryColor);
    }
    if (themeConfig.secondaryColor) {
      root.style.setProperty('--vendor-secondary', themeConfig.secondaryColor);
    }
    if (themeConfig.accentColor) {
      root.style.setProperty('--vendor-accent', themeConfig.accentColor);
    }
    if (themeConfig.backgroundColor) {
      root.style.setProperty('--vendor-bg', themeConfig.backgroundColor);
    }
    if (themeConfig.textColor) {
      root.style.setProperty('--vendor-text', themeConfig.textColor);
    }
    if (themeConfig.fontFamily) {
      root.style.setProperty('--vendor-font', themeConfig.fontFamily);
    }
    if (themeConfig.headingFont) {
      root.style.setProperty('--vendor-heading-font', themeConfig.headingFont);
    }

    // Apply custom CSS
    if (themeConfig.customCss) {
      const styleId = 'vendor-custom-css';
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;
      
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      
      styleElement.textContent = themeConfig.customCss;
    }

    // Cleanup on unmount
    return () => {
      root.style.removeProperty('--vendor-primary');
      root.style.removeProperty('--vendor-secondary');
      root.style.removeProperty('--vendor-accent');
      root.style.removeProperty('--vendor-bg');
      root.style.removeProperty('--vendor-text');
      root.style.removeProperty('--vendor-font');
      root.style.removeProperty('--vendor-heading-font');
      
      const styleElement = document.getElementById('vendor-custom-css');
      if (styleElement) {
        styleElement.remove();
      }
    };
  }, [themeConfig]);

  return <div className="vendor-themed">{children}</div>;
}
