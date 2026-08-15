'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { X, AlertCircle, ShoppingBag, Video, Trash2, Check } from 'lucide-react';
import { OrderItem } from '@/types/common';
import {
  getExchangePicker,
  startExchangePicker,
  removeExchangePick,
  clearExchangePicker,
  updateExchangeDraft,
  useExchangePicker,
  formatVariantLabel,
  setExchangeModalOpen,
} from '@/lib/exchangePicker';

interface Variant {
  id: string;
  sku: string;
  variantAttributes: Record<string, string>;
  stockQuantity: number;
  isActive: boolean;
  price: number;
}

/**
 * How the customer wants to pay the courier charge. 'online' is only offered
 * on a different-product exchange: it is settled on the replacement order
 * that route creates, and a same-product swap creates no such order (the
 * backend refuses the combination outright).
 */
export type CourierPaymentMethod = 'wallet' | 'cod' | 'online';

/** One exchange request as the API expects it — see `ExchangesService.request`. */
export interface ExchangeSubmission {
  quantity: number;
  reason: string;
  exchangeVariantId?: string;
  videoUrl: string;
  customerNotes?: string;
  /** How the courier charge is being paid, when the store charges one. */
  courierChargePaymentMethod?: CourierPaymentMethod;
}

interface ExchangeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderNumber: string;
  item: OrderItem;
  /**
   * A different-product exchange can submit more than one request at once —
   * one per replacement the shopper picked while browsing, since the backend
   * has no notion of "one exchange, several replacements" (each `Return` row
   * carries exactly one `exchangeVariantId`). Same-product and credit-only
   * exchanges always submit a single-item array.
   */
  onSubmit: (submissions: ExchangeSubmission[]) => Promise<void>;
}

const EXCHANGE_REASONS = [
  { value: 'size_fit', label: 'Wrong size or fit' },
  { value: 'wrong_variant', label: 'Ordered the wrong option' },
  { value: 'defective', label: 'Item is damaged or faulty' },
  { value: 'not_as_described', label: "Item isn't as described" },
  { value: 'changed_mind', label: "Changed my mind, don't want a replacement" },
  { value: 'other', label: 'Other reason' },
];

type Mode = 'same_product' | 'different_product' | 'credit_only';

const MODE_OPTIONS: { value: Mode; label: string; hint: string }[] = [
  {
    value: 'same_product',
    label: 'A different size or option of this same item',
    hint: 'A straight swap — nothing to pay, nothing refunded.',
  },
  {
    value: 'different_product',
    label: 'A different product from the store',
    hint: 'We credit what you paid, then you pick anything of the same value or less. Anything left over stays as store credit.',
  },
  {
    value: 'credit_only',
    label: 'Nothing — just credit my account',
    hint: 'The full amount you paid goes to your store credit, to spend whenever.',
  },
];

/**
 * Splits `total` units as evenly as possible across `count` picks — e.g. 3
 * units across 2 picks is [2, 1], not left for the shopper to divide up
 * themselves. There is no separate "choose your replacement" step: whatever
 * is in `picks` (added via "Select for Exchange" while browsing) *is* the
 * replacement set, in full — the picking already happened out on the
 * storefront.
 */
function distributeQuantity(count: number, total: number): number[] {
  if (count <= 0 || total < count) return [];
  const base = Math.floor(total / count);
  const extra = total % count;
  return Array.from({ length: count }, (_, i) => base + (i < extra ? 1 : 0));
}

/**
 * Requests an exchange for one order item — three routes (see the
 * implementation plan): a different variant of the same product (a straight
 * swap, no money moves), one or more different products (the original item's
 * value is credited and the replacements come out of that credit), or no
 * replacement at all (the full value is credited).
 *
 * Every replacement must cost the same as the original item or less.
 * Exchanging *up* is not offered anywhere — the store takes no further
 * payment for the goods, so there is nothing a price gap could be paid with;
 * `ExchangesService.request` refuses one, and the storefront won't let a
 * dearer item be selected.
 *
 * The one thing an exchange can cost is the courier charge for posting the
 * replacement out, which the customer chooses how to pay here rather than
 * inheriting whatever the original order was paid by.
 *
 * A video of the item is mandatory: it is the only evidence the admin has
 * when deciding, and the backend refuses a request without one
 * (`ExchangesService.request`), so the form must not let one be sent.
 */
export default function ExchangeRequestModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  item,
  onSubmit,
}: ExchangeRequestModalProps) {
  const router = useRouter();
  const picker = useExchangePicker();
  const pickerIsForThisItem = picker?.orderItemId === item.id;

  const [mode, setMode] = useState<Mode>('same_product');
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState('');

  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  // The store's flat charge for couriering the replacement out (0 = off) and
  // how the customer wants to pay it. Their choice, not inherited from how
  // the original order was paid.
  const [courierCharge, setCourierCharge] = useState(0);
  const [courierPaymentMethod, setCourierPaymentMethod] = useState<CourierPaymentMethod | ''>('');

  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoName, setVideoName] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoError, setVideoError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Tells ExchangePickerBar to stand down while this is open — its fixed
  // bottom bar otherwise sits over this modal's sticky footer, hiding the
  // Submit button the shopper came back here to press.
  useEffect(() => {
    if (!isOpen) return;
    setExchangeModalOpen(true);
    return () => setExchangeModalOpen(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    // Read storage directly rather than leaning on `picker`: the hook fills
    // in one render *after* mount, so on the render where this effect runs
    // it is still null — which used to drop a shopper returning from
    // browsing back onto the "same product" tab with their picks hidden.
    const saved = getExchangePicker();
    const resuming = saved?.orderItemId === item.id;
    const draft = resuming ? saved!.draft : {};

    setMode(resuming ? 'different_product' : 'same_product');
    setSelectedVariantId('');
    setCourierPaymentMethod('');
    setError('');
    setVideoError('');

    // Everything the shopper had already filled in survives the round trip
    // to the store and back — see `ExchangeDraft`.
    setQuantity(resuming ? saved!.quantity : 1);
    setReason(draft.reason || '');
    setOtherReason(draft.otherReason || '');
    setCustomerNotes(draft.customerNotes || '');
    setVideoUrl(draft.videoUrl || '');
    setVideoName(draft.videoName || '');

    setLoadingVariants(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/${item.productId}/variants`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Variant[]) => {
        // The variant already on the order is not a valid exchange target.
        setVariants((data || []).filter((v) => v.id !== item.variantId && v.isActive && v.stockQuantity > 0));
      })
      .catch(() => setVariants([]))
      .finally(() => setLoadingVariants(false));

    // Settings are public — the same figure the backend quotes from
    // `exchange_courier_charge` when the request is actually created.
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const charge = Number(data?.exchange_courier_charge);
        setCourierCharge(Number.isFinite(charge) && charge > 0 ? charge : 0);
      })
      .catch(() => setCourierCharge(0));

    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders/wallet-balance`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setWalletBalance(data ? Number(data.balance) || 0 : 0))
        .catch(() => setWalletBalance(0));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, item.id, item.productId, item.variantId]);

  const picks = pickerIsForThisItem && picker ? picker.picks : [];

  const itemUnitPrice = Number(item.price) || 0;
  const itemCredit = itemUnitPrice * quantity;

  // Every pick is used, in full — see `distributeQuantity`. Only invalid
  // (more picks than units to exchange) when it comes back empty.
  const pickAssignments = mode === 'different_product' ? distributeQuantity(picks.length, quantity) : [];
  const tooManyPicks = mode === 'different_product' && picks.length > 0 && picks.length > quantity;

  // Exchanging into something dearer isn't offered — the backend refuses it
  // outright (`ExchangesService.request`) and the storefront won't let one be
  // selected. A pick can still turn up here if its price changed after it was
  // selected, so it's flagged rather than silently submitted and rejected.
  const overPricedPicks = picks.filter((p) => Number(p.price) > itemUnitPrice);
  const hasOverPricedPick = mode === 'different_product' && overPricedPicks.length > 0;

  /**
   * What this exchange actually costs the customer: only the courier charge,
   * and only when something is being shipped back out. A credit-only
   * exchange posts nothing, so it is never charged for shipping.
   *
   * Charged per parcel: each replacement the shopper picked becomes its own
   * exchange request and its own delivery, so two replacements means two
   * courier charges — said out loud below rather than left as a surprise.
   */
  const shipments =
    mode === 'credit_only' ? 0 : mode === 'same_product' ? 1 : pickAssignments.filter((q) => q > 0).length;
  const payableCourierCharge = Number((courierCharge * shipments).toFixed(2));
  const canPayCourierFromWallet = walletBalance !== null && walletBalance >= payableCourierCharge;
  // Paying online means paying it on the replacement order, and only a
  // different-product exchange creates one — a same-product swap ships off
  // the original order, which was paid for long ago and has nothing left to
  // charge against.
  const canPayCourierOnline = mode === 'different_product';

  // A stale payment choice must not silently carry over once what's being
  // charged changes — nor once the route changes, since switching to a
  // same-product swap withdraws the online option entirely.
  useEffect(() => {
    setCourierPaymentMethod('');
  }, [payableCourierCharge, mode]);

  /** "Browse Products" — send the shopper shopping normally instead of asking them to type a product name. */
  const handleBrowseProducts = () => {
    startExchangePicker({
      orderId,
      orderNumber,
      orderItemId: item.id,
      itemName: item.productName,
      itemImage: item.productImage || undefined,
      itemPrice: itemUnitPrice,
      quantity,
      itemCredit,
      // Carried so nothing typed so far is lost while they shop.
      draft: { reason, otherReason, customerNotes, videoUrl, videoName },
    });
    onClose();
    router.push('/');
  };

  const handleVideoChange = async (file: File | undefined) => {
    if (!file) return;
    setVideoError('');
    setUploadingVideo(true);
    try {
      const token = localStorage.getItem('token');
      const body = new FormData();
      body.append('file', file);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/upload/exchange-video`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Upload failed. Please try again.');
      }
      const data = await res.json();
      setVideoUrl(data.url);
      setVideoName(file.name);
      // Persist immediately — a shopper who uploads and then goes off to
      // browse should not have to upload the same clip twice.
      // `updateExchangeDraft` is a safe no-op with no session open, so this
      // doesn't need to gate on `pickerIsForThisItem` (which reflects the
      // `useExchangePicker` hook and can lag one tick behind a session that
      // was just created).
      updateExchangeDraft({ videoUrl: data.url, videoName: file.name });
      setError('');
    } catch (err: any) {
      setVideoError(err?.message || 'Upload failed. Please try again.');
    } finally {
      setUploadingVideo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearVideo = () => {
    setVideoUrl('');
    setVideoName('');
    // The one place an empty value is a deliberate write, not a stale one —
    // `updateExchangeDraft` (unlike `startExchangePicker`'s merge) always
    // applies exactly what it's given.
    updateExchangeDraft({ videoUrl: '', videoName: '' });
  };

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!videoUrl) {
      setError('Attach a video of the item — every exchange request needs one.');
      return;
    }
    if (mode === 'same_product' && !selectedVariantId) {
      setError('Choose which option you want instead.');
      return;
    }
    if (mode === 'different_product' && picks.length === 0) {
      setError('Browse the store and select at least one replacement.');
      return;
    }
    if (tooManyPicks) {
      setError(`You've selected ${picks.length} replacements but are only exchanging ${quantity} unit${quantity === 1 ? '' : 's'} — remove some, or raise the quantity below.`);
      return;
    }
    if (hasOverPricedPick) {
      setError(
        `${overPricedPicks[0].name} costs more than the item you're exchanging — remove it and pick something at ₹${itemUnitPrice.toFixed(2)} or under.`,
      );
      return;
    }
    if (payableCourierCharge > 0 && !courierPaymentMethod) {
      setError('Choose how you want to pay the courier charge.');
      return;
    }
    const finalReason = reason === 'other' ? otherReason.trim() : reason;
    if (!finalReason) {
      setError('Let us know why you want to exchange this item.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const submissions: ExchangeSubmission[] =
        mode === 'different_product'
          ? picks
              .map((p, i) => ({
                quantity: pickAssignments[i] || 0,
                reason: finalReason,
                exchangeVariantId: p.variantId,
                videoUrl,
                customerNotes: customerNotes.trim() || undefined,
                courierChargePaymentMethod: courierCharge > 0 ? (courierPaymentMethod as CourierPaymentMethod) : undefined,
              }))
              .filter((s) => s.quantity > 0)
          : [
              {
                quantity,
                reason: finalReason,
                exchangeVariantId: mode === 'same_product' ? selectedVariantId : undefined,
                videoUrl,
                customerNotes: customerNotes.trim() || undefined,
                courierChargePaymentMethod:
                  mode === 'same_product' && courierCharge > 0
                    ? (courierPaymentMethod as CourierPaymentMethod)
                    : undefined,
              },
            ];
      await onSubmit(submissions);
      // Only this item's session — a picker left open for a different item
      // is someone else's half-finished exchange, not ours to end.
      if (pickerIsForThisItem) clearExchangePicker();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit exchange request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Ends the browsing session too — leaving it running puts a "return to
    // your exchange" bar on every page of a store the shopper has walked
    // away from.
    if (pickerIsForThisItem) clearExchangePicker();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-card shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card p-4">
          <h2 className="text-lg font-bold text-foreground">Request Exchange</h2>
          <button onClick={handleCancel} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-4">
          <p className="text-sm text-muted-foreground">
            Order #{orderNumber} — {item.productName}
          </p>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ---- 1. Video (required) ---- */}
          <div>
            <label className="mb-1 block text-sm font-medium text-foreground">
              Video of the item <span className="text-red-600">*</span>
            </label>
            <p className="mb-2 text-xs text-muted-foreground">
              Record a short clip showing the item and what&apos;s wrong with it. We can&apos;t review an
              exchange without one. MP4, MOV or WebM, up to 100MB.
            </p>

            {videoUrl ? (
              <div className="rounded-lg border border-green-300 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2 text-sm text-green-800 dark:text-green-300">
                    <Check className="h-4 w-4 shrink-0" />
                    <span className="truncate">{videoName || 'Video attached'}</span>
                  </span>
                  <button
                    onClick={clearVideo}
                    className="flex shrink-0 items-center gap-1 text-xs text-red-600 hover:underline"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                </div>
                <video src={videoUrl} controls className="max-h-48 w-full rounded bg-black" />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingVideo}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/50 p-4 text-sm font-medium text-primary hover:bg-primary/5 disabled:opacity-50"
              >
                <Video className="h-4 w-4" />
                {uploadingVideo ? 'Uploading…' : 'Record or upload a video'}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              // No `capture` attribute on purpose: it would force the camera
              // on mobile and block choosing a clip already in the gallery.
              className="hidden"
              onChange={(e) => handleVideoChange(e.target.files?.[0])}
            />
            {videoError && <p className="mt-2 text-xs text-red-600">{videoError}</p>}
          </div>

          {/* ---- 2. What they want ---- */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">What would you like?</label>
            <div className="grid grid-cols-1 gap-2">
              {MODE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 ${
                    mode === opt.value ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="exchangeMode"
                    className="mt-1"
                    checked={mode === opt.value}
                    onChange={() => setMode(opt.value)}
                  />
                  <span>
                    <span className="block text-sm text-foreground">{opt.label}</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{opt.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {mode === 'same_product' && (
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Exchange for</label>
              {loadingVariants ? (
                <p className="text-sm text-muted-foreground">Loading options…</p>
              ) : variants.length === 0 ? (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                  No other size or option of this item is in stock right now. Choose{' '}
                  <strong>a different product</strong> or <strong>store credit</strong> above instead.
                </div>
              ) : (
                <div className="space-y-2">
                  {variants.map((v) => (
                    <label
                      key={v.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 ${
                        selectedVariantId === v.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                      }`}
                    >
                      <input
                        type="radio"
                        name="exchangeVariant"
                        checked={selectedVariantId === v.id}
                        onChange={() => setSelectedVariantId(v.id)}
                      />
                      <span className="flex-1 text-sm text-foreground">
                        {formatVariantLabel(v.variantAttributes) || v.sku}
                      </span>
                      <span className="text-xs text-muted-foreground">{v.stockQuantity} in stock</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {mode === 'different_product' && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">How this works</p>
                <ol className="mt-1 list-decimal space-y-0.5 pl-4">
                  <li>
                    Browse the store — hit &quot;Select for Exchange&quot; on anything priced at
                    ₹{itemUnitPrice.toFixed(2)} or under (any number of items).
                  </li>
                  <li>Come back here and submit — everything you selected is used, no extra picking here.</li>
                  <li>
                    Once we receive and check the returned item, ₹{itemCredit.toFixed(2)} goes to your store
                    credit and we place the replacement order(s) for you.
                  </li>
                </ol>
              </div>

              {picks.length > 0 && (
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="block text-sm font-medium text-foreground">
                      Your replacement{picks.length > 1 ? 's' : ''}
                    </label>
                    {picks.length > 1 && (
                      <span className={`text-xs ${tooManyPicks ? 'text-red-600' : 'text-muted-foreground'}`}>
                        {quantity} unit{quantity === 1 ? '' : 's'} split across {picks.length}
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
                    {picks.map((p, i) => {
                      const assignedQty = pickAssignments[i] || 0;
                      const overPriced = Number(p.price) > itemUnitPrice;
                      return (
                        <div
                          key={`${p.productId}:${p.variantId}`}
                          className={`flex items-center gap-3 p-2 ${
                            overPriced ? 'bg-red-50 dark:bg-red-900/20' : ''
                          }`}
                        >
                          {p.image && <img src={p.image} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />}
                          <div className="min-w-0 flex-1">
                            <span className="block truncate text-sm text-foreground">{p.name}</span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {p.variantLabel}
                              {!tooManyPicks && picks.length > 1 && ` · Qty ${assignedQty}`}
                            </span>
                          </div>
                          <span className="shrink-0 text-right">
                            <span className="block text-sm text-foreground">₹{Number(p.price).toFixed(2)}</span>
                            {!tooManyPicks && (
                              <span
                                className={`block text-xs ${overPriced ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}
                              >
                                {overPriced ? 'costs more — remove' : 'covered'}
                              </span>
                            )}
                          </span>
                          <button
                            onClick={() => removeExchangePick(p.productId, p.variantId)}
                            aria-label={`Remove ${p.name}`}
                            className="shrink-0 text-muted-foreground hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {tooManyPicks && (
                    <p className="mt-2 text-xs text-red-600">
                      That&apos;s more replacements than units you&apos;re exchanging — remove one, or raise the
                      quantity below.
                    </p>
                  )}
                  {hasOverPricedPick && (
                    <p className="mt-2 text-xs text-red-600">
                      An exchange has to be for something of the same value or less. Remove anything above
                      ₹{itemUnitPrice.toFixed(2)} — the price may have changed since you selected it.
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={handleBrowseProducts}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/50 p-3 text-sm font-medium text-primary hover:bg-primary/5"
              >
                <ShoppingBag className="h-4 w-4" />
                {picks.length > 0 ? 'Browse for another option' : 'Browse Products'}
              </button>
              <p className="text-xs text-muted-foreground">
                {picks.length > 0
                  ? 'Anything you already selected is kept — browsing again just adds to the list.'
                  : "This takes you to the store. Open an item, choose its size, and hit “Select for Exchange” — then use the bar at the bottom of the screen to come back here."}
              </p>

            </div>
          )}

          {/* ---- Courier charge ----
              The only thing an exchange can cost, and the one decision the
              customer gets to make about payment: it is theirs to choose
              here, rather than being pushed onto whatever the original
              order was paid by. Hidden entirely when the store charges
              nothing (`exchange_courier_charge` = 0). */}
          {payableCourierCharge > 0 && !tooManyPicks && !hasOverPricedPick && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/20">
              <p className="text-sm font-medium text-foreground">
                Courier charge: ₹{payableCourierCharge.toFixed(2)}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {shipments > 1
                  ? `₹${courierCharge.toFixed(2)} for each of the ${shipments} replacements we'll send you.`
                  : 'For posting your replacement out to you.'}{' '}
                Choose how you&apos;d like to pay it.
              </p>
              <div className="mt-2 space-y-2">
                <label
                  className={`flex items-center gap-2 rounded-lg border p-2 ${
                    !canPayCourierFromWallet
                      ? 'cursor-not-allowed opacity-50'
                      : courierPaymentMethod === 'wallet'
                        ? 'cursor-pointer border-primary bg-primary/5'
                        : 'cursor-pointer border-border hover:bg-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="courierPaymentMethod"
                    disabled={!canPayCourierFromWallet}
                    checked={courierPaymentMethod === 'wallet'}
                    onChange={() => setCourierPaymentMethod('wallet')}
                  />
                  <span className="text-sm text-foreground">
                    Pay from store credit
                    {walletBalance === null
                      ? ' (checking…)'
                      : ` (₹${walletBalance.toFixed(2)} available${canPayCourierFromWallet ? '' : ' — not enough'})`}
                    <span className="block text-xs text-muted-foreground">
                      Taken only when your replacement actually ships.
                    </span>
                  </span>
                </label>
                <label
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 ${
                    courierPaymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                  }`}
                >
                  <input
                    type="radio"
                    name="courierPaymentMethod"
                    checked={courierPaymentMethod === 'cod'}
                    onChange={() => setCourierPaymentMethod('cod')}
                  />
                  <span className="text-sm text-foreground">
                    Pay ₹{payableCourierCharge.toFixed(2)} on delivery
                    <span className="block text-xs text-muted-foreground">
                      Cash or UPI to the courier when the replacement{shipments > 1 ? 's arrive' : ' arrives'}.
                    </span>
                  </span>
                </label>
                {canPayCourierOnline ? (
                  <label
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 ${
                      courierPaymentMethod === 'online' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
                    }`}
                  >
                    <input
                      type="radio"
                      name="courierPaymentMethod"
                      checked={courierPaymentMethod === 'online'}
                      onChange={() => setCourierPaymentMethod('online')}
                    />
                    <span className="text-sm text-foreground">
                      Pay online — card, UPI or netbanking
                      <span className="block text-xs text-muted-foreground">
                        Nothing to pay now. Once we&apos;ve checked your returned item we place your
                        replacement order, and a <strong>Pay Now</strong> button appears on it in My Orders.
                      </span>
                    </span>
                  </label>
                ) : (
                  <p className="rounded-lg border border-dashed border-border p-2 text-xs text-muted-foreground">
                    Paying online isn&apos;t available for a straight size or colour swap — there&apos;s no new
                    order for the charge to sit on. Choose a different product above if you&apos;d rather pay by
                    card or UPI.
                  </p>
                )}
              </div>
            </div>
          )}

          {mode === 'credit_only' && (
            <p className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">
              Once we receive and inspect the returned item, ₹{itemCredit.toFixed(2)} will be added to your
              store credit, which you can use on any future order.
            </p>
          )}

          {/* ---- 3. Details ---- */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Quantity</label>
            <input
              type="number"
              min={1}
              max={item.quantity}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(item.quantity, Number(e.target.value) || 1)))}
              className="w-24 rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Up to {item.quantity} ordered — worth ₹{itemCredit.toFixed(2)}
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Reason <span className="text-red-600">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            >
              <option value="">Select a reason</option>
              {EXCHANGE_REASONS.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
            {reason === 'other' && (
              <input
                type="text"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder="Tell us more"
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
              />
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Notes (optional)</label>
            <textarea
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-foreground"
            />
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-border bg-card p-4">
          {/* Says why the button is off rather than leaving a dead control —
              a disabled Submit with no explanation was a reliable way to get
              stuck in this form. */}
          {(() => {
            const blocker = !videoUrl
              ? 'Attach a video of the item to continue.'
              : mode === 'same_product' && variants.length === 0
                ? 'No other option of this item is available — pick a different product or store credit above.'
                : mode === 'same_product' && !selectedVariantId
                  ? 'Choose which option you want instead.'
                  : mode === 'different_product' && picks.length === 0
                    ? 'Browse the store and select at least one replacement.'
                    : tooManyPicks
                      ? 'Remove a replacement, or raise the quantity, so they match.'
                      : hasOverPricedPick
                        ? `Remove anything that costs more than ₹${itemUnitPrice.toFixed(2)} — an exchange can't be for something dearer.`
                        : payableCourierCharge > 0 && !courierPaymentMethod
                          ? 'Choose how to pay the courier charge.'
                          : !(reason === 'other' ? otherReason.trim() : reason)
                            ? 'Select a reason for the exchange.'
                            : '';
            return (
              <>
                {blocker && <p className="mb-2 text-xs text-muted-foreground">{blocker}</p>}
                <div className="flex justify-end gap-3">
                  <button
                    onClick={handleCancel}
                    disabled={submitting}
                    className="rounded-lg border border-border px-4 py-2 font-medium text-foreground hover:bg-muted"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || uploadingVideo || !!blocker}
                    className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {submitting ? 'Submitting…' : 'Submit Request'}
                  </button>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
