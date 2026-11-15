# Furniture Match

Hidden page at `/furniture/`. It is not in the site nav or the sitemap, and it sends `noindex, nofollow` (page meta tag, `public/_headers`, and `X-Robots-Tag` on API responses).

The rest of the site stays static assets. The Worker script (`src/worker.ts`) runs first only for `/furniture/api/*`. Every other request, including `/furniture/` itself, is served from `dist/`.

Everything this page needs is on a free plan. The only secret is `SERPAPI_API_KEY`.

## What a live match does

1. The phone compresses the photo to a JPEG at most 768px on the long edge and about 160 KB, then uploads that copy.
2. The Worker forwards that file to SerpApi's image upload. The upload is free and is not a search. The Worker does not copy the bytes into a `Uint8Array` or a base64 string.
3. Google Lens runs once (one SerpApi search). The response is restricted to the fields the page uses, so parsing stays small.
4. In parallel, Workers AI (`@cf/meta/llama-3.2-11b-vision-instruct`) describes the photo. The image is passed as a stream (`{ body, contentType }`) on the `AI` binding. No OpenAI key and no `OPENAI_MODEL`.
5. Google Shopping runs only when Lens returns fewer than three priced rows. That second search is skipped when Lens already has prices, so a typical match costs one search.

If the description step fails, or the free daily Workers AI allowance is used up, the page still returns the Lens rows. The description falls back to the closest Lens title, and a notice explains what happened.

If SerpApi returns a used-up or rate-limit error, the page says the free allowance is used up (250 searches a month, 50 an hour) and does not start another search.

## Build

`build.format` stays `'file'`, so Astro emits `dist/furniture.html`. The `furnitureIndex()` integration in `astro.config.mjs` moves that file to `dist/furniture/index.html` at the end of `astro build`. Cloudflare's `html_handling: "auto-trailing-slash"` then canonicalizes the page to `/furniture/`, which matches the manifest `start_url`, the service worker scope (`/furniture/`), and `/furniture/sw.js`.

`npm run build` is still `astro build`. There is no postbuild script.

`/furniture` is not a slug in `src/data/pages.json`, so `src/pages/[slug].astro` does not emit a competing page. `src/pages/furniture.astro` is its own document and is not wrapped in `Base.astro`.

## Local check

```sh
npm run build
npx wrangler dev --local
```

`astro dev` does not answer `/furniture/api/*`. With `SERPAPI_API_KEY` unset, `GET /furniture/api/status` returns JSON with `"mode": "demo"`. Demo mode does not call Workers AI or SerpApi.

`--local` keeps that check off the Cloudflare login. Plain `wrangler dev` tries to attach the AI binding to the account (it is a remote binding) and opens a browser login. Use that, after `npx wrangler login`, only when you want live descriptions from a local server. Those calls draw on the free daily Neuron allowance. Wrangler may warn that an AI binding can incur charges; on the free allowance it does not, until 10,000 Neurons in a day are used up.

Copy `.dev.vars.example` to `.dev.vars` for a local key. Do not commit `.dev.vars`.

## Cloudflare

Deploy stays `npm run build` then `npx wrangler deploy` (Cloudflare Git integration). Stay on the Workers Free plan.

- `SERPAPI_API_KEY` — the only secret. https://serpapi.com/manage-api-key — free plan, 250 searches a month and 50 an hour. Leave it unset to stay in demo mode.

  ```sh
  npx wrangler secret put SERPAPI_API_KEY
  ```

- Workers AI binding `AI` is declared in `wrangler.jsonc`. The free allowance is 10,000 Neurons per day and resets at 00:00 UTC. It needs no key. The first time this account calls `@cf/meta/llama-3.2-11b-vision-instruct`, Meta's license has to be accepted. The Worker does that itself: if the model asks for agreement, it sends `{ "prompt": "agree" }` once and retries the photo. If that automatic accept fails, send the same prompt once from a machine that has a Cloudflare API token (this is not a Worker secret):

  ```sh
  curl https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/ai/run/@cf/meta/llama-3.2-11b-vision-instruct \
    -X POST \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -d '{ "prompt": "agree" }'
  ```

## Workers Free CPU

The Free plan allows 10 ms of CPU per request. Waiting on SerpApi and Workers AI does not count. The remaining risk is parsing a large JSON body in JavaScript. Lens and Shopping requests set `json_restrictor` so those bodies stay limited to titles, links, prices, and image URLs. The photo itself is streamed through and is capped at 200 KB. A consistently oversized SerpApi payload could still trip the CPU limit (`Worker exceeded resource limits`, error 1102). Static pages never run this Worker.
