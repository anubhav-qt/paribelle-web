'use client';

import { useState } from 'react';
import { X, AlertCircle, MapPin } from 'lucide-react';

interface ShipBackModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
  onConfirm: (trackingNumber?: string) => Promise<void>;
}

const RETURN_ADDRESS_LINES = [
  'Paribelle',
  '121/72, Adarsh Path, Sector-12,',
  'Mansarovar, Jaipur, Rajasthan, 302020',
];

/**
 * Shown once an exchange request is approved — tells the customer where to
 * send the item and that a receipt must be inside the package, then lets
 * them mark it as shipped (POST /exchanges/:id/in-transit).
 */
export default function ShipBackModal({ isOpen, onClose, productName, onConfirm }: ShipBackModalProps) {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');
    try {
      await onConfirm(trackingNumber.trim() || undefined);
      setTrackingNumber('');
    } catch (err: any) {
      setError(err?.message || 'Failed to mark as shipped. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-bold text-foreground">Send Your Exchange Item Back</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-4">
          <p className="text-sm text-foreground">
            Your exchange request{productName ? ` for "${productName}"` : ''} has been approved. Pack the item
            securely and send it to:
          </p>

          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/50 p-3">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div className="text-sm text-foreground">
              {RETURN_ADDRESS_LINES.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Include the original receipt/invoice inside the package. If there is no receipt, the exchange or
              refund cannot be processed.
            </span>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">Tracking number (optional)</label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g. courier AWB number"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border p-4">
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-border px-4 py-2 font-medium text-foreground hover:bg-muted"
          >
            Not yet
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
          >
            {submitting ? 'Saving…' : "I've shipped it back"}
          </button>
        </div>
      </div>
    </div>
  );
}
