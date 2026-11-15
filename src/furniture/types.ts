export type Closeness = "exact" | "visual" | "similar";
export type Mode = "live" | "demo";

export interface ProductMatch {
  id: string;
  name: string;
  store: string;
  price: number | null;
  priceLabel: string | null;
  url: string;
  image: string;
  closeness: Closeness;
}

export interface PriceRange {
  min: number;
  max: number;
  label: string;
}

export interface MatchResponse {
  mode: Mode;
  description: string;
  priceRange: PriceRange | null;
  results: ProductMatch[];
  notice: string | null;
  missingKeys: string[];
  /** Present on live searches only. Demo searches are not logged. */
  entryId?: string;
  /** Shopping query used for the sheet log. Omitted in demo mode. */
  query?: string;
}

export interface StatusResponse {
  mode: Mode;
  missingKeys: string[];
  message: string | null;
}

/** Minimal Workers AI binding. Binary image inputs use `{ body, contentType }` so the runtime streams the bytes. */
export interface WorkersAi {
  run(model: string, inputs: Record<string, unknown>, options?: { signal?: AbortSignal }): Promise<unknown>;
}

export interface MatchEnv {
  SERPAPI_API_KEY?: string;
  AI?: WorkersAi;
  /** Apps Script web app URL. Logging is skipped when this or the secret is empty. */
  LOG_WEBHOOK_URL?: string;
  /** Shared secret sent to the Apps Script as the `k` query parameter. */
  LOG_WEBHOOK_SECRET?: string;
}

export interface LogContext {
  waitUntil(promise: Promise<unknown>): void;
}
