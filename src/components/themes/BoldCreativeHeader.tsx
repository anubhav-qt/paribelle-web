'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Heart, User, Menu, X, ChevronDown, Search as SearchIcon } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useVendorContext } from '@/contexts/VendorContext';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import SearchWithSuggestions from '@/components/SearchWithSuggestions';

export default function BoldCreativeHeader() {
  const router = useRouter();
  const { totalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const { vendor, isVendorStore } = useVendorContext();
  const theme = useThemeClasses();
  const [user, setUser] = useState<any>(null);
  const [marketplaceLogo, setMarketplaceLogo] = useState<string>('');
  const [marketplaceName, setMarketplaceName] = useState<string>('GaliCart');
  const [menuOpen, setMenuOpen] = useState(false);
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
    <header className={isVendorStore ? 'vendor-primary-bg text-white py-12 relative overflow-hidden' : 'bg-primary text-primary-foreground py-12 relative overflow-hidden'}>
      {/* Decorative circles */}
      <div className={isVendorStore ? 'vendor-secondary-bg absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl' : 'bg-accent absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl'}></div>
      <div className={isVendorStore ? 'vendor-secondary-bg absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-20 blur-3xl' : 'bg-accent absolute bottom-0 left-0 w-96 h-96 rounded-full opacity-20 blur-3xl'}></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Top Actions */}
        <div className="flex justify-end mb-8 space-x-6">
          <Link href="/wishlist" className="relative hover:scale-125 transition-transform duration-300">
            <Heart className="w-6 h-6" fill="white" />
            {wishlistCount > 0 && (
              <span className="absolute -top-3 -right-3 bg-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
                {wishlistCount}
              </span>
            )}
          </Link>
          <Link href="/cart" className="relative hover:scale-125 transition-transform duration-300">
            <ShoppingCart className="w-6 h-6" />
            {totalItems > 0 && (
              <span className="absolute -top-3 -right-3 bg-pink-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold shadow-lg">
                {totalItems}
              </span>
            )}
          </Link>
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-1 hover:scale-125 transition-transform duration-300"
              >
                <User className="w-6 h-6" />
                <span className="text-sm font-medium">{user.firstName || user.email?.split('@')[0]}</span>
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
          ) : (
            <Link href="/login" className="text-sm font-bold hover:underline uppercase tracking-wide">
              Login
            </Link>
          )}
        </div>

        {/* Large Centered Logo */}
        <div className="flex flex-col items-center space-y-6">
          <Link href="/" className="flex flex-col items-center">
            {isVendorStore && vendor?.logo ? (
              <img 
                src={`${process.env.NEXT_PUBLIC_API_URL}${vendor.logo}`} 
                alt={vendor.businessName}
                className="h-24 w-24 rounded-full object-cover mb-4 ring-8 ring-white/30 shadow-2xl"
              />
            ) : !isVendorStore && marketplaceLogo ? (
              <img 
                src={marketplaceLogo.startsWith('http') ? marketplaceLogo : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${marketplaceLogo}`} 
                alt={marketplaceName}
                className="h-24 object-contain mb-4 drop-shadow-2xl"
              />
            ) : null}
            <h1 className="text-5xl font-black tracking-tight drop-shadow-lg">
              {isVendorStore ? vendor?.businessName : marketplaceName}
            </h1>
            <p className="text-purple-100 mt-2 text-lg font-medium">✨ Discover Amazing Products ✨</p>
          </Link>

          {/* Search Bar - Wide and Prominent */}
          <div className="w-full max-w-3xl mt-6">
            <SearchWithSuggestions
              placeholder="What are you looking for today?"
              onSearch={(query) => router.push(`/search?q=${query}`)}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
