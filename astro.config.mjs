// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import fs from 'node:fs';
import { EDIT_MODE } from './src/data/site-flags.ts';

// Copy editor (?edit): ships editor/edit-mode.js as /edit-mode.js only when EDIT_MODE is on.
const editFile = new URL('./editor/edit-mode.js', import.meta.url);
const editMode = () => ({
  name: 'edit-mode',
  hooks: {
    'astro:build:done': ({ dir }) => { if (EDIT_MODE) fs.copyFileSync(editFile, new URL('edit-mode.js', dir)); },
    'astro:server:setup': ({ server }) => {
      if (!EDIT_MODE) return;
      server.middlewares.use('/edit-mode.js', (_req, res) => { res.setHeader('content-type', 'text/javascript'); res.end(fs.readFileSync(editFile)); });
    },
  },
});

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
  integrations: [sitemap(), editMode()],
});
