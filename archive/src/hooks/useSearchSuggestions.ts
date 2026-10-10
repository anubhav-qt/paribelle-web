import { useState, useEffect, useRef } from 'react';

interface Suggestion {
  products?: Array<{
    id: string;
    name: string;
    slug: string;
    featuredImage?: string;
    price: number;
  }>;
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
}

export function useSearchSuggestions(query: string, delay = 300) {
  const [suggestions, setSuggestions] = useState<Suggestion>({});
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Reset if query is too short
    if (!query || query.length < 2) {
      setSuggestions({});
      setLoading(false);
      return;
    }

    // Debounce the search
    timeoutRef.current = setTimeout(async () => {
      setLoading(true);
      abortControllerRef.current = new AbortController();

      try {
        const params = new URLSearchParams({ q: query });

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/search/suggestions?${params.toString()}`,
          { signal: abortControllerRef.current.signal }
        );

        if (response.ok) {
          const data = await response.json();
          setSuggestions(data);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching suggestions:', error);
        }
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, delay]);

  return { suggestions, loading };
}
