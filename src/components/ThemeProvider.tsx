'use client';

import { useEffect, useState } from 'react';

interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
  headingFont: string;
  cardColor?: string;
  borderColor?: string;
}

const defaultFallbackTheme: ThemeConfig = {
  primaryColor: '#FF9900',
  secondaryColor: '#232F3E',
  accentColor: '#FF9900',
  backgroundColor: '#FFFFFF',
  textColor: '#0F1111',
  fontFamily: 'Amazon Ember, Arial, sans-serif',
  headingFont: 'Amazon Ember, Arial, sans-serif',
  cardColor: '#FFFFFF',
  borderColor: '#E2E8F0',
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
      --primary: ${hexToHSL(theme.primaryColor)};
      --primary-foreground: ${getContrastColor(theme.primaryColor)};
      --secondary: ${hexToHSL(theme.secondaryColor)};
      --secondary-foreground: ${getContrastColor(theme.secondaryColor)};
      --accent: ${hexToHSL(theme.accentColor)};
      --background: ${hexToHSL(theme.backgroundColor)};
      --foreground: ${hexToHSL(theme.textColor)};
      --card: ${hexToHSL(theme.cardColor || theme.backgroundColor)};
      --border: ${hexToHSL(theme.borderColor || '#E2E8F0')};
      --marketplace-primary: ${theme.primaryColor};
      --marketplace-secondary: ${theme.secondaryColor};
      --marketplace-accent: ${theme.accentColor};
      --marketplace-bg: ${theme.backgroundColor};
      --marketplace-text: ${theme.textColor};
      --marketplace-font: ${theme.fontFamily};
    }
    body {
      font-family: ${theme.fontFamily}, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
      {children}
    </>
  );
}
