// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.cameronkuey.com',
  // Emit /slug.html (not /slug/index.html) so Cloudflare Pages serves the old
  // Adobe Portfolio URLs (/photography, /klema-ios-app, ...) with no redirect.
  build: { format: 'file' },
  trailingSlash: 'never',
  // Old URLs. In the static build these become small meta-refresh pages (dist/operations.html, ...);
  // public/_redirects adds the real 301s on Cloudflare (it is evaluated before assets).
  redirects: {
    '/operations': '/experience',
    '/ai-builds': '/projects',
    '/case-studies': '/projects',
  },
  integrations: [sitemap()],
});
