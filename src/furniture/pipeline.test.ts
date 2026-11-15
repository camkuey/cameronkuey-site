import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { handleFurnitureApi } from "./api.ts";
import { inferQuery, keyStatus, lensToCandidates, matchPhoto, parseVision, SERP_QUOTA_MESSAGE, shoppingToCandidates, VISION_MODEL, VISION_PROMPT } from "./pipeline.ts";

const TINY_JPEG = Uint8Array.from(
  atob(
    "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAGcP//EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AVf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/AVf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAY/Aqf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/IV//2gAMAwEAAgADAAAAEPP/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/EGH/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/EGH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAE/EH//2Q==",
  ),
  (char) => char.charCodeAt(0),
);

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("demo mode", () => {
  it("describes the missing secrets and returns sample listings", async () => {
    const status = keyStatus({});
    assert.equal(status.mode, "demo");
    assert.deepEqual(status.missingKeys, ["SERPAPI_API_KEY"]);
    assert.match(status.message ?? "", /SERPAPI_API_KEY/);
    assert.equal((status.message ?? "").includes("OPENAI"), false);

    const response = await handleFurnitureApi(new Request("https://www.cameronkuey.com/furniture/api/status"), {});
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("X-Robots-Tag"), "noindex, nofollow");

    const form = new FormData();
    form.set("photo", new File([TINY_JPEG], "chair.jpg", { type: "image/jpeg" }));
    const match = await handleFurnitureApi(
      new Request("https://www.cameronkuey.com/furniture/api/match", { method: "POST", body: form }),
      {},
    );
    assert.equal(match.status, 200);
    const body = (await match.json()) as { mode: string; results: { price: number; url: string }[]; priceRange: { label: string }; notice: string };
    assert.equal(body.mode, "demo");
    assert.equal("entryId" in body, false);
    assert.equal(body.results.length, 6);
    assert.equal(body.results[0]?.price, 1149);
    assert.equal(body.priceRange.label, "$699 – $1,549");
    assert.match(body.notice, /Demo mode/);
    assert.equal(body.results.every((result) => result.url.startsWith("https://")), true);
  });

  it("rejects a match with no photo", async () => {
    const response = await handleFurnitureApi(
      new Request("https://www.cameronkuey.com/furniture/api/match", { method: "POST", body: new FormData() }),
      {},
    );
    assert.equal(response.status, 400);
  });
});

describe("live parsers", () => {
  it("marks lens exact flags first and merges a priced shopping duplicate", () => {
    const lens = lensToCandidates({
      visual_matches: [
        {
          position: 1,
          title: "Soto Leather Lounge Chair",
          link: "https://www.google.com/shopping/product/1",
          source: "Article",
          exact_matches: true,
          thumbnail: "https://encrypted-tbn.gstatic.com/tiny",
        },
        {
          position: 2,
          title: "Someone's living room",
          link: "https://www.pinterest.com/pin/99",
          source: "Pinterest",
        },
      ],
    });
    const shopping = shoppingToCandidates({
      shopping_results: [
        {
          title: "Soto Leather Lounge Chair",
          link: "https://www.article.com/product/soto?utm_source=google",
          source: "Article",
          price: "$1,149",
          extracted_price: 1149,
          thumbnail: "https://cdn.article.com/soto.jpg",
        },
        {
          title: "Andre Leather Lounge",
          source: "West Elm",
          price: "$899",
          extracted_price: 899,
          product_link: "https://www.google.com/shopping/product/andre",
          link: "https://www.westelm.com/products/andre",
          thumbnail: "https://cdn.westelm.com/andre.jpg",
        },
      ],
    });
    const names = [...lens, ...shopping];
    assert.equal(names[0]?.closeness, "exact");
    assert.equal(inferQuery(lens), "Soto Leather Lounge Chair");
    assert.equal(parseVision('{"description":"A walnut lounge chair.","shoppingQuery":"walnut lounge chair"}')?.shoppingQuery, "walnut lounge chair");
  });

  it("streams the photo to SerpApi, skips base64, and uses Workers AI plus shopping when Lens has few prices", async () => {
    const calls: string[] = [];
    let visionImage: { body?: unknown; contentType?: string } | null = null;
    globalThis.fetch = async (input) => {
      const url = String(input);
      calls.push(url);
      if (url.startsWith("https://serpapi.com/image")) {
        return Response.json({ image_id: "img_test" });
      }
      if (url.includes("engine=google_lens")) {
        assert.match(url, /image_id=img_test/);
        assert.match(url, /json_restrictor=/);
        return Response.json({
          visual_matches: [
            {
              position: 1,
              title: "Soto Leather Lounge Chair",
              link: "https://www.article.com/product/soto",
              source: "Article",
              exact_matches: true,
              image: "https://cdn.article.com/soto.jpg",
            },
          ],
        });
      }
      if (url.includes("engine=google_shopping")) {
        assert.match(url, /q=walnut\+lounge\+chair|q=walnut%20lounge%20chair/);
        return Response.json({
          shopping_results: [
            {
              title: "Soto Leather Lounge Chair",
              link: "https://www.article.com/product/soto?utm_source=google",
              source: "Article",
              extracted_price: 1149,
              price: "$1,149",
              thumbnail: "https://cdn.article.com/soto.jpg",
            },
          ],
        });
      }
      throw new Error(`unexpected fetch ${url}`);
    };

    const photo = new Blob([TINY_JPEG], { type: "image/jpeg" });
    const result = await matchPhoto(photo, "image/jpeg", {
      SERPAPI_API_KEY: "super-secret",
      AI: {
        async run(model, inputs) {
          assert.equal(model, VISION_MODEL);
          visionImage = inputs.image as { body?: unknown; contentType?: string };
          assert.equal(visionImage.contentType, "image/jpeg");
          assert.equal(typeof (visionImage.body as ReadableStream | undefined)?.getReader, "function");
          return {
            response: JSON.stringify({
              description: "Walnut lounge chair with a cognac leather seat.",
              shoppingQuery: "walnut lounge chair",
            }),
          };
        },
      },
    });
    assert.equal(result.mode, "live");
    assert.match(result.entryId ?? "", /^[0-9a-f-]{36}$/);
    assert.equal(result.query, "walnut lounge chair");
    assert.equal(result.missingKeys.length, 0);
    assert.equal(result.notice, null);
    assert.equal(result.description, "Walnut lounge chair with a cognac leather seat.");
    assert.equal(result.results.length, 1);
    assert.equal(result.results[0]?.closeness, "exact");
    assert.equal(result.results[0]?.price, 1149);
    assert.equal(result.results[0]?.store, "Article");
    assert.equal(JSON.stringify(result).includes("super-secret"), false);
    assert.equal(calls.some((url) => url.startsWith("https://api.openai.com/")), false);
    assert.equal(calls.some((url) => url.includes("engine=google_shopping")), true);
  });

  it("does not spend a shopping search when Lens already has priced matches", async () => {
    const calls: string[] = [];
    globalThis.fetch = async (input) => {
      const url = String(input);
      calls.push(url);
      if (url.startsWith("https://serpapi.com/image")) return Response.json({ image_id: "img_test" });
      if (url.includes("engine=google_lens")) {
        return Response.json({
          visual_matches: [1, 2, 3].map((position) => ({
            position,
            title: `Chair ${position}`,
            link: `https://www.example.com/chair-${position}`,
            source: "Example",
            extracted_price: 100 * position,
            price: `$${100 * position}`,
            thumbnail: `https://cdn.example.com/${position}.jpg`,
          })),
        });
      }
      if (url.includes("engine=google_shopping")) throw new Error("shopping search should not run");
      throw new Error(`unexpected fetch ${url}`);
    };

    const result = await matchPhoto(new Blob([TINY_JPEG], { type: "image/jpeg" }), "image/jpeg", {
      SERPAPI_API_KEY: "super-secret",
      AI: {
        async run() {
          throw new Error("Workers AI quota exceeded");
        },
      },
    });
    assert.equal(result.results.length, 3);
    assert.equal(result.results[0]?.price, 100);
    assert.match(result.description, /Chair 1/);
    assert.match(result.notice ?? "", /free daily Workers AI allowance/);
    assert.equal(calls.some((url) => url.includes("engine=google_shopping")), false);
  });

  it("returns a friendly message when the SerpApi allowance is used up and does not start shopping", async () => {
    const calls: string[] = [];
    globalThis.fetch = async (input) => {
      const url = String(input);
      calls.push(url);
      if (url.startsWith("https://serpapi.com/image")) return Response.json({ image_id: "img_test" });
      if (url.includes("engine=google_lens")) {
        return Response.json({ error: "Your account has run out of searches." }, { status: 429 });
      }
      if (url.includes("engine=google_shopping")) throw new Error("shopping search should not run");
      throw new Error(`unexpected fetch ${url}`);
    };

    await assert.rejects(
      () => matchPhoto(new Blob([TINY_JPEG], { type: "image/jpeg" }), "image/jpeg", { SERPAPI_API_KEY: "super-secret" }),
      (error: unknown) => error instanceof Error && error.message === SERP_QUOTA_MESSAGE,
    );
    assert.equal(calls.some((url) => url.includes("engine=google_shopping")), false);
  });

  it("keeps Lens results when the extra shopping search hits the allowance", async () => {
    globalThis.fetch = async (input) => {
      const url = String(input);
      if (url.startsWith("https://serpapi.com/image")) return Response.json({ image_id: "img_test" });
      if (url.includes("engine=google_lens")) {
        return Response.json({
          visual_matches: [
            {
              position: 1,
              title: "Soto Leather Lounge Chair",
              link: "https://www.article.com/product/soto",
              source: "Article",
              exact_matches: true,
              extracted_price: 1149,
              price: "$1,149",
              image: "https://cdn.article.com/soto.jpg",
            },
          ],
        });
      }
      if (url.includes("engine=google_shopping")) {
        return Response.json({ error: "You have exceeded your hourly searches limit." }, { status: 429 });
      }
      throw new Error(`unexpected fetch ${url}`);
    };

    const result = await matchPhoto(new Blob([TINY_JPEG], { type: "image/jpeg" }), "image/jpeg", {
      SERPAPI_API_KEY: "super-secret",
    });
    assert.equal(result.results.length, 1);
    assert.equal(result.results[0]?.price, 1149);
    assert.equal(result.notice, SERP_QUOTA_MESSAGE);
  });

  it("accepts the model license once and then describes the photo", async () => {
    const prompts: unknown[] = [];
    globalThis.fetch = async (input) => {
      const url = String(input);
      if (url.startsWith("https://serpapi.com/image")) return Response.json({ image_id: "img_test" });
      if (url.includes("engine=google_lens")) {
        return Response.json({
          visual_matches: [
            {
              position: 1,
              title: "Priced Chair",
              link: "https://www.article.com/product/priced",
              source: "Article",
              extracted_price: 400,
              price: "$400",
              image: "https://cdn.article.com/priced.jpg",
            },
            {
              position: 2,
              title: "Second Chair",
              link: "https://www.example.com/second",
              source: "Example",
              extracted_price: 500,
              price: "$500",
              image: "https://cdn.example.com/second.jpg",
            },
            {
              position: 3,
              title: "Third Chair",
              link: "https://www.example.com/third",
              source: "Example",
              extracted_price: 600,
              price: "$600",
              image: "https://cdn.example.com/third.jpg",
            },
          ],
        });
      }
      throw new Error(`unexpected fetch ${url}`);
    };

    const result = await matchPhoto(new Blob([TINY_JPEG], { type: "image/jpeg" }), "image/jpeg", {
      SERPAPI_API_KEY: "super-secret",
      AI: {
        async run(_model, inputs) {
          prompts.push(inputs.prompt);
          if (prompts.length === 1) throw new Error("You must agree to the Meta License and Acceptable Use Policy");
          if (inputs.prompt === "agree") return { response: "agreed" };
          return { response: '{"description":"Oak dining chair.","shoppingQuery":"oak dining chair"}' };
        },
      },
    });
    assert.deepEqual(prompts, [VISION_PROMPT, "agree", VISION_PROMPT]);
    assert.equal(result.description, "Oak dining chair.");
    assert.equal(result.notice, null);
  });
});
