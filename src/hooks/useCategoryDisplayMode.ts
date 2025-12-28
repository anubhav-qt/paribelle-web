import { useState, useEffect } from 'react';
import { useVendorContext } from '@/contexts/VendorContext';

export function useCategoryDisplayMode() {
  const { isVendorStore, vendor } = useVendorContext();
  const [categoryDisplayMode, setCategoryDisplayMode] = useState<'top' | 'sidebar'>('sidebar');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryDisplayMode = async () => {
      try {
        // For vendor stores, check the vendor's own categoryDisplayMode setting
        if (isVendorStore && vendor) {
          const vendorDisplayMode = (vendor as any).categoryDisplayMode || 'sidebar';
          setCategoryDisplayMode(vendorDisplayMode as 'top' | 'sidebar');
          setIsLoading(false);
          return;
        }

        // For marketplace, fetch from settings
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/public`);
        if (response.ok) {
          const settings = await response.json();
          const displayModeSetting = settings.find((s: any) => s.key === 'categoryDisplayMode');
          if (displayModeSetting) {
            setCategoryDisplayMode(displayModeSetting.value as 'top' | 'sidebar');
          }
        }
      } catch (error) {
        console.error('Error fetching category display mode:', error);
        // Default to sidebar on error
        setCategoryDisplayMode('sidebar');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategoryDisplayMode();
  }, [isVendorStore, vendor]);

  return { categoryDisplayMode, isLoading };
}
