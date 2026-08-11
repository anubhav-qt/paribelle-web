'use client';

// Note: This page uses 'use client' for interactive features
// ISR can still be configured when converted to Server Component in the future

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Star, Heart, Share2, Package, Facebook, Twitter, Linkedin, Link as LinkIcon, Check } from 'lucide-react';
import ProductImageGallery from '@/components/ProductImageGallery';
import VariationSelector from '@/components/VariationSelector';
import ProductVariantSelector from '@/components/ProductVariantSelector';
import ReviewCard from '@/components/ReviewCard';
import ReviewForm from '@/components/ReviewForm';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { Rating } from '@/components/ui/Rating';
import { Accordion } from '@/components/ui/Accordion';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { ProductRail } from '@/components/home/ProductRail';
import { getCurrencySymbol } from '@/lib/currency';
import { useCart } from '@/contexts/CartContext';
import { useWishlist } from '@/contexts/WishlistContext';
import { usePolicies } from '@/contexts/PoliciesContext';
import { cn } from '@/lib/utils';
import { Product as BaseProduct, ProductVariant } from '@/types/product';

// Extend the base Product type with additional fields specific to this page
interface Product extends BaseProduct {
  priceType?: string; // 'mrp_with_gst' | 'selling_price_without_gst'
  gstRate?: number; // GST rate in percentage
}

/**
 * Stock for whatever the shopper has actually selected — the chosen variation
 * or variant when the product has them, the product's own figure otherwise.
 *
 * `null` means "not known yet": nothing is selected, or the API omitted the
 * figure. It is deliberately distinct from `0`, which means out of stock. The
 * three copies of this logic that this replaced each fell back to `999`, which
 * is why a product with two in stock advertised "999 in stock".
 */
function availableStock(
  product: Pick<Product, 'isParent' | 'hasVariants' | 'stockQuantity'>,
  selectedVariation: { stockQuantity?: number } | null,
  selectedVariant: { stockQuantity?: number } | null,
): number | null {
  if (product.isParent) return selectedVariation?.stockQuantity ?? null;
  if (product.hasVariants) return selectedVariant?.stockQuantity ?? null;
  return product.stockQuantity ?? null;
}

/** Cap on the quantity stepper while stock is still unknown. */
const UNKNOWN_STOCK_LIMIT = 99;

export default function ProductDetailPage() {
  const params = useParams();
  const productSlug = params.slug as string;
  const router = useRouter();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { fetchVendorPolicies } = usePolicies();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [addToCartLoading, setAddToCartLoading] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [currency, setCurrency] = useState('INR');
  const [thumbnailLayout, setThumbnailLayout] = useState<'vertical' | 'horizontal'>('vertical');
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [vendorReturnPolicy, setVendorReturnPolicy] = useState<any>(null);
  const [vendorCancellationPolicy, setVendorCancellationPolicy] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [vendorStats, setVendorStats] = useState<any>(null);
  const [showReviews, setShowReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [userOrderItemId, setUserOrderItemId] = useState<string | undefined>();
  const [selectedVariation, setSelectedVariation] = useState<any>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  // Clamp quantity to available stock whenever stock or variant changes
  useEffect(() => {
    if (!product) return;

    const maxStock = availableStock(product, selectedVariation, selectedVariant) ?? UNKNOWN_STOCK_LIMIT;

    if (quantity > maxStock) {
      setQuantity(Math.max(1, maxStock));
    }
  }, [product, selectedVariation, selectedVariant, quantity]);

  useEffect(() => {
    // Reset product state when slug changes to prevent showing stale data
    setProduct(null);
    setLoading(true);
    setQuantity(1);

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/currency`)
      .then(res => res.json())
      .then(data => setCurrency(data.value || 'INR'))
      .catch(err => console.error('Error fetching currency setting:', err));

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/settings/thumbnailLayout`)
      .then(res => res.json())
      .then(data => setThumbnailLayout(data.value || 'vertical'))
      .catch(err => console.error('Error fetching thumbnail layout setting:', err));

    fetchProduct();

    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productSlug]);

  const fetchReviews = async (productId: string) => {
    try {
      setReviewsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/reviews/products/${productId}?page=1&limit=10`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);

        if (product && (data.total !== product.reviewCount || data.averageRating !== product.averageRating)) {
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/reviews/products/${productId}/recalculate`, {
            method: 'POST'
          }).catch(err => console.error('Failed to recalculate ratings:', err));

          setProduct({
            ...product,
            reviewCount: data.total,
            averageRating: data.averageRating || 0
          });
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchVendorStats = async (vendorId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/reviews/vendors/${vendorId}/stats`);
      if (response.ok) {
        const data = await response.json();
        setVendorStats(data);
      }
    } catch (error) {
      console.error('Error fetching vendor stats:', error);
    }
  };

  const handleShowReviews = () => {
    setShowReviews(!showReviews);
    if (!showReviews && reviews.length === 0 && product?.id) {
      fetchReviews(product.id);
    }
  };

  const checkUserPurchase = async (productId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/orders?status=delivered`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.ok) {
        const orders = await response.json();
        for (const order of orders) {
          const orderItem = order.items?.find((item: any) => item.productId === productId);
          if (orderItem) {
            setHasPurchased(true);
            setUserOrderItemId(orderItem.id);
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error checking purchase status:', error);
    }
  };

  const handleWriteReview = () => {
    if (!isLoggedIn) {
      alert('Please login to write a review');
      router.push('/login');
      return;
    }
    setShowReviewForm(true);
    setShowReviews(true);
  };

  const handleReviewSubmit = async (data: any) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/reviews/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product?.id,
          rating: data.rating,
          comment: data.comment,
          orderItemId: userOrderItemId,
        }),
      });

      if (response.ok) {
        setShowReviewForm(false);
        if (product?.id) {
          await fetchReviews(product.id);
          await fetchProduct();
        }
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to submit review');
      }
    } catch (error) {
      alert('Failed to submit review. Please try again.');
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products/slug/${productSlug}`);
      if (response.ok) {
        const productData = await response.json();
        setProduct(productData);

        if (productData.id) checkUserPurchase(productData.id);

        if (productData.vendorId) {
          const policies = await fetchVendorPolicies(productData.vendorId);
          setVendorReturnPolicy(policies.returnPolicy);
          setVendorCancellationPolicy(policies.cancellationPolicy);
          fetchVendorStats(productData.vendorId);
        }

        // Complete the look: other products from the same first category
        if (productData.categories?.[0]?.slug) {
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/products?categoryId=${productData.categories[0].id}`)
            .then((r) => (r.ok ? r.json() : []))
            .then((related) => setRelatedProducts((related || []).filter((p: any) => p.id !== productData.id).slice(0, 8)))
            .catch(() => {});
        }
      } else {
        setProduct(null);
      }
    } catch (error) {
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  /** Returns whether the line actually made it into the cart. */
  const handleAddToCart = (): boolean => {
    if (!product) return false;

    if (product.isParent && !selectedVariation) {
      alert('Please select all product options.');
      return false;
    }
    if (product.hasVariants && !selectedVariant) {
      alert('Please select all product options.');
      return false;
    }

    const stockQuantity = availableStock(product, selectedVariation, selectedVariant);

    if (stockQuantity !== null) {
      if (stockQuantity === 0) {
        alert('Sorry, this product is out of stock.');
        return false;
      }
      if (quantity > stockQuantity) {
        alert(`Sorry, only ${stockQuantity} items available.`);
        return false;
      }
    }

    setAddToCartLoading(true);

    try {
      let added: boolean;
      if (product.hasVariants && selectedVariant) {
        const attrSuffix = Object.values(selectedVariant.variantAttributes || {}).join(' / ');
        added = addToCart({
          productId: product.id,
          variantId: selectedVariant.id,
          variantSku: selectedVariant.sku,
          variantAttributes: selectedVariant.variantAttributes,
          name: attrSuffix ? `${product.name} — ${attrSuffix}` : product.name,
          slug: product.slug,
          price: Number(selectedVariant.price),
          quantity: quantity,
          image: selectedVariant.images?.[0] || product.images?.[0] || product.featuredImage || '/placeholder-product.png',
          vendorId: product.vendorId || '',
          stockQuantity: selectedVariant.stockQuantity,
          maxQuantity: selectedVariant.stockQuantity,
          priceType: product.priceType || 'mrp_with_gst',
          gstRate: product.gstRate || 18,
        });
      } else {
        added = addToCart({
          productId: selectedVariation?.id || product.id,
          variantAttributes: selectedVariation?.variationAttributes,
          name: selectedVariation ? `${product.name} - ${Object.values(selectedVariation.variationAttributes).join(' ')}` : product.name,
          slug: selectedVariation?.slug || product.slug,
          price: Number(selectedVariation?.price || product.price),
          quantity: quantity,
          image: (selectedVariation?.images?.[0] || selectedVariation?.featuredImage) || product.images?.[0] || product.featuredImage || '/placeholder-product.png',
          vendorId: product.vendorId || '',
          stockQuantity: stockQuantity ?? undefined,
          maxQuantity: stockQuantity ?? undefined,
          priceType: product.priceType || 'mrp_with_gst',
          gstRate: product.gstRate || 18,
        });
      }

      if (added) setQuantity(1);
      return added;
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
      return false;
    } finally {
      setAddToCartLoading(false);
    }
  };

  /**
   * Add, then go straight to checkout — but only if the add succeeded. This
   * used to fire a 500ms timer and a hard `window.location` assignment
   * unconditionally, which navigated away from an out-of-stock warning nobody
   * had read yet and tore down whatever requests the page still had open.
   */
  const handleBuyNow = () => {
    if (handleAddToCart()) router.push('/checkout');
  };

  const handleWishlistToggle = () => {
    if (product) {
      toggleWishlist({
        productId: product.id,
        name: product.name,
        slug: product.slug,
        price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
        image: product.featuredImage || '/placeholder-product.png',
        vendorId: product.vendorId || '',
        addedAt: Date.now(),
      });
    }
  };

  const handleShare = (platform: string) => {
    if (!product) return;

    const url = window.location.href;
    const title = product.name;
    let shareUrl = '';

    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
          setShowShareMenu(false);
        }, 2000);
        return;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
      setShowShareMenu(false);
    }
  };

  const getDiscount = (price: string | number, compareAtPrice?: string | number) => {
    if (!compareAtPrice || Number(compareAtPrice) <= Number(price)) return null;
    return Math.round(((Number(compareAtPrice) - Number(price)) / Number(compareAtPrice)) * 100);
  };

  const getDisplayPrice = () => {
    if (selectedVariant) return Number(selectedVariant.price);
    if (selectedVariation) return Number(selectedVariation.price);
    if (product?.hasVariants && product.productVariants && product.productVariants.length > 0) {
      return Math.min(...product.productVariants.map((v: any) => Number(v.price)));
    }
    if (product?.isParent && product.variations && product.variations.length > 0) {
      return Math.min(...product.variations.map((v: any) => Number(v.price)));
    }
    return Number(product?.price || 0);
  };

  const getBestDiscount = () => {
    if (selectedVariant) return getDiscount(selectedVariant.price, selectedVariant.compareAtPrice);
    if (selectedVariation) return getDiscount(selectedVariation.price, selectedVariation.compareAtPrice);

    if (product?.hasVariants && product.productVariants && product.productVariants.length > 0) {
      const variantDiscounts = product.productVariants
        .filter((v: any) => v.compareAtPrice && Number(v.compareAtPrice) > Number(v.price))
        .map((v: any) => getDiscount(v.price, v.compareAtPrice))
        .filter((d): d is number => d !== null);
      if (variantDiscounts.length > 0) return Math.max(...variantDiscounts);
    }

    if (product?.isParent && product.variations && product.variations.length > 0) {
      const variantDiscounts = product.variations
        .filter((v: any) => v.compareAtPrice && Number(v.compareAtPrice) > Number(v.price))
        .map((v: any) => getDiscount(v.price, v.compareAtPrice))
        .filter((d): d is number => d !== null);
      if (variantDiscounts.length > 0) return Math.max(...variantDiscounts);
    }

    if (product?.price) return getDiscount(product.price, product.compareAtPrice);
    return null;
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
        <div className="grid gap-10 md:grid-cols-2">
          <Skeleton className="aspect-[4/5] w-full" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-10 w-1/3" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <EmptyState
        icon={<Package className="h-10 w-10" />}
        title="Product not found"
        action={
          <Link href="/">
            <Button size="sm">Go to Home</Button>
          </Link>
        }
        className="min-h-[50vh]"
      />
    );
  }

  const discount = getBestDiscount();
  const stockOnHand = availableStock(product, selectedVariation, selectedVariant);
  const maxStock = stockOnHand ?? UNKNOWN_STOCK_LIMIT;
  const outOfStock = stockOnHand === 0;
  const needsSelection = (product.isParent && !selectedVariation) || (product.hasVariants && !selectedVariant);

  const accordionItems = [
    {
      id: 'description',
      title: 'Description',
      content: product.description ? (
        <div className="prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: product.description }} />
      ) : (
        <p>{product.shortDescription}</p>
      ),
    },
    ...(vendorReturnPolicy?.enabled || vendorCancellationPolicy?.enabled
      ? [
          {
            id: 'shipping-returns',
            title: 'Shipping & Returns',
            content: (
              <div className="space-y-3">
                {vendorReturnPolicy?.enabled && (
                  <div>
                    <p className="font-medium text-[hsl(var(--pb-ink))]">Return Policy</p>
                    <p>{vendorReturnPolicy.text}</p>
                  </div>
                )}
                {vendorCancellationPolicy?.enabled && (
                  <div>
                    <p className="font-medium text-[hsl(var(--pb-ink))]">Cancellation Policy</p>
                    <p>{vendorCancellationPolicy.text}</p>
                  </div>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="bg-[hsl(var(--pb-ivory))]">
      <div className="mx-auto max-w-7xl px-4 pt-6 md:px-8">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            ...(product.categories?.[0]
              ? [{ label: product.categories[0].name, href: `/category/${product.categories[0].slug}` }]
              : []),
            { label: product.name },
          ]}
        />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
        <div className="grid gap-10 md:grid-cols-2">
          {/* Gallery */}
          <ProductImageGallery
            images={product.images && product.images.length > 0 ? product.images : [product.featuredImage || '/placeholder-image.svg']}
            productName={product.name}
            discount={discount || undefined}
            layout={thumbnailLayout}
          />

          {/* Buy panel */}
          <div className="flex flex-col">
            {product.categories?.[0] && (
              <p className="text-eyebrow text-[hsl(var(--pb-rose-deep))]">{product.categories[0].name}</p>
            )}
            <h1 className="mt-2 font-display text-3xl text-[hsl(var(--pb-ink))]">{product.name}</h1>

            {(product.reviewCount ?? 0) > 0 && (
              <button onClick={handleShowReviews} className="mt-3 w-fit">
                <Rating value={Number(product.averageRating)} count={product.reviewCount ?? 0} />
              </button>
            )}

            {product.hasVariants && product.variantOptions && product.productVariants && product.productVariants.length > 0 && (
              <div className="mt-6">
                <ProductVariantSelector
                  variantOptions={product.variantOptions}
                  productVariants={product.productVariants || []}
                  onVariantSelect={setSelectedVariant}
                  currency={currency}
                />
              </div>
            )}

            {product.isParent && product.variations && product.variations.length > 0 && product.variationThemes && (
              <div className="mt-6">
                <VariationSelector
                  variations={product.variations}
                  variationThemes={product.variationThemes}
                  currentPrice={typeof product.price === 'string' ? parseFloat(product.price) : product.price}
                  currency={getCurrencySymbol(currency)}
                  onVariationSelect={(variation) => setSelectedVariation(variation)}
                />
              </div>
            )}

            <div className="mt-6">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-3xl text-[hsl(var(--pb-ink))]">
                  {needsSelection && <span className="mr-1 text-lg font-normal text-[hsl(var(--pb-ink-faint))]">From</span>}
                  {getCurrencySymbol(currency)}{getDisplayPrice().toLocaleString()}
                </span>
                {selectedVariant?.compareAtPrice && Number(selectedVariant.compareAtPrice) > Number(selectedVariant.price) && (
                  <>
                    <span className="text-[hsl(var(--pb-ink-faint))] line-through">{getCurrencySymbol(currency)}{Number(selectedVariant.compareAtPrice).toLocaleString()}</span>
                    <span className="font-medium text-[hsl(var(--pb-danger))]">{getDiscount(selectedVariant.price, selectedVariant.compareAtPrice)}% off</span>
                  </>
                )}
                {!selectedVariant && !selectedVariation && !product.hasVariants && !product.isParent && product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                  <>
                    <span className="text-[hsl(var(--pb-ink-faint))] line-through">{getCurrencySymbol(currency)}{Number(product.compareAtPrice).toLocaleString()}</span>
                    <span className="font-medium text-[hsl(var(--pb-danger))]">{discount}% off</span>
                  </>
                )}
                {product.isParent && !selectedVariation && getBestDiscount() && (
                  <span className="font-medium text-[hsl(var(--pb-danger))]">Up to {getBestDiscount()}% off</span>
                )}
              </div>
              <p className="mt-1 text-xs text-[hsl(var(--pb-ink-faint))]">Inclusive of all taxes</p>
            </div>

            <div className="mt-6">
                <p className="mb-2 text-sm font-medium text-[hsl(var(--pb-ink))]">Quantity</p>
                <QuantityStepper
                  value={needsSelection ? 1 : quantity}
                  onChange={(q) => {
                    if (q > maxStock) {
                      alert(`Cannot add more. Maximum ${maxStock} items available in stock.`);
                      return;
                    }
                    setQuantity(q);
                  }}
                  max={maxStock}
                  disabled={needsSelection}
                />
                {stockOnHand !== null && (
                  <p className="mt-2 text-xs text-[hsl(var(--pb-ink-faint))]">
                    {stockOnHand > 0 ? `${stockOnHand} in stock` : 'Out of stock'}
                  </p>
                )}
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                size="lg"
                fullWidth
                loading={addToCartLoading}
                disabled={addToCartLoading || needsSelection || outOfStock}
                onClick={handleAddToCart}
              >
                {needsSelection ? 'Select Options' : outOfStock ? 'Sold Out' : 'Add to Bag'}
              </Button>
              <Button
                size="lg"
                variant="secondary"
                fullWidth
                disabled={addToCartLoading || needsSelection || outOfStock}
                onClick={handleBuyNow}
              >
                Buy Now
              </Button>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleWishlistToggle}>
                <Heart className={cn('h-4 w-4', product && isInWishlist(product.id) && 'fill-[hsl(var(--pb-rose))] text-[hsl(var(--pb-rose))]')} />
                {product && isInWishlist(product.id) ? 'In Wishlist' : 'Wishlist'}
              </Button>
              <div className="relative">
                <Button variant="ghost" size="sm" onClick={() => setShowShareMenu(!showShareMenu)}>
                  <Share2 className="h-4 w-4" /> Share
                </Button>
                {showShareMenu && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowShareMenu(false)} />
                    <div className="absolute right-0 top-full z-20 mt-2 min-w-[220px] rounded-sm border border-[hsl(var(--pb-linen))] bg-[hsl(var(--pb-ivory))] p-3 shadow-pb-md">
                      {[
                        { key: 'facebook', label: 'Facebook', icon: Facebook },
                        { key: 'twitter', label: 'Twitter', icon: Twitter },
                        { key: 'linkedin', label: 'LinkedIn', icon: Linkedin },
                      ].map(({ key, label, icon: Icon }) => (
                        <button
                          key={key}
                          onClick={() => handleShare(key)}
                          className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-sm text-[hsl(var(--pb-ink))] hover:bg-[hsl(var(--pb-shell))]"
                        >
                          <Icon className="h-4 w-4" /> {label}
                        </button>
                      ))}
                      <button
                        onClick={() => handleShare('copy')}
                        className="flex w-full items-center gap-3 rounded-sm px-2 py-2 text-sm text-[hsl(var(--pb-ink))] hover:bg-[hsl(var(--pb-shell))]"
                      >
                        {copied ? <Check className="h-4 w-4 text-[hsl(var(--pb-success))]" /> : <LinkIcon className="h-4 w-4" />}
                        {copied ? 'Link Copied!' : 'Copy Link'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Accordion items={accordionItems} className="mt-8" />

            {product.categories && product.categories.length > 1 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {product.categories.map((category) => (
                  <Link key={category.id} href={`/category/${category.slug}`}>
                    <Badge variant="neutral">{category.name}</Badge>
                  </Link>
                ))}
              </div>
            )}

            {vendorStats?.totalReviews > 0 && (
              <div className="mt-6 flex items-center gap-4 text-xs text-[hsl(var(--pb-ink-muted))]">
                <Rating value={vendorStats.averageRating} size="sm" showValue={false} />
                <span>({vendorStats.totalReviews} store reviews)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 && (
        <ProductRail eyebrow="Pair It With" title="Complete the Look" products={relatedProducts} />
      )}

      {/* Reviews */}
      <div className="mx-auto max-w-7xl px-4 py-14 md:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-t border-[hsl(var(--pb-linen))] pt-10">
          <div>
            <h2 className="font-display text-2xl text-[hsl(var(--pb-ink))]">Customer Reviews</h2>
            <div className="mt-2">
              {(product.reviewCount ?? 0) > 0 ? (
                <Rating value={Number(product.averageRating)} count={product.reviewCount ?? 0} />
              ) : (
                <p className="text-sm text-[hsl(var(--pb-ink-faint))]">No reviews yet</p>
              )}
            </div>
            {isLoggedIn && !hasPurchased && (
              <p className="mt-2 text-xs text-[hsl(var(--pb-ink-faint))]">Purchase this product to write a verified review</p>
            )}
          </div>
          <div className="flex gap-3">
            {(product.reviewCount ?? 0) > 0 && (
              <Button variant="ghost" size="sm" onClick={handleShowReviews}>
                {showReviews ? 'Hide Reviews' : `View All ${product.reviewCount} Reviews`}
              </Button>
            )}
            <Button size="sm" onClick={handleWriteReview}>
              Write a Review
            </Button>
          </div>
        </div>

        {showReviewForm && (
          <div className="mt-6">
            <ReviewForm
              type="product"
              itemId={product.id}
              itemName={product.name}
              orderItemId={userOrderItemId}
              onSubmit={handleReviewSubmit}
              onCancel={() => setShowReviewForm(false)}
            />
          </div>
        )}

        {showReviews &&
          (reviewsLoading ? (
            <div className="py-8 text-center text-sm text-[hsl(var(--pb-ink-faint))]">Loading reviews…</div>
          ) : reviews.length > 0 ? (
            <div className="mt-6 space-y-6">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Star className="h-10 w-10" />}
              title="No reviews yet"
              description="Be the first to review this product."
              className="mt-6"
            />
          ))}
      </div>
    </div>
  );
}
