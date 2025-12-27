'use client';

import { PageSection, SECTION_TEMPLATES, SECTION_CATEGORIES, createSectionFromTemplate } from '@/lib/pageSections';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';

interface SectionLibraryProps {
  onSelectSection: (section: PageSection) => void;
  onClose: () => void;
}

export default function SectionLibrary({ onSelectSection, onClose }: SectionLibraryProps) {
  const [selectedCategory, setSelectedCategory] = useState<'header' | 'content' | 'footer' | 'all'>('all');

  const filteredTemplates = selectedCategory === 'all' 
    ? SECTION_TEMPLATES 
    : SECTION_TEMPLATES.filter(t => t.category === selectedCategory);

  const handleSelectTemplate = (template: typeof SECTION_TEMPLATES[0]) => {
    const newSection = createSectionFromTemplate(template);
    onSelectSection(newSection);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-lg shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Add Section</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Choose a section to add to your page
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Filter */}
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background hover:bg-muted text-foreground'
              }`}
            >
              All Sections
            </button>
            {Object.entries(SECTION_CATEGORIES).map(([key, category]) => (
              <button
                key={key}
                onClick={() => setSelectedCategory(key as any)}
                className={`px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2 ${
                  selectedCategory === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background hover:bg-muted text-foreground'
                }`}
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <button
                key={template.type}
                onClick={() => handleSelectTemplate(template)}
                className="border border-border rounded-lg p-5 hover:border-primary hover:shadow-lg transition-all text-left group bg-background"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="text-3xl">{template.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {template.name}
                    </h3>
                    <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                      {template.category}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>
                <div className="mt-4 flex items-center gap-2 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <Plus className="w-4 h-4" />
                  <span>Click to add</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30 text-center text-sm text-muted-foreground">
          You can customize each section after adding it to your page
        </div>
      </div>
    </div>
  );
}
