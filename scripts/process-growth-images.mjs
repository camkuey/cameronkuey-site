#!/usr/bin/env node
/**
 * Growth Roadmap case study screenshots (preview renders, invented sample data).
 *
 *   node scripts/process-growth-images.mjs     # Node 22
 *
 * Reads ../growth-roadmap/screenshots (override with GROWTH_DIR), writes
 * public/media/growth/*.webp|avif and MERGES the entries into src/data/extra-images.json.
 * sharp drops EXIF/ICC metadata by default. Only screens that were checked for
 * emails, Sheet/script IDs and URLs are listed here.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.resolve(ROOT, process.env.GROWTH_DIR || '../growth-roadmap/screenshots');
const OUT = path.join(ROOT, 'public/media/growth');
const FORCE = !!process.env.FORCE;
const images = {
  'overview-light': '01-overview-light.png',
  'overview-dark': '02-overview-dark.png',
  'notes-tooltip': '03-notes-tooltip.png',
  'edit-milestone': '04-edit-milestone.png',
  'edit-year-header': '07-edit-year-header.png',
  'empty-state': '08-empty-state.png',
  'label-resized': '09-label-column-resized.png',
  'menu-launcher': '11-menu-launcher.png',
};
const WEBP = [480, 960, 1600, 2400];
const AVIF = [480, 960, 1600];
fs.mkdirSync(OUT, { recursive: true });
const mp = path.join(ROOT, 'src/data/extra-images.json');
const manifest = JSON.parse(fs.readFileSync(mp, 'utf8'));
for (const [name, f] of Object.entries(images)) {
  const file = path.join(SRC, f);
  const { width: W, height: H } = await sharp(file).metadata();
  const cap = (l) => [...new Set([...l.filter((w) => w < W), ...(W <= l.at(-1) ? [W] : [])])].sort((a, b) => a - b);
  const webp = cap(WEBP), avif = cap(AVIF);
  for (const w of webp) { const o = path.join(OUT, `${name}-${w}.webp`); if (FORCE || !fs.existsSync(o)) await sharp(file).resize({ width: w }).webp({ quality: 82, effort: 5 }).toFile(o); }
  for (const w of avif) { const o = path.join(OUT, `${name}-${w}.avif`); if (FORCE || !fs.existsSync(o)) await sharp(file).resize({ width: w }).avif({ quality: 58, effort: 4 }).toFile(o); }
  const { dominant } = await sharp(file).resize(64).stats();
  const color = '#' + [dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, '0')).join('');
  manifest[`growth-${name}`] = { w: W, h: H, base: `/media/growth/${name}`, webp, avif, color };
}
fs.writeFileSync(mp, JSON.stringify(manifest, null, 1) + '\n');
console.log(`done: ${Object.keys(images).length} images`);
