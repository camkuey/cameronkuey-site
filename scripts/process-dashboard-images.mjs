#!/usr/bin/env node
/**
 * Internal Dashboard case study media (sample data only).
 *
 *   python3 scripts/redact-dashboard.py           # 1. hide vendor names (writes ../portfolio-site-assets/dashboard/redacted)
 *   node scripts/process-dashboard-images.mjs     # 2. this script (Node 22)
 *
 * Writes public/media/dashboard/*.webp|avif, public/media/dashboard/video/*.mp4
 * and src/data/dashboard-images.json (merged into IMAGES in src/lib/site.ts).
 * Kept separate from process-images.mjs, which prunes keys it doesn't know.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.resolve(ROOT, process.env.DASH_DIR || '../portfolio-site-assets/dashboard');
const OUT = path.join(ROOT, 'public/media/dashboard');
const FORCE = !!process.env.FORCE;
const R = (f) => path.join(SRC, 'redacted', f);
const S = (f) => path.join(SRC, 'screenshots', f);

const images = {
  'today-focus': S('desktop-today-focus@2x.png'),
  'today-focus-deck': S('desktop-today-focus-deck@2x.png'),
  'tasks-open-list': R('desktop-tasks-open-list@2x.png'),
  'ask-otis-confirm-card': R('desktop-ask-otis-confirm-card@2x.png'),
  'ask-otis-approved': R('desktop-ask-otis-approved@2x.png'),
  'kiosk-clocked-in': S('desktop-kiosk-clocked-in@2x.png'),
  'work-schedule-pto-saved': S('desktop-work-schedule-pto-saved@2x.png'),
  'time-review-week': S('desktop-time-review-week@2x.png'),
  'weekly-signoff': S('desktop-weekly-signoff@2x.png'),
  'hero-focus': S('desktop-today-focus-hero-1000x800@2x.png'),
  'projects-milestones': S('desktop-projects-milestones@2x.png'),
  'documentation-editor': S('desktop-documentation-editor@2x.png'),
  'onboarding': S('desktop-onboarding@2x.png'),
  'phone-today-focus': S('phone-today-focus.png'),
  'phone-ask-otis-card': S('phone-ask-otis-card.png'),
  'phone-ask-otis-add-task-final': S('ask-otis-add-task-mobile-final@2x.png'),
};
// video -> poster frame (seconds). Videos come from the redacted folder.
const videos = { 'opening-the-day': 6, 'finishing-a-task': 16.4, 'ask-otis-approve-suggestion': 19.6, 'kiosk-clock-in': 24 };

fs.mkdirSync(path.join(OUT, 'video'), { recursive: true });
// phone recording (sample mode, recorded unredacted: no vendor names on screen); its poster is the final-frame screenshot above
fs.copyFileSync(path.join(SRC, 'videos/ask-otis-add-task-mobile.mp4'), path.join(OUT, 'video/ask-otis-add-task-mobile.mp4'));
fs.mkdirSync(path.join(SRC, 'redacted/posters'), { recursive: true });
for (const [v, t] of Object.entries(videos)) {
  const dst = path.join(OUT, 'video', `${v}.mp4`);
  if (FORCE || !fs.existsSync(dst)) fs.copyFileSync(R(`${v}.mp4`), dst);
  const poster = R(`posters/${v}.png`);
  if (FORCE || !fs.existsSync(poster)) execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(t), '-i', R(`${v}.mp4`), '-frames:v', '1', poster]);
  images[`poster-${v}`] = poster;
}

const WEBP = [480, 960, 1600, 2400];
const AVIF = [480, 960, 1600];
const manifestPath = path.join(ROOT, 'src/data/dashboard-images.json');
const manifest = {};
for (const [name, file] of Object.entries(images)) {
  const id = `dash-${name}`;
  const { width: W, height: H } = await sharp(file).metadata();
  const cap = (l) => [...new Set([...l.filter((w) => w < W), ...(W <= l.at(-1) ? [W] : [])])].sort((a, b) => a - b);
  const webp = cap(WEBP), avif = cap(AVIF);
  for (const w of webp) {
    const o = path.join(OUT, `${name}-${w}.webp`);
    if (FORCE || !fs.existsSync(o)) await sharp(file).resize({ width: w }).webp({ quality: 80, effort: 5 }).toFile(o);
  }
  for (const w of avif) {
    const o = path.join(OUT, `${name}-${w}.avif`);
    if (FORCE || !fs.existsSync(o)) await sharp(file).resize({ width: w }).avif({ quality: 55, effort: 4 }).toFile(o);
  }
  const { dominant } = await sharp(file).resize(64).stats();
  const color = '#' + [dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, '0')).join('');
  manifest[id] = { w: W, h: H, base: `/media/dashboard/${name}`, webp, avif, color };
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 1));
console.log(`done: ${Object.keys(manifest).length} images, ${Object.keys(videos).length} videos`);
