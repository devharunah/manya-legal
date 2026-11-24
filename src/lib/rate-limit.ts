/**
 * A sliding-window limiter kept in memory. On serverless each instance has its
 * own copy, so this is best effort: it stops one browser from draining our
 * free-tier credits, not a determined attacker.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();
  return function allow(key: string, now = Date.now()): boolean {
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= limit) {
      hits.set(key, recent);
      return false;
    }
    hits.delete(key);
    hits.set(key, [...recent, now]);
    // Bound memory by dropping the least recently seen caller, never everyone's limits.
    if (hits.size > 5_000) {
      const oldest = hits.keys().next().value;
      if (oldest !== undefined) hits.delete(oldest);
    }
    return true;
  };
}

/** The caller's address as Vercel reports it. Good enough to key a limiter on. */
export function clientKey(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}
