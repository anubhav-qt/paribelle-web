'use client';

import { useEffect, useState } from 'react';
import { ThemeConfig } from '@/types/common';

const defaultFallbackTheme: ThemeConfig = {
  primaryColor: '#FF9900',
  secondaryColor: '#232F3E',
  accentColor: '#FF9900',
  backgroundColor: '#FFFFFF',
  textColor: '#0F1111',
  fontFamily: 'Amazon Ember, Arial, sans-serif',
  headingFont: 'Amazon Ember, Arial, sans-serif',
};

export default function ThemeProvider({ 
  children,
  initialTheme 
}: { 
  children: React.ReactNode;
  initialTheme?: ThemeConfig | null;
}) {
  const [theme, setTheme] = useState<ThemeConfig>(initialTheme || defaultFallbackTheme);

  // Fetch theme if not provided
  useEffect(() => {
    if (initialTheme) return;

    const fetchTheme = async () => {
      try {
        const response = await fetch('/api/theme', {
          cache: 'no-store',
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.value) {
            // Handle both string and object formats
            const savedTheme = typeof data.value === 'string' 
              ? JSON.parse(data.value) 
              : data.value;
            setTheme({ ...defaultFallbackTheme, ...savedTheme });
          }
        }
      } catch (error) {
        console.error('[ThemeProvider] Error fetching theme:', error);
      }
    };

    fetchTheme();
  }, [initialTheme]);

  // Helper functions
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

  const themeCSS = `
    :root {
      --primary: ${hexToHSL(theme.primaryColor || '#FF9900')};
      --primary-foreground: ${getContrastColor(theme.primaryColor || '#FF9900')};
      --secondary: ${hexToHSL(theme.secondaryColor || '#232F3E')};
      --secondary-foreground: ${getContrastColor(theme.secondaryColor || '#232F3E')};
      --accent: ${hexToHSL(theme.accentColor || '#FF9900')};
      --background: ${hexToHSL(theme.backgroundColor || '#FFFFFF')};
      --foreground: ${hexToHSL(theme.textColor || '#0F1111')};
      --card: ${hexToHSL(theme.backgroundColor || '#FFFFFF')};
      --border: ${hexToHSL('#E2E8F0')};
      --marketplace-primary: ${theme.primaryColor || '#FF9900'};
      --marketplace-secondary: ${theme.secondaryColor || '#232F3E'};
      --marketplace-accent: ${theme.accentColor || '#FF9900'};
      --marketplace-bg: ${theme.backgroundColor || '#FFFFFF'};
      --marketplace-text: ${theme.textColor || '#0F1111'};
      --marketplace-font: ${theme.fontFamily || 'Amazon Ember, Arial, sans-serif'};
    }
    body {
      font-family: ${theme.fontFamily || 'Amazon Ember, Arial, sans-serif'}, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
      {children}
    </>
  );
}
