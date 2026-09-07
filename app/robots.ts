import type { MetadataRoute } from "next";

import { absoluteUrl } from "@/lib/site";

/**
 * robots.txt at /robots.txt. The site had none, so crawlers had no pointer to
 * a sitemap and no statement about the admin area.
 *
 * Deliberately permissive on content: everything public should be crawled. The
 * only disallows are routes that are gated or would waste crawl budget — they
 * are already unreachable or noindex, and this just saves the request.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        // /wp-content/uploads/ is deliberately NOT disallowed: the migrated
        // Market Pulse PDFs live there and should stay crawlable.
        allow: ["/", "/wp-content/uploads/"],
        disallow: [
          "/admin", // login-gated CMS
          "/api/",
          // Dead WordPress infrastructure. These paths hold plugin and theme
          // CSS/JS from the old site — never pages, and nothing that should be
          // indexed. Vercel's firewall denies them outright (they are the most
          // scanned paths on the internet), and a 403 makes Google retry rather
          // than drop the URL, so it kept reporting them as errors. Telling
          // crawlers not to ask stops the error at the source and returns the
          // crawl budget to real pages.
          "/wp-content/plugins/",
          "/wp-content/themes/",
          "/wp-includes/",
          "/wp-admin/",
          "/wp-json/",
          "/xmlrpc.php",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/").replace(/\/$/, ""),
  };
}
