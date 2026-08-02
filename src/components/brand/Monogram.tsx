import { cn } from '@/lib/utils';

/**
 * The PariBelle fairy monogram, drawn as a single-path SVG so it can be
 * recolored per-context (rose on ivory, gold on wine) without needing
 * multiple exported PNGs. Used as a bullet, divider ornament, and loading spinner.
 */
export function Monogram({ className, spin = false }: { className?: string; spin?: boolean }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('h-6 w-6', spin && 'animate-spin', className)}
      aria-hidden="true"
    >
      <path
        d="M24 6c1.5 3 1 6.5-1.5 9.5C25 13 29 11.5 33 12.5c-2.5 2-3.5 5-3 8 2.5-1.5 6-1.5 8 .5-3 .5-5 2.5-5.5 5 2.5.5 4.5 2.5 5 5-3-1-6-.5-8 1.5 1 2.5 0 5.5-2.5 7-1.5-2-4-3-6.5-2.5.5 3-1 6-3.5 7.5-1-3-.5-6-3-8-2 1.5-5 1.5-7-.5 2.5-1 4-3.5 4-6-2.5.5-5.5-.5-7-3 3-.5 5.5-2.5 6.5-5.5-2.5.5-5-1-6-3.5 3 .5 6-1 7.5-3.5C22.5 12.5 22 9 24 6Z"
        fill="currentColor"
        opacity="0.9"
      />
      <circle cx="24" cy="24" r="2" fill="currentColor" />
    </svg>
  );
}
