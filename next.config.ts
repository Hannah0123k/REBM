import type { NextConfig } from "next";

/**
 * Security headers. The app had none — this adds a CSP, clickjacking and
 * transport protections, and stops leaking the framework version.
 *
 * CSP notes:
 *  - Blog cover images are served from the Supabase Storage host, so img-src /
 *    connect-src include it (derived from NEXT_PUBLIC_SUPABASE_URL).
 *  - `data:`/`blob:` cover the inline SVG placeholders and the in-browser
 *    crop/PDF-thumbnail previews; `worker-src blob:` covers the bundled pdfjs
 *    worker; `'wasm-unsafe-eval'` covers pdfjs WASM.
 *  - Inline `<script>`s exist (scroll-restoration + JSON-LD), so script-src
 *    keeps `'unsafe-inline'`; the one attacker-reachable inline sink (JSON-LD)
 *    is separately escaped (lib/blog/jsonLd.ts). Dev adds `'unsafe-eval'` for
 *    HMR only. Follow-up hardening: move to nonce-based script-src.
 *  - `'unsafe-inline'` styles are required by React inline styles + Next.
 */
const isDev = process.env.NODE_ENV !== "production";

const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "";
  }
})();

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseHost}`.trim(),
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseHost}`.trim(),
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "frame-src 'none'",
  // Production ONLY: force any http subresource to https. Omitted in dev because
  // Safari applies it even on http://localhost (unlike Chrome, which exempts
  // localhost) — it would upgrade every CSS/JS/image to https://localhost, which
  // the dev server doesn't serve, leaving the page unstyled.
  isDev ? "" : "upgrade-insecure-requests",
]
  .filter(Boolean)
  .join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

/**
 * Redirects for the WordPress URLs Google still holds.
 * ===========================================================================
 * The migration moved every post from a root-level WordPress URL to /blog/...,
 * and the tag and category archives from /tag/... to /blog/tag/... . Nothing
 * bridged the two, so ~87 previously indexed URLs began returning 404 at the
 * DNS cutover and Google dropped them. These are 308/permanent so the ranking
 * signal on the old URL transfers to the new one instead of being discarded.
 *
 * Generated from migration/manifest.json (source_url -> destination_url), so
 * this list is the actual set of URLs that moved, not a guess.
 *
 * They must stay permanently. Google keeps old URLs in its index for a long
 * time, and external sites still link to them.
 */
// FOUR OF THESE DO NOT POINT AT THEIR OWN ARTICLE.
//
// Five of the 21 migrated posts were never published on the new site, so a
// direct mapping would redirect Google straight into a 404 — worse than a plain
// 404, because it spends a crawl and teaches nothing. Those five instead point
// at the closest published article on the same subject, which keeps the ranking
// signal on the old URL working for a live page and lands a reader somewhere
// relevant rather than on an error.
//
// IF ONE OF THOSE POSTS IS LATER PUBLISHED, restore its direct mapping — the
// entry below would otherwise keep sending its own old URL to a different
// article. The affected sources are marked with a "->" comment.
const legacyPostRedirects = [
  { source: "/a-complete-guide-to-what-commercial-real-estate-brokers-actually-do-for-sellers", destination: "/blog/a-complete-guide-to-what-commercial-real-estate-brokers-actually-do-for-sellers", permanent: true },
  { source: "/capital-gains-basics-investment-property", destination: "/blog/capital-gains-basics-investment-property", permanent: true },
  // cap rates -> the rates-and-pricing guide
  { source: "/how-cap-rates-are-trending-and-what-it-means-for-your-property-value", destination: "/blog/interest-rates-and-cre-pricing-a-sellers-guide", permanent: true },
  // sellers losing leverage -> the other leverage article
  { source: "/how-commercial-real-estate-sellers-lose-leverage-during-due-diligence-and-how-to-prevent-it", destination: "/blog/why-international-sellers-lose-leverage-in-commercial-real-estate-negotiations", permanent: true },
  { source: "/how-local-market-micro-knowledge-drives-pricing-in-commercial-real-estate", destination: "/blog/how-local-market-micro-knowledge-drives-pricing-in-commercial-real-estate", permanent: true },
  { source: "/how-long-does-it-take-to-sell-commercial-real-estate", destination: "/blog/how-long-does-it-take-to-sell-commercial-real-estate", permanent: true },
  // The "-copy" duplicate was never published on the new site, so pointing at
  // it would redirect straight into a 404. Send it to the original article it
  // duplicates instead, which is the page it should always have been.
  { source: "/how-long-does-it-take-to-sell-commercial-real-estate-copy", destination: "/blog/how-long-does-it-take-to-sell-commercial-real-estate", permanent: true },
  { source: "/how-multifamily-buyers-underwrite-properties-in-todays-market", destination: "/blog/how-multifamily-buyers-underwrite-properties-in-todays-market", permanent: true },
  { source: "/how-to-choose-the-right-commercial-real-estate-broker-for-your-property", destination: "/blog/how-to-choose-the-right-commercial-real-estate-broker-for-your-property", permanent: true },
  { source: "/industrial-property-buyers-what-they-look-for-and-why", destination: "/blog/industrial-property-buyers-what-they-look-for-and-why", permanent: true },
  { source: "/interest-rates-and-cre-pricing-a-sellers-guide", destination: "/blog/interest-rates-and-cre-pricing-a-sellers-guide", permanent: true },
  { source: "/local-broker-vs-national-brokerage-which-gets-sellers-better-pricing", destination: "/blog/local-broker-vs-national-brokerage-which-gets-sellers-better-pricing", permanent: true },
  { source: "/loopnet-vs-commercial-real-estate-broker-what-property-owners-need-to-know", destination: "/blog/loopnet-vs-commercial-real-estate-broker-what-property-owners-need-to-know", permanent: true },
  { source: "/office-sales-in-a-hybrid-work-world-seller-strategies-that-drive-value", destination: "/blog/office-sales-in-a-hybrid-work-world-seller-strategies-that-drive-value", permanent: true },
  // no other Market Pulse issue is published, so the blog index
  { source: "/rebm-market-pulse-february-2026", destination: "/blog", permanent: true },
  { source: "/specialist-vs-generalist-brokers", destination: "/blog/specialist-vs-generalist-brokers", permanent: true },
  { source: "/when-should-a-property-owner-hire-a-commercial-real-estate-brokerand-when-shouldnt-they", destination: "/blog/when-should-a-property-owner-hire-a-commercial-real-estate-brokerand-when-shouldnt-they", permanent: true },
  // listings sitting unsold -> time-to-sell
  { source: "/why-commercial-listings-sit-unsold-for-months", destination: "/blog/how-long-does-it-take-to-sell-commercial-real-estate", permanent: true },
  { source: "/why-international-sellers-lose-leverage-in-commercial-real-estate-negotiations", destination: "/blog/why-international-sellers-lose-leverage-in-commercial-real-estate-negotiations", permanent: true },
  { source: "/why-out-of-state-owners-overpay-for-convenience", destination: "/blog/why-out-of-state-owners-overpay-for-convenience", permanent: true },
  { source: "/working-with-international-clients-buying-and-selling-us-real-estate", destination: "/blog/working-with-international-clients-buying-and-selling-us-real-estate", permanent: true },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      ...legacyPostRedirects,
      // 65 tag archives + 1 category archive. A pattern rule covers every tag
      // without listing them, and keeps working for tags added later.
      { source: "/tag/:slug", destination: "/blog/tag/:slug", permanent: true },
      { source: "/category/:slug", destination: "/blog", permanent: true },
      // WordPress feed and author URLs Google may still hold. Nothing serves
      // them now, and a redirect to the blog beats a 404.
      { source: "/feed", destination: "/blog", permanent: true },
      { source: "/comments/feed", destination: "/blog", permanent: true },
      { source: "/author/:slug", destination: "/blog", permanent: true },
      // The privacy policy lived at the WordPress path; this build uses /privacy.
      { source: "/privacy-policy", destination: "/privacy", permanent: true },
    ];
  },
};

export default nextConfig;
