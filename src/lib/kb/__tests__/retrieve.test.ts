import { EVALS } from "@/data/evals";
import { CHUNKS } from "@/data/kb/chunks";
import { SOURCES } from "@/data/kb/sources";

import { isInDomain, retrieve, tokenize } from "../retrieve";

describe("tokenize", () => {
  it("maps trader words onto source vocabulary", () => {
    expect(tokenize("Do I need a permit for my shop?")).toEqual(
      expect.arrayContaining(["licence", "trade"]),
    );
    expect(tokenize("license")).toContain("licence");
  });
});

describe("knowledge base integrity", () => {
  it("gives every chunk a known source and a unique id", () => {
    const sourceIds = new Set(SOURCES.map((s) => s.id));
    const ids = new Set<string>();
    for (const chunk of CHUNKS) {
      expect(sourceIds.has(chunk.sourceId)).toBe(true);
      expect(ids.has(chunk.id)).toBe(false);
      ids.add(chunk.id);
    }
  });

  it("never states an outdated shilling penalty as text", () => {
    for (const chunk of CHUNKS) {
      expect(chunk.text).not.toMatch(/thousand shillings/i);
    }
  });
});

describe("retrieve against the eval set", () => {
  for (const c of EVALS) {
    it(`${c.expect}s: ${c.question}`, () => {
      const result = retrieve(c.question);
      if (c.expect === "refuse") {
        expect(result.covered).toBe(false);
        expect(result.hits).toHaveLength(0);
        return;
      }
      expect(result.covered).toBe(true);
      const ids = result.hits.map((h) => h.chunk.id);
      for (const must of c.mustRetrieve ?? []) expect(ids).toContain(must);
    });
  }

  it("treats unrelated small talk as out of domain", () => {
    expect(isInDomain("hello how are you")).toBe(false);
  });
});
