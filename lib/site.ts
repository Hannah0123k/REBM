/** Production origin, now that DNS points at this deployment. */
const PRODUCTION_ORIGIN = "https://realestatebrokermatch.com";

/**
 * Canonical site origin, used for metadataBase, canonical URLs, OG tags and
 * JSON-LD.
 *
 * NEXT_PUBLIC_SITE_URL still wins, so a preview deploy can point at its own
 * origin. It is NOT set in Vercel, though, and a plain localhost fallback was
 * shipping `og:image`, `og:url`, blog canonicals and JSON-LD `@id` values that
 * all read http://localhost:3000 in production — unfetchable for any crawler.
 * So the fallback is environment-aware rather than unconditionally localhost.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.NODE_ENV === "production" ? PRODUCTION_ORIGIN : "http://localhost:3000")
).replace(/\/+$/, "");

export const SITE_NAME = "Real Estate Broker Match";

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
