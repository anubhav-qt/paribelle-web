/**
 * Feature flags for storefront sections that are built and working but not
 * ready to be public. Gating with a flag — rather than commenting the code
 * out — means flipping a section back on is a one-line env change, not a
 * re-implementation.
 */

/**
 * The Lookbook route and its nav links. Off by default: set
 * `NEXT_PUBLIC_LOOKBOOK_ENABLED=true` to bring it back.
 */
export const LOOKBOOK_ENABLED = process.env.NEXT_PUBLIC_LOOKBOOK_ENABLED === 'true';

/**
 * Cash on Delivery at checkout and as a way to pay an exchange's courier fee.
 * Off: the store takes prepaid orders only. Past COD orders keep their admin
 * handling (cash to collect, refused at the door). Set
 * `NEXT_PUBLIC_COD_ENABLED=true` (and `COD_ENABLED=true` on the API) to bring
 * it back.
 */
export const COD_ENABLED = process.env.NEXT_PUBLIC_COD_ENABLED === 'true';
