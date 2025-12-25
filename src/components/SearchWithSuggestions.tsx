'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchSuggestions } from '@/hooks/useSearchSuggestions';
import { Search, Package, Tag, Store, Loader2 } from 'lucide-react';
import { getProductImageUrl } from '@/lib/image-url';

interface SearchWithSuggestionsProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  initialQuery?: string;
}

export default function SearchWithSuggestions({ 
  placeholder = "Search products, categories, vendors...",
  onSearch,
  initialQuery = ''
}: SearchWithSuggestionsProps) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { suggestions, loading } = useSearchSuggestions(query);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
      if (onSearch) {
        onSearch(query.trim());
      } else {
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  const handleSuggestionClick = (url: string) => {
    setShowSuggestions(false);
    router.push(url);
  };

  const hasResults = suggestions.products?.length || suggestions.categories?.length || suggestions.vendors?.length;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form onSubmit={handleSearch} className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full px-4 py-2 pl-10 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
        )}
      </form>

      {/* Suggestions Dropdown */}
      {showSuggestions && query.length >= 2 && (
        <div className="absolute z-[9999] w-full mt-2 bg-card rounded-lg shadow-xl border border-border max-h-96 overflow-y-auto">
          {loading && !hasResults ? (
            <div className="p-4 text-center text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Searching...
            </div>
          ) : hasResults ? (
            <>
              {/* Products */}
              {suggestions.products && suggestions.products.length > 0 && (
                <div className="p-2">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Products
                  </div>
                  {suggestions.products.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSuggestionClick(`/products/${product.slug}`)}
                      className="flex items-center gap-3 w-full px-3 py-2 hover:bg-accent rounded-md transition-colors"
                    >
                      {product.featuredImage && (
                        <img
                          src={getProductImageUrl(product)}
                          alt={product.name}
                          className="w-10 h-10 rounded object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-medium text-foreground truncate">
                          {product.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          ₹{product.price}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Categories */}
              {suggestions.categories && suggestions.categories.length > 0 && (
                <div className="p-2 border-t border-border">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Categories
                  </div>
                  {suggestions.categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleSuggestionClick(`/category/${category.slug}`)}
                      className="block w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              )}

              {/* Vendors */}
              {suggestions.vendors && suggestions.vendors.length > 0 && (
                <div className="p-2 border-t border-border">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    Vendors
                  </div>
                  {suggestions.vendors.map((vendor) => (
                    <button
                      key={vendor.id}
                      onClick={() => handleSuggestionClick(`/vendor/${vendor.slug}`)}
                      className="block w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent rounded-md transition-colors"
                    >
                      {vendor.storeName}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="p-4 text-center text-muted-foreground">
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
