'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Trash2, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import ThemeRenderer from '@/components/ThemeRenderer';

interface SocialLink {
  platform: 'facebook' | 'twitter' | 'instagram' | 'linkedin' | 'youtube' | 'tiktok';
  url: string;
  enabled: boolean;
}

interface FooterLink {
  label: string;
  url: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
  enabled: boolean;
}

interface ContactInfo {
  phone: string;
  email: string;
  address: string;
}

interface FooterSettings {
  id?: string;
  aboutText: string;
  socialLinks: SocialLink[];
  customSections: FooterSection[];
  contactInfo: ContactInfo;
  copyrightText: string;
  showCategories: boolean;
  maxCategoriesDisplay: number;
}

const SOCIAL_PLATFORMS = [
  { value: 'facebook', label: 'Facebook', icon: Facebook },
  { value: 'twitter', label: 'Twitter', icon: Twitter },
  { value: 'instagram', label: 'Instagram', icon: Instagram },
  { value: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { value: 'youtube', label: 'YouTube', icon: Youtube },
];

export default function FooterSettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<FooterSettings>({
    aboutText: '',
    socialLinks: [],
    customSections: [],
    contactInfo: { phone: '', email: '', address: '' },
    copyrightText: '',
    showCategories: true,
    maxCategoriesDisplay: 6,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/footer-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching footer settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      
      // Create a clean copy of settings without metadata fields
      const settingsData = {
        aboutText: settings.aboutText,
        socialLinks: settings.socialLinks,
        customSections: settings.customSections,
        contactInfo: settings.contactInfo,
        copyrightText: settings.copyrightText,
        showCategories: settings.showCategories,
        maxCategoriesDisplay: settings.maxCategoriesDisplay,
      };
      
      console.log('📤 Saving footer settings:', settingsData);
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/footer-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(settingsData),
      });

      if (response.ok) {
        const savedData = await response.json();
        console.log('✅ Footer settings saved successfully:', savedData);
        alert('Footer settings updated successfully!');
        // Refresh the settings from server to ensure we have the latest
        await fetchSettings();
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to save footer settings:', errorText);
        alert(`Failed to update footer settings: ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error updating footer settings:', error);
      alert(`Error updating footer settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const addSocialLink = () => {
    setSettings({
      ...settings,
      socialLinks: [...settings.socialLinks, { platform: 'facebook', url: '', enabled: true }],
    });
  };

  const updateSocialLink = (index: number, field: keyof SocialLink, value: any) => {
    const updated = [...settings.socialLinks];
    updated[index] = { ...updated[index], [field]: value };
    setSettings({ ...settings, socialLinks: updated });
  };

  const removeSocialLink = (index: number) => {
    setSettings({
      ...settings,
      socialLinks: settings.socialLinks.filter((_, i) => i !== index),
    });
  };

  const addSection = () => {
    setSettings({
      ...settings,
      customSections: [...settings.customSections, { title: '', links: [], enabled: true }],
    });
  };

  const updateSection = (index: number, field: keyof FooterSection, value: any) => {
    const updated = [...settings.customSections];
    updated[index] = { ...updated[index], [field]: value };
    setSettings({ ...settings, customSections: updated });
  };

  const removeSection = (index: number) => {
    setSettings({
      ...settings,
      customSections: settings.customSections.filter((_, i) => i !== index),
    });
  };

  const addLink = (sectionIndex: number) => {
    const updated = [...settings.customSections];
    updated[sectionIndex].links.push({ label: '', url: '' });
    setSettings({ ...settings, customSections: updated });
  };

  const updateLink = (sectionIndex: number, linkIndex: number, field: keyof FooterLink, value: string) => {
    const updated = [...settings.customSections];
    updated[sectionIndex].links[linkIndex] = { ...updated[sectionIndex].links[linkIndex], [field]: value };
    setSettings({ ...settings, customSections: updated });
  };

  const removeLink = (sectionIndex: number, linkIndex: number) => {
    const updated = [...settings.customSections];
    updated[sectionIndex].links = updated[sectionIndex].links.filter((_, i) => i !== linkIndex);
    setSettings({ ...settings, customSections: updated });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <ThemeRenderer component="header" />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          {/* Sticky Save Button */}
          <div className="fixed top-20 right-6 z-50">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 shadow-lg"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Footer Settings</h1>
                <p className="text-sm text-gray-600">Customize your marketplace footer content</p>
              </div>
            </div>

        </div>

        <div className="space-y-6">
          {/* About Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">About Section</h2>
            <textarea
              value={settings.aboutText}
              onChange={(e) => setSettings({ ...settings, aboutText: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-3 h-24"
              placeholder="Brief description about your marketplace..."
            />
          </div>

          {/* Social Links */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Social Media Links</h2>
              <button
                onClick={addSocialLink}
                className="flex items-center gap-2 text-sm bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                <Plus className="w-4 h-4" />
                Add Social Link
              </button>
            </div>
            <div className="space-y-3">
              {settings.socialLinks.map((link, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                  <select
                    value={link.platform}
                    onChange={(e) => updateSocialLink(index, 'platform', e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  >
                    {SOCIAL_PLATFORMS.map((platform) => (
                      <option key={platform.value} value={platform.value}>
                        {platform.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => updateSocialLink(index, 'url', e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="https://..."
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={link.enabled}
                      onChange={(e) => updateSocialLink(index, 'enabled', e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Enabled</span>
                  </label>
                  <button
                    onClick={() => removeSocialLink(index)}
                    className="text-red-500 hover:text-red-700 p-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Contact Information</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={settings.contactInfo.phone}
                  onChange={(e) => setSettings({
                    ...settings,
                    contactInfo: { ...settings.contactInfo, phone: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={settings.contactInfo.email}
                  onChange={(e) => setSettings({
                    ...settings,
                    contactInfo: { ...settings.contactInfo, email: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="support@marketplace.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={settings.contactInfo.address}
                  onChange={(e) => setSettings({
                    ...settings,
                    contactInfo: { ...settings.contactInfo, address: e.target.value }
                  })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 h-20"
                  placeholder="123 Market Street&#10;City, State 12345"
                />
              </div>
            </div>
          </div>

          {/* Custom Sections */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Footer Sections</h2>
              <button
                onClick={addSection}
                className="flex items-center gap-2 text-sm bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
              >
                <Plus className="w-4 h-4" />
                Add Section
              </button>
            </div>
            <div className="space-y-4">
              {settings.customSections.map((section, sectionIndex) => (
                <div key={sectionIndex} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSection(sectionIndex, 'title', e.target.value)}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 font-medium"
                      placeholder="Section Title"
                    />
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={section.enabled}
                        onChange={(e) => updateSection(sectionIndex, 'enabled', e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Enabled</span>
                    </label>
                    <button
                      onClick={() => removeSection(sectionIndex)}
                      className="text-red-500 hover:text-red-700 p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2 ml-4">
                    {section.links.map((link, linkIndex) => (
                      <div key={linkIndex} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={link.label}
                          onChange={(e) => updateLink(sectionIndex, linkIndex, 'label', e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          placeholder="Link Label"
                        />
                        <input
                          type="text"
                          value={link.url}
                          onChange={(e) => updateLink(sectionIndex, linkIndex, 'url', e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          placeholder="/page-url"
                        />
                        <button
                          onClick={() => removeLink(sectionIndex, linkIndex)}
                          className="text-red-500 hover:text-red-700 p-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addLink(sectionIndex)}
                      className="text-sm text-blue-500 hover:text-blue-700 px-2 py-1"
                    >
                      + Add Link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category Display */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Category Display</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.showCategories}
                  onChange={(e) => setSettings({ ...settings, showCategories: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">Show categories in footer</span>
              </label>
              {settings.showCategories && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maximum categories to display
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={settings.maxCategoriesDisplay}
                    onChange={(e) => setSettings({ ...settings, maxCategoriesDisplay: parseInt(e.target.value) })}
                    className="w-32 border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Copyright */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Copyright Text</h2>
            <input
              type="text"
              value={settings.copyrightText}
              onChange={(e) => setSettings({ ...settings, copyrightText: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              placeholder="All rights reserved."
            />
            <p className="text-xs text-gray-500 mt-2">
              Note: Year and marketplace name will be automatically added
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
