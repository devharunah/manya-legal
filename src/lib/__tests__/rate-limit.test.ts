/** @jest-environment node */
import { clientKey, createRateLimiter } from "../rate-limit";

describe("createRateLimiter", () => {
  it("allows up to the limit inside the window, then refuses", () => {
    const allow = createRateLimiter({ limit: 2, windowMs: 1_000 });
    expect(allow("a", 0)).toBe(true);
    expect(allow("a", 100)).toBe(true);
    expect(allow("a", 200)).toBe(false);
  });

  it("frees up again once old requests leave the window", () => {
    const allow = createRateLimiter({ limit: 1, windowMs: 1_000 });
    expect(allow("a", 0)).toBe(true);
    expect(allow("a", 999)).toBe(false);
    expect(allow("a", 1_000)).toBe(true);
  });

  it("counts each caller separately", () => {
    const allow = createRateLimiter({ limit: 1, windowMs: 1_000 });
    expect(allow("a", 0)).toBe(true);
    expect(allow("b", 0)).toBe(true);
  });
});

describe("clientKey", () => {
  it("uses the first forwarded address", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } });
    expect(clientKey(req)).toBe("1.2.3.4");
  });

  it("falls back when there is no header", () => {
    expect(clientKey(new Request("http://x"))).toBe("local");
  });
});
