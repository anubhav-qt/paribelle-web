'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

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
  const { totalItems } = useCart();
  const [user, setUser] = useState<any>(null);
  const [vendor, setVendor] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);

  useEffect(() => {
    // Fetch vendor data
    fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/vendors/slug/${vendorSlug}`)
      .then(res => res.json())
      .then(data => setVendor(data))
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

  return (
    <header className="sticky top-0 z-40 bg-[#232f3e] shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href={`/vendor/${vendorSlug}`} className="flex items-center gap-4">
            {vendor?.logo && (
              <img 
                src={vendor.logo} 
                alt={vendor.businessName}
                className="h-12 w-12 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">
                {vendor?.businessName || 'Store'}
              </h1>
              <p className="text-xs text-white">Official Store</p>
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
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </form>
          </div>

          <div className="flex gap-4 items-center">
            <Link href={`/vendor/${vendorSlug}/cart`} className="relative text-white hover:text-[#f90] transition-colors">
              <ShoppingCart className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
            <Link href="http://localhost:3000" className="text-sm text-white px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors">
              All Vendors
            </Link>
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-white hover:text-[#f90] transition-colors font-medium"
                >
                  {user.firstName || user.email}
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-white font-medium hover:text-[#f90] rounded transition-colors"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
