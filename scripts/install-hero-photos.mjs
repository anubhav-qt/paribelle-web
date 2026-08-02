/**
 * Installs the scrapbook-hero photography into public/hero/.
 *
 * The collage in components/home/ScrapbookHero.tsx addresses each photo by a
 * fixed filename and expects a fixed aspect ratio per slot, so this maps the
 * source files onto those slots and normalises them: cover-cropped to the
 * slot's ratio, capped on the long edge, re-encoded as progressive JPEG.
 *
 * Usage:  node scripts/install-hero-photos.mjs [sourceDir]
 *
 * `sourceDir` defaults to the folder the originals were delivered in. Point it
 * somewhere else when the shots are re-cut; only SOURCES below needs updating
 * if the filenames change.
 */
import sharp from 'sharp';
import path from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

const DEFAULT_SOURCE = 'C:/Users/Anubhav/Downloads';
const OUT_DIR = path.join(process.cwd(), 'public', 'hero');
const LONG_EDGE = 1600;

/** slot filename → [source basename, width ÷ height the slot renders at] */
const SOURCES = {
  'hero-store-floral.jpg': ['WhatsApp Image 2026-07-27 at 7.35.10 PM.jpeg', 1 / 1],
  'detail-rose-tag.jpg': ['WhatsApp Image 2026-07-27 at 7.35.11 PM (2).jpeg', 1 / 1],
  'store-rose.jpg': ['WhatsApp Image 2026-07-27 at 7.35.13 PM (2).jpeg', 1 / 1],
  'packaging-bag.jpg': ['WhatsApp Image 2026-07-27 at 7.35.12 PM (1).jpeg', 1 / 1],
  'ivory-floral.jpg': ['WhatsApp Image 2026-07-27 at 7.35.11 PM.jpeg', 4 / 5],
  'packed-rose.jpg': ['WhatsApp Image 2026-07-27 at 7.35.12 PM (2).jpeg', 4 / 5],
  'packed-ivory.jpg': ['WhatsApp Image 2026-07-27 at 7.35.12 PM.jpeg', 2 / 3],
};

const sourceDir = process.argv[2] || DEFAULT_SOURCE;
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

let failed = 0;
for (const [slot, [basename, ratio]] of Object.entries(SOURCES)) {
  const src = path.join(sourceDir, basename);
  if (!existsSync(src)) {
    console.error(`MISSING  ${slot}  <-  ${basename}`);
    failed++;
    continue;
  }

  // Fit the slot's ratio inside the long-edge cap, then cover-crop to it so the
  // print fills its frame with no letterboxing.
  const [w, h] = ratio >= 1 ? [LONG_EDGE, Math.round(LONG_EDGE / ratio)] : [Math.round(LONG_EDGE * ratio), LONG_EDGE];

  await sharp(src)
    .resize(w, h, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toFile(path.join(OUT_DIR, slot));

  console.log(`ok       ${slot}  ${w}x${h}  <-  ${basename}`);
}

if (failed) {
  console.error(`\n${failed} source file(s) not found in ${sourceDir}`);
  process.exit(1);
}
