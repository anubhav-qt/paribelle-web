'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search, Heart, ChevronDown, ShoppingBag, Store, Menu, X, Home } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useVendorContext } from '@/contexts/VendorContext';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import LocationFilter from '@/components/LocationFilter';
import { useSettings } from '@/hooks/useSettings';
import SearchWithSuggestions from '@/components/SearchWithSuggestions';
import { initAuthFromCookie, removeAuthCookie } from '@/lib/cross-domain-auth';

interface UnifiedHeaderProps {
  showLocationFilter?: boolean;
  showBookingsLink?: boolean;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  initialSearchQuery?: string;
}

export default function UnifiedHeader({ 
  showLocationFilter = false,
  showBookingsLink = true,
  onSearch,
  searchPlaceholder,
  initialSearchQuery = ''
}: UnifiedHeaderProps) {
  const router = useRouter();
  const { totalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const { vendor, isVendorStore, themeConfig } = useVendorContext();
  const theme = useThemeClasses();
  
  const [user, setUser] = useState<any>(null);
  const [vendorSlug, setVendorSlug] = useState<string | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { data: settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [cityId, setCityId] = useState<string>('');
  const [subLocationId, setSubLocationId] = useState<string>('');
  
  const marketplaceLogo = settings?.logo || '';
  const marketplaceName = settings?.name || 'GaliCart';
  const locationFilterEnabled = showLocationFilter && (settings?.locationEnabled || false);
  const showSearchBar = isVendorStore ? (themeConfig?.showSearchBar !== false) : true;
  
  const placeholder = searchPlaceholder || (isVendorStore ? 'Search in this store...' : 'Search products...');

  // Auth check
  useEffect(() => {
    const checkUser = () => {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
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

    // Initialize auth from cookie if on vendor subdomain
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const hostname = window.location.hostname;
      const isVendorSubdomain = hostname !== 'localhost' && hostname.includes('.localhost');
      
      if ((!storedToken || !storedUser) && isVendorSubdomain) {
        try {
          await initAuthFromCookie();
        } catch (error) {
          console.error('Error initializing auth from cookie:', error);
        }
      }
      checkUser();
    };

    initAuth();

    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      if (e instanceof StorageEvent) {
        if (e.key === 'user' || e.key === null) checkUser();
      } else {
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
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}`);
      if (response.ok) {
        const vendor = await response.json();
        setVendorSlug(vendor.slug);
      }
    } catch (error) {
      console.error('Error fetching vendor slug:', error);
    }
  };

  const handleSearch = (query: string) => {
    if (onSearch) {
      onSearch(query);
    } else {
      if (query.trim()) {
        if (isVendorStore && vendor) {
          router.push(`/vendor/${vendor.slug}/search?q=${encodeURIComponent(query.trim())}`);
        } else {
          router.push(`/?search=${encodeURIComponent(query.trim())}`);
        }
      } else {
        router.push(isVendorStore && vendor ? `/vendor/${vendor.slug}` : '/');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    removeAuthCookie('token');
    removeAuthCookie('user');
    setUser(null);
    setVendorSlug(null);
    setShowDropdown(false);
    
    if (isVendorStore) {
      window.location.href = 'http://localhost:3000/login';
    } else {
      router.push('/login');
    }
  };

  // Determine home URL based on context
  const isVendorAdminPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/vendor/');
  const homeUrl = isVendorAdminPage ? '/' : (isVendorStore && vendor ? `/vendor/${vendor.slug}` : '/');
  const cartUrl = isVendorStore && vendor ? `/vendor/${vendor.slug}/cart` : '/cart';

  return (
    <header className={theme.combine(
      'sticky top-0 z-40 shadow-md border-b-2',
      isVendorStore ? 'vendor-primary-bg text-white vendor-border-primary' : 'bg-primary text-primary-foreground border-b-secondary'
    )}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center overflow-visible">
          {/* Mobile Menu Button (vendor only) */}
          {isVendorStore && (
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-white hover:opacity-80 transition-colors p-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}

          {/* Logo/Brand */}
          <Link href={homeUrl} className="flex items-center gap-4">
            {isVendorStore && vendor && !window.location.pathname.startsWith('/vendor/') ? (
              <>
                {vendor.logo && (
                  <img 
                    src={vendor.logo} 
                    alt={vendor.businessName}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {vendor.businessName}
                  </h1>
                  <p className="text-xs text-white/80">Official Store</p>
                </div>
              </>
            ) : (
              <>
                {marketplaceLogo ? (
                  <img 
                    src={marketplaceLogo} 
                    alt={marketplaceName} 
                    className="h-10 object-contain"
                  />
                ) : (
                  <span className="text-xl font-bold text-primary-foreground">{marketplaceName}</span>
                )}
              </>
            )}
          </Link>
          
          {/* Search Bar */}
          {showSearchBar && (
            <div className="hidden md:flex flex-1 max-w-2xl mx-8 gap-4">
              <div className="relative w-full">
                <SearchWithSuggestions
                  placeholder={placeholder}
                  onSearch={handleSearch}
                  initialQuery={initialSearchQuery}
                />
              </div>
              
              {/* Location Filter (main marketplace only) */}
              {!isVendorStore && showLocationFilter && locationFilterEnabled && (
                <div className="flex-shrink-0">
                  <LocationFilter 
                    onFilterChange={(newCityId, newSubLocationId) => {
                      setCityId(newCityId || '');
                      setSubLocationId(newSubLocationId || '');
                      
                      const params = new URLSearchParams(window.location.search);
                      if (newCityId) params.set('cityId', newCityId);
                      else params.delete('cityId');
                      if (newSubLocationId) params.set('subLocationId', newSubLocationId);
                      else params.delete('subLocationId');
                      
                      const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
                      router.push(newUrl);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4 items-center">
            {/* Wishlist (main marketplace only) */}
            {!isVendorStore && (
              <Link 
                href="/wishlist"
                className="relative hover:opacity-80 transition-colors text-primary-foreground"
                aria-label="Wishlist"
              >
                <Heart className={`w-6 h-6 ${wishlistCount > 0 ? 'fill-accent text-accent' : ''}`} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {/* Cart */}
            <Link 
              href={cartUrl}
              className={theme.combine(
                'relative hover:opacity-80 transition-colors',
                isVendorStore ? 'text-white' : 'text-primary-foreground'
              )}
              aria-label="Cart"
            >
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* All Vendors Link (vendor store only) */}
            {isVendorStore && (
              <Link 
                href="http://localhost:3000" 
                className="hidden md:inline-flex text-sm text-white px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                All Vendors
              </Link>
            )}

            {/* User Menu */}
            {user ? (
              <div className="relative z-[9999]" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={theme.combine(
                    'hidden md:flex items-center gap-1 px-2 py-1 text-sm hover:opacity-80 transition-colors font-normal',
                    isVendorStore ? 'text-white' : 'text-primary-foreground'
                  )}
                >
                  <span>{user.firstName || user.email}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showDropdown && (
                  <div className={theme.combine(
                    'absolute right-0 mt-2 w-56 border rounded-lg shadow-xl py-2 z-[9999]',
                    isVendorStore ? 'vendor-bg vendor-border-primary' : 'bg-card border-border'
                  )}>
                    <Link
                      href="/dashboard"
                      className={theme.combine(
                        'flex items-center gap-2 px-4 py-2 text-sm hover:opacity-80 transition-colors',
                        isVendorStore ? 'vendor-text' : 'text-foreground'
                      )}
                      onClick={() => setShowDropdown(false)}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      My Purchases
                    </Link>
                    
                    {user.role === 'super_admin' && (
                      <>
                        <div className={theme.combine('border-t my-1', isVendorStore ? 'vendor-border-primary-30' : 'border-border')}></div>
                        <Link
                          href="/admin"
                          className={theme.combine(
                            'flex items-center gap-2 px-4 py-2 text-sm hover:opacity-80 transition-colors',
                            isVendorStore ? 'vendor-text' : 'text-foreground'
                          )}
                          onClick={() => setShowDropdown(false)}
                        >
                          <Store className="w-4 h-4" />
                          <span className="flex flex-col">
                            <span>Admin Dashboard</span>
                            <span className={theme.combine('text-xs', isVendorStore ? 'vendor-text-80' : 'text-muted-foreground')}>
                              Manage Marketplace
                            </span>
                          </span>
                        </Link>
                      </>
                    )}
                    
                    {user.role === 'vendor_admin' && (
                      <>
                        <div className={theme.combine('border-t my-1', isVendorStore ? 'vendor-border-primary-30' : 'border-border')}></div>
                        <Link
                          href="/vendor/dashboard"
                          className={theme.combine(
                            'flex items-center gap-2 px-4 py-2 text-sm hover:opacity-80 transition-colors',
                            isVendorStore ? 'vendor-text' : 'text-foreground'
                          )}
                          onClick={() => setShowDropdown(false)}
                        >
                          <Store className="w-4 h-4" />
                          <span className="flex flex-col">
                            <span>My Vendor Dashboard</span>
                            <span className={theme.combine('text-xs', isVendorStore ? 'vendor-text-80' : 'text-muted-foreground')}>
                              Orders & Products
                            </span>
                          </span>
                        </Link>
                      </>
                    )}
                    
                    <div className={theme.combine('border-t my-1', isVendorStore ? 'vendor-border-primary-30' : 'border-border')}></div>
                    <button
                      onClick={handleLogout}
                      className={theme.combine(
                        'w-full text-left px-4 py-2 text-sm hover:opacity-80 transition-colors',
                        isVendorStore ? 'vendor-text' : 'text-foreground'
                      )}
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {isVendorStore ? (
                  <Link
                    href={`/login?returnUrl=${encodeURIComponent(window.location.href)}`}
                    className="hidden md:block px-4 py-2 text-white hover:opacity-80 transition-colors font-medium"
                  >
                    Login
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="px-2 py-1 text-sm border border-primary-foreground/30 hover:border-primary-foreground hover:bg-primary-foreground/10 rounded transition-all font-normal text-primary-foreground"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="px-3 py-1 text-sm bg-primary-foreground text-primary font-normal hover:opacity-90 rounded transition-colors"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        {showSearchBar && (
          <div className="md:hidden mt-3">
            <div className="relative w-full">
              <input
                type="text"
                placeholder={placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
                className={theme.combine(
                  'w-full px-4 py-2 pl-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring',
                  isVendorStore ? 'vendor-border-primary vendor-bg vendor-text' : 'border-input bg-background text-foreground'
                )}
              />
              <Search className={theme.combine(
                'absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 pointer-events-none',
                isVendorStore ? 'vendor-text-80' : 'text-muted-foreground'
              )} />
            </div>
          </div>
        )}
      </div>

      {/* Mobile Menu (vendor only) */}
      {isVendorStore && mobileMenuOpen && (
        <div className={theme.combine('lg:hidden border-t', theme.bg, theme.borderLight)}>
          <nav className="container mx-auto px-4 py-4 space-y-2">
            <Link
              href="http://localhost:3000"
              onClick={() => setMobileMenuOpen(false)}
              className={theme.combine('block py-2 px-4 hover:opacity-80 rounded-md transition-colors', theme.text)}
            >
              All Vendors
            </Link>

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className={theme.combine('block py-2 px-4 hover:opacity-80 rounded-md transition-colors', theme.text)}
                >
                  My Purchases
                </Link>
                {user.role === 'vendor_admin' && (
                  <Link
                    href="/vendor/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className={theme.combine('block py-2 px-4 hover:opacity-80 rounded-md transition-colors', theme.text)}
                  >
                    My Vendor Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className={theme.combine('block w-full text-left py-2 px-4 hover:opacity-80 rounded-md transition-colors', theme.text)}
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href={`/login?returnUrl=${encodeURIComponent(window.location.href)}`}
                onClick={() => setMobileMenuOpen(false)}
                className={theme.combine('block py-2 px-4 hover:opacity-80 rounded-md transition-colors', theme.text)}
              >
                Login
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
