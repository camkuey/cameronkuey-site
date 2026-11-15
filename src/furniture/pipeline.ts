import { DEMO_CANDIDATES, DEMO_DESCRIPTION } from "./demo.ts";
import {
  isDirectProductLink,
  isHttpUrl,
  mergeAndRank,
  priceParts,
  storeFromUrl,
  type Candidate,
} from "./rank.ts";
import type { MatchEnv, MatchResponse, StatusResponse } from "./types";

const LENS_TIMEOUT_MS = 25_000;
const SHOPPING_TIMEOUT_MS = 20_000;
const VISION_TIMEOUT_MS = 20_000;

/** Instruction-tuned vision model on the free Workers AI allowance. */
export const VISION_MODEL = "@cf/meta/llama-3.2-11b-vision-instruct";

/**
 * Lens rows that already have a price. At or above this, skip Google Shopping
 * so a match costs one SerpApi search instead of two.
 */
export const SHOPPING_MIN_PRICED = 3;

export const SERP_QUOTA_MESSAGE =
  "The free SerpApi allowance is used up (250 searches a month, 50 an hour). Try again after it resets.";

const AI_QUOTA_MESSAGE =
  "Photo descriptions are paused until the free daily Workers AI allowance resets. These matches are from visual search.";
const AI_FAILED_MESSAGE = "The photo description did not run. These matches are from visual search.";

export const VISION_PROMPT =
  'Identify the furniture in this photo for a shopping search. Reply with JSON only, no markdown: {"description":"one sentence a shopper would recognize, under 140 characters","shoppingQuery":"6 to 14 product keywords, no store names"}. If it is not furniture, describe what you see and set shoppingQuery to the closest furniture product search.';

const AGREEMENT = /meta license|acceptable use policy|must agree|model agreement|license agreement/i;

/** Drops unused SerpApi fields so JSON parsing stays small on the Workers Free 10 ms CPU budget. */
const LENS_FIELDS =
  "visual_matches[].{title,link,source,price,extracted_price,thumbnail,image,position,exact_matches},exact_matches[].{title,link,source,price,extracted_price,thumbnail,image,position},products[].{title,link,source,price,extracted_price,thumbnail,image,position}";
const SHOPPING_FIELDS =
  "shopping_results[].{title,link,product_link,source,price,extracted_price,thumbnail,image},inline_shopping_results[].{title,link,product_link,source,price,extracted_price,thumbnail,image}";

interface Vision {
  description: string;
  shoppingQuery: string;
}

interface LensItem {
  title?: string;
  link?: string;
  source?: string;
  price?: unknown;
  extracted_price?: unknown;
  thumbnail?: string;
  image?: string;
  position?: number;
  exact_matches?: boolean;
}

interface ShoppingItem extends LensItem {
  product_link?: string;
}

interface LensOutcome {
  candidates: Candidate[];
  quota: boolean;
}

export function present(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isSerpQuota(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /run out of searches|searches limit|hourly limit|rate limit|too many requests/i.test(message);
}

export function keyStatus(env: MatchEnv): StatusResponse {
  const missingKeys: string[] = [];
  if (!present(env.SERPAPI_API_KEY)) missingKeys.push("SERPAPI_API_KEY");
  const mode = missingKeys.length === 0 ? "live" : "demo";
  const message =
    mode === "demo"
      ? "Demo mode. Sample listings and prices. Add SERPAPI_API_KEY for live matches."
      : null;
  return { mode, missingKeys, message };
}

export function countPriced(candidates: Candidate[]): number {
  let count = 0;
  for (const candidate of candidates) {
    if (candidate.price != null) count += 1;
  }
  return count;
}

export async function matchPhoto(photo: Blob, mime: string, env: MatchEnv): Promise<MatchResponse> {
  const status = keyStatus(env);
  if (status.mode === "demo") {
    const ranked = mergeAndRank(DEMO_CANDIDATES);
    return {
      mode: "demo",
      description: DEMO_DESCRIPTION,
      priceRange: ranked.priceRange,
      results: ranked.results,
      notice: status.message,
      missingKeys: status.missingKeys,
    };
  }

  const serpKey = env.SERPAPI_API_KEY!.trim();
  const notes: string[] = [];
  // Two views of the same bytes. Blob.slice does not copy them through JavaScript.
  const lensPhoto = photo.slice(0, photo.size, mime);
  const visionPhoto = photo.slice(0, photo.size, mime);

  const visionPromise = describeImage(visionPhoto, mime, env).catch((error: unknown) => {
    console.error("workers-ai", safeError(error));
    notes.push(aiNote(error));
    return null;
  });

  const lens = await searchLens(lensPhoto, mime, serpKey).catch((error: unknown): LensOutcome => {
    console.error("lens", safeError(error));
    if (isSerpQuota(error)) return { candidates: [], quota: true };
    notes.push("Visual search did not respond.");
    return { candidates: [], quota: false };
  });

  if (lens.quota && lens.candidates.length === 0) {
    throw new Error(SERP_QUOTA_MESSAGE);
  }
  if (lens.quota) notes.push(SERP_QUOTA_MESSAGE);

  const vision = await visionPromise;
  let shopping: Candidate[] = [];
  if (!lens.quota && countPriced(lens.candidates) < SHOPPING_MIN_PRICED) {
    const query = vision?.shoppingQuery || inferQuery(lens.candidates);
    if (query) {
      try {
        shopping = await searchShopping(query, serpKey);
      } catch (error) {
        console.error("shopping", safeError(error));
        notes.push(isSerpQuota(error) ? SERP_QUOTA_MESSAGE : "The extra shopping search did not respond.");
      }
    }
  }

  const ranked = mergeAndRank([...lens.candidates, ...shopping]);
  if (ranked.results.length === 0) {
    if (notes.includes(SERP_QUOTA_MESSAGE)) throw new Error(SERP_QUOTA_MESSAGE);
    throw new Error("No priced matches came back. Try a closer photo, with one piece filling the frame.");
  }

  const description = vision?.description || fallbackDescription(lens.candidates);
  const notice = notes.filter(Boolean).join(" ") || null;
  return {
    mode: "live",
    description,
    priceRange: ranked.priceRange,
    results: ranked.results,
    notice,
    missingKeys: status.missingKeys,
  };
}

function fallbackDescription(candidates: Candidate[]): string {
  const best = candidates.find((candidate) => candidate.closeness === "exact") ?? candidates[0];
  if (best?.name) return `Visually similar listings, starting with ${best.name}.`.slice(0, 180);
  return "Visually similar listings for this photo.";
}

function aiNote(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (/neuron|quota|allowance|rate limit|429|exceeded/i.test(message)) return AI_QUOTA_MESSAGE;
  return AI_FAILED_MESSAGE;
}

export function lensToCandidates(payload: unknown): Candidate[] {
  const exact = readItems(payload, "exact_matches").map((item, index) => toLensCandidate(item, "exact", index));
  const visual = readItems(payload, "visual_matches").map((item, index) =>
    toLensCandidate(item, item.exact_matches ? "exact" : "visual", index),
  );
  const products = readItems(payload, "products").map((item, index) => toLensCandidate(item, "visual", index + 20));
  return [...exact, ...visual, ...products].filter((item): item is Candidate => item !== null);
}

export function shoppingToCandidates(payload: unknown): Candidate[] {
  const blocks = [...readItems(payload, "shopping_results"), ...readItems(payload, "inline_shopping_results")];
  return blocks
    .map((item, index) => toShoppingCandidate(item, index))
    .filter((item): item is Candidate => item !== null);
}

function toLensCandidate(item: LensItem, closeness: Candidate["closeness"], index: number): Candidate | null {
  const name = cleanTitle(item.title);
  const url = firstHttp(item.link);
  if (!name || !url) return null;
  const priced = priceParts(item);
  return {
    name,
    store: cleanTitle(item.source) || storeFromUrl(url),
    price: priced.price,
    priceLabel: priced.label,
    url,
    image: firstImage(item.image, item.thumbnail),
    closeness,
    origin: "lens",
    position: typeof item.position === "number" ? item.position : index,
  };
}

function toShoppingCandidate(item: ShoppingItem, index: number): Candidate | null {
  const name = cleanTitle(item.title);
  const direct = firstHttp(item.link);
  const product = firstHttp(item.product_link);
  const url = direct && isDirectProductLink(direct) ? direct : product || direct;
  if (!name || !url) return null;
  const priced = priceParts(item);
  return {
    name,
    store: cleanTitle(item.source) || storeFromUrl(url),
    price: priced.price,
    priceLabel: priced.label,
    url,
    image: firstImage(item.thumbnail, item.image),
    closeness: "similar",
    origin: "shopping",
    position: index,
  };
}

async function searchLens(photo: Blob, mime: string, apiKey: string): Promise<LensOutcome> {
  const imageId = await uploadImage(photo, mime, apiKey);
  const payload = await serpGet(
    {
      engine: "google_lens",
      image_id: imageId,
      type: "visual_matches",
      hl: "en",
      country: "us",
      json_restrictor: LENS_FIELDS,
    },
    apiKey,
    LENS_TIMEOUT_MS,
  );
  return { candidates: lensToCandidates(payload), quota: false };
}

async function searchShopping(query: string, apiKey: string): Promise<Candidate[]> {
  const payload = await serpGet(
    {
      engine: "google_shopping",
      q: query,
      hl: "en",
      gl: "us",
      json_restrictor: SHOPPING_FIELDS,
    },
    apiKey,
    SHOPPING_TIMEOUT_MS,
  );
  return shoppingToCandidates(payload);
}

async function uploadImage(photo: Blob, mime: string, apiKey: string): Promise<string> {
  const type = mime === "image/png" || mime === "image/webp" ? mime : "image/jpeg";
  const extension = type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  const form = new FormData();
  form.set("api_key", apiKey);
  // Pass the uploaded Blob through. Do not copy it into a Uint8Array or base64 string.
  form.set("image", photo, `furniture.${extension}`);
  const response = await fetch("https://serpapi.com/image", {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(LENS_TIMEOUT_MS),
  });
  const payload = (await response.json().catch(() => ({}))) as { image_id?: string; error?: string };
  if (!response.ok || !payload.image_id) {
    throw new Error(payload.error || "The photo could not be sent to visual search.");
  }
  return payload.image_id;
}

async function serpGet(params: Record<string, string>, apiKey: string, timeoutMs: number): Promise<unknown> {
  const query = new URLSearchParams({ ...params, api_key: apiKey });
  const response = await fetch(`https://serpapi.com/search.json?${query}`, {
    signal: AbortSignal.timeout(timeoutMs),
  });
  const payload = (await response.json().catch(() => ({}))) as { error?: string };
  if (response.status === 429) {
    throw new Error(payload.error || "SerpApi rate limit");
  }
  if (!response.ok || payload.error) {
    throw new Error(payload.error || "The product search did not respond.");
  }
  return payload;
}

async function describeImage(photo: Blob, mime: string, env: MatchEnv): Promise<Vision | null> {
  if (!env.AI) return null;
  const type = mime === "image/png" || mime === "image/webp" ? mime : "image/jpeg";
  try {
    const first = await runVision(photo, type, env);
    if (!needsAgreement(first)) return parseVision(first);
  } catch (error) {
    if (!isAgreementError(error)) throw error;
  }
  await env.AI.run(VISION_MODEL, { prompt: "agree" }, { signal: AbortSignal.timeout(VISION_TIMEOUT_MS) });
  return parseVision(await runVision(photo, type, env));
}

function visionInputs(photo: Blob, mime: string): Record<string, unknown> {
  return {
    image: {
      body: photo.stream(),
      contentType: mime,
    },
    prompt: VISION_PROMPT,
    max_tokens: 160,
    temperature: 0.1,
  };
}

async function runVision(photo: Blob, mime: string, env: MatchEnv): Promise<string> {
  const result = await env.AI!.run(VISION_MODEL, visionInputs(photo, mime), {
    signal: AbortSignal.timeout(VISION_TIMEOUT_MS),
  });
  return visionText(result);
}

function needsAgreement(text: string): boolean {
  return AGREEMENT.test(text);
}

function isAgreementError(error: unknown): boolean {
  return AGREEMENT.test(error instanceof Error ? error.message : String(error ?? ""));
}

function visionText(result: unknown): string {
  if (typeof result === "string") return result;
  if (!result || typeof result !== "object") return "";
  const record = result as { response?: unknown; description?: unknown };
  if (typeof record.response === "string") return record.response;
  if (typeof record.description === "string") return record.description;
  return "";
}

export function parseVision(content: string): Vision | null {
  const trimmed = content.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) {
    try {
      const parsed = JSON.parse(trimmed.slice(start, end + 1)) as { description?: unknown; shoppingQuery?: unknown };
      const description = typeof parsed.description === "string" ? parsed.description.replace(/\s+/g, " ").trim() : "";
      const shoppingQuery = sanitizeQuery(typeof parsed.shoppingQuery === "string" ? parsed.shoppingQuery : "");
      if (description) return { description: description.slice(0, 180), shoppingQuery };
    } catch {
      /* fall through to a plain sentence */
    }
  }
  if (!trimmed || needsAgreement(trimmed)) return null;
  const sentence = trimmed.replace(/\s+/g, " ").split(/(?<=[.!?])\s/)[0]?.trim() ?? "";
  if (sentence.length < 8) return null;
  return { description: sentence.slice(0, 180), shoppingQuery: sanitizeQuery(sentence) };
}

export function inferQuery(candidates: Candidate[]): string | null {
  const best = candidates.find((candidate) => candidate.closeness === "exact") ?? candidates[0];
  if (!best) return null;
  return sanitizeQuery(best.name.split(/[|–—-]/)[0] ?? best.name);
}

export function sanitizeQuery(value: string): string {
  const words = value
    .replace(/["'`]/g, " ")
    .replace(/\b(amazon|ebay|wayfair|etsy|walmart|google)\b/gi, " ")
    .replace(/[^\w\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1)
    .slice(0, 14);
  const query = words.join(" ").slice(0, 140).trim();
  return query.length >= 3 ? query : "";
}

function readItems(payload: unknown, key: string): LensItem[] {
  if (!payload || typeof payload !== "object") return [];
  const value = (payload as Record<string, unknown>)[key];
  return Array.isArray(value) ? (value as LensItem[]) : [];
}

function cleanTitle(value: unknown): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
}

function firstHttp(...urls: (string | undefined)[]): string | null {
  for (const url of urls) {
    if (url && isHttpUrl(url)) return url;
  }
  return null;
}

function firstImage(...urls: (string | undefined)[]): string {
  for (const url of urls) {
    if (url && isHttpUrl(url)) return url;
  }
  return "";
}

function safeError(error: unknown): string {
  const raw = error instanceof Error ? error.message : "Search failed";
  return raw.replace(/api[_-]?key[=:\s]+\S+/gi, "api_key").slice(0, 180);
}
