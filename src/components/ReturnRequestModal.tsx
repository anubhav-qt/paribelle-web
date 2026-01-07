'use client';

import { useState, useEffect } from 'react';
import { X, Upload, AlertCircle, Package } from 'lucide-react';
import { useThemeClasses } from '@/hooks/useThemeClasses';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  productImage?: string;
  returnedQuantity?: number;
  returnStatus?: string;
}

interface SelectedItem {
  itemId: string;
  quantity: number;
}

interface ReturnRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  items: OrderItem[];
  onSubmit: (returnData: {
    orderItemId: string;
    quantity: number;
    reason: string;
    customerNotes?: string;
    images?: string[];
  }) => Promise<void>;
}

const RETURN_REASONS = [
  { value: 'defective', label: 'Defective or damaged item' },
  { value: 'wrong_item', label: 'Wrong item received' },
  { value: 'not_as_described', label: 'Item not as described' },
  { value: 'size_fit', label: 'Size/fit issue' },
  { value: 'quality', label: 'Poor quality' },
  { value: 'changed_mind', label: 'Changed my mind' },
  { value: 'other', label: 'Other reason' }
];

export default function ReturnRequestModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  items,
  onSubmit
}: ReturnRequestModalProps) {
  const theme = useThemeClasses();
  const [selectedItems, setSelectedItems] = useState<Map<string, number>>(new Map());
  const [reason, setReason] = useState<string>('');
  const [otherReason, setOtherReason] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleItemToggle = (itemId: string, available: number) => {
    const newSelected = new Map(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.set(itemId, 1); // Default to 1 item
    }
    setSelectedItems(newSelected);
  };

  const handleQuantityChange = (itemId: string, quantity: number, max: number) => {
    const newSelected = new Map(selectedItems);
    const clampedQty = Math.max(1, Math.min(quantity, max));
    newSelected.set(itemId, clampedQty);
    setSelectedItems(newSelected);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const uploadedUrls: string[] = [];
      
      for (let i = 0; i < files.length && images.length + uploadedUrls.length < 5; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('image', file);

        const token = localStorage.getItem('token');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/upload/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          uploadedUrls.push(data.url);
        }
      }

      setImages([...images, ...uploadedUrls]);
    } catch (error) {
      console.error('Error uploading images:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedItems.size === 0 || !reason) {
      return;
    }

    if (reason === 'other' && !otherReason.trim()) {
      return;
    }

    setLoading(true);
    try {
      // Submit each selected item as a separate return request
      const finalReason = reason === 'other' ? otherReason : reason;
      const returnPromises = Array.from(selectedItems.entries()).map(([itemId, quantity]) => 
        onSubmit({
          orderItemId: itemId,
          quantity: quantity,
          reason: finalReason,
          customerNotes: customerNotes.trim() || undefined,
          images: images.length > 0 ? images : undefined
        })
      );

      await Promise.all(returnPromises);
      
      // Reset form
      setSelectedItems(new Map());
      setReason('');
      setOtherReason('');
      setCustomerNotes('');
      setImages([]);
      onClose();
    } catch (error) {
      console.error('Error submitting return:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className={theme.combine(
        'w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl',
        theme.cardBg
      )}>
        {/* Header */}
        <div className={theme.combine(
          'flex items-center justify-between p-6 border-b',
          theme.border
        )}>
          <div>
            <h2 className={theme.combine('text-2xl font-bold', theme.text)}>
              Request Item Return
            </h2>
            <p className={theme.combine('text-sm mt-1', theme.textMuted)}>
              Order #{orderNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className={theme.combine(
              'p-2 rounded-lg transition-colors hover:opacity-80',
              theme.text
            )}
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Select Items */}
          <div>
            <label className={theme.combine('block text-sm font-medium mb-2', theme.text)}>
              Select Items to Return * (You can select multiple)
            </label>
            <div className="space-y-3">
              {items.map(item => {
                const available = item.quantity - (item.returnedQuantity || 0);
                const canReturn = available > 0;
                const isSelected = selectedItems.has(item.id);
                const selectedQty = selectedItems.get(item.id) || 1;

                return (
                  <div
                    key={item.id}
                    className={theme.combine(
                      'p-3 rounded-lg border',
                      theme.border,
                      isSelected ? 'ring-2 ring-blue-500' : '',
                      !canReturn ? 'opacity-50' : ''
                    )}
                  >
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleItemToggle(item.id, available)}
                        disabled={!canReturn || loading}
                        className="w-4 h-4"
                      />
                      {item.productImage && (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1">
                        <div className={theme.combine('font-medium', theme.text)}>
                          {item.productName}
                        </div>
                        <div className={theme.combine('text-sm', theme.textMuted)}>
                          {canReturn ? (
                            <>Quantity: {item.quantity} | Available to return: {available}</>
                          ) : (
                            <>All items returned or return in progress</>
                          )}
                        </div>
                      </div>
                      <div className={theme.combine('text-right', theme.text)}>
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </label>
                    
                    {/* Quantity selector for selected items */}
                    {isSelected && (
                      <div className="mt-3 ml-7 flex items-center gap-3">
                        <label className={theme.combine('text-sm font-medium', theme.text)}>
                          Quantity:
                        </label>
                        <input
                          type="number"
                          min="1"
                          max={available}
                          value={selectedQty}
                          onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 1, available)}
                          className={theme.combine(
                            'w-24 px-3 py-1 rounded',
                            theme.input
                          )}
                          disabled={loading}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className={theme.combine('text-sm', theme.textMuted)}>
                          of {available} available
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {selectedItems.size > 0 && (
              <p className={theme.combine('text-sm mt-2', theme.primary)}>
                {selectedItems.size} {selectedItems.size === 1 ? 'item' : 'items'} selected for return
              </p>
            )}
          </div>

          {/* Return Reason */}
          <div>
            <label className={theme.combine('block text-sm font-medium mb-2', theme.text)}>
              Reason for Return *
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className={theme.combine(
                'w-full px-4 py-2 rounded-lg',
                theme.input
              )}
              disabled={loading}
              required
            >
              <option value="">Select a reason</option>
              {RETURN_REASONS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {/* Other Reason Text */}
          {reason === 'other' && (
            <div>
              <label className={theme.combine('block text-sm font-medium mb-2', theme.text)}>
                Please Specify *
              </label>
              <input
                type="text"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder="Enter your reason"
                className={theme.combine(
                  'w-full px-4 py-2 rounded-lg',
                  theme.input
                )}
                disabled={loading}
                required
              />
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <label className={theme.combine('block text-sm font-medium mb-2', theme.text)}>
              Additional Notes (Optional)
            </label>
            <textarea
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              placeholder="Any additional information about the return..."
              rows={3}
              className={theme.combine(
                'w-full px-4 py-2 rounded-lg resize-none',
                theme.input
              )}
              disabled={loading}
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className={theme.combine('block text-sm font-medium mb-2', theme.text)}>
              Upload Images (Optional)
            </label>
            <p className={theme.combine('text-sm mb-2', theme.textMuted)}>
              Upload photos if item is defective or damaged (max 5 images)
            </p>
            
            {images.length < 5 && (
              <label className={theme.combine(
                'flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors hover:opacity-80',
                theme.border
              )}>
                <Upload className="w-5 h-5" />
                <span>{uploadingImage ? 'Uploading...' : 'Click to upload images'}</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage || loading}
                />
              </label>
            )}

            {images.length > 0 && (
              <div className="grid grid-cols-5 gap-2 mt-3">
                {images.map((url, index) => (
                  <div key={index} className="relative">
                    <img
                      src={url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-20 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className={theme.combine('absolute -top-2 -right-2 p-1 rounded-full', theme.primaryButton)}
                      disabled={loading}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Alert */}
          <div className={theme.combine(
            'flex gap-3 p-4 rounded-lg',
            theme.cardBg, theme.borderLight
          )}>
            <AlertCircle className={theme.combine('w-5 h-5 flex-shrink-0 mt-0.5', theme.primary)} />
            <div className={theme.combine('text-sm', theme.text)}>
              <p className="font-medium mb-1">Return Process:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Your return request will be reviewed by the vendor</li>
                <li>If approved, you'll receive return shipping instructions</li>
                <li>Refund will be processed after the vendor receives the item</li>
              </ul>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={theme.combine(
                'flex-1 px-4 py-2 rounded-lg border transition-colors hover:opacity-80',
                theme.border
              )}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={theme.combine(
                'flex-1 px-4 py-2 rounded-lg font-medium transition-colors',
                theme.primaryButton,
                loading ? 'opacity-50 cursor-not-allowed' : ''
              )}
              disabled={loading || selectedItems.size === 0 || !reason || (reason === 'other' && !otherReason.trim())}
            >
              {loading ? 'Submitting...' : `Submit Return Request${selectedItems.size > 1 ? ` (${selectedItems.size} items)` : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
