import { Sparkles, RotateCcw, ShieldCheck, FileText } from 'lucide-react';

const ITEMS = [
  { icon: Sparkles, label: 'In-House Design', desc: 'Designed and quality checked by us' },
  { icon: RotateCcw, label: 'Easy Returns', desc: '7-day hassle-free returns' },
  { icon: ShieldCheck, label: 'Secure Payment', desc: '100% protected checkout' },
  { icon: FileText, label: 'GST Invoice', desc: 'On every order, always' },
];

export function TrustStrip() {
  return (
    <section className="border-y border-[hsl(var(--pb-linen))]">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-10 md:grid-cols-4 md:px-8">
        {ITEMS.map(({ icon: Icon, label, desc }) => (
          <div key={label} className="flex flex-col items-center gap-2 text-center">
            <Icon className="h-6 w-6 text-[hsl(var(--pb-gold))]" strokeWidth={1.5} />
            <p className="text-sm font-medium text-[hsl(var(--pb-ink))]">{label}</p>
            <p className="text-xs text-[hsl(var(--pb-ink-faint))]">{desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
