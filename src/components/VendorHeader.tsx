'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingCart, Search, Menu, X } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import ThemeToggle from '@/components/ThemeToggle';

interface VendorHeaderProps {
  vendorSlug: string;
  vendorId?: string;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  initialSearchQuery?: string;
}

export default function VendorHeader({ 
  vendorSlug,
  vendorId,
  onSearch,
  searchPlaceholder = "Search in this store...",
  initialSearchQuery = ''
}: VendorHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { totalItems } = useCart();
  const [user, setUser] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Fetch vendor data
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/vendors/slug/${vendorSlug}`)
      .then(res => res.json())
      .then(data => {
        setVendor(data);
      })
      .catch(err => console.error('Error fetching vendor:', err));

    // Check for user
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, [vendorSlug]);

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
    setUser(null);
    router.push('/');
  };

  // Memoize dashboard URL to prevent infinite re-renders
  const dashboardUrl = useMemo(() => {
    if (!user) return '/login';
    
    // If user is a vendor, go to vendor dashboard
    if (user.role === 'vendor_admin') {
      return '/vendor/dashboard';
    }
    
    // For buyers, use locale-based dashboard (middleware will handle rewrite on vendor subdomains)
    return '/en/dashboard';
  }, [user]);

  return (
    <header className="sticky top-0 z-40 bg-card shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-foreground hover:text-primary transition-colors p-2"
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
              <h1 className="text-2xl font-bold text-foreground">
                {vendor?.businessName || 'Store'}
              </h1>
              <p className="text-xs text-muted-foreground">Official Store</p>
            </div>
          </Link>
          
          {/* Search Bar */}
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

          <div className="flex gap-4 items-center">
            <ThemeToggle />
            <Link href={`/vendor/${vendorSlug}/cart`} className="relative text-foreground hover:text-primary transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
            <Link href="http://localhost:3000" className="hidden md:inline-flex text-sm text-foreground px-4 py-2 bg-muted rounded-lg hover:bg-accent transition-colors">
              All Vendors
            </Link>
            {user && (
              <>
                <Link
                  href={dashboardUrl}
                  className="hidden md:block px-4 py-2 text-foreground hover:text-primary transition-colors font-medium"
                >
                  {user.firstName || user.email}
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden md:block px-4 py-2 text-foreground font-medium hover:text-primary rounded transition-colors"
                >
                  Logout
                </button>
              </>
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
                  href={dashboardUrl}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2 px-4 text-foreground hover:bg-accent rounded-md transition-colors"
                >
                  {user.firstName || user.email}
                </Link>
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
                href="/login"
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
