import { describe, expect, it } from "vitest";

import { flattenNewestFirstPages } from "@/queries/pagination";

describe("flattenNewestFirstPages", () => {
  it("keeps newest-to-oldest order across cursor pages", () => {
    const messages = flattenNewestFirstPages([
      { items: ["newest", "newer"] },
      { items: ["older", "oldest"] },
    ]);

    expect(messages).toEqual(["newest", "newer", "older", "oldest"]);
  });
});
