# archive

PariBelle is a single store. When the multi-vendor marketplace features were
removed from the backend (October 2026), the storefront code that only served
them, plus components and helpers nothing imported any more, was moved here
rather than deleted.

- **Paths mirror the originals.** `archive/src/components/LocationFilter.tsx`
  was `src/components/LocationFilter.tsx`. `git log --follow` on a file here
  shows its history.
- **Nothing here is built or deployed.** `archive` is excluded in
  `tsconfig.json`, Tailwind only scans `src/`, and nothing under `src/`
  imports from it. Several files call backend endpoints that no longer exist
  (vendor policies, locations, vendor reviews), so they will not work if
  copied back as they are.

The backend has its own `archive/` with the matching server code.
