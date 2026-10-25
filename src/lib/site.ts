import pagesData from '../data/pages.json';
import images from '../data/images.json';
import dashImages from '../data/dashboard-images.json';
import extraImages from '../data/extra-images.json';
import docsImages from '../data/documentation-images.json';
import alts from '../data/alt.json';

export type Img = { w: number; h: number; base: string; webp: number[]; avif: number[]; color: string };
export const IMAGES = { ...images, ...dashImages, ...extraImages, ...docsImages } as Record<string, Img>;
export const ALT = alts as Record<string, string>;
/** Creative categories hidden from the site for now (content stays in pages.json; remove a slug here to bring it back). */
export const HIDDEN_CATEGORIES = ['work', 'graphic-design'];
const ALL_MENU = (pagesData as any).menu as { title: string; slug: string; children: { title: string; slug: string }[] }[];
const hiddenSlugs = new Set(ALL_MENU.filter((m) => HIDDEN_CATEGORIES.includes(m.slug)).flatMap((m) => [m.slug, ...m.children.map((c) => c.slug)]));
export const PAGES = ((pagesData as any).pages as any[]).filter((p) => !hiddenSlugs.has(p.slug));
export const MENU = ALL_MENU.filter((m) => !HIDDEN_CATEGORIES.includes(m.slug));

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
// A category with a single page (Audio Production) links straight to that page; /audio-production redirects there.
export const CATEGORIES = MENU.map((m) => ({ title: m.title, slug: m.slug, children: m.children, href: `/${m.children.length === 1 ? m.children[0].slug : m.slug}` }));

export const page = (slug: string) => PAGES.find((p) => p.slug === slug);
export const alt = (id: string, fallback = '') => ALT[id] ?? fallback;

/** Largest webp URL for an image id (used for lightbox / full view). */
export function fullSrc(id: string) {
  const i = IMAGES[id];
  return `${i.base}-${i.webp[i.webp.length - 1]}.webp`;
}
