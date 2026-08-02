'use client';

import { useState } from 'react';
import { PageSection } from '@/lib/pageSections';
import SectionRenderer from './SectionRenderer';
import HotspotEditor from './HotspotEditor';
import { GripVertical, Settings2, Eye, EyeOff, Trash2, ChevronUp, ChevronDown, Plus } from 'lucide-react';

interface PageBuilderProps {
  sections: PageSection[];
  onChange: (sections: PageSection[]) => void;
  onAddSection: () => void;
}

export default function PageBuilder({ sections, onChange, onAddSection }: PageBuilderProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const moveSectionUp = (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    updateSectionOrders(newSections);
  };

  const moveSectionDown = (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    updateSectionOrders(newSections);
  };

  const toggleSectionVisibility = (id: string) => {
    const newSections = sections.map(s =>
      s.id === id ? { ...s, visible: !s.visible } : s
    );
    onChange(newSections);
  };

  const deleteSection = (id: string) => {
    if (confirm('Are you sure you want to delete this section?')) {
      const newSections = sections.filter(s => s.id !== id);
      updateSectionOrders(newSections);
    }
  };

  const updateSectionOrders = (newSections: PageSection[]) => {
    const updated = newSections.map((s, i) => ({ ...s, order: i }));
    onChange(updated);
  };

  const updateSectionSettings = (id: string, settings: any) => {
    const newSections = sections.map(s =>
      s.id === id ? { ...s, settings } : s
    );
    onChange(newSections);
  };

  if (sections.length === 0) {
    return (
      <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
        <div className="text-muted-foreground mb-4">
          <Plus className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-lg">No sections added yet</p>
          <p className="text-sm">Click &quot;Add Section&quot; button above to start building your page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((section, index) => (
        <div
          key={section.id}
          className={`border border-border rounded-lg overflow-hidden ${
            !section.visible ? 'opacity-50' : ''
          }`}
        >
          {/* Section Controls */}
          <div className="bg-muted p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <GripVertical className="w-5 h-5 text-muted-foreground cursor-move" />
              <span className="font-medium">{section.title}</span>
              <span className="text-xs px-2 py-0.5 bg-background rounded">
                {section.type}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveSectionUp(index)}
                disabled={index === 0}
                className="p-1.5 hover:bg-background rounded disabled:opacity-30"
                title="Move up"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              
              <button
                type="button"
                onClick={() => moveSectionDown(index)}
                disabled={index === sections.length - 1}
                className="p-1.5 hover:bg-background rounded disabled:opacity-30"
                title="Move down"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              
              <button
                type="button"
                onClick={() => toggleSectionVisibility(section.id)}
                className="p-1.5 hover:bg-background rounded"
                title={section.visible ? 'Hide section' : 'Show section'}
              >
                {section.visible ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  console.log('Edit clicked for section:', section.id, 'Current expanded:', expandedSection);
                  setExpandedSection(expandedSection === section.id ? null : section.id);
                }}
                className="px-3 py-1.5 hover:bg-background rounded inline-flex items-center gap-1.5 text-sm font-medium"
                title="Edit section content"
              >
                <Settings2 className="w-4 h-4" />
                Edit
              </button>
              
              <button
                type="button"
                onClick={() => deleteSection(section.id)}
                className="p-1.5 hover:bg-destructive hover:text-destructive-foreground rounded"
                title="Delete section"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Section Preview */}
          {section.visible && (
            <div className="bg-background">
              <SectionRenderer section={section} isPreview />
            </div>
          )}

          {/* Section Settings (Expanded) */}
          {expandedSection === section.id && (
            <div className="bg-muted/50 p-4 border-t border-border">
              <h4 className="font-semibold mb-3">Section Settings</h4>
              <SectionSettingsForm
                section={section}
                onUpdate={(settings) => updateSectionSettings(section.id, settings)}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Settings form for each section type
function SectionSettingsForm({ section, onUpdate }: { section: PageSection; onUpdate: (settings: any) => void }) {
  const [settings, setSettings] = useState(section.settings);

  const handleChange = (key: string, value: any) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    onUpdate(updated);
  };

  if (section.type === 'shoppable-image') {
    return (
      <HotspotEditor
        settings={settings}
        onChange={(updated) => {
          setSettings(updated);
          onUpdate(updated);
        }}
      />
    );
  }

  const renderField = (key: string, value: any) => {
    // Select dropdowns for specific fields
    if (key === 'type' && typeof value === 'string') {
      const options = ['info', 'warning', 'error', 'success'];
      return (
        <div key={key} className="mb-3">
          <label className="block text-sm font-medium mb-1 capitalize">
            Alert Type
          </label>
          <select
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg"
          >
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    if (key === 'listType') {
      const options = ['bullet', 'numbered'];
      return (
        <div key={key} className="mb-3">
          <label className="block text-sm font-medium mb-1">
            List Type
          </label>
          <select
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg"
          >
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    if (key === 'headingLevel') {
      const options = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
      return (
        <div key={key} className="mb-3">
          <label className="block text-sm font-medium mb-1">
            Heading Level
          </label>
          <select
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg"
          >
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    if (key === 'padding' || key === 'spacing') {
      const options = ['none', 'small', 'normal', 'large'];
      return (
        <div key={key} className="mb-3">
          <label className="block text-sm font-medium mb-1 capitalize">
            {key}
          </label>
          <select
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg"
          >
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    if (key === 'style' && section.type === 'divider') {
      const options = ['line', 'space'];
      return (
        <div key={key} className="mb-3">
          <label className="block text-sm font-medium mb-1">
            Divider Style
          </label>
          <select
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg"
          >
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    if (key === 'thickness') {
      const options = ['thin', 'medium', 'thick'];
      return (
        <div key={key} className="mb-3">
          <label className="block text-sm font-medium mb-1">
            Line Thickness
          </label>
          <select
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg"
          >
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    if (key === 'alignment') {
      const options = ['left', 'center', 'right'];
      return (
        <div key={key} className="mb-3">
          <label className="block text-sm font-medium mb-1">
            Alignment
          </label>
          <select
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg"
          >
            {options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      );
    }

    if (key === 'date') {
      return (
        <div key={key} className="mb-3">
          <label className="block text-sm font-medium mb-1">
            Date
          </label>
          <input
            type="date"
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg"
          />
        </div>
      );
    }

    if (typeof value === 'string') {
      if (key.includes('color') || key.includes('Color')) {
        return (
          <div key={key} className="mb-3">
            <label className="block text-sm font-medium mb-1 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </label>
            <input
              type="color"
              value={value}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full h-10 rounded border border-border"
            />
          </div>
        );
      }
      
      if (key.includes('content') || key.includes('description') || key.includes('message')) {
        return (
          <div key={key} className="mb-3">
            <label className="block text-sm font-medium mb-1 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </label>
            <textarea
              value={value}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg"
              rows={4}
            />
          </div>
        );
      }

      return (
        <div key={key} className="mb-3">
          <label className="block text-sm font-medium mb-1 capitalize">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg"
          />
        </div>
      );
    }

    if (typeof value === 'number') {
      return (
        <div key={key} className="mb-3">
          <label className="block text-sm font-medium mb-1 capitalize">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </label>
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(key, parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-border rounded-lg"
          />
        </div>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <div key={key} className="mb-3 flex items-center gap-2">
          <input
            type="checkbox"
            id={key}
            checked={value}
            onChange={(e) => handleChange(key, e.target.checked)}
            className="w-4 h-4"
          />
          <label htmlFor={key} className="text-sm font-medium capitalize">
            {key.replace(/([A-Z])/g, ' $1').trim()}
          </label>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="max-h-96 overflow-y-auto">
      {Object.entries(settings).map(([key, value]) => {
        if (Array.isArray(value)) {
          return (
            <div key={key} className="mb-3">
              <label className="block text-sm font-medium mb-2 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <p className="text-xs text-muted-foreground mb-2">
                This is a complex field. Edit individual items below or use JSON.
              </p>
              <textarea
                value={JSON.stringify(value, null, 2)}
                onChange={(e) => {
                  try {
                    handleChange(key, JSON.parse(e.target.value));
                  } catch (err) {
                    // Invalid JSON, ignore
                  }
                }}
                className="w-full px-3 py-2 border border-border rounded-lg font-mono text-xs"
                rows={8}
              />
            </div>
          );
        }
        
        if (typeof value === 'object' && value !== null) {
          return null; // Skip complex objects for now
        }

        return renderField(key, value);
      })}
    </div>
  );
}
