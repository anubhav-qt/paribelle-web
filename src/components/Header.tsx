'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search, Heart, ChevronDown, ShoppingBag, Store } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import LocationFilter from '@/components/LocationFilter';
import ThemeToggle from '@/components/ThemeToggle';
import { useSettings } from '@/hooks/useSettings';
import SearchWithSuggestions from '@/components/SearchWithSuggestions';

interface HeaderProps {
  showLocationFilter?: boolean;
  showBookingsLink?: boolean;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  initialSearchQuery?: string;
}

export default function Header({ 
  showLocationFilter = false,
  showBookingsLink = true,
  onSearch,
  searchPlaceholder,
  initialSearchQuery = ''
}: HeaderProps) {
  const router = useRouter();
  const { totalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const [user, setUser] = useState<any>(null);
  const [vendorSlug, setVendorSlug] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [cityId, setCityId] = useState<string>('');
  const [subLocationId, setSubLocationId] = useState<string>('');
  
  const marketplaceLogo = settings?.logo || '';
  const marketplaceName = settings?.name || 'GaliCart';
  const locationFilterEnabled = showLocationFilter && (settings?.locationEnabled || false);
  
  const placeholder = searchPlaceholder || 'Search products...';

  useEffect(() => {
    // Check for user on mount and when localStorage changes
    const checkUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // Fetch vendor info if user has vendorId
          if (parsedUser.vendorId) {
            fetchVendorSlug(parsedUser.vendorId);
          } else {
            setVendorSlug(null);
          }
        } catch (err) {
          console.error('Error parsing user data:', err);
        }
      } else {
        setUser(null);
        setVendorSlug(null);
      }
    };

    checkUser();

    // Listen for storage changes (including custom events)
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      if (e instanceof StorageEvent) {
        if (e.key === 'user' || e.key === null) {
          checkUser();
        }
      } else {
        // Custom event from same window
        checkUser();
      }
    };

    window.addEventListener('storage', handleStorageChange as EventListener);
    window.addEventListener('userChanged', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange as EventListener);
      window.removeEventListener('userChanged', handleStorageChange as EventListener);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  const fetchVendorSlug = async (vendorId: string) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}`
      );
      if (response.ok) {
        const vendor = await response.json();
        setVendorSlug(vendor.slug);
      }
    } catch (error) {
      console.error('Error fetching vendor slug:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      // Always redirect to home page with search query
      if (searchQuery.trim()) {
        router.push(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        router.push(`/`);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setVendorSlug(null);
    setShowDropdown(false);
    router.push('/login');
  };

  const getVendorDashboardUrl = () => {
    if (!vendorSlug) return '#';
    return 'http://localhost:3000/vendor/dashboard';
  };

  return (
    <header className="sticky top-0 z-40 shadow-md bg-card">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
            {marketplaceLogo ? (
              <img 
                src={marketplaceLogo} 
                alt={marketplaceName} 
                className="h-10 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<span class="text-2xl font-bold text-primary">${marketplaceName}</span>`;
                  }
                }}
              />
            ) : (
              <span className="text-xl font-bold text-foreground">{marketplaceName}</span>
            )}
          </Link>
          
          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8 gap-4">
            <SearchWithSuggestions 
              placeholder={placeholder}
              onSearch={(query) => {
                if (onSearch) {
                  onSearch(query);
                } else {
                  if (query.trim()) {
                    router.push(`/?search=${encodeURIComponent(query.trim())}`);
                  } else {
                    router.push(`/`);
                  }
                }
              }}
            />
            
            {/* Location Filter */}
            {showLocationFilter && locationFilterEnabled && (
              <div className="flex-shrink-0">
                <LocationFilter 
                  onFilterChange={(newCityId, newSubLocationId) => {
                    setCityId(newCityId || '');
                    setSubLocationId(newSubLocationId || '');
                    
                    // Update URL with location parameters
                    const params = new URLSearchParams(window.location.search);
                    if (newCityId) {
                      params.set('cityId', newCityId);
                    } else {
                      params.delete('cityId');
                    }
                    if (newSubLocationId) {
                      params.set('subLocationId', newSubLocationId);
                    } else {
                      params.delete('subLocationId');
                    }
                    
                    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
                    router.push(newUrl);
                  }}
                />
              </div>
            )}
          </div>

          <div className="flex gap-4 items-center">
            <ThemeToggle />
            <Link 
              href="/wishlist"
              className="relative hover:text-primary transition-colors text-foreground"
              aria-label="Wishlist"
            >
              <Heart className={`w-6 h-6 ${
                wishlistCount > 0 ? 'fill-red-600 text-red-600' : ''
              }`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link 
              href="/cart"
              className="relative hover:text-primary transition-colors text-foreground"
              aria-label="Cart"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
            {user ? (
              <>
                {/* Dropdown for user menu */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-1 px-2 py-1 text-sm hover:text-primary transition-colors font-normal text-foreground"
                  >
                    <span>{user.firstName || user.email}</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg py-2 z-50">
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-foreground"
                        onClick={() => setShowDropdown(false)}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        My Purchases
                      </Link>
                      
                      {vendorSlug && (
                        <>
                          <div className="border-t border-border my-1"></div>
                          <a
                            href={getVendorDashboardUrl()}
                            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-foreground"
                            onClick={() => setShowDropdown(false)}
                          >
                            <Store className="w-4 h-4" />
                            <span className="flex flex-col">
                              <span>My Vendor Dashboard</span>
                              <span className="text-xs text-muted-foreground">Orders & Products</span>
                            </span>
                          </a>
                        </>
                      )}
                      
                      <div className="border-t border-border my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-foreground"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-2 py-1 text-sm border border-border hover:border-primary hover:text-primary rounded transition-all font-normal text-foreground"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-3 py-1 text-sm bg-primary text-primary-foreground font-normal hover:opacity-90 rounded transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
