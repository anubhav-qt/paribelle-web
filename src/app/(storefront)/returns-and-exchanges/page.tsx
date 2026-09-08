import type { Metadata } from 'next';
import { Monogram } from '@/components/brand/Monogram';
import { Divider } from '@/components/ui/Divider';

export const metadata: Metadata = {
  title: 'Returns and Exchanges',
  description:
    'PariBelle does not accept returns for a refund. We offer exchanges within 7 days of delivery, subject to the conditions on this page.',
};

/**
 * Static policy page. Deliberately not wired to the admin Policies settings or
 * the per-order exchange flow: this is the customer-facing statement of the
 * rule, and it should read the same on every page load regardless of API
 * state. The route sits ahead of the [pageSlug] catch-all, so it wins over any
 * CMS page that might later be created at the same slug.
 */

const SECTIONS: { heading: string; body: string[] }[] = [
  {
    heading: 'No returns',
    body: [
      'All orders placed on PariBelle are final. We do not offer returns or refunds once an order has been delivered. If there is a genuine problem with what you received, an exchange is available under the terms below.',
    ],
  },
  {
    heading: 'Exchange window',
    body: [
      'You have 7 days from the date your order is delivered to raise an exchange request. The delivery date is the one recorded by our courier. Requests raised after the 7th day cannot be accepted, so please check your order as soon as it arrives.',
    ],
  },
  {
    heading: 'Condition of the item',
    body: [
      'The item must be unworn and unwashed, with every original tag attached and the original packing intact. It must be free of stains, marks, alterations and scent.',
      'If the item reaches us in a condition we cannot sell again, the exchange is declined and the item is sent back to you.',
    ],
  },
  {
    heading: 'How to raise a request',
    body: [
      'Sign in to your account, open the order and select the item you want to exchange. As part of the request you will be asked to record a short video of the product with its tags. Our team reviews each request and confirms the next step by email or phone.',
    ],
  },
  {
    heading: 'Your replacement',
    body: [
      'You can exchange an item for a different size or colour, or for another product of the same value. Where the replacement costs more, the difference is payable before it is dispatched. Where it costs less, the balance is added to your PariBelle wallet.',
      'The replacement is dispatched once the original item has reached us and passed inspection.',
    ],
  },
  {
    heading: 'Collection charge',
    body: [
      'Where our courier partner operates, we arrange collection of the original item. A collection charge may apply. The amount is shown to you before you confirm the request.',
    ],
  },
  {
    heading: 'Items that cannot be exchanged',
    body: [
      'Products sold as final sale or bought during a clearance event, and any item damaged after delivery through normal use.',
    ],
  },
  {
    heading: 'Contact',
    body: [
      'For any question about an exchange, write to paribelle.official@gmail.com or call +91 86969 30217. We reply within one working day, Monday to Saturday.',
    ],
  },
];

export default function ReturnsAndExchangesPage() {
  return (
    <div className="bg-[hsl(var(--pb-ivory))]">
      <section className="relative flex min-h-[38vh] items-center justify-center overflow-hidden bg-[hsl(var(--pb-wine))] px-6 py-20 text-center">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -left-16 -top-16 h-72 w-72 rounded-full bg-[hsl(var(--pb-rose))] blur-3xl" />
          <div className="absolute -bottom-16 -right-16 h-72 w-72 rounded-full bg-[hsl(var(--pb-gold))] blur-3xl" />
        </div>
        <div className="relative">
          <Monogram className="mx-auto h-9 w-9 text-[hsl(var(--pb-gold))]" />
          <p className="text-eyebrow mt-5 text-[hsl(var(--pb-gold-soft))]">Customer Care</p>
          <h1 className="mt-3 text-display-xl italic text-white">Returns and Exchanges</h1>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-6 py-16 md:px-8">
        <p className="text-lg leading-relaxed text-[hsl(var(--pb-ink-muted))]">
          Please read this policy before you place an order. It sets out what happens if something is
          not right with what you receive.
        </p>

        <Divider variant="gold-flourish" className="my-10" />

        <div className="space-y-10">
          {SECTIONS.map((section) => (
            <section key={section.heading}>
              <h2 className="font-display text-2xl text-[hsl(var(--pb-ink))]">{section.heading}</h2>
              {section.body.map((para, i) => (
                <p key={i} className="mt-3 leading-relaxed text-[hsl(var(--pb-ink-muted))]">
                  {para}
                </p>
              ))}
            </section>
          ))}
        </div>

        <p className="mt-12 text-sm text-[hsl(var(--pb-ink-faint))]">
          This policy applies to all orders and may be updated from time to time. The version shown
          here is the one in effect.
        </p>
      </article>
    </div>
  );
}
