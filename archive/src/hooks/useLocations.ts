'use client';

import { useQuery } from '@tanstack/react-query';
import { City, SubLocation } from '@/types/common';

export function useCities() {
  return useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/locations/cities`
      );
      if (!response.ok) throw new Error('Failed to fetch cities');
      return response.json() as Promise<City[]>;
    },
    staleTime: 30 * 60 * 1000, // 30 minutes (rarely changes)
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}

export function useSubLocations(cityId?: string) {
  return useQuery({
    queryKey: ['sublocations', cityId],
    queryFn: async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/locations/sublocations${
          cityId ? `?cityId=${cityId}` : ''
        }`
      );
      if (!response.ok) throw new Error('Failed to fetch sublocations');
      return response.json() as Promise<SubLocation[]>;
    },
    enabled: !!cityId,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
