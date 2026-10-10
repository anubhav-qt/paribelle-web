'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

export default function StorefrontError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[hsl(var(--pb-ivory))] px-6 py-20 text-center">
      <h1 className="text-display-lg text-[hsl(var(--pb-ink))]">Something went wrong</h1>
      <p className="mt-3 max-w-md text-[hsl(var(--pb-ink-muted))]">
        Please try again. If it keeps happening, your bag is saved, so you can come back to it later.
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link href="/">
          <Button variant="ghost">Go to home</Button>
        </Link>
      </div>
    </div>
  );
}
