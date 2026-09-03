'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProductVariant } from '@/types/product';

interface VariantOption {
  id: string;
  /** The attribute key as the variants actually spell it. */
  name: string;
  /** What to show above the buttons. Falls back to `name`. */
  label?: string;
  values: string[];
}

interface ProductVariantSelectorProps {
  variantOptions: VariantOption[];
  productVariants: ProductVariant[];
  onVariantSelect: (variant: ProductVariant | null) => void;
  /**
   * Every change to the chosen attributes, including partial ones.
   *
   * `onVariantSelect` only fires once *every* axis has a value, which is right
   * for pricing and add-to-cart but too late for the gallery: picking a colour
   * should change the photographs immediately, before a size is chosen.
   */
  onAttributesChange?: (attributes: Record<string, string>) => void;
  currency: string;
}

/** Case- and whitespace-insensitive comparison, for values typed by hand. */
function same(a: unknown, b: unknown): boolean {
  if (a == null || b == null) return false;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

/**
 * Read an attribute off a variant by key, tolerating a difference in case.
 *
 * Attribute keys are typed into the admin and into the import sheet, so the
 * same product can hold both `Colour` and `colour`. An exact-key lookup finds
 * one and misses the other.
 */
function attributeOf(variant: ProductVariant, key: string): string | undefined {
  const attributes = variant.variantAttributes || {};
  const direct = attributes[key];
  if (direct != null) return String(direct);

  const match = Object.keys(attributes).find((k) => same(k, key));
  return match ? String(attributes[match]) : undefined;
}

function inStock(variant: ProductVariant): boolean {
  return Number(variant.stockQuantity) > 0;
}

export default function ProductVariantSelector({
  variantOptions,
  productVariants,
  onVariantSelect,
  onAttributesChange,
  currency,
}: ProductVariantSelectorProps) {
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});

  const selectedVariant = useMemo(() => {
    const allChosen = variantOptions.every((option) => selectedAttributes[option.name]);
    if (!allChosen) return null;

    return (
      productVariants.find((variant) =>
        variantOptions.every((option) =>
          same(attributeOf(variant, option.name), selectedAttributes[option.name]),
        ),
      ) || null
    );
  }, [selectedAttributes, variantOptions, productVariants]);

  useEffect(() => {
    onVariantSelect(selectedVariant);
  }, [selectedVariant, onVariantSelect]);

  useEffect(() => {
    onAttributesChange?.(selectedAttributes);
  }, [selectedAttributes, onAttributesChange]);

  /**
   * Whether any in-stock variant carries this value at all — ignoring what
   * else is currently selected.
   *
   * This is deliberately not "available given the current selection". Judging
   * availability against the other choices, and then disabling everything that
   * failed, is what locked shoppers in: pick Size L and Colour Red on a
   * catalogue holding only (L, Red) and (M, Blue) and every other size *and*
   * every other colour greys out, because each is only stocked alongside the
   * value the shopper would have to change first. Both were in stock; neither
   * could be reached. Only genuinely unbuyable values are disabled here, and
   * `select` below repairs a combination that does not exist.
   */
  const isSellable = useCallback(
    (optionName: string, value: string) =>
      productVariants.some(
        (variant) => same(attributeOf(variant, optionName), value) && inStock(variant),
      ),
    [productVariants],
  );

  /**
   * Choosing a value always takes effect. If no in-stock variant matches the
   * resulting combination, the other choices are dropped and re-derived: the
   * shopper's newest click is the one they meant, so it is kept and the rest
   * give way.
   */
  const select = (optionName: string, value: string) => {
    setSelectedAttributes((previous) => {
      const wanted = { ...previous, [optionName]: value };

      const matches = (candidate: Record<string, string>) =>
        productVariants.some(
          (variant) =>
            inStock(variant) &&
            Object.entries(candidate).every(([key, val]) =>
              same(attributeOf(variant, key), val),
            ),
        );

      if (matches(wanted)) return wanted;

      // Keep the clicked value, then add back as many of the previous choices
      // as still lead somewhere buyable.
      const repaired: Record<string, string> = { [optionName]: value };
      for (const option of variantOptions) {
        if (option.name === optionName) continue;
        const previousValue = previous[option.name];
        if (!previousValue) continue;
        if (matches({ ...repaired, [option.name]: previousValue })) {
          repaired[option.name] = previousValue;
        }
      }
      return repaired;
    });
  };

  const getCurrencySymbol = (curr: string) => {
    const symbols: Record<string, string> = {
      INR: '₹',
      USD: '$',
      EUR: '€',
      GBP: '£',
    };
    return symbols[curr] || curr;
  };

  return (
    <div className="space-y-4">
      {variantOptions.map((option) => {
        const selectedValue = selectedAttributes[option.name];

        return (
          <div key={option.id || option.name} className="space-y-2">
            <label className="text-sm font-semibold text-foreground">
              {option.label || option.name}:
              {selectedValue && (
                <span className="ml-2 font-normal text-primary">{selectedValue}</span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const sellable = isSellable(option.name, value);
                const isSelected = same(selectedValue, value);

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => sellable && select(option.name, value)}
                    disabled={!sellable}
                    className={`
                      px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all
                      ${isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : sellable
                        ? 'border-border hover:border-primary bg-card text-foreground'
                        : 'border-border bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                      }
                    `}
                  >
                    {value}
                    {!sellable && <span className="ml-1 text-xs">(Out of Stock)</span>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Selected Variant Info */}
      {selectedVariant && (
        <div className="mt-4 p-4 bg-accent/10 border border-primary rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Selected Variant</div>
              <div className="font-semibold text-foreground">
                {Object.entries(selectedVariant.variantAttributes)
                  .map(([key, value]) => `${key}: ${value}`)
                  .join(' • ')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                SKU: {selectedVariant.sku}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">
                {getCurrencySymbol(currency)}{Number(selectedVariant.price).toLocaleString()}
              </div>
              {selectedVariant.compareAtPrice && Number(selectedVariant.compareAtPrice) > Number(selectedVariant.price) && (
                <div className="text-sm">
                  <span className="line-through text-muted-foreground">
                    {getCurrencySymbol(currency)}{Number(selectedVariant.compareAtPrice).toLocaleString()}
                  </span>
                  <span className="ml-2 text-green-600 font-semibold">
                    {Math.round(((Number(selectedVariant.compareAtPrice) - Number(selectedVariant.price)) / Number(selectedVariant.compareAtPrice)) * 100)}% OFF
                  </span>
                </div>
              )}
              <div className="text-sm text-green-600 mt-1">
                {selectedVariant.stockQuantity} in stock
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
