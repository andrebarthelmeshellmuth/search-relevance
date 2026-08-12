#!/usr/bin/env node
// Regenerates the WebP derivatives the screenshot gallery actually serves, and records each image's
// intrinsic size back into screenshots-data.json so the <img> tags can reserve their space up front.
//
// The 1920px PNGs under screenshots/ stay the source of truth but are never sent to a browser:
//
//   <name>-thumb.webp   420x240, center-cropped   carousel strip (rendered in a fixed 210x120 box)
//   <name>-full.webp    <=1920px wide             main viewer and lightbox
//
// The thumbnail is what makes this worth doing: the strip loads every screenshot of the selected
// package at once, so serving the originals there meant ~3 MB to draw a row of 210px images.
//
// Run this after adding or replacing any screenshot:  npm run images

import { readFile, writeFile, stat } from "node:fs/promises";
import { dirname, join, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "screenshots-data.json");

// 2x the CSS box (.carousel-thumb is 210px wide, .carousel-thumb-media 120px tall) so the strip stays
// sharp on retina displays. object-fit: cover in the stylesheet crops the same way sharp does here.
const THUMB = { width: 420, height: 240 };
// The main viewer tops out around the 1180px content column, and the lightbox asks for native width.
// One 1920px variant covers both and still lands far under the PNG it replaces.
const FULL_WIDTH = 1920;

const variantPath = (src, suffix) =>
  join(dirname(src), `${basename(src, extname(src))}-${suffix}.webp`);

async function build(src) {
  const abs = join(ROOT, src);
  const thumbRel = variantPath(src, "thumb");
  const fullRel = variantPath(src, "full");

  await sharp(abs)
    .resize({ ...THUMB, fit: "cover", position: "center" })
    .webp({ quality: 78 })
    .toFile(join(ROOT, thumbRel));

  // withoutEnlargement keeps a screenshot narrower than 1920px at its native size rather than
  // upscaling it into a blurrier, larger file.
  const full = await sharp(abs)
    .resize({ width: FULL_WIDTH, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(join(ROOT, fullRel));

  return { thumb: thumbRel, full: fullRel, width: full.width, height: full.height };
}

const packages = JSON.parse(await readFile(DATA, "utf8"));
let count = 0;
let bytesBefore = 0;
let bytesAfter = 0;

for (const pkg of packages) {
  for (const shot of pkg.screenshots) {
    // A screenshot entry with no src is an intentional "coming soon" placeholder, not an error.
    if (!shot.src) continue;
    const built = await build(shot.src);
    Object.assign(shot, built);
    count++;

    const size = async (p) => (await stat(join(ROOT, p))).size;
    bytesBefore += await size(shot.src);
    bytesAfter += (await size(built.thumb)) + (await size(built.full));
  }
}

await writeFile(DATA, `${JSON.stringify(packages, null, 2)}\n`);

const mb = (n) => `${(n / 1024 / 1024).toFixed(2)} MB`;
console.log(`Built ${count * 2} derivatives for ${count} screenshots.`);
console.log(`Sources ${mb(bytesBefore)} -> derivatives ${mb(bytesAfter)}`);
