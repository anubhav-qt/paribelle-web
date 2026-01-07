import { useState, useCallback } from 'react';
import { ToastType } from '@/components/Toast';

export function useToast() {
  const [toast, setToast] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    setToast({ message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, hideToast };
}

export function useConfirm() {
  const [confirm, setConfirm] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'danger' | 'primary' | 'success' | 'warning';
    onConfirm: () => void;
  } | null>(null);

  const showConfirm = useCallback((options: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmVariant?: 'danger' | 'primary' | 'success' | 'warning';
    onConfirm: () => void;
  }) => {
    setConfirm(options);
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirm(null);
  }, []);

  return { confirm, showConfirm, hideConfirm };
}
