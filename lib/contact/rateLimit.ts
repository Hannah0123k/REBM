/**
 * Best-effort in-memory rate limiter, extracted so it can be unit-tested with an
 * injected clock. NOTE: the state lives in a single server instance and resets on
 * redeploy / scale-out, so it is NOT a distributed limiter — it stops casual
 * rapid resubmission and simple floods, not a coordinated attack. For production
 * hardening, back the same key with a shared store (Upstash Redis / Vercel KV).
 */
export type RateLimiter = {
  /** Records a hit for `key` and returns true when the limit is now exceeded. */
  check(key: string): boolean;
};

export function createRateLimiter(opts: {
  windowMs: number;
  max: number;
  /** Injectable clock (defaults to Date.now) so tests are deterministic. */
  now?: () => number;
}): RateLimiter {
  const { windowMs, max } = opts;
  const now = opts.now ?? (() => Date.now());
  const hits = new Map<string, number[]>();

  return {
    check(key: string): boolean {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((ts) => t - ts < windowMs);
      recent.push(t);
      hits.set(key, recent);
      return recent.length > max;
    },
  };
}
