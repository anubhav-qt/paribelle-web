'use client';

import { useEffect, useState } from 'react';
import { ThemeConfig } from '@/types/common';

/**
 * Hex mirrors of the PariBelle tokens in styles/tokens.css — rose, shell,
 * blush wash, blush ivory and plum ink respectively. Kept in step with that
 * file: an unconfigured marketplace should look identical whether these
 * fallbacks or the tokens win the cascade.
 */
const defaultFallbackTheme: ThemeConfig = {
  primaryColor: '#D78E9B',
  secondaryColor: '#F9F0F2',
  accentColor: '#F8E8EA',
  backgroundColor: '#FCF8F8',
  textColor: '#36262B',
  fontFamily: 'Jost, sans-serif',
  headingFont: 'Cormorant Garamond, serif',
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

  // This only injects the *marketplace-wide fallback* theme (admin-configurable via
  // /admin/default-theme). Per-vendor storefronts theme themselves separately via the
  // `vendor-*` utility layer in globals.css (see ThemeContext / useThemeClasses) and are
  // unaffected by this. Colors are intentionally NOT forced with `!important` so the
  // PariBelle design tokens in tokens.css remain the source of truth on the root site;
  // an admin-configured theme still overrides them, but doesn't fight the CSS cascade.
  // A partially-filled admin theme falls back per-field rather than wholesale,
  // so one unset colour can't drag the rest off the brand palette.
  const c = {
    primary: theme.primaryColor || defaultFallbackTheme.primaryColor!,
    secondary: theme.secondaryColor || defaultFallbackTheme.secondaryColor!,
    accent: theme.accentColor || defaultFallbackTheme.accentColor!,
    background: theme.backgroundColor || defaultFallbackTheme.backgroundColor!,
    text: theme.textColor || defaultFallbackTheme.textColor!,
    font: theme.fontFamily || 'var(--font-sans)',
    headingFont: theme.headingFont || 'var(--font-display)',
  };

  const themeCSS = `
    :root {
      --primary: ${hexToHSL(c.primary)};
      --primary-foreground: ${getContrastColor(c.primary)};
      --secondary: ${hexToHSL(c.secondary)};
      --secondary-foreground: ${getContrastColor(c.secondary)};
      --accent: ${hexToHSL(c.accent)};
      --background: ${hexToHSL(c.background)};
      --foreground: ${hexToHSL(c.text)};
      --card: ${hexToHSL(c.background)};
      --marketplace-primary: ${c.primary};
      --marketplace-secondary: ${c.secondary};
      --marketplace-accent: ${c.accent};
      --marketplace-bg: ${c.background};
      --marketplace-text: ${c.text};
      --marketplace-font: ${c.font};
      --marketplace-heading-font: ${c.headingFont};
    }
    h1, h2, h3 {
      font-family: ${c.headingFont};
    }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
      {children}
    </>
  );
}
