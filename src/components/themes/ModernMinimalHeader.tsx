'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search, Heart, User, Menu, X, ChevronDown } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useVendorContext } from '@/contexts/VendorContext';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import SearchWithSuggestions from '@/components/SearchWithSuggestions';
import { clearAuth } from '@/lib/auth';

export default function ModernMinimalHeader() {
  const router = useRouter();
  const { totalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const { vendor, isVendorStore } = useVendorContext();
  const theme = useThemeClasses();
  const [user, setUser] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [marketplaceLogo, setMarketplaceLogo] = useState<string>('');
  const [marketplaceName, setMarketplaceName] = useState<string>('GaliCart');
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        .then(data => {
          console.log('📸 Fetched marketplace logo:', data);
          setMarketplaceLogo(data.value || '');
        })
        .catch(err => console.error('Failed to fetch logo:', err));
      
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/marketplace_name`)
        .then(res => res.json())
        .then(data => {
          console.log('🏷️ Fetched marketplace name:', data);
          setMarketplaceName(data.value || 'GaliCart');
        })
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
    <header className={isVendorStore ? 'vendor-primary-bg vendor-border-primary border-b py-6' : 'bg-primary text-primary-foreground border-b py-6'}>
      <div className="container mx-auto px-4">
        {/* Centered Layout */}
        <div className="flex flex-col items-center space-y-4">
          {/* Logo - Centered */}
          <Link href="/" className="flex flex-col items-center">
            {isVendorStore && vendor?.logo ? (
              <img 
                src={`${process.env.NEXT_PUBLIC_API_URL}${vendor.logo}`} 
                alt={vendor.businessName}
                className="h-12 w-12 rounded-full object-cover mb-2"
              />
            ) : !isVendorStore && marketplaceLogo ? (
              <img 
                src={marketplaceLogo.startsWith('http') ? marketplaceLogo : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${marketplaceLogo}`} 
                alt={marketplaceName}
                className="h-12 object-contain mb-2"
                onError={(e) => {
                  console.error('❌ Logo failed to load:', marketplaceLogo);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                onLoad={() => {
                  console.log('✅ Logo loaded successfully:', marketplaceLogo);
                }}
              />
            ) : null}
            <h1 className={isVendorStore ? theme.text + ' text-2xl font-light tracking-wide' : 'text-primary-foreground text-2xl font-light tracking-wide'}>
              {isVendorStore ? vendor?.businessName : marketplaceName}
            </h1>
          </Link>

          {/* Search Bar - Centered, Wide */}
          <div className="w-full max-w-2xl">
            <SearchWithSuggestions
              placeholder="Search products..."
              onSearch={(query) => router.push(`/search?q=${query}`)}
            />
          </div>

          {/* Actions - Centered */}
          <div className="flex items-center space-x-6">
            <Link href="/wishlist" className="relative group">
              <Heart className={isVendorStore ? theme.combine('w-5 h-5 transition-colors', theme.text, 'group-hover:opacity-70') : 'w-5 h-5 text-primary-foreground transition-colors hover:opacity-70'} />
              {wishlistCount > 0 && (
                <span className={isVendorStore ? theme.combine('absolute -top-2 -right-2 text-xs rounded-full w-5 h-5 flex items-center justify-center vendor-primary-bg vendor-primary-text') : 'absolute -top-2 -right-2 text-xs rounded-full w-5 h-5 flex items-center justify-center bg-secondary text-secondary-foreground'}>
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link href="/cart" className="relative group">
              <ShoppingCart className={isVendorStore ? theme.combine('w-5 h-5 transition-colors', theme.text, 'group-hover:opacity-70') : 'w-5 h-5 text-primary-foreground transition-colors hover:opacity-70'} />
              {totalItems > 0 && (
                <span className={isVendorStore ? theme.combine('absolute -top-2 -right-2 text-xs rounded-full w-5 h-5 flex items-center justify-center vendor-primary-bg vendor-primary-text') : 'absolute -top-2 -right-2 text-xs rounded-full w-5 h-5 flex items-center justify-center bg-secondary text-secondary-foreground'}>
                  {totalItems}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className={isVendorStore ? theme.combine('flex items-center space-x-1 transition-colors hover:opacity-70', theme.text) : 'flex items-center space-x-1 text-primary-foreground transition-colors hover:opacity-70'}
                >
                  <User className="w-5 h-5" />
                  <span className="text-sm">{user.firstName || user.email?.split('@')[0]}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-100">
                    {user?.role === 'super_admin' && (
                      <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">
                        Admin Dashboard
                      </Link>
                    )}
                    {user?.role === 'vendor_admin' && (
                      <Link href="/vendor/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">
                        Vendor Dashboard
                      </Link>
                    )}
                    <Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      My Profile
                    </Link>
                    <Link href="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      My Orders
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/login" className={isVendorStore ? theme.combine('text-sm transition-colors hover:opacity-70', theme.text) : 'text-sm text-primary-foreground transition-colors hover:opacity-70'}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
