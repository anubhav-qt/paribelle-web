import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import SectionRenderer from '@/components/SectionRenderer';
import { PageSection } from '@/lib/pageSections';

interface CustomPage {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
}

type Props = { params: { pageSlug: string } };

/**
 * Rendered on the server so a URL that matches no published page answers
 * with a real 404. As a client component it answered 200 with a loading
 * spinner for every mistyped or made-up URL on the site.
 */
async function getPage(slug: string): Promise<CustomPage | null> {
  const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  try {
    const response = await fetch(`${apiUrl}/api/v1/marketplace/pages/slug/${encodeURIComponent(slug)}`, {
      next: { revalidate: 300 },
    });
    if (!response.ok) return null;
    const page: CustomPage = await response.json();
    return page.status === 'published' ? page : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await getPage(params.pageSlug);
  return page ? { title: page.title } : {};
}

/** Builder pages store a JSON array of sections; anything else is markdown. */
function parseSections(content: string): PageSection[] | null {
  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) && parsed.length > 0 && parsed[0].type ? parsed : null;
  } catch {
    return null;
  }
}

export default async function CustomPage({ params }: Props) {
  const page = await getPage(params.pageSlug);
  if (!page) notFound();

  const sections = parseSections(page.content);

  return (
    <>
      <main className="min-h-screen bg-[hsl(var(--pb-ivory))]">
        {sections ? (
          // Render sections in builder mode
          <div>
            {sections
              .filter((s) => s.visible !== false)
              .map((section) => (
                <SectionRenderer key={section.id} section={section} />
              ))}
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
