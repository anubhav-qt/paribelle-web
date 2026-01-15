'use client';

import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import ThemeRenderer from '@/components/ThemeRenderer';
import CategorySidebar from '@/components/CategorySidebar';
import HeroCarousel from '@/components/HeroCarousel';
import CategoryNav from '@/components/CategoryNav';
import Footer from '@/components/Footer';
import SectionRenderer from '@/components/SectionRenderer';
import { useVendorContext } from '@/contexts/VendorContext';
import { PageSection } from '@/lib/pageSections';

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  pageMode?: 'builder' | 'markdown';
  status: 'draft' | 'published' | 'archived';
  showInNavigation: boolean;
}

export default function CustomPage({ params }: { params: { pageSlug: string } }) {
  const { vendor, isVendorStore, isLoading: vendorLoading } = useVendorContext();
  const [page, setPage] = useState<CustomPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  console.log('🟢 CustomPage:', { 
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

      try {
        let url: string;
        let response: Response;

        if (isVendorStore && vendor) {
          // Fetch vendor page
          url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendor.id}/pages`;
          console.log('🟢 Fetching vendor pages from:', url);
          
          response = await fetch(url);

          console.log('🟢 Response status:', response.status);
          if (response.ok) {
            const pages = await response.json();
            console.log('🟢 Vendor pages received:', pages.length);
            console.log('🟢 Looking for slug:', params.pageSlug);
            
            // Find the page with matching slug that is published
            const matchedPage = pages.find(
              (p: CustomPage) => p.slug === params.pageSlug && p.status === 'published'
            );
            console.log('🟢 Matched vendor page:', matchedPage);
            setPage(matchedPage || null);
          } else {
            console.log('🟢 Vendor page response not ok');
            setPage(null);
          }
        } else {
          // Fetch marketplace page by slug
          url = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/marketplace/pages/slug/${params.pageSlug}`;
          console.log('🟢 Fetching marketplace page from:', url);
          
          response = await fetch(url);

          console.log('🟢 Response status:', response.status);
          if (response.ok) {
            const marketplacePage = await response.json();
            console.log('🟢 Marketplace page received:', marketplacePage);
            
            // Only show published pages
            if (marketplacePage.status === 'published') {
              setPage(marketplacePage);
            } else {
              console.log('🟢 Marketplace page not published');
              setPage(null);
            }
          } else {
            console.log('🟢 Marketplace page response not ok');
            setPage(null);
          }
        }
      } catch (error) {
        console.error('🔴 Error fetching page:', error);
        setPage(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPage();
  }, [params.pageSlug, vendor, isVendorStore, vendorLoading]);

  // If page not found after loading, show 404
  if (!isLoading && !page) {
    notFound();
  }

  if (isLoading) {
    return (
      <>
        <ThemeRenderer component="header" />
        <HeroCarousel />
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

  // Determine if content is sections (builder mode) or markdown
  let sections: PageSection[] = [];
  let isBuilderMode = false;
  
  try {
    const parsed = JSON.parse(page.content);
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].type) {
      sections = parsed;
      isBuilderMode = true;
      console.log('🟢 Builder mode detected, sections:', sections.length);
    }
  } catch (e) {
    // Not JSON, treat as markdown
    console.log('🟢 Markdown mode, content length:', page.content?.length);
    isBuilderMode = false;
  }

  return (
    <>
      <ThemeRenderer component="header" />
      <HeroCarousel />
      <CategoryNav mode="scroll" />
      <main className="min-h-screen bg-gray-50">
        {isBuilderMode ? (
          // Render sections in builder mode
          <div>
            {sections
              .filter(s => s.visible !== false) // Show sections unless explicitly hidden
              .map((section) => {
                return <SectionRenderer key={section.id} section={section} />;
              })}
          </div>
        ) : (
          // Render markdown content
          <div className="container mx-auto px-4 py-8">
            <div className="flex gap-6">
              {/* <CategorySidebar /> */}
              <div className="flex-1 max-w-4xl bg-white rounded-lg shadow-sm p-8">
              <h1 className="text-3xl font-bold mb-6 text-gray-900">{page.title}</h1>
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <h1 className="text-4xl font-bold mb-6 mt-8 text-gray-900">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-3xl font-bold mb-4 mt-6 text-gray-800">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-2xl font-bold mb-3 mt-5 text-gray-800">{children}</h3>,
                    h4: ({ children }) => <h4 className="text-xl font-semibold mb-2 mt-4 text-gray-700">{children}</h4>,
                    p: ({ children }) => <p className="mb-4 leading-relaxed text-gray-700">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed text-gray-700">{children}</li>,
                    a: ({ href, children }) => (
                      <a href={href} className="text-blue-600 hover:text-blue-800 hover:underline" target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                    img: ({ src, alt }) => (
                      <img src={src} alt={alt} className="rounded-lg max-w-full h-auto my-6 shadow-md" />
                    ),
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-500 pl-4 italic my-4 text-gray-600 bg-gray-50 py-2">
                        {children}
                      </blockquote>
                    ),
                    code: ({ className, children }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-800">{children}</code>
                      ) : (
                        <code className="block bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono my-4">
                          {children}
                        </code>
                      );
                    },
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-6">
                        <table className="min-w-full border border-gray-300 shadow-sm">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-gray-100">{children}</thead>,
                    th: ({ children }) => (
                      <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">{children}</th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-gray-300 px-4 py-3 text-gray-700">{children}</td>
                    ),
                    hr: () => <hr className="border-t-2 border-gray-300 my-8" />,
                    strong: ({ children }) => <strong className="font-bold text-gray-900">{children}</strong>,
                    em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
                  }}
                >
                  {page.content}
                </ReactMarkdown>
              </div>
            </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
