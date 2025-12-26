'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface FooterProps {
  categories?: Array<{ id: string; name: string; slug: string }>;
  marketplaceName?: string;
}

export default function Footer({ categories = [], marketplaceName = 'GaliCart' }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const pathname = usePathname();

  return (
    <footer 
      className="mt-12 bg-secondary text-secondary-foreground" 
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-secondary-foreground">{marketplaceName}</h3>
            <p className="text-sm mb-4 text-secondary-foreground/80">
              Your one-stop destination for quality products from trusted vendors across multiple categories.
            </p>
            <div className="flex gap-3">
              <a href="#" className="p-2 rounded-full transition-colors bg-secondary-foreground/10 text-secondary-foreground hover:bg-primary hover:text-primary-foreground">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-full transition-colors bg-secondary-foreground/10 text-secondary-foreground hover:bg-primary hover:text-primary-foreground">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-full transition-colors bg-secondary-foreground/10 text-secondary-foreground hover:bg-primary hover:text-primary-foreground">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-full transition-colors bg-secondary-foreground/10 text-secondary-foreground hover:bg-primary hover:text-primary-foreground">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Shop Categories */}
          <div>
            <h4 className="font-semibold mb-4 text-lg text-secondary-foreground">Shop by Category</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              {categories.slice(0, 6).map(cat => (
                <li key={cat.id}>
                  <Link 
                    href={`/#category-${cat.slug}`}
                    className="hover:text-primary transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              {categories.length > 6 && (
                <li>
                  <Link 
                    href="/#categories"
                    className="text-primary hover:underline transition-colors"
                  >
                    View All Categories →
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Customer Support */}
          <div>
            <h4 className="font-semibold mb-4 text-lg text-secondary-foreground">Help Center</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/80">
              <li>
                <Link href="/help" className="hover:text-primary transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-primary transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-primary transition-colors">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="hover:text-primary transition-colors">
                  Track Your Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Account & Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-lg text-secondary-foreground">My Account</h4>
            <ul className="space-y-2 text-sm mb-6 text-secondary-foreground/80">
              <li>
                <Link href="/login" className="hover:text-primary transition-colors">
                  Login / Register
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-primary transition-colors">
                  My Dashboard
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-primary transition-colors">
                  Order History
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-primary transition-colors">
                  My Wishlist
                </Link>
              </li>
            </ul>

            <div className="space-y-2 text-sm text-secondary-foreground/80">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:support@marketplace.com" className="hover:text-primary transition-colors">
                  support@marketplace.com
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>123 Market Street<br />City, State 12345</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-secondary-foreground/20">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-center text-sm text-secondary-foreground/80">
              © {currentYear} {marketplaceName}. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-secondary-foreground/80">
              <Link href="/privacy-policy" className="hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/terms-of-service" className="hover:text-primary transition-colors">
                Terms of Service
              </Link>
              <span>•</span>
              <Link href="/cookie-policy" className="hover:text-primary transition-colors">
                Cookie Policy
              </Link>
              <span>•</span>
              <Link href="/vendor-registration" className="hover:text-primary transition-colors">
                Become a Vendor
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

