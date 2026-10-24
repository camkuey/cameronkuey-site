/**
 * Per-case-study themes. Each case study takes its primary colour from the product it describes;
 * values were sampled from the real screenshots with PIL (see DESIGN-NOTES.md for file and region).
 * Pages emit these as CSS custom properties on the .cs-page wrapper (themeVars) so steps, tiles,
 * bands and shapes follow them; the SVG diagrams read the same object for their SMIL colours.
 * Site chrome (nav, footer, type) stays on the base brand.
 */
export type ThemeName = 'brand' | 'dashboard' | 'documentation' | 'roadmap';
export type Theme = {
  primary: string; //    fills, step marks, diagram emphasis
  primaryInk: string; // primary when used as text (>= 4.5:1 on cream and on the tint)
  soft: string; //       light primary tint (human nodes, chips)
  softLine: string; //   mid tint (pulses, soft strokes)
  tint: string; //       alternate step band
  band: string; //       hero band
  second: string; //     quiet secondary, diagrams only
  accent: string; //     the one highlight per page
  keyBg: string; keyNum: string; keyLabel: string; keyBar: string; // the key stat tile
  warn: string; //       "broken / before" marks in diagrams
  shape: string; shape2: string; shapeAlt: string; // background shapes
};

export const THEMES: Record<ThemeName, Theme> = {
  // Site brand: Circles scheduling and Contract automation (no product screenshots to sample)
  brand: {
    primary: '#881919', primaryInk: '#881919', soft: '#F6EAE7', softLine: '#E5B0AA',
    tint: '#F7F3EE', band: '#F0EBE4', second: '#2E5E92', accent: '#A69B88',
    keyBg: '#1B1A18', keyNum: '#DAB057', keyLabel: '#D5CEC2', keyBar: '#881919',
    warn: '#881919',
    shape: 'rgba(150,118,74,.05)', shape2: 'rgba(150,118,74,.032)', shapeAlt: 'rgba(150,118,74,.04)',
  },
  // Internal Dashboard: the slate blue the whole UI sits on, its action blue, its "Clock in" green
  dashboard: {
    primary: '#356698', primaryInk: '#356698', soft: '#E3EBF4', softLine: '#A9C1DB',
    tint: '#F0F3F7', band: '#E7EDF4', second: '#2F7CCF', accent: '#2E9D5C',
    keyBg: '#285080', keyNum: '#FFFFFF', keyLabel: '#D6E2F0', keyBar: '#2E9D5C',
    warn: '#8A8172',
    shape: 'rgba(53,102,152,.05)', shape2: 'rgba(53,102,152,.03)', shapeAlt: 'rgba(47,124,207,.04)',
  },
  // Documentation library (part of the Internal Dashboard): same blue, tile and tints as the dashboard; the one accent is the site red,
  // used rarely (key-tile rule, the "which one?" mark in the problem graphic)
  documentation: {
    primary: '#356698', primaryInk: '#356698', soft: '#E3EBF4', softLine: '#A9C1DB',
    tint: '#F0F3F7', band: '#E7EDF4', second: '#2F7CCF', accent: '#881919',
    keyBg: '#285080', keyNum: '#FFFFFF', keyLabel: '#D6E2F0', keyBar: '#881919',
    warn: '#8A8172',
    shape: 'rgba(53,102,152,.05)', shape2: 'rgba(53,102,152,.03)', shapeAlt: 'rgba(47,124,207,.04)',
  },
  // Strategy Growth Roadmap: the sheet UI's link / current-year blue, its cool greys,
  // the KPI sparkline green (diagrams only) and the amber "Example data" chip as the accent
  roadmap: {
    primary: '#1870C0', primaryInk: '#1662AE', soft: '#E6EEF8', softLine: '#A8C8E8',
    tint: '#F5F4F7', band: '#ECEEF4', second: '#408850', accent: '#907028',
    keyBg: '#FEF6D6', keyNum: '#6E5418', keyLabel: '#1B1A18', keyBar: '#907028',
    warn: '#8A8172',
    shape: 'rgba(24,112,192,.04)', shape2: 'rgba(24,112,192,.025)', shapeAlt: 'rgba(88,120,184,.04)',
  },
};

/** CSS custom properties for a page wrapper. */
export const themeVars = (name: ThemeName) => {
  const t = THEMES[name];
  return [
    `--cs-primary:${t.primary}`, `--cs-primary-ink:${t.primaryInk}`, `--cs-primary-soft:${t.soft}`, `--cs-soft-line:${t.softLine}`,
    `--cs-tint:${t.tint}`, `--cs-band:${t.band}`, `--cs-second:${t.second}`, `--cs-accent:${t.accent}`,
    `--cs-key-bg:${t.keyBg}`, `--cs-key-num:${t.keyNum}`, `--cs-key-label:${t.keyLabel}`, `--cs-key-bar:${t.keyBar}`,
    `--cs-shape:${t.shape}`, `--cs-shape2:${t.shape2}`, `--cs-shape-alt:${t.shapeAlt}`,
    `--accent:${t.primaryInk}`,
  ].join(';');
};
