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
        allow: "/",
        disallow: [
          "/admin", // login-gated CMS
          "/api/",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/").replace(/\/$/, ""),
  };
}
