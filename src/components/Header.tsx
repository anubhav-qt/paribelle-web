'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Search } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useTranslations, useLocale } from 'next-intl';
import LocationFilter from '@/components/LocationFilter';
import ThemeToggle from '@/components/ThemeToggle';

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
  const t = useTranslations('header');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [user, setUser] = useState<any>(null);
  const [marketplaceLogo, setMarketplaceLogo] = useState<string>('');
  const [marketplaceName, setMarketplaceName] = useState<string>('Marketplace');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [cityId, setCityId] = useState<string>('');
  const [subLocationId, setSubLocationId] = useState<string>('');
  const [locationFilterEnabled, setLocationFilterEnabled] = useState(false);
  
  const placeholder = searchPlaceholder || t('searchPlaceholder');

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
        router.push(`/${locale}/search?q=${encodeURIComponent(searchQuery.trim())}`);
      } else {
        router.push(`/${locale}/search`);
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
