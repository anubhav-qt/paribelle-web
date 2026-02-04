'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Heart, User, ChevronDown, Crown } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useVendorContext } from '@/contexts/VendorContext';
import { useCategories } from '@/hooks/useCategories';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import SearchWithSuggestions from '@/components/SearchWithSuggestions';
import { clearAuth } from '@/lib/auth';

export default function LuxuryBoutiqueHeader() {
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
    <header className={isVendorStore ? 'vendor-secondary-bg text-white' : 'bg-secondary text-secondary-foreground'}>
      {/* Elegant Top Bar - Gold Accent */}
      <div className={isVendorStore ? 'vendor-primary-bg py-1 text-white' : 'bg-primary text-primary-foreground py-1'}>
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center text-xs font-medium tracking-widest">
            <Crown className="w-3 h-3 mr-2" />
            Experience Luxury Like Never Before
            <Crown className="w-3 h-3 ml-2" />
          </div>
        </div>
      </div>

      {/* Main Header - Elegant Black Background */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-8">
          {/* Top Row - Logo Centered */}
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex flex-col items-center group">
              {isVendorStore && vendor?.logo ? (
                <img 
                  src={`${process.env.NEXT_PUBLIC_API_URL}${vendor.logo}`} 
                  alt={vendor.businessName}
                  className="h-16 w-16 rounded-full object-cover mb-3 ring-2 ring-amber-500/50 group-hover:ring-amber-500 transition-all"
                />
              ) : !isVendorStore && marketplaceLogo ? (
                <img 
                  src={marketplaceLogo.startsWith('http') ? marketplaceLogo : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}${marketplaceLogo}`} 
                  alt={marketplaceName}
                  className="h-16 object-contain mb-3 drop-shadow-lg"
                />
              ) : null}
              <h1 className="text-3xl font-serif tracking-[0.3em] text-white mb-1">
                {isVendorStore ? vendor?.businessName?.toUpperCase() : marketplaceName.toUpperCase()}
              </h1>
              <div className="h-px w-32 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
            </Link>
          </div>

          {/* Middle Row - Navigation Links */}
          <nav className="flex justify-center items-center space-x-12 mb-6 text-sm tracking-widest">
            {categories.slice(0, 6).map((category: any) => (
              <button
                key={category.id}
                onClick={(e) => {
                  e.preventDefault();
                  
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
                className="hover:text-amber-500 transition-colors uppercase"
              >
                {category.name}
              </button>
            ))}
          </nav>

          {/* Bottom Row - Search and Actions */}
          <div className="flex items-center justify-between">
            {/* Left Spacer */}
            <div className="w-48"></div>

            {/* Center - Search */}
            <div className="flex-1 max-w-xl">
              <SearchWithSuggestions
                placeholder="Search luxury items..."
                onSearch={(query) => router.push(`/search?q=${query}`)}
              />
            </div>

            {/* Right - Actions */}
            <div className="w-48 flex items-center justify-end space-x-6">
              <Link href="/wishlist" className="relative group">
                <Heart className="w-5 h-5 text-white group-hover:text-amber-500 transition-colors" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              <Link href="/cart" className="relative group">
                <ShoppingCart className="w-5 h-5 text-white group-hover:text-amber-500 transition-colors" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-amber-500 text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Link>

              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-1 text-white hover:text-amber-500 transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span className="text-sm font-light tracking-wide">{user.firstName || user.email?.split('@')[0]}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl py-2 z-50">
                      {user?.role === 'super_admin' && (<Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">Admin Dashboard</Link>)}{user?.role === 'vendor_admin' && (<Link href="/vendor/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium">Vendor Dashboard</Link>)}<Link href="/profile" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
                        My Profile
                      </Link>
                      <Link href="/orders" className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white">
                        My Orders
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left block px-4 py-2 text-sm text-amber-500 hover:bg-gray-800"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/login" className="text-sm uppercase tracking-wider hover:text-amber-500 transition-colors">
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
