import type { Metadata } from 'next';
import Link from 'next/link';
import { Monogram } from '@/components/brand/Monogram';
import { Divider } from '@/components/ui/Divider';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'The terms that apply when you shop at paribelle.in: orders, payment, shipping, cancellation and exchanges.',
};

/**
 * Static, like the returns policy: it states how the shop actually works
 * (prepaid only, free shipping, cancel before dispatch for store credit,
 * exchange-only after delivery), so it reads the same regardless of API state.
 */

const SECTIONS: { heading: string; body: string[] }[] = [
  {
    heading: 'About these terms',
    body: [
      'paribelle.in is run by PariBelle, Jaipur, Rajasthan, India. We sell designer kurtis and artificial jewellery. By creating an account or placing an order you agree to these terms, together with our Privacy Policy and Returns & Exchange Policy.',
    ],
  },
  {
    heading: 'Your account',
    body: [
      'Please give us accurate details and keep your password to yourself. You are responsible for orders placed from your account. You must be 18 or older to shop with us.',
    ],
  },
  {
    heading: 'Products and prices',
    body: [
      'Prices are in Indian rupees and include GST. Colours can look slightly different on screen than in person, and handcrafted pieces may vary a little from the photos.',
      'If a product is listed at a clearly wrong price or with a wrong description, we may cancel the order. Anything you paid for it is returned to you in full.',
    ],
  },
  {
    heading: 'Orders and payment',
    body: [
      'All orders are paid online at checkout through Razorpay (UPI, cards, net banking and wallets). We never see or store your card or bank details. An order is confirmed once the payment succeeds.',
      'We may decline or cancel an order if an item is out of stock, the delivery address cannot be served, or the payment looks fraudulent. If you have already paid, the full amount is returned to you.',
    ],
  },
  {
    heading: 'Shipping',
    body: [
      'Shipping is free on every order within India. We ship through courier partners and add tracking details to your order once it is dispatched. Delivery dates are estimates and can be affected by events outside our control.',
    ],
  },
  {
    heading: 'Cancelling an order',
    body: [
      'You can cancel an order from your account until it is shipped. For an order you have already paid for, the full amount is added to your PariBelle wallet straight away, to use on any future order. Once an order has shipped it can no longer be cancelled.',
    ],
  },
  {
    heading: 'Returns and exchanges',
    body: [
      'We do not accept returns for a refund. Exchanges are available within 7 days of delivery, as set out in our Returns & Exchange Policy.',
    ],
  },
  {
    heading: 'Your PariBelle wallet',
    body: [
      'Store credit in your wallet can be used towards any order on paribelle.in. It cannot be withdrawn as cash or transferred to another account.',
    ],
  },
  {
    heading: 'Use of the website',
    body: [
      'Please do not misuse the website: no attempts to break or overload it, to access other people\'s accounts or data, or to copy our photos and content for your own use. All photos, designs and text on paribelle.in belong to PariBelle.',
    ],
  },
  {
    heading: 'Liability',
    body: [
      'We take care to describe and deliver every order correctly. To the extent the law allows, our liability for any order is limited to the amount you paid for it. Nothing in these terms affects your rights as a consumer under Indian law.',
    ],
  },
  {
    heading: 'Governing law',
    body: [
      'These terms are governed by the laws of India. Any dispute is subject to the courts of Jaipur, Rajasthan.',
    ],
  },
  {
    heading: 'Contact',
    body: [
      'Questions about these terms or an order: write to paribelle.official@gmail.com or call +91 86969 30217. We reply within one working day, Monday to Saturday.',
    ],
  },
];

export default function TermsOfServicePage() {
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
          <h1 className="mt-3 text-display-xl italic text-white">Terms of Service</h1>
        </div>
      </section>

      <article className="mx-auto max-w-3xl px-6 py-16 md:px-8">
        <p className="text-lg leading-relaxed text-[hsl(var(--pb-ink-muted))]">
          Last updated: 10 October 2026. Please read these terms before you place an order.
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
          See also our{' '}
          <Link href="/privacy-policy" className="underline underline-offset-2 hover:text-[hsl(var(--pb-ink))]">
            Privacy Policy
          </Link>{' '}
          and{' '}
          <Link href="/returns-and-exchanges" className="underline underline-offset-2 hover:text-[hsl(var(--pb-ink))]">
            Returns &amp; Exchange Policy
          </Link>
          .
        </p>
      </article>
    </div>
  );
}
