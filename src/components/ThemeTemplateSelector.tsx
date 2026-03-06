'use client';

import { useEffect, useState } from 'react';
import { Check, Palette, Layout, Navigation, Columns } from 'lucide-react';

interface ThemeTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  features: {
    header: string;
    navigation: string;
    footer: string;
  };
}

const themeTemplates: ThemeTemplate[] = [
  {
    id: 'modern-minimal',
    name: 'Modern Minimal',
    description: 'Clean, contemporary design with centered logo. Perfect for fashion and lifestyle brands.',
    preview: 'linear-gradient(135deg, #000000 0%, #ffffff 100%)',
    features: {
      header: 'Centered',
      navigation: 'Top',
      footer: 'Centered',
    },
  },
  {
    id: 'classic-ecommerce',
    name: 'Classic E-commerce',
    description: 'Traditional layout with left-aligned logo. Great for large catalogs.',
    preview: 'linear-gradient(135deg, #0f172a 0%, #f59e0b 100%)',
    features: {
      header: 'Left-aligned',
      navigation: 'Top',
      footer: '4-Column',
    },
  },
  {
    id: 'bold-creative',
    name: 'Bold & Creative',
    description: 'Eye-catching design with large logo. Ideal for creative and artistic brands.',
    preview: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
    features: {
      header: 'Bold',
      navigation: 'Off-canvas',
      footer: 'Magazine',
    },
  },
  {
    id: 'minimal-sidebar',
    name: 'Minimal Sidebar',
    description: 'Sidebar navigation with clean lines. Perfect for niche stores.',
    preview: 'linear-gradient(135deg, #0ea5e9 0%, #f97316 100%)',
    features: {
      header: 'Minimal',
      navigation: 'Sidebar',
      footer: '3-Column',
    },
  },
  {
    id: 'luxury-boutique',
    name: 'Luxury Boutique',
    description: 'Elegant split header. Designed for premium and luxury brands.',
    preview: 'linear-gradient(135deg, #92400e 0%, #d97706 100%)',
    features: {
      header: 'Split',
      navigation: 'Top',
      footer: 'Centered',
    },
  },
];

interface ThemeTemplateSelectorProps {
  currentThemeId?: string;
  onThemeSelect: (themeId: string) => void;
}

export default function ThemeTemplateSelector({ currentThemeId, onThemeSelect }: ThemeTemplateSelectorProps) {
  const [selectedTheme, setSelectedTheme] = useState<string>(currentThemeId || 'modern-minimal');

  // Keep selector UI in sync when theme config is loaded or changed externally.
  useEffect(() => {
    setSelectedTheme(currentThemeId || 'modern-minimal');
  }, [currentThemeId]);
  
  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId);
    onThemeSelect(themeId);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Palette className="w-6 h-6 text-blue-600" />
          Choose Your Store Theme
        </h2>
        <p className="text-gray-600 mt-2">
          Select a professional template that matches your brand. Each theme includes unique header, navigation, and footer styling.
        </p>
      </div>
      
      {/* Theme Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {themeTemplates.map((theme) => (
          <div
            key={theme.id}
            className={`relative group cursor-pointer rounded-lg border-2 transition-all duration-200 hover:shadow-xl ${
              selectedTheme === theme.id
                ? 'border-blue-600 bg-blue-50 shadow-lg'
                : 'border-gray-200 hover:border-blue-400'
            }`}
            onClick={() => handleThemeSelect(theme.id)}
          >
            {/* Selected Badge */}
            {selectedTheme === theme.id && (
              <div className="absolute -top-3 -right-3 z-10 bg-blue-600 text-white rounded-full p-2 shadow-lg">
                <Check className="w-5 h-5" />
              </div>
            )}
            
            {/* Preview Image Placeholder */}
            <div 
              className="h-40 rounded-t-lg flex items-center justify-center text-white font-bold text-3xl"
              style={{ background: theme.preview }}
            >
              {theme.name.split(' ')[0]}
            </div>
            
            {/* Theme Info */}
            <div className="p-5 space-y-3">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{theme.name}</h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{theme.description}</p>
              </div>
              
              {/* Theme Features */}
              <div className="space-y-2 pt-3 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Layout className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Header:</span>
                  <span>{theme.features.header}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Navigation className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Nav:</span>
                  <span>{theme.features.navigation}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <Columns className="w-4 h-4 text-gray-500" />
                  <span className="font-medium">Footer:</span>
                  <span>{theme.features.footer}</span>
                </div>
              </div>
            </div>
            
            {/* Hover Overlay */}
            <div className={`absolute inset-0 bg-blue-600 bg-opacity-0 group-hover:bg-opacity-5 rounded-lg transition-all duration-200 pointer-events-none`} />
          </div>
        ))}
      </div>
      
      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <span className="font-semibold">💡 Tip:</span> Each theme has a completely different design. You can further customize colors and fonts in the Advanced Customization section below.
        </p>
      </div>
    </div>
  );
}
