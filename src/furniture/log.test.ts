import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { handleFurnitureApi } from "./api.ts";
import type { LogContext } from "./types.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function ctxFor(pending: Promise<unknown>[]): LogContext {
  return {
    waitUntil(promise) {
      pending.push(promise);
    },
  };
}

function logRequest(body: string, action: "search" | "accuracy", mode = "live"): Request {
  return new Request("https://www.cameronkuey.com/furniture/api/log", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Log-Action": action,
      "X-Match-Mode": mode,
    },
    body,
  });
}

describe("sheet log", () => {
  it("skips demo searches and does nothing when the webhook secrets are unset", async () => {
    let called = false;
    globalThis.fetch = async () => {
      called = true;
      return new Response("no");
    };
    const pending: Promise<unknown>[] = [];
    const demo = await handleFurnitureApi(logRequest('{"mode":"demo"}', "search", "demo"), {
      LOG_WEBHOOK_URL: "https://script.google.com/macros/s/abc/exec",
      LOG_WEBHOOK_SECRET: "secret",
    }, ctxFor(pending));
    assert.deepEqual(await demo.json(), { logged: false });

    const missing = await handleFurnitureApi(logRequest('{"action":"search"}', "search"), {}, ctxFor(pending));
    assert.deepEqual(await missing.json(), { logged: false });
    await Promise.all(pending);
    assert.equal(called, false);
  });

  it("answers immediately and forwards the raw body, including Google's redirect", async () => {
    const seen: { url: string; body: string; method: string }[] = [];
    globalThis.fetch = async (input, init) => {
      await new Promise((resolve) => setTimeout(resolve, 150));
      const url = String(input);
      seen.push({ url, method: String(init?.method), body: await new Response(init?.body).text() });
      if (seen.length === 1) {
        return new Response(null, { status: 302, headers: { Location: "https://script.googleusercontent.com/macros/echo?user=1" } });
      }
      return Response.json({ ok: true });
    };

    const pending: Promise<unknown>[] = [];
    const started = Date.now();
    const payload = JSON.stringify({ action: "search", entryId: "abc", photo: "aGVsbG8=" });
    const response = await handleFurnitureApi(
      logRequest(payload, "search"),
      { LOG_WEBHOOK_URL: "https://script.google.com/macros/s/abc/exec", LOG_WEBHOOK_SECRET: "top-secret" },
      ctxFor(pending),
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { logged: true });
    assert.ok(Date.now() - started < 100);
    await Promise.all(pending);
    assert.equal(seen.length, 2);
    assert.equal(seen[0]?.method, "POST");
    assert.equal(seen[1]?.method, "POST");
    assert.match(seen[0]?.url ?? "", /^https:\/\/script\.google\.com\/macros\/s\/abc\/exec\?k=top-secret$/);
    assert.match(seen[1]?.url ?? "", /^https:\/\/script\.googleusercontent\.com\/macros\/echo\?user=1&k=top-secret$/);
    assert.equal(seen[0]?.body, payload);
    assert.equal(seen[1]?.body, payload);
    assert.equal(JSON.stringify(seen).includes("SERPAPI"), false);
  });

  it("records an accuracy update with the same forwarder", async () => {
    const seen: string[] = [];
    globalThis.fetch = async (input, init) => {
      seen.push(await new Response(init?.body).text());
      return Response.json({ ok: true });
    };
    const pending: Promise<unknown>[] = [];
    const payload = JSON.stringify({ action: "accuracy", entryId: "abc", accurate: "Found it", which: "Soto Leather Lounge Chair" });
    const response = await handleFurnitureApi(
      logRequest(payload, "accuracy"),
      { LOG_WEBHOOK_URL: "https://script.google.com/macros/s/abc/exec", LOG_WEBHOOK_SECRET: "top-secret" },
      ctxFor(pending),
    );
    assert.deepEqual(await response.json(), { logged: true });
    await Promise.all(pending);
    assert.deepEqual(seen, [payload]);
  });
});
