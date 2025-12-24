'use client';

import { useQuery } from '@tanstack/react-query';

interface Settings {
  logo?: string;
  name?: string;
  currency: string;
  locationEnabled: boolean;
  categoryMode: string;
  thumbnailLayout: string;
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const [logo, name, currency, locationEnabled, categoryMode, thumbnailLayout] = await Promise.all([
        fetch(`${API_URL}/api/v1/settings/marketplace_logo`).then(r => r.json()).catch(() => ({ value: '' })),
        fetch(`${API_URL}/api/v1/settings/marketplace_name`).then(r => r.json()).catch(() => ({ value: 'Marketplace' })),
        fetch(`${API_URL}/api/v1/settings/currency`).then(r => r.json()).catch(() => ({ value: 'INR' })),
        fetch(`${API_URL}/api/v1/settings/location_filter_enabled`).then(r => r.json()).catch(() => ({ value: 'false' })),
        fetch(`${API_URL}/api/v1/settings/category_display_mode`).then(r => r.json()).catch(() => ({ value: 'scroll' })),
        fetch(`${API_URL}/api/v1/settings/thumbnailLayout`).then(r => r.json()).catch(() => ({ value: 'vertical' })),
      ]);
      
      return {
        logo: logo?.value,
        name: name?.value || 'Marketplace',
        currency: currency?.value || 'INR',
        locationEnabled: locationEnabled?.value === 'true',
        categoryMode: categoryMode?.value || 'scroll',
        thumbnailLayout: thumbnailLayout?.value || 'vertical',
      } as Settings;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
