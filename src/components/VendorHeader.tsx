'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingCart, Search, Menu, X, ChevronDown, ShoppingBag, Store } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import ThemeToggle from '@/components/ThemeToggle';
import { useVendor } from '@/hooks/useVendor';
import { initAuthFromCookie, removeAuthCookie } from '@/lib/cross-domain-auth';

interface VendorHeaderProps {
  vendorSlug: string;
  vendorId?: string;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  initialSearchQuery?: string;
  showSearchBar?: boolean;
  themeConfig?: any;
}

export default function VendorHeader({ 
  vendorSlug,
  vendorId,
  onSearch,
  searchPlaceholder = "Search in this store...",
  initialSearchQuery = '',
  showSearchBar = true,
  themeConfig
}: VendorHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [user, setUser] = useState<any>(null);
  const { data: vendor } = useVendor(vendorSlug);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for user
    const checkUser = () => {
      const storedUser = localStorage.getItem('user');
      console.log('VendorHeader: checkUser called, storedUser:', storedUser ? 'Found' : 'Not found');
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          console.log('VendorHeader: User set:', parsedUser.email);
        } catch (err) {
          console.error('Error parsing user data:', err);
        }
      } else {
        setUser(null);
      }
    };
    
    // Initialize auth from cookie if not already in localStorage
    const initAuth = async () => {
      console.log('VendorHeader: Initializing auth...');
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      // Only check cookie if we're on a vendor subdomain (not main domain)
      const hostname = window.location.hostname;
      const isVendorSubdomain = hostname !== 'localhost' && hostname.includes('.localhost');
      
      console.log('VendorHeader: hostname:', hostname, 'isVendorSubdomain:', isVendorSubdomain);
      
      if ((!storedToken || !storedUser) && isVendorSubdomain) {
        console.log('VendorHeader: No token/user in localStorage, checking cookie...');
        try {
          await initAuthFromCookie();
        } catch (error) {
          console.error('VendorHeader: Error initializing auth from cookie:', error);
        }
      } else if (!storedToken || !storedUser) {
        console.log('VendorHeader: On main domain, auth should already be in localStorage from login');
      }
      
      // Check user after potential auth initialization
      checkUser();
      setAuthChecked(true);
    };
    
    initAuth();
    
    // Listen for custom userChanged event
    const handleUserChanged = () => {
      console.log('VendorHeader: User changed event received, reloading user');
      checkUser();
    };
    
    window.addEventListener('userChanged', handleUserChanged);
    
    // Listen for storage changes (when auth is synced from cookie)
    const handleStorageChange = (e: StorageEvent) => {
      console.log('VendorHeader: Storage event received, key:', e.key);
      if (e.key === 'user' && e.newValue) {
        try {
          setUser(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Error parsing user data from storage event:', err);
        }
      } else if (e.key === 'user' && !e.newValue) {
        setUser(null);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('userChanged', handleUserChanged);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [vendorSlug]);

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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      if (searchQuery.trim()) {
        router.push(`/vendor/${vendorSlug}/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    removeAuthCookie('token');
    removeAuthCookie('user');
    setUser(null);
    setShowDropdown(false);
    // Redirect to main domain login page
    window.location.href = 'http://localhost:3000/login';
  };

  // Memoize dashboard URL to prevent infinite re-renders
  const dashboardUrl = useMemo(() => {
    if (!user) return '/login';
    
    // If user is a vendor, go to vendor dashboard
    if (user.role === 'vendor_admin') {
      return '/vendor/dashboard';
    }
    
    // For buyers, use dashboard (middleware will handle rewrite on vendor subdomains)
    return '/dashboard';
  }, [user]);

  return (
    <header className="sticky top-0 z-40 shadow-md overflow-visible bg-primary text-primary-foreground border-b-2 border-secondary">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center overflow-visible">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-primary-foreground hover:opacity-80 transition-colors p-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <Link href={`/vendor/${vendorSlug}`} className="flex items-center gap-4">
            {vendor?.logo && (
              <img 
                src={vendor.logo} 
                alt={vendor.businessName}
                className="h-12 w-12 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-primary-foreground">
                {vendor?.businessName || 'Store'}
              </h1>
              <p className="text-xs text-primary-foreground/80">Official Store</p>
            </div>
          </Link>
          
          {/* Search Bar */}
          {showSearchBar && (
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
              </form>
            </div>
          )}

          <div className="flex gap-4 items-center">
            <Link href={`/vendor/${vendorSlug}/cart`} className="relative text-primary-foreground hover:opacity-80 transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
            <Link href="http://localhost:3000" className="hidden md:inline-flex text-sm text-primary-foreground px-4 py-2 bg-primary-foreground/10 rounded-lg hover:bg-primary-foreground/20 transition-colors">
              All Vendors
            </Link>
            {user ? (
              <div className="relative z-[9999]" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="hidden md:flex items-center gap-1 px-2 py-1 text-sm hover:opacity-80 transition-colors font-normal text-primary-foreground"
                >
                  <span>{user.firstName || user.email}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-xl py-2 z-[9999]">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-foreground"
                      onClick={() => setShowDropdown(false)}
                    >
                      <ShoppingBag className="w-4 h-4" />
                      My Purchases
                    </Link>
                    
                    {user.role === 'vendor_admin' && (
                      <>
                        <div className="border-t border-border my-1"></div>
                        <Link
                          href="/vendor/dashboard"
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-foreground"
                          onClick={() => setShowDropdown(false)}
                        >
                          <Store className="w-4 h-4" />
                          <span className="flex flex-col">
                            <span>My Vendor Dashboard</span>
                            <span className="text-xs text-muted-foreground">Orders & Products</span>
                          </span>
                        </Link>
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
            ) : (
              <Link
                href={`/login?returnUrl=${encodeURIComponent(window.location.href)}`}
                className="hidden md:block px-4 py-2 text-foreground hover:text-primary transition-colors font-medium"
              >
                Login
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden mt-3">
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
          </form>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-card border-t border-border">
          <nav className="container mx-auto px-4 py-4 space-y-2">
            <Link
              href="http://localhost:3000"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 px-4 text-foreground hover:bg-accent rounded-md transition-colors"
            >
              All Vendors
            </Link>

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 px-4 text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  My Purchases
                </Link>
                {user.role === 'vendor_admin' && (
                  <Link
                    href="/vendor/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block py-2 px-4 text-foreground hover:bg-accent rounded-md transition-colors"
                  >
                    My Vendor Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full text-left py-2 px-4 text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                href={`/login?returnUrl=${encodeURIComponent(window.location.href)}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 px-4 text-foreground hover:bg-accent rounded-md transition-colors"
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
