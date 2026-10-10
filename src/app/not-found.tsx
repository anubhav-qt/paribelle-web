import Link from 'next/link';

/** Unmatched URLs outside the storefront's own routes. */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[hsl(var(--pb-ivory))] px-6 text-center">
      <h1 className="text-display-lg text-[hsl(var(--pb-ink))]">Page not found</h1>
      <p className="mt-3 text-[hsl(var(--pb-ink-muted))]">This page doesn&apos;t exist.</p>
      <Link
        href="/"
        className="mt-8 rounded-sm bg-[hsl(var(--pb-rose))] px-6 py-3 text-sm font-medium text-white hover:bg-[hsl(var(--pb-rose-deep))]"
      >
        Go to PariBelle
      </Link>
    </div>
  );
}
