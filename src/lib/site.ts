import pagesData from '../data/pages.json';
import images from '../data/images.json';
import alts from '../data/alt.json';

export type Img = { w: number; h: number; base: string; webp: number[]; avif: number[]; color: string };
export const IMAGES = images as Record<string, Img>;
export const ALT = alts as Record<string, string>;
export const PAGES = (pagesData as any).pages as any[];
export const MENU = (pagesData as any).menu as { title: string; slug: string; children: { title: string; slug: string }[] }[];

export const SITE = {
  name: 'Cameron Kuey',
  url: 'https://www.cameronkuey.com',
  email: 'camkuey93@gmail.com',
  linkedin: 'https://www.linkedin.com/in/cameron-kuey-4303b711a/',
  github: 'https://github.com/camkuey',
  cosie: 'https://cosiephotos.com/',
  tcp: 'https://www.cultivationproject.org/',
};

/** The five Creative categories, in the old site's menu order. */
export const CATEGORIES = MENU.map((m) => ({ title: m.title, slug: m.slug, children: m.children }));

export const page = (slug: string) => PAGES.find((p) => p.slug === slug);
export const alt = (id: string, fallback = '') => ALT[id] ?? fallback;

/** Largest webp URL for an image id (used for lightbox / full view). */
export function fullSrc(id: string) {
  const i = IMAGES[id];
  return `${i.base}-${i.webp[i.webp.length - 1]}.webp`;
}
