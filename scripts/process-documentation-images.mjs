#!/usr/bin/env node
/**
 * Documentation case study media (sample data only, no "sample" notes baked into these "-clean" shots).
 *
 *   npx -y node@22 scripts/process-documentation-images.mjs
 *
 * Reads ../portfolio-site-assets/dashboard/screenshots, crops the empty blue margins (and, for the editor,
 * the blocked video box along the bottom edge), and writes public/media/documentation/*.webp|avif
 * plus src/data/documentation-images.json (merged into IMAGES in src/lib/site.ts).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.resolve(ROOT, process.env.DASH_DIR || '../portfolio-site-assets/dashboard/screenshots');
const OUT = path.join(ROOT, 'public/media/documentation');
const FORCE = !!process.env.FORCE;

// crop = [left, top, width, height] in source pixels (2x desktop shots are 2880x1800)
const X = 240, W = 2400;
const images = {
  'library': { file: 'desktop-documentation-library-clean@2x.png', crop: [X, 0, W, 1500] },
  'editor': { file: 'desktop-documentation-editor-clean@2x.png', crop: [X, 0, W, 1730] }, // stops above the dark video box (starts at y~1752)
  'new-page': { file: 'desktop-documentation-new-page@2x.png', crop: [X, 0, W, 1540] },
  'new-page-editor': { file: 'desktop-documentation-new-page-editor@2x.png', crop: [X, 0, W, 1700] },
  'intern-access': { file: 'desktop-documentation-intern-access-grants@2x.png', crop: [X, 0, W, 1740] },
  'intern-view': { file: 'desktop-documentation-intern-view@2x.png', crop: [X, 0, W, 1130] },
  'phone-library': { file: 'phone-documentation-library@2x.png' },
  'phone-editor': { file: 'phone-documentation-editor@2x.png' },
};

fs.mkdirSync(OUT, { recursive: true });
const WEBP = [480, 960, 1600, 1800];
const AVIF = [480, 960, 1600];
const manifest = {};
for (const [name, { file, crop }] of Object.entries(images)) {
  const input = path.join(SRC, file);
  let pipe = () => sharp(input);
  let W0, H0;
  if (crop) { const [l, t, w, h] = crop; pipe = () => sharp(input).extract({ left: l, top: t, width: w, height: h }); W0 = w; H0 = h; }
  else { const m = await sharp(input).metadata(); W0 = m.width; H0 = m.height; }
  const cap = (l) => [...new Set([...l.filter((w) => w < W0), ...(W0 <= l.at(-1) ? [W0] : [])])].sort((a, b) => a - b);
  const webp = cap(WEBP), avif = cap(AVIF);
  for (const w of webp) {
    const o = path.join(OUT, `${name}-${w}.webp`);
    if (FORCE || !fs.existsSync(o)) await pipe().resize({ width: w }).webp({ quality: 80, effort: 5 }).toFile(o);
  }
  for (const w of avif) {
    const o = path.join(OUT, `${name}-${w}.avif`);
    if (FORCE || !fs.existsSync(o)) await pipe().resize({ width: w }).avif({ quality: 55, effort: 4 }).toFile(o);
  }
  const { dominant } = await pipe().resize(64).stats();
  const color = '#' + [dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, '0')).join('');
  manifest[`docs-${name}`] = { w: W0, h: H0, base: `/media/documentation/${name}`, webp, avif, color };
}
fs.writeFileSync(path.join(ROOT, 'src/data/documentation-images.json'), JSON.stringify(manifest, null, 1));
console.log(`done: ${Object.keys(manifest).length} images`);
