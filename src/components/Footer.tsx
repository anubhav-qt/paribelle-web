'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Store } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useVendorContext } from '@/contexts/VendorContext';
import { useThemeClasses } from '@/hooks/useThemeClasses';
import { useCategories } from '@/hooks/useCategories';

interface FooterProps {
  categories?: Array<{ id: string; name: string; slug: string }>;
  marketplaceName?: string;
}

export default function Footer({ categories = [], marketplaceName = 'GaliCart' }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();
  const { isVendorStore, vendor } = useVendorContext();
  const theme = useThemeClasses();
  
  // Use the same category filtering as CategoryNav - only show categories with products
  const { data: vendorCategories = [] } = useCategories({
    vendorId: vendor?.id,
    hideEmptyCategories: true, // Only show categories with products or booking services
  });

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

  return (
    <footer className="mt-12">
      <div className={theme.combine(
        '',
        isVendorStore ? 'vendor-footer-bg' : 'bg-secondary text-secondary-foreground'
      )}>
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* About Section */}
            <div>
            <h3 className="text-xl font-bold mb-4">{marketplaceName}</h3>
            <p className="text-sm mb-4 opacity-90">
              Your one-stop destination for quality products from trusted vendors across multiple categories.
            </p>
            <div className="flex gap-3">
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
            </div>
          </div>

          {/* Shop Categories */}
          {displayCategories.length > 0 && (
            <div>
              <h4 className="font-semibold mb-4 text-lg">Shop by Category</h4>
              <ul className="space-y-2 text-sm opacity-90">
                {displayCategories.slice(0, 6).map(cat => (
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

          {/* Customer Support */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">
              {isVendorStore ? 'Store Info' : 'Help Center'}
            </h4>
            <ul className="space-y-2 text-sm opacity-90">
              {isVendorStore ? (
                <>
                  <li><FooterLink href="/about">About Us</FooterLink></li>
                  <li><FooterLink href="/contact">Contact Store</FooterLink></li>
                  <li><FooterLink href="/shipping">Shipping Policy</FooterLink></li>
                  <li><FooterLink href="/returns">Return Policy</FooterLink></li>
                </>
              ) : (
                <>
                  <li><FooterLink href="/help">Help Center</FooterLink></li>
                  <li><FooterLink href="/contact">Contact Us</FooterLink></li>
                  <li><FooterLink href="/shipping">Shipping Info</FooterLink></li>
                  <li><FooterLink href="/returns">Returns</FooterLink></li>
                  <li><FooterLink href="/faq">FAQ</FooterLink></li>
                  <li><FooterLink href="/track-order">Track Your Order</FooterLink></li>
                </>
              )}
            </ul>
          </div>

          {/* Account & Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-lg">
              {isVendorStore ? 'Customer Account' : 'My Account'}
            </h4>
            <ul className="space-y-2 text-sm mb-6 opacity-90">
              <li><FooterLink href="/login">Login / Register</FooterLink></li>
              <li><FooterLink href="/dashboard">My Dashboard</FooterLink></li>
              <li><FooterLink href="/orders">Order History</FooterLink></li>
              <li><FooterLink href="/wishlist">My Wishlist</FooterLink></li>
            </ul>

            {isVendorStore && vendor && (
              <div className="space-y-2 text-sm opacity-90">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4" />
                  <span className="font-semibold">{vendor.businessName}</span>
                </div>
                {vendor.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <FooterLink href={`mailto:${vendor.contactEmail}`}>
                      {vendor.contactEmail}
                    </FooterLink>
                  </div>
                )}
                {vendor.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    <span>{vendor.contactPhone}</span>
                  </div>
                )}
              </div>
            )}

            {!isVendorStore && (
              <div className="space-y-2 text-sm">
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
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={theme.combine(
          'mt-8 pt-8 border-t',
          isVendorStore ? 'vendor-border-primary' : ''
        )}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-center text-sm opacity-90">
              © {currentYear} {marketplaceName}. All rights reserved.
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

