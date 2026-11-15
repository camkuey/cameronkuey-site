import { isSerpQuota, keyStatus, matchPhoto, SERP_QUOTA_MESSAGE } from "./pipeline.ts";
import type { MatchEnv } from "./types";

const MAX_BYTES = 200_000;
const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

export async function handleFurnitureApi(request: Request, env: MatchEnv): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (path === "/furniture/api/status" && request.method === "GET") {
    return json(keyStatus(env));
  }

  if (path === "/furniture/api/match" && request.method === "POST") {
    return matchRequest(request, env);
  }

  if (path === "/furniture/api/status" || path === "/furniture/api/match") {
    return json({ error: "Method not allowed." }, 405);
  }

  return json({ error: "Not found." }, 404);
}

async function matchRequest(request: Request, env: MatchEnv): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json({ error: "Send the photo as a file upload." }, 400);
  }

  const photo = form.get("photo");
  if (!(photo instanceof File)) return json({ error: "Choose a photo first." }, 400);

  const mime = normalizeMime(photo.type);
  if (!ALLOWED.has(mime)) return json({ error: "Use a JPEG, PNG, or WebP photo." }, 400);
  if (photo.size > MAX_BYTES) {
    return json({ error: "That photo is still too large after compression. Try another shot." }, 413);
  }
  if (photo.size < 32) return json({ error: "That file was empty." }, 400);

  try {
    // Stream the File through. Do not read it into a byte array in the Worker.
    const result = await matchPhoto(photo, mime === "image/jpg" ? "image/jpeg" : mime, env);
    return json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The search did not finish.";
    console.error("match", message.slice(0, 180));
    return json({ error: friendly(message) }, 502);
  }
}

function normalizeMime(type: string): string {
  const mime = type.toLowerCase().split(";")[0]?.trim() || "";
  return mime === "image/jpg" ? "image/jpeg" : mime;
}

function friendly(message: string): string {
  const cleaned = message.replace(/api[_-]?key[=:\s]+\S+/gi, "api_key").slice(0, 240);
  if (cleaned === SERP_QUOTA_MESSAGE) return cleaned;
  if (/rejected SERPAPI_API_KEY|Invalid API key/i.test(cleaned)) return "SerpApi rejected SERPAPI_API_KEY.";
  if (isSerpQuota(new Error(cleaned))) return SERP_QUOTA_MESSAGE;
  if (/No priced matches/i.test(cleaned)) return cleaned;
  return "The search did not finish. Try the photo again.";
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
