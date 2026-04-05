'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ImageUpload from './ImageUpload';
import MultiImageUpload from './MultiImageUpload';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface ProductEditModalProps {
  product: any;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  categories?: Array<{ id: string; name: string; level?: number }>;
}

export default function ProductEditModal({ product, onClose, onSave, categories = [] }: ProductEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: 0,
    compareAtPrice: 0,
    stockQuantity: 0,
    sku: '',
    featuredImage: '',
    images: [] as string[],
    productType: 'physical' as 'physical' | 'booking',
    categoryIds: [] as string[],
    hasVariants: false,
    variations: [] as any[],
    variationThemes: [] as string[],
    productVariants: [] as any[],
    variantOptions: [] as any[],
    attributes: {
      booking: {
        duration: 60,
        durationUnit: 'hours' as 'hours' | 'days' | 'sessions',
        bufferTime: 0,
        availableDays: [] as string[],
        timeSlots: [{ start: '09:00', end: '17:00' }],
      },
    },
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        price: product.price || 0,
        compareAtPrice: product.compareAtPrice || 0,
        stockQuantity: product.stockQuantity || 0,
        sku: product.sku || '',
        featuredImage: product.featuredImage || '',
        images: product.images || [],
        productType: product.productType || 'physical',
        categoryIds: product.categories?.map((c: any) => c.id) || [],
        hasVariants: product.hasVariants || product.isParent || false,
        variations: product.variations || [],
        variationThemes: product.variationThemes || [],
        productVariants: product.productVariants || [],
        variantOptions: product.variantOptions || [],
        attributes: {
          booking: {
            duration: product.attributes?.booking?.duration || 60,
            durationUnit: product.attributes?.booking?.durationUnit || 'hours',
            bufferTime: product.attributes?.booking?.bufferTime || 0,
            availableDays: product.attributes?.booking?.availableDays || [],
            timeSlots: product.attributes?.booking?.timeSlots || [{ start: '09:00', end: '17:00' }],
          },
        },
      });
    }
  }, [product]);

  const handleSubmit = async () => {
    await onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Edit Product</h2>
        
        <div className="space-y-4">
          {/* Product Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Short Description
            </label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description (1-2 sentences)"
            />
          </div>

          {/* Full Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Description
            </label>
            {typeof window !== 'undefined' ? (
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <ReactQuill
                  theme="snow"
                  value={formData.description || ''}
                  onChange={(content) => {
                    if (content !== formData.description) {
                      setFormData({ ...formData, description: content });
                    }
                  }}
                  modules={{
                    toolbar: [
                      [{ 'header': [1, 2, 3, false] }],
                      ['bold', 'italic', 'underline', 'strike'],
                      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                      [{ 'color': [] }, { 'background': [] }],
                      ['link'],
                      ['clean']
                    ],
                  }}
                  placeholder="Detailed product description with formatting"
                  className="bg-white"
                  style={{ minHeight: '200px' }}
                />
              </div>
            ) : (
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={6}
                placeholder="Detailed product description"
              />
            )}
          </div>

          {/* Price Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price
              </label>
              {formData.hasVariants ? (
                <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500">
                  <p className="text-sm">Price set per variant</p>
                  <p className="text-xs mt-1">See variants table below</p>
                </div>
              ) : (
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.01"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Compare At Price
              </label>
              {formData.hasVariants ? (
                <div className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-500">
                  <p className="text-sm">Compare price per variant</p>
                  <p className="text-xs mt-1">See variants table below</p>
                </div>
              ) : (
                <input
                  type="number"
                  value={formData.compareAtPrice}
                  onChange={(e) => setFormData({ ...formData, compareAtPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.01"
                />
              )}
            </div>
          </div>

          {/* SKU and Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SKU
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity
              </label>
              <input
                type="number"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={formData.productType === 'booking'}
              />
            </div>
          </div>

          {/* Product Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Type
            </label>
            <select
              value={formData.productType}
              onChange={(e) => setFormData({ ...formData, productType: e.target.value as 'physical' | 'booking' })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="physical">📦 Physical Product</option>
              <option value="booking">📅 Booking/Service</option>
            </select>
          </div>

          {/* Images */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Featured Image
            </label>
            <ImageUpload
              value={formData.featuredImage}
              onChange={(url) => setFormData({ ...formData, featuredImage: url })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Images
            </label>
            <MultiImageUpload
              value={formData.images}
              onChange={(urls) => setFormData({ ...formData, images: urls })}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 mt-6 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
