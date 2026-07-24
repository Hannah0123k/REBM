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

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
