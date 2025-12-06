'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import LocationFilter from '@/components/LocationFilter';

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
  searchPlaceholder = "Search for products, brands and more",
  initialSearchQuery = ''
}: HeaderProps) {
  const router = useRouter();
  const { totalItems } = useCart();
  const [user, setUser] = useState<any>(null);
  const [marketplaceLogo, setMarketplaceLogo] = useState<string>('');
  const [marketplaceName, setMarketplaceName] = useState<string>('Marketplace');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [cityId, setCityId] = useState<string>('');
  const [subLocationId, setSubLocationId] = useState<string>('');
  const [locationFilterEnabled, setLocationFilterEnabled] = useState(false);

  useEffect(() => {
    // Fetch marketplace branding
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/settings/marketplace_logo`)
      .then(res => res.json())
      .then(data => setMarketplaceLogo(data.value || ''))
      .catch(err => console.error('Error fetching marketplace logo:', err));
    
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/settings/marketplace_name`)
      .then(res => res.json())
      .then(data => setMarketplaceName(data.value || 'Marketplace'))
      .catch(err => console.error('Error fetching marketplace name:', err));

    // Check location filter setting
    if (showLocationFilter) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/settings/location_filter_enabled`)
        .then(res => res.json())
        .then(data => setLocationFilterEnabled(data.value === true || data.value === 'true'))
        .catch(err => console.error('Error fetching location filter setting:', err));
    }

    // Check for user
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, [showLocationFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      if (searchQuery.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        router.push('/search');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-[#131921] shadow-md">
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
                    parent.innerHTML = `<span class="text-2xl font-bold text-blue-600">${marketplaceName}</span>`;
                  }
                }}
              />
            ) : (
              <span className="text-xl font-bold text-white">{marketplaceName}</span>
            )}
          </Link>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-8 gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600" />
            </div>
            
            {/* Location Filter */}
            {showLocationFilter && locationFilterEnabled && (
              <div className="flex-shrink-0">
                <LocationFilter 
                  onFilterChange={(newCityId, newSubLocationId) => {
                    setCityId(newCityId || '');
                    setSubLocationId(newSubLocationId || '');
                  }}
                />
              </div>
            )}
          </form>

          <div className="flex gap-4 items-center">
            {showBookingsLink && (
              <Link href="/search?type=booking" className="text-sm text-white hover:text-[#f90] transition-colors font-normal whitespace-nowrap">
                Bookings & Services
              </Link>
            )}
            <Link href="/cart" className="relative text-white hover:text-[#f90] transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-2 py-1 text-sm text-white hover:text-[#f90] transition-colors font-normal"
                >
                  {user.firstName || user.email}
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-2 py-1 text-sm text-white font-normal hover:text-[#f90] rounded transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-2 py-1 text-sm text-white hover:text-[#f90] border border-gray-600 hover:border-[#f90] rounded transition-colors font-normal"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="px-3 py-1 text-sm bg-[#f90] text-[#0F1111] font-normal hover:bg-[#ff9f3d] rounded transition-colors"
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
