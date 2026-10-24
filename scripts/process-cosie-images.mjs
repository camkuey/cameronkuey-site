#!/usr/bin/env node
/**
 * Extra portfolio photos from Cameron's own Cosie Co. site (cosiephotos.com) for the /creative collage.
 *
 *   COSIE_DIR=/workspace/cosie-photos/full node scripts/process-cosie-images.mjs     # Node 22
 *
 * Reads <COSIE_DIR>/cosie-<kind>-NN.jpg, writes public/media/cosie/*.webp|avif and MERGES
 * the entries into src/data/extra-images.json (ids "cosie-<kind>-NN"). sharp drops EXIF/ICC.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.resolve(process.env.COSIE_DIR || '/workspace/cosie-photos/full');
const OUT = path.join(ROOT, 'public/media/cosie');
const FORCE = !!process.env.FORCE;
const WEBP = [480, 960, 1600, 2400];
const AVIF = [480, 960, 1600];
fs.mkdirSync(OUT, { recursive: true });
const mp = path.join(ROOT, 'src/data/extra-images.json');
const manifest = JSON.parse(fs.readFileSync(mp, 'utf8'));
const files = fs.readdirSync(SRC).filter((f) => /^cosie-.*\.jpg$/.test(f)).sort();
for (const f of files) {
  const name = f.replace(/\.jpg$/, '');
  const file = path.join(SRC, f);
  const { width: W, height: H } = await sharp(file).metadata();
  const cap = (l) => [...new Set([...l.filter((w) => w < W), ...(W <= l.at(-1) ? [W] : [])])].sort((a, b) => a - b);
  const webp = cap(WEBP), avif = cap(AVIF);
  for (const w of webp) { const o = path.join(OUT, `${name}-${w}.webp`); if (FORCE || !fs.existsSync(o)) await sharp(file).resize({ width: w }).webp({ quality: 80, effort: 5 }).toFile(o); }
  for (const w of avif) { const o = path.join(OUT, `${name}-${w}.avif`); if (FORCE || !fs.existsSync(o)) await sharp(file).resize({ width: w }).avif({ quality: 55, effort: 4 }).toFile(o); }
  const { dominant } = await sharp(file).resize(64).stats();
  const color = '#' + [dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, '0')).join('');
  manifest[name] = { w: W, h: H, base: `/media/cosie/${name}`, webp, avif, color };
}
fs.writeFileSync(mp, JSON.stringify(manifest, null, 1) + '\n');
console.log(`done: ${files.length} images`);
