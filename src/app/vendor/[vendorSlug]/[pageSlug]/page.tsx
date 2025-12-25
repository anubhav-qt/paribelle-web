import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import VendorHeader from '@/components/VendorHeader';
import CategoryNav from '@/components/CategoryNav';
import Footer from '@/components/Footer';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

interface PageProps {
  params: {
    vendorSlug: string;
    pageSlug: string;
  };
}

async function getVendor(slug: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/v1/vendors/${slug}`,
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

  // Render different templates based on page type
  const renderPageContent = () => {
    switch (page.pageType) {
      case 'contact':
        return <ContactTemplate page={page} vendor={vendor} />;
      case 'about':
        return <AboutTemplate page={page} vendor={vendor} />;
      case 'faq':
        return <FAQTemplate page={page} />;
      case 'terms':
      case 'privacy':
        return <LegalTemplate page={page} />;
      default:
        return <CustomTemplate page={page} />;
    }
  };

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
        {renderPageContent()}
      </div>

      <Footer />
    </div>
  );
}

// Contact Page Template
function ContactTemplate({ page, vendor }: any) {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-foreground mb-8">{page.title}</h1>
      
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Contact Info */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-4">Get in Touch</h2>
          
          {vendor.email && (
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary mt-1" />
              <div>
                <h3 className="font-medium">Email</h3>
                <a href={`mailto:${vendor.email}`} className="text-primary hover:underline">
                  {vendor.email}
                </a>
              </div>
            </div>
          )}
          
          {vendor.phone && (
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-primary mt-1" />
              <div>
                <h3 className="font-medium">Phone</h3>
                <a href={`tel:${vendor.phone}`} className="text-primary hover:underline">
                  {vendor.phone}
                </a>
              </div>
            </div>
          )}
          
          {vendor.address && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-1" />
              <div>
                <h3 className="font-medium">Address</h3>
                <p className="text-muted-foreground">{vendor.address}</p>
              </div>
            </div>
          )}
        </div>

        {/* Contact Form */}
        <div className="bg-card p-6 rounded-lg border border-border">
          <h2 className="text-2xl font-semibold mb-4">Send a Message</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                className="w-full px-4 py-2 border border-border rounded-md bg-background"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2 border border-border rounded-md bg-background"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                rows={4}
                className="w-full px-4 py-2 border border-border rounded-md bg-background"
                placeholder="Your message..."
              ></textarea>
            </div>
            <button
              type="submit"
              className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>

      {/* Additional Content */}
      {page.content && (
        <div
          className="prose prose-lg max-w-none mt-8 prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      )}
    </div>
  );
}

// About Page Template
function AboutTemplate({ page, vendor }: any) {
  return (
    <div className="max-w-4xl mx-auto">
      {vendor.logo && (
        <div className="flex justify-center mb-8">
          <img
            src={vendor.logo}
            alt={vendor.businessName}
            className="w-32 h-32 rounded-full object-cover border-4 border-primary"
          />
        </div>
      )}
      
      <h1 className="text-4xl font-bold text-foreground text-center mb-4">{page.title}</h1>
      {page.excerpt && (
        <p className="text-xl text-muted-foreground text-center mb-8">{page.excerpt}</p>
      )}
      
      <div
        className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground prose-a:text-primary"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
      
      {/* Stats Section */}
      <div className="grid grid-cols-3 gap-6 mt-12 p-6 bg-muted rounded-lg">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-2">Since</div>
          <div className="text-muted-foreground">
            {new Date(vendor.createdAt).getFullYear()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-2">Products</div>
          <div className="text-muted-foreground">Quality Assured</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-primary mb-2">Support</div>
          <div className="text-muted-foreground">Always Available</div>
        </div>
      </div>
    </div>
  );
}

// FAQ Template
function FAQTemplate({ page }: any) {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-foreground mb-4">{page.title}</h1>
      {page.excerpt && (
        <p className="text-xl text-muted-foreground mb-8">{page.excerpt}</p>
      )}
      
      <div
        className="prose prose-lg max-w-none [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-3 [&_h2]:text-foreground [&_h3]:text-lg [&_h3]:font-medium [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-foreground [&_p]:mb-4 [&_p]:text-foreground [&_a]:text-primary"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}

// Terms/Privacy Template
function LegalTemplate({ page }: any) {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-foreground mb-4">{page.title}</h1>
      <p className="text-sm text-muted-foreground mb-8">
        Last Updated: {new Date(page.updatedAt).toLocaleDateString()}
      </p>
      
      <div
        className="prose prose-lg max-w-none [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-4 [&_h2]:text-foreground [&_h3]:text-xl [&_h3]:font-medium [&_h3]:mt-6 [&_h3]:mb-3 [&_h3]:text-foreground [&_p]:mb-4 [&_p]:text-foreground [&_ul]:mb-4 [&_ul]:text-foreground [&_ol]:mb-4 [&_ol]:text-foreground [&_a]:text-primary"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </div>
  );
}

// Custom/Default Template
function CustomTemplate({ page }: any) {
  return (
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
  );
}
