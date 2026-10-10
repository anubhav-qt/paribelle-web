/**
 * A bag line's name carries its variant ("Anarkali Set — M / Mustard Yellow"),
 * which checkout and the stock notices need to tell two sizes apart. The bag
 * drawer and the cart page list the variant on its own line under the title,
 * so they show the name without it.
 */
export function cartItemTitle(item: { name: string; variantAttributes?: Record<string, unknown> | null }): string {
  const values = Object.values(item.variantAttributes || {});
  if (values.length === 0) return item.name;
  const suffix = ` — ${values.join(' / ')}`;
  return item.name.endsWith(suffix) ? item.name.slice(0, -suffix.length) : item.name;
}
