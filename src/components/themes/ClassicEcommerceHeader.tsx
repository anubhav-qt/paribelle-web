'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search, Heart, User, Menu, ChevronDown } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useVendorContext } from '@/contexts/VendorContext';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import SearchWithSuggestions from '@/components/SearchWithSuggestions';

export default function ClassicEcommerceHeader() {
  const router = useRouter();
  const { totalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const { vendor, isVendorStore } = useVendorContext();
  const theme = useThemeClasses();
  const [user, setUser] = useState<any>(null);
  const [marketplaceLogo, setMarketplaceLogo] = useState<string>('');
  const [marketplaceName, setMarketplaceName] = useState<string>('GaliCart');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) setUser(JSON.parse(userStr));
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowDropdown(false);
    router.push('/login');
  };

  return (
    <header className={isVendorStore ? 'vendor-secondary-bg text-white shadow-lg' : 'bg-secondary text-secondary-foreground shadow-lg'}>
      {/* Top Bar - Distinctive feature */}
      <div className={isVendorStore ? 'vendor-primary-bg py-2 text-white' : 'bg-primary text-primary-foreground py-2'}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center text-sm text-slate-900 font-medium">
            <div>
              🔥 Welcome to {isVendorStore ? vendor?.businessName : marketplaceName} - Free Shipping on Orders Over ₹500!
            </div>
            <div className="flex space-x-4">
              {user ? (
                <Link href="/profile" className="hover:opacity-70 transition-colors">
                  My Account
                </Link>
              ) : (
                <>
                  <Link href="/login" className="hover:opacity-70 transition-colors">Sign In</Link>
                  <Link href="/signup" className="hover:opacity-70 transition-colors">Register</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="py-4 border-b border-slate-700">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            {/* Logo - Left */}
            <Link href="/" className="flex items-center space-x-3">
              {isVendorStore && vendor?.logo ? (
                <img 
                  src={`${process.env.NEXT_PUBLIC_API_URL}${vendor.logo}`} 
                  alt={vendor.businessName}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : !isVendorStore && marketplaceLogo ? (
                <img 
                  src={marketplaceLogo.startsWith('http') ? marketplaceLogo : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${marketplaceLogo}`} 
                  alt={marketplaceName}
                  className="h-10 object-contain"
                />
              ) : null}
              <span className="text-2xl font-bold">
                {isVendorStore ? vendor?.businessName : marketplaceName}
              </span>
            </Link>

            {/* Search Bar - Center */}
            <div className="flex-1 max-w-2xl mx-8">
              <SearchWithSuggestions
                placeholder="Search for products..."
                onSearch={(query) => router.push(`/search?q=${query}`)}
              />
            </div>

            {/* Actions - Right */}
            <div className="flex items-center space-x-6">
              <Link href="/wishlist" className="relative hover:opacity-70 transition-colors">
                <Heart className="w-6 h-6" />
                {wishlistCount > 0 && (
                  <span className={theme.combine('absolute -top-2 -right-2 text-xs rounded-full w-5 h-5 flex items-center justify-center', isVendorStore ? 'vendor-primary-bg vendor-primary-text' : 'bg-amber-500 text-white')}>
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link href="/cart" className="relative hover:opacity-70 transition-colors">
                <ShoppingCart className="w-6 h-6" />
                {totalItems > 0 && (
                  <span className={theme.combine('absolute -top-2 -right-2 text-xs rounded-full w-5 h-5 flex items-center justify-center', isVendorStore ? 'vendor-primary-bg vendor-primary-text' : 'bg-amber-500 text-white')}>
                    {totalItems}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-1 hover:opacity-70 transition-colors"
                  >
                    <User className="w-6 h-6" />
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-100">
                      {user?.role === 'super_admin' && (<Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">Admin Dashboard</Link>)}{user?.role === 'vendor_admin' && (<Link href="/vendor/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">Vendor Dashboard</Link>)}<Link href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
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
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
