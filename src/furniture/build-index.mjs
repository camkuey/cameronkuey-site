import fs from "node:fs";

/**
 * cameronkuey-site builds with `format: "file"`, so this page would be
 * emitted as dist/furniture.html. Cloudflare's html_handling
 * "auto-trailing-slash" then canonicalizes that file to /furniture, with
 * /furniture/ redirecting away from it.
 *
 * A service worker at /furniture/sw.js can only control URLs under
 * /furniture/. The page has to live at /furniture/ or the installed PWA
 * never controls its own document. Moving the file to
 * dist/furniture/index.html makes /furniture/ the canonical URL.
 */
export function furnitureIndex() {
  return {
    name: "furniture-index",
    hooks: {
      "astro:build:done": ({ dir }) => {
        const from = new URL("furniture.html", dir);
        if (!fs.existsSync(from)) return;
        const folder = new URL("furniture/", dir);
        fs.mkdirSync(folder, { recursive: true });
        fs.renameSync(from, new URL("index.html", folder));
      },
    },
  };
}
