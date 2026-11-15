import type { LogContext, MatchEnv } from "./types";

const MAX_LOG_BYTES = 450_000;

export function loggingEnabled(env: MatchEnv): boolean {
  return present(env.LOG_WEBHOOK_URL) && present(env.LOG_WEBHOOK_SECRET);
}

/**
 * Forward the client's log body to the Apps Script without reading or re-encoding it.
 * Google answers the first POST with a redirect, and fetch would drop the body on that hop,
 * so a second POST sends the same bytes to the redirect target.
 */
export function scheduleLog(ctx: LogContext | undefined, env: MatchEnv, request: Request): Promise<void> | null {
  if (!loggingEnabled(env) || !request.body) return null;
  const contentType = request.headers.get("content-type") || "application/json";
  const task = postLog(env, request.body, contentType).catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "log failed";
    console.error("log", message.replace(/https?:\/\/\S+/gi, "url").slice(0, 180));
  });
  ctx?.waitUntil(task);
  return task;
}

export function logSkipped(request: Request): boolean {
  const action = request.headers.get("x-log-action");
  if (action !== "search" && action !== "accuracy") return true;
  if (action === "search" && request.headers.get("x-match-mode") !== "live") return true;
  const length = Number(request.headers.get("content-length") || "0");
  return Number.isFinite(length) && length > MAX_LOG_BYTES;
}

async function postLog(env: MatchEnv, body: ReadableStream<Uint8Array>, contentType: string): Promise<void> {
  const secret = env.LOG_WEBHOOK_SECRET!.trim();
  const [first, second] = body.tee();
  const headers = { "Content-Type": contentType };
  const started = await fetch(withSecret(env.LOG_WEBHOOK_URL!, secret), {
    method: "POST",
    redirect: "manual",
    headers,
    body: first,
  });
  if (started.status >= 300 && started.status < 400) {
    const location = started.headers.get("Location");
    if (!location) {
      await cancel(second);
      return;
    }
    const followed = await fetch(withSecret(location, secret), {
      method: "POST",
      redirect: "follow",
      headers,
      body: second,
    });
    if (!followed.ok) console.error("log", followed.status);
    return;
  }
  await cancel(second);
  if (!started.ok) console.error("log", started.status);
}

function withSecret(url: string, secret: string): string {
  const target = new URL(url);
  target.searchParams.set("k", secret);
  return target.toString();
}

function present(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

async function cancel(stream: ReadableStream<Uint8Array>): Promise<void> {
  try {
    await stream.cancel();
  } catch {
    /* The unused copy of the body can already be closed. */
  }
}
