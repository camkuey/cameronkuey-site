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
}
