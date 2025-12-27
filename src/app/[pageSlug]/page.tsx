'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import UnifiedHeader from '@/components/UnifiedHeader';
import CategoryNav from '@/components/CategoryNav';
import Footer from '@/components/Footer';
import { useVendorContext } from '@/contexts/VendorContext';

interface VendorPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  showInNavigation: boolean;
}

export default function VendorCustomPage({ params }: { params: { pageSlug: string } }) {
  const { vendor, isVendorStore, isLoading: vendorLoading } = useVendorContext();
  const [page, setPage] = useState<VendorPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log('🟢 VendorCustomPage:', { 
    pageSlug: params.pageSlug, 
    isVendorStore, 
    hasVendor: !!vendor,
    vendorLoading,
    vendorId: vendor?.id 
  });

  useEffect(() => {
    const fetchPage = async () => {
      console.log('🟢 Fetch page useEffect:', { vendor, isVendorStore, vendorLoading });
      
      // Wait for vendor context to load
      if (vendorLoading) {
        console.log('🟢 Vendor still loading, waiting...');
        return;
      }
      
      // Only fetch if we have a vendor (i.e., on vendor subdomain)
      if (!vendor || !isVendorStore) {
        console.log('🟢 No vendor or not vendor store, setting loading false');
        setIsLoading(false);
        return;
      }

      try {
        // Fetch all pages for this vendor and find the matching slug
        const url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendor.id}/pages`;
        console.log('🟢 Fetching pages from:', url);
        
        const response = await fetch(url);

        console.log('🟢 Response status:', response.status);
        if (response.ok) {
          const pages = await response.json();
          console.log('🟢 Pages received:', pages.length);
          console.log('🟢 Looking for slug:', params.pageSlug);
          
          // Find the page with matching slug that is published
          const matchedPage = pages.find(
            (p: VendorPage) => p.slug === params.pageSlug && p.status === 'published'
          );
          console.log('🟢 Matched page:', matchedPage);
          setPage(matchedPage || null);
        } else {
          console.log('🟢 Response not ok');
          setPage(null);
        }
      } catch (error) {
        console.error('🔴 Error fetching vendor page:', error);
        setPage(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPage();
  }, [params.pageSlug, vendor, isVendorStore, vendorLoading]);

  // If not on vendor store or page not found, show 404
  if (!isLoading && (!isVendorStore || !page)) {
    notFound();
  }

  if (isLoading) {
    return (
      <>
        <UnifiedHeader />
        <CategoryNav mode="scroll" />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!page) {
    notFound();
  }

  return (
    <>
      <UnifiedHeader />
      <CategoryNav mode="scroll" />
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-900">{page.title}</h1>
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
