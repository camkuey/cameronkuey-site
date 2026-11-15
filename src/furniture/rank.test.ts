import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldShowInstallHint } from "./install-hint.ts";
import { mergeAndRank, parseMoney, type Candidate } from "./rank.ts";

function candidate(overrides: Partial<Candidate> & Pick<Candidate, "name" | "url" | "closeness" | "position">): Candidate {
  return {
    store: "Article",
    price: 100,
    priceLabel: "$100",
    image: "https://cdn.example/p.jpg",
    origin: "lens",
    ...overrides,
  };
}

describe("mergeAndRank", () => {
  it("puts exact matches ahead of visual matches and shopping results", () => {
    const { results } = mergeAndRank([
      candidate({ name: "Shopping chair", url: "https://westelm.com/a", closeness: "similar", origin: "shopping", position: 0, price: 50 }),
      candidate({ name: "Visual chair", url: "https://cb2.com/a", closeness: "visual", position: 4, price: null, priceLabel: null }),
      candidate({ name: "Exact chair", url: "https://article.com/a", closeness: "exact", position: 3, price: 10 }),
    ]);
    assert.deepEqual(
      results.map((result) => result.closeness),
      ["exact", "visual", "similar"],
    );
  });

  it("keeps a closer visual match ahead of a later priced one", () => {
    const { results } = mergeAndRank([
      candidate({ name: "Farther priced", url: "https://cb2.com/far", closeness: "visual", position: 2, price: 80 }),
      candidate({ name: "Closer plain", url: "https://article.com/near", closeness: "visual", position: 1, price: null, priceLabel: null, store: "West Elm" }),
    ]);
    assert.equal(results[0]?.name, "Closer plain");
    assert.equal(results[1]?.name, "Farther priced");
  });

  it("dedupes tracking urls and keeps the price and the direct link", () => {
    const { results, priceRange } = mergeAndRank([
      candidate({
        name: "Soto Leather Lounge Chair",
        url: "https://www.google.com/shopping/product/1",
        closeness: "exact",
        position: 1,
        price: null,
        priceLabel: null,
        image: "https://encrypted-tbn.gstatic.com/tiny",
      }),
      candidate({
        name: "Soto Leather Lounge Chair",
        url: "https://www.article.com/product/soto?utm_source=google&srsltid=abc",
        closeness: "similar",
        origin: "shopping",
        position: 0,
        price: 1149,
        priceLabel: "$1,149",
        image: "https://cdn.article.com/soto.jpg",
      }),
    ]);
    assert.equal(results.length, 1);
    assert.equal(results[0]?.closeness, "exact");
    assert.equal(results[0]?.price, 1149);
    assert.equal(results[0]?.url, "https://www.article.com/product/soto?utm_source=google&srsltid=abc");
    assert.equal(results[0]?.image, "https://cdn.article.com/soto.jpg");
    assert.equal(priceRange?.label, "$1,149");
  });

  it("drops social posts that have no price and reports a range", () => {
    const { results, priceRange } = mergeAndRank([
      candidate({ name: "Pin", url: "https://www.pinterest.com/pin/1", closeness: "visual", position: 0, price: null, priceLabel: null }),
      candidate({ name: "Low", url: "https://burrow.com/low", closeness: "similar", origin: "shopping", position: 1, price: 699, store: "Burrow" }),
      candidate({ name: "High", url: "https://joybird.com/high", closeness: "similar", origin: "shopping", position: 2, price: 1549, store: "Joybird" }),
    ]);
    assert.deepEqual(
      results.map((result) => result.name),
      ["Low", "High"],
    );
    assert.equal(priceRange?.min, 699);
    assert.equal(priceRange?.max, 1549);
    assert.equal(priceRange?.label, "$699 – $1,549");
  });
});

describe("parseMoney", () => {
  it("reads lens price objects and starred strings", () => {
    assert.equal(parseMoney({ value: "$260*", extracted_value: 260, currency: "$" }), 260);
    assert.equal(parseMoney("$1,149"), 1149);
    assert.equal(parseMoney("Free"), null);
  });
});

describe("shouldShowInstallHint", () => {
  const iphoneSafari =
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";

  it("shows for iPhone Safari outside the installed app", () => {
    assert.equal(
      shouldShowInstallHint({ userAgent: iphoneSafari, platform: "iPhone", maxTouchPoints: 5, standalone: false }),
      true,
    );
  });

  it("hides when the app is already standalone or the browser is Chrome", () => {
    assert.equal(
      shouldShowInstallHint({ userAgent: iphoneSafari, platform: "iPhone", maxTouchPoints: 5, standalone: true }),
      false,
    );
    assert.equal(
      shouldShowInstallHint({
        userAgent: iphoneSafari.replace("Version/18.5", "CriOS/120.0.6099.119"),
        platform: "iPhone",
        maxTouchPoints: 5,
        standalone: false,
      }),
      false,
    );
    assert.equal(
      shouldShowInstallHint({
        userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
        platform: "MacIntel",
        maxTouchPoints: 0,
        standalone: false,
      }),
      false,
    );
  });
});
