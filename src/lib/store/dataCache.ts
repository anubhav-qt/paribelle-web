'use client';

import * as React from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * The storefront's shared read cache.
 *
 * Every non-user-specific GET the storefront makes used to be re-issued on
 * every mount: the header and footer each asked for the category tree, the
 * category and product pages each re-fetched `settings/currency`, and a
 * back-navigation threw all of it away and started again. React Query already
 * held some of these, but its cache lives only in memory — a reload emptied it
 * and every page began with a skeleton again.
 *
 * So reads go through one store instead, with two properties that matter:
 *
 *  - **Cache-first.** A key that already has a value renders it immediately,
 *    with no loading state and no network wait. That is what makes a repeat
 *    visit — or a reload — paint instantly.
 *  - **Revalidate behind the paint.** A value past its TTL is still served
 *    straight away; the refetch happens in the background and swaps in only
 *    once it has resolved. A stale price is corrected a moment later rather
 *    than being replaced by a spinner, and a failed refetch leaves what is on
 *    screen alone rather than blanking it.
 *
 * Entries flagged `persistToDisk` additionally survive a reload via
 * localStorage. That is deliberately limited to the small, slow-moving,
 * *public* config the chrome is built from — the category tree, footer
 * settings, theme, marketplace settings, policies. Two things stay out of it:
 * anything user-specific (cart, wishlist, orders, notifications), which would
 * leak across a logout or between people sharing a device, and bulk catalogue
 * responses, which would blow the ~5MB localStorage budget. Those are still
 * cached — just in memory, for the life of the tab.
 */

interface CacheEntry {
  data: unknown;
  /** Epoch ms of the last successful fetch, for TTL comparisons. */
  fetchedAt: number;
  /** Whether this entry is written through to localStorage. */
  persistToDisk: boolean;
}

interface DataCacheState {
  entries: Record<string, CacheEntry>;
  /**
   * False until localStorage has been read back. Reads wait for this so a
   * cached value isn't missed and refetched, and so the first client render
   * matches the server's (see `skipHydration` below).
   */
  hydrated: boolean;
  put: (key: string, data: unknown, persistToDisk: boolean) => void;
  /** Drop every entry whose key starts with `prefix`. Used after writes. */
  invalidate: (prefix: string) => void;
  markHydrated: () => void;
}

/**
 * A no-op Storage so `createJSONStorage` has something to hold during SSR.
 * Declared above the store because `createJSONStorage` calls its getter
 * eagerly, at store-creation time.
 */
const noopStorage: Storage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
  clear: () => undefined,
  key: () => null,
  length: 0,
};

export const useDataCache = create<DataCacheState>()(
  persist(
    (set) => ({
      entries: {},
      hydrated: false,

      put: (key, data, persistToDisk) =>
        set((state) => ({
          entries: { ...state.entries, [key]: { data, fetchedAt: Date.now(), persistToDisk } },
        })),

      invalidate: (prefix) =>
        set((state) => {
          const entries: Record<string, CacheEntry> = {};
          for (const [key, entry] of Object.entries(state.entries)) {
            if (!key.startsWith(prefix)) entries[key] = entry;
          }
          return { entries };
        }),

      markHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'pb-data-cache',
      version: 1,
      storage: createJSONStorage(() =>
        typeof window === 'undefined' ? noopStorage : window.localStorage
      ),
      // Only the disk-eligible entries are written back out.
      partialize: (state) => ({
        entries: Object.fromEntries(
          Object.entries(state.entries).filter(([, entry]) => entry.persistToDisk)
        ),
      }),
      // Rehydration is triggered by hand from Providers rather than at module
      // load. Reading localStorage during the module's evaluation would give
      // the first client render different data than the server rendered with,
      // which React reports as a hydration mismatch.
      skipHydration: true,
    }
  )
);

/**
 * Read localStorage back into the store. Call once, from an effect, after
 * mount — see `skipHydration` above.
 */
export async function hydrateDataCache(): Promise<void> {
  await useDataCache.persist.rehydrate();
  useDataCache.getState().markHydrated();
}

/**
 * In-flight requests, keyed the same way as the cache.
 *
 * Without this the header and the footer — which both want the category tree,
 * and both mount in the same commit — each fire their own request, as does
 * every other pair of components that happens to want the same data. Sharing
 * the promise collapses them into one.
 */
const inFlight = new Map<string, Promise<unknown>>();

function fetchOnce<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fetcher().finally(() => inFlight.delete(key));
  inFlight.set(key, promise);
  return promise;
}

/** Sensible TTLs by how often the thing behind the key actually changes. */
export const TTL = {
  /** Marketplace chrome: categories, footer, theme, settings. */
  CONFIG: 30 * 60 * 1000,
  /** Catalogue reads: product lists, a single product, filters. */
  CATALOGUE: 5 * 60 * 1000,
  /** Anything that a shopper's own action can invalidate. */
  SHORT: 60 * 1000,
} as const;

export interface CachedDataOptions {
  /** How long a value is considered fresh. Past this it is still served, and refreshed behind the paint. */
  ttl?: number;
  /** Write through to localStorage so the value survives a reload. Public, small, slow-moving data only. */
  persistToDisk?: boolean;
}

export interface CachedDataResult<T> {
  data: T | undefined;
  /** True only when there is nothing to show yet. A background revalidation leaves this false. */
  isLoading: boolean;
  error: Error | null;
  /** Force a refetch regardless of TTL. */
  refresh: () => void;
}

/**
 * Read `key` from the cache, fetching it if absent or stale.
 *
 * Pass `key: null` to disable the read entirely — for a query that depends on
 * an id that hasn't loaded yet.
 */
export function useCachedData<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: CachedDataOptions = {}
): CachedDataResult<T> {
  const { ttl = TTL.CATALOGUE, persistToDisk = false } = options;

  const entry = useDataCache((state) => (key ? state.entries[key] : undefined));
  const hydrated = useDataCache((state) => state.hydrated);
  const put = useDataCache((state) => state.put);

  const [error, setError] = React.useState<Error | null>(null);
  // A fetch that has been asked for but hasn't produced a value yet. Only
  // drives `isLoading` when there is no cached value to show meanwhile.
  const [pending, setPending] = React.useState(false);

  // The fetcher is almost always an inline closure, so it is a new function
  // identity every render. Holding it in a ref keeps it out of the effect's
  // dependencies — otherwise the effect re-runs on every render and refetches
  // forever.
  const fetcherRef = React.useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = React.useCallback(
    (cacheKey: string) => {
      setPending(true);
      fetchOnce(cacheKey, fetcherRef.current)
        .then((data) => {
          put(cacheKey, data, persistToDisk);
          setError(null);
        })
        .catch((cause: unknown) => {
          // Deliberately leaves any existing cached value in place: a failed
          // refresh should not blank a page that is already showing content.
          setError(cause instanceof Error ? cause : new Error(String(cause)));
        })
        .finally(() => setPending(false));
    },
    [put, persistToDisk]
  );

  const fetchedAt = entry?.fetchedAt;

  React.useEffect(() => {
    // Waiting for hydration matters: acting before localStorage has been read
    // would refetch data that is already on disk, which is the whole thing
    // this cache exists to avoid.
    if (!key || !hydrated) return;
    if (fetchedAt !== undefined && Date.now() - fetchedAt < ttl) return;
    run(key);
  }, [key, hydrated, fetchedAt, ttl, run]);

  const refresh = React.useCallback(() => {
    if (key) run(key);
  }, [key, run]);

  return {
    data: entry?.data as T | undefined,
    isLoading: pending && entry === undefined,
    error,
    refresh,
  };
}
