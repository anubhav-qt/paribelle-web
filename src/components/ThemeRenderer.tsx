'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { useVendorContext } from '@/contexts/VendorContext';
import UnifiedHeader from './UnifiedHeader';

// Theme-specific headers
import ModernMinimalHeader from './themes/ModernMinimalHeader';
import ClassicEcommerceHeader from './themes/ClassicEcommerceHeader';
import BoldCreativeHeader from './themes/BoldCreativeHeader';
import LuxuryBoutiqueHeader from './themes/LuxuryBoutiqueHeader';
import MinimalSidebarHeader from './themes/MinimalSidebarHeader';

interface ThemeRendererProps {
  component: 'header' | 'nav' | 'footer';
  fallback?: React.ReactNode;
  [key: string]: any;
}

export default function ThemeRenderer({ component, fallback, ...props }: ThemeRendererProps) {
  const { themeConfig, isVendorStore } = useVendorContext();
  const [defaultTheme, setDefaultTheme] = useState<any>(null);
  const [loading, setLoading] = useState(!isVendorStore); // Only load for marketplace
  
  // Fetch default marketplace theme if not a vendor store
  useEffect(() => {
    if (!isVendorStore && !defaultTheme) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/settings/default-theme`)
        .then(res => res.json())
        .then(data => {
          console.log('🎨 Fetched default theme from settings:', data);
          if (data.value) {
            const theme = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
            console.log('🎨 Parsed theme:', theme);
            setDefaultTheme(theme);
          }
        })
        .catch(err => console.error('Failed to fetch default theme:', err))
        .finally(() => setLoading(false));
    }
  }, [isVendorStore, defaultTheme]);
  
  // Use vendor theme or default marketplace theme
  const activeThemeConfig = isVendorStore ? themeConfig : defaultTheme;
  const templateId = activeThemeConfig?.templateId || 'modern-minimal';
  
  useEffect(() => {
    console.log('🎨 ThemeRenderer:', {
      component,
      templateId,
      isVendorStore,
      hasVendorTheme: !!themeConfig,
      hasDefaultTheme: !!defaultTheme,
      activeThemeConfig,
    });
  }, [component, templateId, themeConfig, defaultTheme, isVendorStore, activeThemeConfig]);

  // Header components mapping
  if (component === 'header') {
    const headerComponents: Record<string, React.ComponentType<any>> = {
      'modern-minimal': ModernMinimalHeader,
      'classic-ecommerce': ClassicEcommerceHeader,
      'bold-creative': BoldCreativeHeader,
      'minimal-sidebar': MinimalSidebarHeader,
      'luxury-boutique': LuxuryBoutiqueHeader,
    };

    const HeaderComponent = headerComponents[templateId] || UnifiedHeader;
    return <HeaderComponent {...props} />;
  }

  // Nav components mapping
  if (component === 'nav') {
    // Keep CategoryNav visible across templates and wrap for subtle per-theme distinction.
    const navNode = React.isValidElement(fallback)
      ? React.cloneElement(fallback, {
          ...(fallback.props || {}),
          forceTopDisplay: true,
        })
      : fallback;

    if (!navNode) {
      return null;
    }

    if (templateId === 'bold-creative') {
      return <div className="relative z-20 bg-gradient-to-r from-fuchsia-50 to-rose-50">{navNode}</div>;
    }

    if (templateId === 'luxury-boutique') {
      return <div className="relative z-20 border-y border-amber-900/20 bg-amber-50/30">{navNode}</div>;
    }

    if (templateId === 'minimal-sidebar') {
      return <div className="relative z-20 border-t border-slate-200 bg-slate-50">{navNode}</div>;
    }

    return navNode;
  }

  // Footer components mapping  
  if (component === 'footer') {
    // For now, return null or existing footer
    return fallback || null;
  }

  return fallback || null;
}
