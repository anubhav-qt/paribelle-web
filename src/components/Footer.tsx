'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Store, Youtube } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useVendorContext } from '@/contexts/VendorContext';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { useCategories } from '@/hooks/useCategories';

interface FooterProps {
  categories?: Array<{ id: string; name: string; slug: string }>;
  marketplaceName?: string;
}

interface FooterLink {
  label: string;
  url: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
  enabled: boolean;
}

interface FooterSettings {
  aboutText: string;
  socialLinks: any[];
  customSections: FooterSection[];
  contactInfo: {
    phone: string;
    email: string;
    address: string;
  };
  copyrightText: string;
  showCategories: boolean;
  maxCategoriesDisplay: number;
}

export default function Footer({ categories = [], marketplaceName = 'GaliCart' }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const { isVendorStore, vendor } = useVendorContext();
  const theme = useThemeClasses();
  const [footerSettings, setFooterSettings] = useState<FooterSettings | null>(null);
  
  // Use the same category filtering as CategoryNav - only show categories with products
  const { data: vendorCategories = [] } = useCategories({
    vendorId: vendor?.id,
    hideEmptyCategories: true, // Only show categories with products or booking services
  });

  // Fetch footer settings
  useEffect(() => {
    const fetchFooterSettings = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/footer-settings`);
        if (response.ok) {
          const data = await response.json();
          console.log('📥 Footer settings received:', {
            customSectionsCount: data.customSections?.length,
            customSections: data.customSections,
            socialLinksCount: data.socialLinks?.length,
          });
          setFooterSettings(data);
        }
      } catch (error) {
        console.error('Error fetching footer settings:', error);
      }
    };

    // Only fetch for main marketplace, not vendor stores
    if (!isVendorStore) {
      fetchFooterSettings();
    }
  }, [isVendorStore]);

  // Extract only parent categories (top-level) for footer display
  const parentCategories = vendorCategories.map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug
  }));

  // On vendor store, only show vendor categories (don't fall back to marketplace categories)
  const displayCategories = isVendorStore ? parentCategories : categories;

  console.log('🔴 Footer displayCategories:', { 
    isVendorStore, 
    vendorCategoriesCount: vendorCategories.length, 
    categoriesCount: categories.length,
    displayCount: displayCategories.length 
  });

  const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link 
      href={href}
      className="transition-colors hover:opacity-80"
    >
      {children}
    </Link>
  );

  // Calculate number of columns needed
  const columnCount = (
    1 + // About section
    (displayCategories.length > 0 && footerSettings?.showCategories !== false ? 1 : 0) + // Categories
    (footerSettings?.customSections?.filter(s => s.enabled).length || 0) + // Custom sections
    (!isVendorStore && footerSettings ? 1 : 0) + // Contact section
    (isVendorStore && vendor ? 2 : 0) // Vendor sections
  );

  const gridClass = columnCount <= 2 ? 'lg:grid-cols-2' : 
                    columnCount === 3 ? 'lg:grid-cols-3' : 
                    columnCount === 4 ? 'lg:grid-cols-4' : 
                    'lg:grid-cols-5';

  console.log('🔵 Footer render:', { 
    columnCount, 
    gridClass,
    isVendorStore,
    hasFooterSettings: !!footerSettings,
    customSectionsCount: footerSettings?.customSections?.length 
  });

  return (
    <footer className="mt-12">
      <div className={theme.combine(
        '',
        isVendorStore ? 'vendor-footer-bg' : 'bg-secondary text-secondary-foreground'
      )}>
        <div className="container mx-auto px-4 py-12">
          <div className={`grid grid-cols-1 md:grid-cols-2 ${gridClass} gap-8`}>
            {/* About Section */}
            <div>
            <h3 className="text-xl font-bold mb-4">{marketplaceName}</h3>
            <p className="text-sm mb-4 opacity-90">
              {!isVendorStore && footerSettings ? footerSettings.aboutText : 
                'Your one-stop destination for quality products from trusted vendors across multiple categories.'}
            </p>
            <div className="flex gap-3">
              {!isVendorStore && footerSettings ? (
                footerSettings.socialLinks.filter(link => link.enabled).map((link, idx) => {
                  const icons = { facebook: Facebook, twitter: Twitter, instagram: Instagram, linkedin: Linkedin, youtube: Youtube };
                  const Icon = icons[link.platform as keyof typeof icons] || Facebook;
                  return (
                    <a key={idx} href={link.url} target="_blank" rel="noopener noreferrer" 
                       className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                      <Icon className="w-4 h-4" />
                    </a>
                  );
                })
              ) : (
                <>
                  <a href="#" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                    <Facebook className="w-4 h-4" />
                  </a>
                  <a href="#" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                    <Twitter className="w-4 h-4" />
                  </a>
                  <a href="#" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a href="#" className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </a>
                </>
              )}
            </div>
          </div>

          {/* Shop Categories */}
          {displayCategories.length > 0 && footerSettings?.showCategories !== false && (
            <div>
              <h4 className="font-semibold mb-4 text-lg">Shop by Category</h4>
              <ul className="space-y-2 text-sm opacity-90">
                {displayCategories.slice(0, footerSettings?.maxCategoriesDisplay || 6).map(cat => (
                  <li key={cat.id}>
                    <Link 
                      href={`/#category-${cat.slug}`}
                      className="transition-colors hover:opacity-80"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
                {displayCategories.length > 6 && (
                  <li>
                    <Link 
                      href="/#categories"
                      className="hover:underline transition-colors"
                    >
                      View All Categories →
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Custom Sections from Admin */}
          {!isVendorStore && footerSettings && footerSettings.customSections
            .filter(section => section.enabled)
            .map((section, idx) => {
              console.log(`🔸 Rendering section ${idx}:`, section.title, `with ${section.links?.length || 0} links`);
              return (
                <div key={idx}>
                  <h4 className="font-semibold mb-4 text-lg">{section.title}</h4>
                  <ul className="space-y-2 text-sm opacity-90">
                    {section.links && section.links.length > 0 ? (
                      section.links.map((link, linkIdx) => (
                        <li key={linkIdx}>
                          <FooterLink href={link.url}>{link.label}</FooterLink>
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-400 italic">No links configured</li>
                    )}
                  </ul>
                </div>
              );
            })
          }

          {/* Vendor Store - Hardcoded Sections */}
          {isVendorStore && (
            <>
              <div>
                <h4 className="font-semibold mb-4 text-lg">Store Info</h4>
                <ul className="space-y-2 text-sm opacity-90">
                  <li><FooterLink href="/about">About Us</FooterLink></li>
                  <li><FooterLink href="/contact">Contact Store</FooterLink></li>
                  <li><FooterLink href="/shipping">Shipping Policy</FooterLink></li>
                  <li><FooterLink href="/returns">Return Policy</FooterLink></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4 text-lg">Customer Account</h4>
                <ul className="space-y-2 text-sm mb-6 opacity-90">
                  <li><FooterLink href="/login">Login / Register</FooterLink></li>
                  <li><FooterLink href="/dashboard">My Dashboard</FooterLink></li>
                  <li><FooterLink href="/orders">Order History</FooterLink></li>
                  <li><FooterLink href="/wishlist">My Wishlist</FooterLink></li>
                </ul>
              </div>
            </>
          )}

          {/* Contact Info Section */}
          {!isVendorStore && footerSettings && (
            <div>
              <h4 className="font-semibold mb-4 text-lg">Contact Us</h4>
              <div className="space-y-2 text-sm opacity-90">
                {footerSettings.contactInfo.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{footerSettings.contactInfo.phone}</span>
                  </div>
                )}
                {footerSettings.contactInfo.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <FooterLink href={`mailto:${footerSettings.contactInfo.email}`}>
                      {footerSettings.contactInfo.email}
                    </FooterLink>
                  </div>
                )}
                {footerSettings.contactInfo.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-0.5" />
                    <span style={{ whiteSpace: 'pre-line' }}>{footerSettings.contactInfo.address}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vendor Contact */}
          {isVendorStore && vendor && (
            <div>
              <h4 className="font-semibold mb-4 text-lg">Store Contact</h4>
              <div className="space-y-2 text-sm opacity-90">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  <span className="font-semibold">{vendor.businessName}</span>
                </div>
                {/* Contact details can be added to vendor interface if needed */}
              </div>
            </div>
          )}

          {/* Default Contact for Non-Vendor without Settings */}
          {!isVendorStore && !footerSettings && (
            <div>
              <h4 className="font-semibold mb-4 text-lg">Contact Us</h4>
              <div className="space-y-2 text-sm opacity-90">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <span>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <FooterLink href="mailto:support@marketplace.com">
                    support@marketplace.com
                  </FooterLink>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <span>123 Market Street<br />City, State 12345</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className={theme.combine(
          'mt-8 pt-8 border-t',
          isVendorStore ? 'vendor-border-primary' : ''
        )}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-center text-sm opacity-90">
              © {currentYear} {marketplaceName}. {footerSettings?.copyrightText || 'All rights reserved.'}
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm opacity-90">
              <FooterLink href="/privacy-policy">Privacy Policy</FooterLink>
              <span>•</span>
              <FooterLink href="/terms-of-service">Terms of Service</FooterLink>
              <span>•</span>
              <FooterLink href="/cookie-policy">Cookie Policy</FooterLink>
              <span>•</span>
              <FooterLink href="/vendor-registration">Become a Vendor</FooterLink>
            </div>
          </div>
        </div>
      </div>
      </div>
    </footer>
  );
}

