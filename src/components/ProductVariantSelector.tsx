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

  /** Whether any in-stock variant carries this value at all. */
  const isSellable = useCallback(
    (optionName: string, value: string) =>
      productVariants.some(
        (variant) => same(attributeOf(variant, optionName), value) && inStock(variant),
      ),
    [productVariants],
  );

  /**
   * Whether this value is buyable alongside what is chosen on the *other*
   * axes. Values that fail are disabled rather than silently wiping the other
   * choice when clicked. Clicking a selected value clears it, so a shopper is
   * never locked in by their first pick.
   */
  const isAvailable = useCallback(
    (optionName: string, value: string) =>
      productVariants.some(
        (variant) =>
          inStock(variant) &&
          same(attributeOf(variant, optionName), value) &&
          Object.entries(selectedAttributes).every(
            ([key, val]) => !val || same(key, optionName) || same(attributeOf(variant, key), val),
          ),
      ),
    [productVariants, selectedAttributes],
  );

  const select = (optionName: string, value: string) => {
    setSelectedAttributes((previous) => {
      if (same(previous[optionName], value)) {
        const { [optionName]: _removed, ...rest } = previous;
        return rest;
      }
      return { ...previous, [optionName]: value };
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
                const available = isSelected || (sellable && isAvailable(option.name, value));

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => available && select(option.name, value)}
                    disabled={!available}
                    title={sellable && !available ? 'Not available with your current selection' : undefined}
                    className={`
                      px-4 py-2 rounded-lg border-2 font-medium text-sm transition-all
                      ${isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : available
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
