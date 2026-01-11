'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Heart, User, ChevronDown, Menu, X, ChevronRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useVendorContext } from '@/contexts/VendorContext';
import { useCategories } from '@/hooks/useCategories';
import { clearAuth } from '@/lib/auth';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import SearchWithSuggestions from '@/components/SearchWithSuggestions';

export default function MinimalSidebarHeader() {
  const router = useRouter();
  const { totalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const { vendor, isVendorStore } = useVendorContext();
  const theme = useThemeClasses();
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [marketplaceLogo, setMarketplaceLogo] = useState<string>('');
  const [marketplaceName, setMarketplaceName] = useState<string>('GaliCart');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch categories
  const effectiveVendorId = isVendorStore && vendor ? vendor.id : undefined;
  const { data: categories = [] } = useCategories({
    vendorId: effectiveVendorId,
    hideEmptyCategories: true,
  });

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    if (!isVendorStore) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/marketplace_logo`)
        .then(res => res.json())
        .then(data => setMarketplaceLogo(data.value || ''))
        .catch(err => console.error('Failed to fetch logo:', err));
      
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/marketplace_name`)
        .then(res => res.json())
        .then(data => setMarketplaceName(data.value || 'GaliCart'))
        .catch(err => console.error('Failed to fetch name:', err));
    }
  }, [isVendorStore]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth(); // Use centralized auth clearing
    localStorage.removeItem('marketplace_cart'); // Clear cart from local storage
    setUser(null);
    setShowDropdown(false);
    router.push('/login');
  };

  return (
    <>
      {/* Compact Header Bar */}
      <header className={isVendorStore ? 'vendor-primary-bg vendor-border-primary border-b sticky top-0 z-40' : 'bg-primary text-primary-foreground border-b sticky top-0 z-40'}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left - Menu Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className={isVendorStore ? theme.combine('p-2 rounded-lg transition-colors hover:opacity-80', theme.text) : 'p-2 rounded-lg transition-colors hover:opacity-80 text-primary-foreground'}
              aria-label="Open menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Center - Logo & Search */}
            <div className="flex items-center space-x-6 flex-1 mx-6">
              <Link href="/" className="flex items-center space-x-2 shrink-0">
                {isVendorStore && vendor?.logo ? (
                  <img 
                    src={`${process.env.NEXT_PUBLIC_API_URL}${vendor.logo}`} 
                    alt={vendor.businessName}
                    className="h-8 w-8 rounded object-cover"
                  />
                ) : !isVendorStore && marketplaceLogo ? (
                  <img 
                    src={marketplaceLogo.startsWith('http') ? marketplaceLogo : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${marketplaceLogo}`} 
                    alt={marketplaceName}
                    className="h-8 object-contain"
                  />
                ) : null}
                <span className={isVendorStore ? theme.combine('text-xl font-semibold', theme.text) : 'text-xl font-semibold text-primary-foreground'}>
                  {isVendorStore ? vendor?.businessName : marketplaceName}
                </span>
              </Link>

              <div className="flex-1 max-w-md">
                <SearchWithSuggestions
                  placeholder="Search..."
                  onSearch={(query) => router.push(`/search?q=${query}`)}
                />
              </div>
            </div>

            {/* Right - Actions */}
            <div className="flex items-center space-x-4">
              <Link href="/wishlist" className={isVendorStore ? theme.combine('relative p-2 rounded-lg transition-colors hover:opacity-90') : 'relative p-2 rounded-lg transition-colors hover:opacity-80'}>
                <Heart className={isVendorStore ? theme.combine('w-5 h-5', theme.text) : 'w-5 h-5 text-primary-foreground'} />
                {wishlistCount > 0 && (
                  <span className={isVendorStore ? theme.combine('absolute top-0 right-0 text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-medium', theme.primaryBg, 'text-white') : 'absolute top-0 right-0 text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-medium bg-secondary text-secondary-foreground'}>
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link href="/cart" className={isVendorStore ? theme.combine('relative p-2 rounded-lg transition-colors hover:opacity-90') : 'relative p-2 rounded-lg transition-colors hover:opacity-80'}>
                <ShoppingCart className={isVendorStore ? theme.combine('w-5 h-5', theme.text) : 'w-5 h-5 text-primary-foreground'} />
                {totalItems > 0 && (
                  <span className={isVendorStore ? theme.combine('absolute top-0 right-0 text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-medium', theme.primaryBg, 'text-white') : 'absolute top-0 right-0 text-xs rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-medium bg-secondary text-secondary-foreground'}>
                    {totalItems}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className={isVendorStore ? theme.combine('flex items-center space-x-1 p-2 rounded-lg transition-colors hover:opacity-90') : 'flex items-center space-x-1 p-2 rounded-lg transition-colors hover:opacity-80 text-primary-foreground'}
                  >
                    <User className="w-5 h-5" />
                    <span className="text-sm">{user.firstName || user.email?.split('@')[0]}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showDropdown && (
                    <div className={theme.combine('absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-2 z-50 border', theme.bg, theme.border)}>
                      {user?.role === 'super_admin' && (
                        <Link href="/admin" className={theme.combine('block px-4 py-2 text-sm font-medium hover:opacity-90', theme.text)}>
                          Admin Dashboard
                        </Link>
                      )}
                      {user?.role === 'vendor_admin' && (
                        <Link href="/vendor/dashboard" className={theme.combine('block px-4 py-2 text-sm font-medium hover:opacity-90', theme.text)}>
                          Vendor Dashboard
                        </Link>
                      )}
                      <Link href="/profile" className={theme.combine('block px-4 py-2 text-sm hover:opacity-90', theme.text)}>
                        My Profile
                      </Link>
                      <Link href="/orders" className={theme.combine('block px-4 py-2 text-sm hover:opacity-90', theme.text)}>
                        My Orders
                      </Link>
                      <button
                        onClick={handleLogout}
                        className={theme.combine('w-full text-left block px-4 py-2 text-sm text-red-600 hover:opacity-90')}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className={isVendorStore ? theme.combine('text-sm font-medium transition-colors', theme.text, theme.linkHover) : 'text-sm font-medium transition-colors hover:opacity-80 text-primary-foreground'}>
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div 
        className={`fixed top-0 left-0 h-full w-80 shadow-2xl z-50 transform transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isVendorStore ? 'vendor-bg' : 'bg-background'}`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className={theme.combine('flex items-center justify-between p-6 border-b', theme.border)}>
            <h2 className={theme.combine('text-xl font-semibold', theme.text)}>Menu</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className={theme.combine('p-2 rounded-lg transition-colors hover:opacity-90')}
            >
              <X className={theme.combine('w-5 h-5', theme.text)} />
            </button>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 overflow-y-auto p-6">
            <div className="space-y-1">
              {categories.map((category: any) => (
                <button
                  key={category.id}
                  onClick={(e) => {
                    e.preventDefault();
                    setSidebarOpen(false);
                    
                    const isOnHomepage = window.location.pathname === '/';
                    
                    if (!isOnHomepage) {
                      window.location.href = `/#category-${category.slug}`;
                    } else {
                      const element = document.getElementById(`category-${category.slug}`);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }
                  }}
                  className={theme.combine('w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors group hover:opacity-90', theme.text)}
                >
                  <span>{category.name}</span>
                  <ChevronRight className={theme.combine('w-4 h-4 group-hover:opacity-100', theme.textMuted)} />
                </button>
              ))}
            </div>

            {/* User Section in Sidebar */}
            {user && (
              <div className={theme.combine('mt-8 pt-6 border-t', theme.border)}>
                <div className="space-y-1">
                  <Link 
                    href="/profile" 
                    className={theme.combine('flex items-center justify-between px-4 py-3 rounded-lg transition-colors hover:opacity-90', theme.text)}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span>My Profile</span>
                    <ChevronRight className={theme.combine('w-4 h-4', theme.textMuted)} />
                  </Link>
                  <Link 
                    href="/orders" 
                    className={theme.combine('flex items-center justify-between px-4 py-3 rounded-lg transition-colors hover:opacity-90', theme.text)}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <span>My Orders</span>
                    <ChevronRight className={theme.combine('w-4 h-4', theme.textMuted)} />
                  </Link>
                </div>
              </div>
            )}
          </nav>

          {/* Sidebar Footer */}
          {user && (
            <div className={theme.combine('p-6 border-t', theme.border)}>
              <button
                onClick={() => {
                  handleLogout();
                  setSidebarOpen(false);
                }}
                className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors font-medium"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
