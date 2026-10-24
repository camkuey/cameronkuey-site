#!/usr/bin/env node
/**
 * Responsive image pipeline (re-runnable, incremental).
 *
 *   EXPORT_DIR=../site-export npm run images
 *
 * Reads every image referenced in src/data/pages.json from the original
 * Adobe Portfolio export (kept OUTSIDE this repo) and writes:
 *   public/media/<page>/<name>-<width>.webp   (480/960/1600/2400, never upscaled)
 *   public/media/<page>/<name>-<width>.avif   (480/960/1600)
 *   public/media/video/...                    (self-hosted logo animation + poster)
 *   public/og.jpg, public/favicon-32.png, public/apple-touch-icon.png, public/favicon.ico
 *   src/data/images.json                      (dimensions, widths, placeholder colour)
 * Existing outputs are skipped, so re-runs only process new images.
 * Set FORCE=1 to regenerate everything.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXPORT = path.resolve(ROOT, process.env.EXPORT_DIR || '../site-export');
const OUT = path.join(ROOT, 'public', 'media');
const FORCE = !!process.env.FORCE;
const WEBP_WIDTHS = [480, 960, 1600, 2400];
const AVIF_WIDTHS = [480, 960, 1600];
// Images deliberately not published (see README "Content decisions").
const EXCLUDE = new Set(['home/02-3e0a0db9']);

sharp.concurrency(2);
const pages = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/pages.json'), 'utf8')).pages;
const jobs = new Map();
for (const p of pages) {
  for (const c of p.covers) if (c.image) jobs.set(c.image.id, c.image.src);
  for (const b of p.blocks) {
    if (b.t === 'images') for (const i of b.items) jobs.set(i.id, i.src);
    if (b.t === 'video' && b.poster) jobs.set('video/' + path.basename(b.poster, path.extname(b.poster)), b.poster);
  }
}
for (const id of EXCLUDE) jobs.delete(id);

const manifestPath = path.join(ROOT, 'src/data/images.json');
const manifest = fs.existsSync(manifestPath) && !FORCE ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};

async function processOne(id, src) {
  const file = path.join(EXPORT, src);
  const outDir = path.join(OUT, path.dirname(id));
  const base = path.basename(id);
  fs.mkdirSync(outDir, { recursive: true });
  const meta = await sharp(file).metadata();
  // honour EXIF orientation
  const rotated = (meta.orientation || 1) >= 5;
  const W = rotated ? meta.height : meta.width;
  const H = rotated ? meta.width : meta.height;
  const cap = (list) => {
    const ws = list.filter((w) => w < W);
    if (W <= list[list.length - 1] && !ws.includes(W)) ws.push(Math.min(W, list[list.length - 1]));
    return [...new Set(ws)].sort((a, b) => a - b);
  };
  const webp = cap(WEBP_WIDTHS);
  const avif = cap(AVIF_WIDTHS);
  for (const w of webp) {
    const o = path.join(outDir, `${base}-${w}.webp`);
    if (FORCE || !fs.existsSync(o)) await sharp(file).rotate().resize({ width: w }).webp({ quality: 78, effort: 5 }).toFile(o);
  }
  for (const w of avif) {
    const o = path.join(outDir, `${base}-${w}.avif`);
    if (FORCE || !fs.existsSync(o)) await sharp(file).rotate().resize({ width: w }).avif({ quality: 52, effort: 4 }).toFile(o);
  }
  let color = manifest[id]?.color;
  if (!color) {
    const { dominant } = await sharp(file).resize(64).stats();
    color = '#' + [dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, '0')).join('');
  }
  manifest[id] = { w: W, h: H, base: `/media/${id}`, webp, avif, color };
}

const entries = [...jobs.entries()];
let done = 0;
const POOL = 4;
await Promise.all(
  Array.from({ length: POOL }, async () => {
    while (entries.length) {
      const [id, src] = entries.shift();
      await processOne(id, src);
      if (++done % 20 === 0) console.log(`  ${done}/${jobs.size}`);
    }
  }),
);
for (const k of Object.keys(manifest)) if (!jobs.has(k)) delete manifest[k];
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));

// self-hosted video(s)
for (const p of pages)
  for (const b of p.blocks)
    if (b.t === 'video') {
      const o = path.join(OUT, 'video', path.basename(b.src));
      fs.mkdirSync(path.dirname(o), { recursive: true });
      if (FORCE || !fs.existsSync(o)) fs.copyFileSync(path.join(EXPORT, b.src), o);
    }

// site assets: Open Graph image + favicons from the old site
const site = path.join(EXPORT, 'images/_site');
const pub = path.join(ROOT, 'public');
await sharp(path.join(site, 'og-image.jpg')).resize(1200, 630, { fit: 'cover', position: 'attention' }).jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(pub, 'og.jpg'));
await sharp(path.join(site, 'favicon-32.jpg')).png().toFile(path.join(pub, 'favicon-32.png'));
await sharp(path.join(site, 'apple-touch-icon-180.jpg')).png().toFile(path.join(pub, 'apple-touch-icon.png'));
// favicon.ico = a single 32x32 PNG wrapped in an ICO container
const png = await sharp(path.join(site, 'apple-touch-icon-180.jpg')).resize(32, 32).png().toBuffer();
const hdr = Buffer.alloc(22);
hdr.writeUInt16LE(0, 0); hdr.writeUInt16LE(1, 2); hdr.writeUInt16LE(1, 4);
hdr.writeUInt8(32, 6); hdr.writeUInt8(32, 7); hdr.writeUInt16LE(1, 10); hdr.writeUInt16LE(32, 12);
hdr.writeUInt32LE(png.length, 14); hdr.writeUInt32LE(22, 18);
fs.writeFileSync(path.join(pub, 'favicon.ico'), Buffer.concat([hdr, png]));
console.log(`done: ${jobs.size} images -> public/media, manifest -> src/data/images.json`);
