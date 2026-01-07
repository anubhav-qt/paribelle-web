'use client';

import { Package, Clock, CheckCircle, XCircle, AlertCircle, DollarSign } from 'lucide-react';
import { useThemeClasses } from '@/hooks/useThemeClasses';

interface ReturnItem {
  id: string;
  returnNumber: string;
  productName: string;
  quantity: number;
  originalQuantity: number;
  refundAmount: number;
  refundTotal: number;
  reason: string;
  status: string;
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  refundedAt?: string;
  rejectionReason?: string;
  vendorNotes?: string;
  trackingNumber?: string;
  images?: string[];
}

interface OrderReturnsDisplayProps {
  returns: ReturnItem[];
}

// Get status configuration based on theme
const getStatusConfig = (theme: any) => ({
  requested: {
    icon: Clock,
    label: 'Pending Review',
    className: 'px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
  },
  approved: {
    icon: CheckCircle,
    label: 'Approved',
    className: 'px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
  },
  rejected: {
    icon: XCircle,
    label: 'Rejected',
    className: 'px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
  },
  received: {
    icon: Package,
    label: 'Item Received',
    className: 'px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
  },
  refunded: {
    icon: DollarSign,
    label: 'Refunded',
    className: 'px-3 py-1 rounded-full text-sm font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    className: 'px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
  }
});

export default function OrderReturnsDisplay({ returns }: OrderReturnsDisplayProps) {
  const theme = useThemeClasses();
  const statusConfig = getStatusConfig(theme);

  if (!returns || returns.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className={theme.combine('text-lg font-semibold', theme.text)}>
        Return Requests
      </h3>

      {returns.map((returnItem) => {
        const statusInfo = statusConfig[returnItem.status as keyof typeof statusConfig] || statusConfig.requested;
        const StatusIcon = statusInfo.icon;

        return (
          <div
            key={returnItem.id}
            className={theme.combine(
              'p-4 rounded-lg border space-y-3',
              theme.border,
              theme.cardBg
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={theme.combine('font-medium', theme.text)}>
                    {returnItem.productName}
                  </span>
                  <span className={statusInfo.className}>
                    <StatusIcon className="w-3 h-3 inline mr-1" />
                    {statusInfo.label}
                  </span>
                </div>
                <div className={theme.combine('text-sm mt-1', theme.textMuted)}>
                  Return #{returnItem.returnNumber}
                </div>
              </div>

              <div className="text-right">
                <div className={theme.combine('font-medium', theme.text)}>
                  ${returnItem.refundTotal.toFixed(2)}
                </div>
                <div className={theme.combine('text-sm', theme.textMuted)}>
                  Refund amount
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className={theme.textMuted}>Quantity:</span>
                <span className={theme.combine('ml-2 font-medium', theme.text)}>
                  {returnItem.quantity} of {returnItem.originalQuantity}
                </span>
              </div>
              <div>
                <span className={theme.textMuted}>Requested:</span>
                <span className={theme.combine('ml-2 font-medium', theme.text)}>
                  {new Date(returnItem.requestedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Reason */}
            <div className={theme.combine(
              'p-3 rounded-lg text-sm',
              'bg-gray-50 dark:bg-gray-900/50'
            )}>
              <span className={theme.textMuted}>Reason: </span>
              <span className={theme.text}>{returnItem.reason}</span>
            </div>

            {/* Images */}
            {returnItem.images && returnItem.images.length > 0 && (
              <div>
                <div className={theme.combine('text-sm font-medium mb-2', theme.text)}>
                  Attached Images:
                </div>
                <div className="flex gap-2 overflow-x-auto">
                  {returnItem.images.map((image, index) => (
                    <a
                      key={index}
                      href={image}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0"
                    >
                      <img
                        src={image}
                        alt={`Return evidence ${index + 1}`}
                        className="w-20 h-20 object-cover rounded border"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Vendor Notes (if approved) */}
            {returnItem.status === 'approved' && returnItem.vendorNotes && (
              <div className={theme.combine(
                'p-3 rounded-lg text-sm border-l-4 border-green-500',
                'bg-green-50 dark:bg-green-900/20'
              )}>
                <div className="font-medium text-green-800 dark:text-green-200 mb-1">
                  Vendor Response:
                </div>
                <div className="text-green-700 dark:text-green-300">
                  {returnItem.vendorNotes}
                </div>
              </div>
            )}

            {/* Tracking Number (if approved) */}
            {returnItem.trackingNumber && (
              <div className={theme.combine(
                'p-3 rounded-lg text-sm',
                theme.cardBg, theme.borderLight
              )}>
                <AlertCircle className={theme.combine('w-4 h-4 inline mr-2', theme.primary)} />
                <span className={theme.text}>
                  Return Tracking: <span className="font-mono font-medium">{returnItem.trackingNumber}</span>
                </span>
              </div>
            )}

            {/* Rejection Reason */}
            {returnItem.status === 'rejected' && returnItem.rejectionReason && (
              <div className={theme.combine(
                'p-3 rounded-lg text-sm border-l-4 border-red-500',
                'bg-red-50 dark:bg-red-900/20'
              )}>
                <div className="font-medium text-red-800 dark:text-red-200 mb-1">
                  Rejection Reason:
                </div>
                <div className="text-red-700 dark:text-red-300">
                  {returnItem.rejectionReason}
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="pt-3 border-t">
              <div className={theme.combine('text-xs space-y-1', theme.textMuted)}>
                {returnItem.requestedAt && (
                  <div>Requested: {new Date(returnItem.requestedAt).toLocaleString()}</div>
                )}
                {returnItem.approvedAt && (
                  <div className="text-green-600">
                    Approved: {new Date(returnItem.approvedAt).toLocaleString()}
                  </div>
                )}
                {returnItem.rejectedAt && (
                  <div className="text-red-600">
                    Rejected: {new Date(returnItem.rejectedAt).toLocaleString()}
                  </div>
                )}
                {returnItem.refundedAt && (
                  <div className="text-purple-600">
                    Refunded: {new Date(returnItem.refundedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
