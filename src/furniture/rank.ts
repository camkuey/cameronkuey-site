import type { Closeness, PriceRange, ProductMatch } from "./types";

export type Origin = "lens" | "shopping" | "demo";

export interface Candidate {
  name: string;
  store: string;
  price: number | null;
  priceLabel: string | null;
  url: string;
  image: string;
  closeness: Closeness;
  origin: Origin;
  position: number;
}

const TIER: Record<Closeness, number> = { exact: 0, visual: 1, similar: 2 };
const TRACKING = /^(utm_|gclid$|fbclid$|srsltid$|mc_)/i;

export function parseMoney(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string") {
    const match = value.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
    if (!match) return null;
    const amount = Number(match[1]);
    return Number.isFinite(amount) && amount > 0 ? amount : null;
  }
  if (value && typeof value === "object") {
    const record = value as { extracted_value?: unknown; value?: unknown };
    if (typeof record.extracted_value === "number") return parseMoney(record.extracted_value);
    return parseMoney(record.value);
  }
  return null;
}

export function formatMoney(amount: number): string {
  const cents = Math.round(amount * 100) % 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents === 0 ? 0 : 2,
    maximumFractionDigits: cents === 0 ? 0 : 2,
  }).format(amount);
}

export function priceParts(item: { price?: unknown; extracted_price?: unknown }): {
  price: number | null;
  label: string | null;
} {
  let price: number | null = null;
  let label: string | null = null;
  if (typeof item.price === "string") {
    label = item.price.replace(/\*/g, "").trim() || null;
    price = parseMoney(item.price);
  } else if (typeof item.price === "number") {
    price = parseMoney(item.price);
  } else if (item.price && typeof item.price === "object") {
    const record = item.price as { value?: unknown; extracted_value?: unknown };
    price = parseMoney(record.extracted_value ?? record.value);
    if (typeof record.value === "string") label = record.value.replace(/\*/g, "").trim() || null;
  }
  if (price == null && typeof item.extracted_price === "number") price = parseMoney(item.extracted_price);
  if (price != null && !label) label = formatMoney(price);
  return { price, label };
}

export function isHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export function isDirectProductLink(url: string): boolean {
  if (!isHttpUrl(url)) return false;
  const host = new URL(url).hostname.replace(/^www\./, "");
  if (host === "google.com" || host.endsWith(".google.com")) return false;
  if (host === "gstatic.com" || host.endsWith(".gstatic.com")) return false;
  if (host === "serpapi.com" || host.endsWith(".serpapi.com")) return false;
  return true;
}

export function canonicalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    for (const key of [...parsed.searchParams.keys()]) {
      if (TRACKING.test(key)) parsed.searchParams.delete(key);
    }
    parsed.hash = "";
    const host = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname.replace(/\/$/, "");
    const query = parsed.searchParams.toString();
    return `${host}${path}${query ? `?${query}` : ""}`;
  } catch {
    return url.trim().toLowerCase();
  }
}

function normName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&amp;/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .slice(0, 72);
}

function normStore(store: string): string {
  return store
    .toLowerCase()
    .replace(/\.com$|\.net$|\.co$/, "")
    .replace(/[^a-z0-9]+/g, "");
}

function sameProduct(a: Candidate, b: Candidate): boolean {
  if (canonicalUrl(a.url) === canonicalUrl(b.url)) return true;
  const storeA = normStore(a.store);
  const storeB = normStore(b.store);
  if (!storeA || !storeB || storeA !== storeB) return false;
  const nameA = normName(a.name);
  const nameB = normName(b.name);
  return nameA.length > 0 && nameA === nameB;
}

function imageScore(url: string): number {
  if (!url) return 0;
  if (/gstatic\.com|encrypted-tbn|serpapi\.com/i.test(url)) return 1;
  return 2;
}

function linkScore(url: string): number {
  if (!isHttpUrl(url)) return 0;
  return isDirectProductLink(url) ? 2 : 1;
}

function prefer(a: Candidate, b: Candidate): Candidate {
  const winner =
    TIER[a.closeness] < TIER[b.closeness] ? a : TIER[b.closeness] < TIER[a.closeness] ? b : a.position <= b.position ? a : b;
  const priced = a.price != null ? a : b;
  const linked = linkScore(b.url) > linkScore(a.url) ? b : a;
  const image = imageScore(b.image) > imageScore(a.image) ? b.image : a.image || b.image;
  return {
    name: winner.name.trim().length >= 8 ? winner.name : a.name.length >= b.name.length ? a.name : b.name,
    store: winner.store || a.store || b.store,
    price: priced.price,
    priceLabel: priced.price != null ? priced.priceLabel || formatMoney(priced.price) : null,
    url: linked.url,
    image,
    closeness: TIER[a.closeness] <= TIER[b.closeness] ? a.closeness : b.closeness,
    origin: winner.origin,
    position: Math.min(a.position, b.position),
  };
}

const SOCIAL = ["pinterest.", "instagram.", "facebook.", "fb.com", "reddit.", "tiktok.", "twitter.", "x.com", "youtube.", "youtu.be"];

function isSearchPage(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "lens.google.com") return true;
    return (host === "google.com" || host.endsWith(".google.com")) && parsed.pathname.startsWith("/search");
  } catch {
    return true;
  }
}

export function keepCandidate(candidate: Candidate): boolean {
  if (!candidate.name.trim() || !isHttpUrl(candidate.url)) return false;
  let host = "";
  try {
    host = new URL(candidate.url).hostname;
  } catch {
    return false;
  }
  const social = SOCIAL.some((needle) => host.includes(needle));
  if (social && candidate.price == null) return false;
  if (isSearchPage(candidate.url) && candidate.price == null) return false;
  return true;
}

function sortScore(candidate: Candidate): number {
  const priceBoost = candidate.price != null && isDirectProductLink(candidate.url) ? 0 : 0.35;
  return candidate.position + priceBoost;
}

function idFor(candidate: Candidate, index: number): string {
  const basis = canonicalUrl(candidate.url);
  let hash = 0;
  for (let i = 0; i < basis.length; i++) hash = (hash * 31 + basis.charCodeAt(i)) >>> 0;
  return `${candidate.closeness}-${hash.toString(36)}-${index}`;
}

export function mergeAndRank(input: Candidate[], limit = 12): { results: ProductMatch[]; priceRange: PriceRange | null } {
  const merged: Candidate[] = [];
  for (const candidate of input) {
    if (!keepCandidate(candidate)) continue;
    const index = merged.findIndex((existing) => sameProduct(existing, candidate));
    if (index === -1) merged.push(candidate);
    else merged[index] = prefer(merged[index], candidate);
  }

  merged.sort((a, b) => {
    const tier = TIER[a.closeness] - TIER[b.closeness];
    if (tier !== 0) return tier;
    const score = sortScore(a) - sortScore(b);
    if (score !== 0) return score;
    return linkScore(b.url) - linkScore(a.url);
  });

  const results: ProductMatch[] = merged.slice(0, limit).map((candidate, index) => ({
    id: idFor(candidate, index),
    name: candidate.name.trim(),
    store: candidate.store.trim() || storeFromUrl(candidate.url),
    price: candidate.price,
    priceLabel: candidate.price != null ? candidate.priceLabel || formatMoney(candidate.price) : null,
    url: candidate.url,
    image: candidate.image,
    closeness: candidate.closeness,
  }));

  const prices = results.map((result) => result.price).filter((price): price is number => price != null);
  const priceRange =
    prices.length === 0
      ? null
      : {
          min: Math.min(...prices),
          max: Math.max(...prices),
          label:
            Math.min(...prices) === Math.max(...prices)
              ? formatMoney(prices[0])
              : `${formatMoney(Math.min(...prices))} – ${formatMoney(Math.max(...prices))}`,
        };

  return { results, priceRange };
}

export function storeFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const name = host.split(".")[0] ?? host;
    return name.charAt(0).toUpperCase() + name.slice(1);
  } catch {
    return "Store";
  }
}

export function safeHttpUrl(url: string): string | null {
  if (!isHttpUrl(url)) return null;
  return url;
}

export function safeImageUrl(url: string): string | null {
  if (!url) return null;
  if (url.startsWith("/furniture/")) return url;
  return safeHttpUrl(url);
}
