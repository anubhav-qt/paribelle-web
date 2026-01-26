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
  bookingDetails,
}: {
  isOpen: boolean;
  onClose: () => void;
  onViewBookings: () => void;
  onContinueShopping: () => void;
  bookingType?: 'booking' | 'tour';
  bookingDetails?: {
    productName?: string;
    numberOfGuests?: number;
    numberOfDays?: number;
    departureDate?: string;
    totalPrice?: number;
    currency?: string;
    bookingDate?: string;    bookingDates?: string[];    startTime?: string;
    endTime?: string;
    endDate?: string;
    timeSlots?: string[];
  };
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
    {bookingDetails && (
      <div className="bg-muted rounded-lg p-4 mb-2 space-y-2">
        {bookingDetails.productName && (
          <div className="text-center">
            <p className="font-semibold text-foreground text-lg">{bookingDetails.productName}</p>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-3 text-sm pt-2">
          {bookingDetails.numberOfDays && (
            <div>
              <p className="text-muted-foreground">Duration</p>
              <p className="font-semibold text-foreground">
                {bookingDetails.numberOfDays} {bookingDetails.numberOfDays === 1 ? 'Day' : 'Days'}
              </p>
            </div>
          )}
          
          {bookingDetails.timeSlots && bookingDetails.timeSlots.length > 0 && (
            <div className="col-span-2">
              <p className="text-muted-foreground mb-2">Time Slots</p>
              <div className="space-y-1">
                {bookingDetails.timeSlots.map((slot, idx) => (
                  <p key={idx} className="font-semibold text-foreground text-sm">
                    {slot}
                  </p>
                ))}
              </div>
            </div>
          )}
          
          {!bookingDetails.numberOfDays && !bookingDetails.timeSlots && bookingDetails.numberOfGuests && (
            <div>
              <p className="text-muted-foreground">Guests</p>
              <p className="font-semibold text-foreground">
                {bookingDetails.numberOfGuests} {bookingDetails.numberOfGuests === 1 ? 'Person' : 'People'}
              </p>
            </div>
          )}
          
          {bookingDetails.departureDate && (
            <div>
              <p className="text-muted-foreground">{bookingType === 'tour' ? 'Departure Date' : 'Booking Date'}</p>
              <p className="font-semibold text-foreground">
                {new Date(bookingDetails.departureDate).toLocaleDateString()}
              </p>
            </div>
          )}
          
          {bookingDetails.bookingDates && bookingDetails.bookingDates.length > 0 && (
            <div className="col-span-2">
              <p className="text-muted-foreground mb-2">Selected Dates</p>
              <div className="space-y-1">
                {bookingDetails.bookingDates.map((date, idx) => (
                  <p key={idx} className="font-semibold text-foreground text-sm">
                    {new Date(date).toLocaleDateString()}
                  </p>
                ))}
              </div>
            </div>
          )}
          
          {bookingDetails.bookingDate && !bookingDetails.departureDate && !bookingDetails.bookingDates && (
            <div className={bookingDetails.endDate ? 'col-span-2' : ''}>
              <p className="text-muted-foreground">{bookingDetails.endDate ? 'Booking Period' : 'Date'}</p>
              <p className="font-semibold text-foreground">
                {new Date(bookingDetails.bookingDate).toLocaleDateString()}
                {bookingDetails.endDate && (
                  <> - {new Date(bookingDetails.endDate).toLocaleDateString()}</>
                )}
              </p>
            </div>
          )}
          
          {bookingDetails.startTime && !bookingDetails.timeSlots && (
            <div>
              <p className="text-muted-foreground">Time</p>
              <p className="font-semibold text-foreground">
                {bookingDetails.startTime}
                {bookingDetails.endTime && ` - ${bookingDetails.endTime}`}
              </p>
            </div>
          )}
          
          {bookingDetails.totalPrice && (
            <div className="col-span-2 pt-2 border-t border-border">
              <p className="text-muted-foreground">Total Amount</p>
              <p className="font-bold text-primary text-lg">
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: bookingDetails.currency || 'INR'
                }).format(bookingDetails.totalPrice)}
              </p>
            </div>
          )}
        </div>
      </div>
    )}
    
    <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-2 mt-4">
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
