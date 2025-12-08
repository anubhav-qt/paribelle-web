import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import VendorHeader from '@/components/VendorHeader';
import CategoryNav from '@/components/CategoryNav';
import Footer from '@/components/Footer';

interface PageProps {
  params: {
    vendorSlug: string;
    pageSlug: string;
  };
}

async function getVendor(slug: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/slug/${slug}`,
    { cache: 'no-store' }
  );
  
  if (!res.ok) return null;
  return res.json();
}

async function getPage(vendorId: string, pageSlug: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${vendorId}/pages/slug/${pageSlug}`,
    { cache: 'no-store' }
  );
  
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const vendor = await getVendor(params.vendorSlug);
  if (!vendor) return { title: 'Page Not Found' };

  const page = await getPage(vendor.id, params.pageSlug);
  if (!page) return { title: 'Page Not Found' };

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription || page.excerpt,
    keywords: page.metaKeywords,
  };
}

export default async function VendorCustomPage({ params }: PageProps) {
  const vendor = await getVendor(params.vendorSlug);
  
  if (!vendor) {
    notFound();
  }

  const page = await getPage(vendor.id, params.pageSlug);

  if (!page) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <VendorHeader 
        vendorSlug={params.vendorSlug}
        vendorId={vendor.id}
        searchPlaceholder="Search in this store..."
      />

      <CategoryNav 
        vendorId={vendor.id}
        vendorSlug={params.vendorSlug}
        mode="scroll"
      />

      <div className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              {page.title}
            </h1>
            {page.excerpt && (
              <p className="text-xl text-muted-foreground">
                {page.excerpt}
              </p>
            )}
          </header>

          {page.featuredImage && (
            <div className="mb-8">
              <img
                src={page.featuredImage}
                alt={page.title}
                className="w-full h-auto rounded-lg"
              />
            </div>
          )}

          <div
            className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary prose-strong:text-foreground prose-ul:text-foreground prose-ol:text-foreground"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </article>
      </div>

      <Footer />
    </div>
  );
}
