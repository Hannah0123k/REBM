import { createHash } from "node:crypto";

/**
 * Rate limiting for the public forms.
 *
 * PRODUCTION uses a shared Postgres store (Supabase RPC `contact_rate_check`,
 * migration 0005) so the limit holds across all serverless instances. If that
 * store is unavailable (RPC error, migration not yet applied, local dev), we
 * FALL BACK to the per-instance in-memory limiter below — the form keeps working
 * (fail-safe) with best-effort limiting rather than blocking legitimate leads.
 * The key is always a HASH of the client IP, so no raw IP is stored anywhere.
 */
export type RateLimiter = {
  /** Records a hit for `key` and returns true when the limit is now exceeded. */
  check(key: string): boolean;
};

/**
 * Derive the client IP from platform-set headers. Prefers `x-real-ip` (Vercel /
 * the edge set this to the true client IP and overwrite any client-supplied
 * value), then the first `x-forwarded-for` hop. We do NOT trust an arbitrary raw
 * XFF chain from an untrusted network. Returns "unknown" when absent so a missing
 * IP still maps to a single shared bucket (can't bypass by omitting the header).
 */
export function clientIp(getHeader: (name: string) => string | null | undefined): string {
  const realIp = (getHeader("x-real-ip") ?? "").trim();
  if (realIp) return realIp;
  const xff = (getHeader("x-forwarded-for") ?? "").split(",")[0].trim();
  return xff || "unknown";
}

/** Hash the IP (sha256 hex) so the rate-limit key never stores a raw IP. */
export function hashIp(ip: string): string {
  return createHash("sha256").update(ip).digest("hex");
}

/**
 * Report whether this submission is rate-limited, preferring the shared store
 * and failing SAFE to the in-memory `fallback` on any store error. `sharedCheck`
 * returns true when over the limit; if it throws (store down / not provisioned),
 * `onFallback` is invoked and the in-memory limiter decides.
 */
export async function isRateLimited(params: {
  ipHash: string;
  fallback: RateLimiter;
  sharedCheck?: (ipHash: string) => Promise<boolean>;
  onFallback?: (error: unknown) => void;
}): Promise<boolean> {
  const { ipHash, fallback, sharedCheck, onFallback } = params;
  if (sharedCheck) {
    try {
      return await sharedCheck(ipHash);
    } catch (error) {
      onFallback?.(error);
    }
  }
  return fallback.check(ipHash);
}

export function createRateLimiter(opts: {
  windowMs: number;
  max: number;
  /** Injectable clock (defaults to Date.now) so tests are deterministic. */
  now?: () => number;
}): RateLimiter {
  const { windowMs, max } = opts;
  const now = opts.now ?? (() => Date.now());
  const hits = new Map<string, number[]>();
  // Bound memory: an attacker rotating the (spoofable) key per request could
  // otherwise grow this map without limit (memory-exhaustion DoS). Above the cap
  // we evict fully-expired keys, then hard-reset if still oversized.
  const MAX_KEYS = 10_000;

  return {
    check(key: string): boolean {
      const t = now();
      if (hits.size > MAX_KEYS) {
        for (const [k, arr] of hits) {
          if (arr.every((ts) => t - ts >= windowMs)) hits.delete(k);
        }
        if (hits.size > MAX_KEYS) hits.clear();
      }
      const recent = (hits.get(key) ?? []).filter((ts) => t - ts < windowMs);
      recent.push(t);
      hits.set(key, recent);
      return recent.length > max;
    },
  };
}
