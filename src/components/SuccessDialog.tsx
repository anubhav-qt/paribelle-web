'use client';

import { CheckCircle, Calendar, ShoppingBag, X } from 'lucide-react';
import { ReactNode } from 'react';

export interface SuccessDialogAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary';
}

interface SuccessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  icon?: ReactNode;
  actions?: SuccessDialogAction[];
  children?: ReactNode;
  showCloseButton?: boolean;
}

export default function SuccessDialog({
  isOpen,
  onClose,
  title,
  message,
  icon,
  actions = [],
  children,
  showCloseButton = false,
}: SuccessDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card rounded-lg shadow-xl border border-border max-w-md w-full animate-in zoom-in-95 duration-200">
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              {icon || <CheckCircle className="w-10 h-10 text-green-600" />}
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {title}
            </h2>
            {message && (
              <p className="text-muted-foreground">
                {message}
              </p>
            )}
          </div>
          
          {children}
          
          {actions.length > 0 && (
            <div className="flex flex-col gap-3 mt-6">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={
                    action.variant === 'secondary'
                      ? 'w-full px-6 py-3 border border-border text-foreground rounded-lg font-semibold hover:bg-muted transition-colors flex items-center justify-center gap-2'
                      : 'w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2'
                  }
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Preset configurations for common use cases
export const BookingSuccessDialog = ({
  isOpen,
  onClose,
  onViewBookings,
  onContinueShopping,
  bookingType = 'booking',
}: {
  isOpen: boolean;
  onClose: () => void;
  onViewBookings: () => void;
  onContinueShopping: () => void;
  bookingType?: 'booking' | 'tour';
}) => (
  <SuccessDialog
    isOpen={isOpen}
    onClose={onClose}
    title={bookingType === 'tour' ? 'Tour Booked Successfully!' : 'Booking Confirmed!'}
    message={`Your ${bookingType} has been confirmed. You'll receive a confirmation email shortly.`}
    actions={[
      {
        label: 'View My Bookings',
        onClick: onViewBookings,
        icon: <Calendar className="w-5 h-5" />,
        variant: 'primary',
      },
      {
        label: 'Continue Shopping',
        onClick: onContinueShopping,
        variant: 'secondary',
      },
    ]}
  >
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-2">
      <p className="text-sm text-muted-foreground text-center">
        What would you like to do next?
      </p>
    </div>
  </SuccessDialog>
);

export const OrderSuccessDialog = ({
  isOpen,
  onClose,
  onViewOrders,
  onContinueShopping,
  orderNumber,
}: {
  isOpen: boolean;
  onClose: () => void;
  onViewOrders: () => void;
  onContinueShopping: () => void;
  orderNumber?: string;
}) => (
  <SuccessDialog
    isOpen={isOpen}
    onClose={onClose}
    title="Order Placed Successfully!"
    message="Thank you for your order. We'll send you a confirmation email shortly."
    actions={[
      {
        label: 'View My Orders',
        onClick: onViewOrders,
        icon: <ShoppingBag className="w-5 h-5" />,
        variant: 'primary',
      },
      {
        label: 'Continue Shopping',
        onClick: onContinueShopping,
        variant: 'secondary',
      },
    ]}
  >
    {orderNumber && (
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-2">
        <p className="text-sm text-muted-foreground mb-1 text-center">Order Number</p>
        <p className="text-lg font-bold text-primary text-center">{orderNumber}</p>
      </div>
    )}
  </SuccessDialog>
);
