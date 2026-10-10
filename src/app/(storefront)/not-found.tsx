import Link from 'next/link';
import { Monogram } from '@/components/brand/Monogram';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[hsl(var(--pb-ivory))] px-6 py-20 text-center">
      <Monogram className="h-9 w-9 text-[hsl(var(--pb-gold))]" />
      <h1 className="mt-6 text-display-lg text-[hsl(var(--pb-ink))]">Page not found</h1>
      <p className="mt-3 max-w-md text-[hsl(var(--pb-ink-muted))]">
        This page may have moved, or the piece you were looking for is no longer available.
      </p>
      <Link href="/" className="mt-8">
        <Button>Continue shopping</Button>
      </Link>
    </div>
  );
}
