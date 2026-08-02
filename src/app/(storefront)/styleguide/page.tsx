'use client';

import { useState } from 'react';
import { Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Radio } from '@/components/ui/Radio';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/card';
import { Drawer } from '@/components/ui/Drawer';
import { Modal } from '@/components/ui/Modal';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Accordion } from '@/components/ui/Accordion';
import { Tooltip } from '@/components/ui/Tooltip';
import { usePbToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { PriceTag } from '@/components/ui/PriceTag';
import { Rating } from '@/components/ui/Rating';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { Divider } from '@/components/ui/Divider';
import { Monogram } from '@/components/brand/Monogram';
import { SectionHeading } from '@/components/brand/SectionHeading';
import { RevealOnScroll } from '@/components/brand/RevealOnScroll';

function Swatch({ name, varName }: { name: string; varName: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div
        className="h-16 w-full rounded-sm border border-[hsl(var(--pb-linen))]"
        style={{ backgroundColor: `hsl(var(${varName}))` }}
      />
      <span className="text-xs text-[hsl(var(--pb-ink-muted))]">{name}</span>
    </div>
  );
}

export default function StyleguidePage() {
  const { showToast } = usePbToast();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [switchOn, setSwitchOn] = useState(true);
  const [qty, setQty] = useState(1);
  const [page, setPage] = useState(3);

  return (
    <div className="min-h-screen bg-[hsl(var(--pb-ivory))] px-6 py-16 md:px-16">
      <div className="mx-auto max-w-5xl space-y-16">
        <header>
          <p className="text-eyebrow text-[hsl(var(--pb-rose-deep))]">Design System</p>
          <h1 className="text-display-xl text-[hsl(var(--pb-ink))]">PariBelle Styleguide</h1>
          <p className="mt-2 text-[hsl(var(--pb-ink-muted))]">Phase 1 primitives — palette, type, components.</p>
        </header>

        <section>
          <SectionHeading eyebrow="Foundations" title="Palette" showRule />
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
            <Swatch name="Ivory" varName="--pb-ivory" />
            <Swatch name="Shell" varName="--pb-shell" />
            <Swatch name="Blush wash" varName="--pb-blush-wash" />
            <Swatch name="Blush" varName="--pb-blush" />
            <Swatch name="Linen" varName="--pb-linen" />
            <Swatch name="Rose mist" varName="--pb-rose-mist" />
            <Swatch name="Rose" varName="--pb-rose" />
            <Swatch name="Rose deep" varName="--pb-rose-deep" />
            <Swatch name="Rose ink" varName="--pb-rose-ink" />
            <Swatch name="Gold" varName="--pb-gold" />
            <Swatch name="Gold soft" varName="--pb-gold-soft" />
            <Swatch name="Ink" varName="--pb-ink" />
            <Swatch name="Wine" varName="--pb-wine" />
            <Swatch name="Wine deep" varName="--pb-wine-deep" />
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="Foundations" title="Type" showRule />
          <div className="mt-6 space-y-3">
            <p className="text-display-xl">Discover the Elegance</p>
            <p className="text-display-lg">Shop by Category</p>
            <p className="text-display-md">Rosewood Embroidered Kurti</p>
            <p className="text-eyebrow text-[hsl(var(--pb-rose-deep))]">New In</p>
            <p className="text-base">Designer kurtis and artificial jewellery, designed in Jaipur.</p>
            <p className="text-xs text-[hsl(var(--pb-ink-faint))]">Free shipping on orders over ₹999</p>
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="Components" title="Buttons" showRule />
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button variant="primary">Add to Bag</Button>
            <Button variant="secondary">Checkout</Button>
            <Button variant="ghost">Continue Shopping</Button>
            <Button variant="gold-outline">
              <Sparkles className="h-4 w-4" /> Explore Lookbook
            </Button>
            <Button variant="danger">Remove</Button>
            <Button loading>Placing order</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="Components" title="Forms" showRule />
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Input label="Email address" type="email" />
            <Select label="Size" defaultValue="m">
              <option value="s">Small</option>
              <option value="m">Medium</option>
              <option value="l">Large</option>
            </Select>
            <Textarea label="Gift note" />
            <div className="flex flex-col gap-3 justify-center">
              <Checkbox label="Remember me" defaultChecked />
              <Radio label="Cash on delivery" name="pay" defaultChecked />
              <Switch checked={switchOn} onCheckedChange={setSwitchOn} label="Email me about new arrivals" />
            </div>
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="Components" title="Badges & Rating" showRule />
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Badge variant="sale">30% off</Badge>
            <Badge variant="new">New</Badge>
            <Badge variant="low-stock">Low stock</Badge>
            <Badge variant="sold-out">Sold out</Badge>
            <Rating value={4.3} count={142} />
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="Components" title="Price & Quantity" showRule />
          <div className="mt-6 flex flex-wrap items-center gap-8">
            <PriceTag price={1899} compareAtPrice={2599} size="lg" />
            <QuantityStepper value={qty} onChange={setQty} />
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="Components" title="Overlays" showRule />
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => setDrawerOpen(true)}>Open Drawer</Button>
            <Button variant="secondary" onClick={() => setModalOpen(true)}>
              Open Modal
            </Button>
            <Button variant="ghost" onClick={() => showToast('Added to your bag', 'success')}>
              Fire Success Toast
            </Button>
            <Button variant="ghost" onClick={() => showToast('Could not reach the server', 'error')}>
              Fire Error Toast
            </Button>
            <Tooltip content="Add to wishlist">
              <button className="rounded-full p-2 hover:bg-[hsl(var(--pb-shell))]">
                <Heart className="h-5 w-5" />
              </button>
            </Tooltip>
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="Components" title="Tabs & Accordion" showRule />
          <div className="mt-6 space-y-8">
            <Tabs defaultValue="desc">
              <TabsList>
                <TabsTrigger value="desc">Description</TabsTrigger>
                <TabsTrigger value="fabric">Fabric & Care</TabsTrigger>
                <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
              </TabsList>
              <TabsContent value="desc" className="pt-4 text-sm text-[hsl(var(--pb-ink-muted))]">
                A hand-embroidered cotton kurti with antique gold thread work.
              </TabsContent>
              <TabsContent value="fabric" className="pt-4 text-sm text-[hsl(var(--pb-ink-muted))]">
                100% pure cotton. Hand wash cold, dry in shade.
              </TabsContent>
              <TabsContent value="shipping" className="pt-4 text-sm text-[hsl(var(--pb-ink-muted))]">
                Ships in 2-4 days. 7-day easy returns.
              </TabsContent>
            </Tabs>

            <Accordion
              items={[
                { id: '1', title: 'What sizes are available?', content: 'S through XXL, see our size guide.' },
                { id: '2', title: 'Is this true to size?', content: 'Yes, runs true to size for a relaxed fit.' },
              ]}
            />
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="Components" title="Feedback" showRule />
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            <Skeleton className="h-40 w-full" />
            <EmptyState
              icon={<Monogram className="h-8 w-8" />}
              title="Your wishlist is empty"
              description="Save your favourite pieces here."
              action={<Button size="sm">Start Browsing</Button>}
            />
            <Card className="p-6 flex items-center justify-center">
              <Monogram className="h-10 w-10 text-[hsl(var(--pb-rose))]" />
            </Card>
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="Components" title="Navigation" showRule />
          <div className="mt-6 space-y-6">
            <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Kurtis', href: '/category/kurtis' }, { label: 'Rosewood Embroidered' }]} />
            <Pagination page={page} totalPages={12} onPageChange={setPage} />
          </div>
        </section>

        <section>
          <SectionHeading eyebrow="Brand" title="Editorial & Motion" showRule />
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <RevealOnScroll className="rounded-sm border border-[hsl(var(--pb-linen))] p-6">
              <p className="text-sm text-[hsl(var(--pb-ink-muted))]">Scrolled into view — fades and lifts.</p>
            </RevealOnScroll>
            <Divider variant="gold-flourish" />
          </div>
        </section>

        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Your Bag">
          <div className="p-6 text-sm text-[hsl(var(--pb-ink-muted))]">Drawer content preview.</div>
        </Drawer>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Confirm">
          <p className="text-sm text-[hsl(var(--pb-ink-muted))]">Modal content preview.</p>
        </Modal>
      </div>
    </div>
  );
}
