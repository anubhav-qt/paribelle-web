'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search, Heart } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { useTranslations, useLocale } from 'next-intl';
import LocationFilter from '@/components/LocationFilter';
import ThemeToggle from '@/components/ThemeToggle';
import { useSettings } from '@/hooks/useSettings';

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
  searchPlaceholder,
  initialSearchQuery = ''
}: HeaderProps) {
  const router = useRouter();
  const { totalItems } = useCart();
  const { totalItems: wishlistCount } = useWishlist();
  const t = useTranslations('header');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [user, setUser] = useState<any>(null);
  const { data: settings } = useSettings();
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [cityId, setCityId] = useState<string>('');
  const [subLocationId, setSubLocationId] = useState<string>('');
  
  const marketplaceLogo = settings?.logo || '';
  const marketplaceName = settings?.name || 'Marketplace';
  const locationFilterEnabled = showLocationFilter && (settings?.locationEnabled || false);
  
  const placeholder = searchPlaceholder || t('searchPlaceholder');

  useEffect(() => {
    // Check for user
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error('Error parsing user data:', err);
      }
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      // Always redirect to home page with search query
      if (searchQuery.trim()) {
        router.push(`/${locale}?search=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        router.push(`/${locale}`);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push(`/${locale}`);
  };

  return (
    <header className="sticky top-0 z-40 shadow-md bg-card">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <Link href={`/${locale}`} className="flex items-center">
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
                    parent.innerHTML = `<span class="text-2xl font-bold text-primary">${marketplaceName}</span>`;
                  }
                }}
              />
            ) : (
              <span className="text-xl font-bold text-foreground">{marketplaceName}</span>
            )}
          </Link>
          
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl mx-8 gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={placeholder}
                className="w-full px-4 py-2 pl-10 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            </div>
            
            {/* Location Filter */}
            {showLocationFilter && locationFilterEnabled && (
              <div className="flex-shrink-0">
                <LocationFilter 
                  onFilterChange={(newCityId, newSubLocationId) => {
                    setCityId(newCityId || '');
                    setSubLocationId(newSubLocationId || '');
                    
                    // Update URL with location parameters
                    const params = new URLSearchParams(window.location.search);
                    if (newCityId) {
                      params.set('cityId', newCityId);
                    } else {
                      params.delete('cityId');
                    }
                    if (newSubLocationId) {
                      params.set('subLocationId', newSubLocationId);
                    } else {
                      params.delete('subLocationId');
                    }
                    
                    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
                    router.push(newUrl);
                  }}
                />
              </div>
            )}
          </form>

          <div className="flex gap-4 items-center">
            {showBookingsLink && (
              <Link 
                href={`/${locale}/search?type=booking`}
                className="text-sm hover:text-primary transition-colors font-normal whitespace-nowrap text-foreground"
              >
                {t('bookings', { default: 'Bookings & Services' })}
              </Link>
            )}
            <ThemeToggle />
            <Link 
              href={`/${locale}/wishlist`}
              className="relative hover:text-primary transition-colors text-foreground"
              aria-label="Wishlist"
            >
              <Heart className={`w-6 h-6 ${
                wishlistCount > 0 ? 'fill-red-600 text-red-600' : ''
              }`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link 
              href={`/${locale}/cart`}
              className="relative hover:text-primary transition-colors text-foreground"
              aria-label={tCommon('cart')}
            >
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
                  href={`/${locale}/dashboard`}
                  className="px-2 py-1 text-sm hover:text-primary transition-colors font-normal text-foreground"
                >
                  {user.firstName || user.email}
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-2 py-1 text-sm font-normal hover:text-primary rounded transition-colors text-foreground"
                >
                  {t('logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  href={`/${locale}/login`}
                  className="px-2 py-1 text-sm border border-border hover:border-primary hover:text-primary rounded transition-all font-normal text-foreground"
                >
                  {t('login')}
                </Link>
                <Link
                  href={`/${locale}/signup`}
                  className="px-3 py-1 text-sm bg-primary text-primary-foreground font-normal hover:opacity-90 rounded transition-colors"
                >
                  {t('signup')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
