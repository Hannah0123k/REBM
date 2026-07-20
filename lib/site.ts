/**
 * Canonical site origin, used for metadataBase, canonical URLs, OG tags and
 * JSON-LD. Set NEXT_PUBLIC_SITE_URL in the environment for each deploy
 * (e.g. https://realestatebrokermatch.com). Falls back to localhost in dev.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
).replace(/\/+$/, "");

export const SITE_NAME = "Real Estate Broker Match";

/** Absolute URL for a site-relative path. */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
