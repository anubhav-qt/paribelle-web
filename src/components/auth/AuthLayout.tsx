import Link from 'next/link';
import { Monogram } from '@/components/brand/Monogram';

export interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] md:grid-cols-2">
      <div className="relative hidden items-center justify-center overflow-hidden bg-[hsl(var(--pb-wine))] p-16 md:flex">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-16 -top-16 h-80 w-80 rounded-full bg-[hsl(var(--pb-rose))] blur-3xl" />
          <div className="absolute -bottom-16 -right-16 h-80 w-80 rounded-full bg-[hsl(var(--pb-gold))] blur-3xl" />
        </div>
        <div className="relative text-center">
          <Monogram className="mx-auto h-12 w-12 text-[hsl(var(--pb-gold))]" />
          <p className="mt-6 font-display text-3xl italic text-white">PariBelle</p>
          <p className="mt-3 max-w-xs text-sm text-white/60">
            Designer kurtis and artificial jewellery, designed by us to be treasured.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-16 md:px-16">
        <div className="w-full max-w-sm">
          <Link href="/" className="font-display text-xl italic text-[hsl(var(--pb-ink))] md:hidden">
            PariBelle
          </Link>
          <h1 className="mt-4 font-display text-3xl text-[hsl(var(--pb-ink))] md:mt-0">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-[hsl(var(--pb-ink-muted))]">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
