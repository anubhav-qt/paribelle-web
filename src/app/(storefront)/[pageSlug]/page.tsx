'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import HeroCarousel from '@/components/HeroCarousel';
import SectionRenderer from '@/components/SectionRenderer';
import { PageSection } from '@/lib/pageSections';
import { Loader } from '@/components/ui/Loader';

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
  const [page, setPage] = useState<CustomPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/marketplace/pages/slug/${params.pageSlug}`
        );

        if (response.ok) {
          const storePage = await response.json();
          setPage(storePage.status === 'published' ? storePage : null);
        } else {
          setPage(null);
        }
      } catch (error) {
        console.error('Error fetching page:', error);
        setPage(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPage();
  }, [params.pageSlug]);

  // If page not found after loading, show 404
  if (!isLoading && !page) {
    notFound();
  }

  if (isLoading) {
    return (
      <>
        <div className="min-h-screen bg-[hsl(var(--pb-ivory))] flex items-center justify-center">
          <div className="text-center">
            <Loader size="md" className="mx-auto mb-4" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
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
      <main className="min-h-screen bg-[hsl(var(--pb-ivory))]">
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
          <article className="mx-auto max-w-3xl px-4 py-14 md:px-8">
            <header className="border-b border-[hsl(var(--pb-linen))] pb-8">
              <h1 className="text-display-lg text-[hsl(var(--pb-ink))]">{page.title}</h1>
            </header>
            <div className="mt-10">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="text-display-md mt-12 mb-4 text-[hsl(var(--pb-ink))]">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="font-display text-2xl mt-10 mb-3 text-[hsl(var(--pb-ink))]">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="font-display text-xl mt-8 mb-2 text-[hsl(var(--pb-ink))]">{children}</h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="mt-6 mb-2 font-medium text-[hsl(var(--pb-ink))]">{children}</h4>
                  ),
                  p: ({ children }) => (
                    <p className="mb-5 leading-relaxed text-[hsl(var(--pb-ink-muted))]">{children}</p>
                  ),
                  ul: ({ children }) => <ul className="mb-5 list-disc space-y-2 pl-6">{children}</ul>,
                  ol: ({ children }) => <ol className="mb-5 list-decimal space-y-2 pl-6">{children}</ol>,
                  li: ({ children }) => (
                    <li className="leading-relaxed text-[hsl(var(--pb-ink-muted))]">{children}</li>
                  ),
                  a: ({ href, children }) => {
                    // Internal links must stay in the tab and use the router;
                    // only genuinely external destinations open a new tab.
                    const isExternal = !!href && /^(https?:)?\/\//.test(href);
                    const className =
                      'text-[hsl(var(--pb-rose-deep))] underline underline-offset-2 hover:text-[hsl(var(--pb-rose-ink))] transition-colors duration-150';

                    return isExternal ? (
                      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ) : (
                      <Link href={href || '#'} className={className}>
                        {children}
                      </Link>
                    );
                  },
                  img: ({ src, alt }) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={src} alt={alt || ''} className="my-8 h-auto max-w-full rounded-sm" />
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="my-6 border-l-2 border-[hsl(var(--pb-gold))] bg-[hsl(var(--pb-blush-wash))] py-3 pl-5 italic text-[hsl(var(--pb-ink-muted))]">
                      {children}
                    </blockquote>
                  ),
                  code: ({ className, children }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="rounded-sm bg-[hsl(var(--pb-shell))] px-1.5 py-0.5 font-mono text-sm text-[hsl(var(--pb-ink))]">
                        {children}
                      </code>
                    ) : (
                      <code className="my-5 block overflow-x-auto rounded-sm bg-[hsl(var(--pb-wine-deep))] p-4 font-mono text-sm text-white/90">
                        {children}
                      </code>
                    );
                  },
                  table: ({ children }) => (
                    <div className="my-8 overflow-x-auto">
                      <table className="min-w-full border-collapse text-sm">{children}</table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="border-b border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-shell))]">
                      {children}
                    </thead>
                  ),
                  th: ({ children }) => (
                    <th className="text-eyebrow px-4 py-3 text-left text-[hsl(var(--pb-ink-faint))]">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border-b border-[hsl(var(--pb-linen))] px-4 py-3 text-[hsl(var(--pb-ink-muted))]">
                      {children}
                    </td>
                  ),
                  hr: () => <hr className="my-10 border-t border-[hsl(var(--pb-linen))]" />,
                  strong: ({ children }) => (
                    <strong className="font-medium text-[hsl(var(--pb-ink))]">{children}</strong>
                  ),
                  em: ({ children }) => <em className="italic">{children}</em>,
                }}
              >
                {page.content}
              </ReactMarkdown>
            </div>
          </article>
        )}
      </main>
    </>
  );
}
