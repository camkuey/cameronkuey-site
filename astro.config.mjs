// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.cameronkuey.com',
  // Emit /slug.html (not /slug/index.html) so Cloudflare Pages serves the old
  // Adobe Portfolio URLs (/photography, /klema-ios-app, ...) with no redirect.
  build: { format: 'file' },
  trailingSlash: 'never',
  integrations: [sitemap()],
});
