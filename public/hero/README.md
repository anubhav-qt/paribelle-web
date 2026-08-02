# Scrapbook hero photography

The landing collage (`src/components/home/ScrapbookHero.tsx`) reads these seven
files. Each slot has a fixed crop in the layout, so **keep the filenames and the
aspect ratios** — the composition depends on each shot sitting in its own slot.

| File | Aspect | Shot |
| --- | --- | --- |
| `hero-store-floral.jpg` | 1:1 | **Pinned photo.** Blush floral kurti on a PariBelle hanger, logo wall behind. This is the one the scroll zooms into. |
| `detail-rose-tag.jpg` | 1:1 | Rose kurti with the swing-tag detail split. |
| `store-rose.jpg` | 1:1 | Rose linen kurti, chikankari yoke, store rack behind. |
| `packaging-bag.jpg` | 1:1 | Branded carry bag. |
| `ivory-floral.jpg` | 4:5 | Ivory kurti with pink floral embroidery. |
| `packed-rose.jpg` | 4:5 | Folded blush kurti in a resealable pouch. |
| `packed-ivory.jpg` | 2:3 | Ivory kurti in a presentation sleeve. |

## Replacing them

Don't hand-crop. Point the installer at a folder of originals and it will
cover-crop each one to its slot's ratio, cap the long edge at 1600px and
re-encode:

```bash
node scripts/install-hero-photos.mjs "C:/path/to/originals"
```

The source filename for each slot lives in the `SOURCES` map at the top of
`scripts/install-hero-photos.mjs` — update that when the shots are re-cut. With
no argument it re-reads the folder the current set came from.

To change the composition (positions, tilts, which photo is pinned), edit the
`TILES` table and `HERO_TILE_ID` in `ScrapbookHero.tsx`. Tile heights are
derived from their width via the stage ratio, so `STAGE_RATIO_WIDE` /
`STAGE_RATIO_NARROW` must stay in step with the `aspect-ratio` on
`.pb-scrap-stage` in `globals.css`.
