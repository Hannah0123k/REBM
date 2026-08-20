import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { ScrollToTopOnNavigate } from "@/components/ScrollToTopOnNavigate";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

/**
 * The live site renders in Inter, not Helvetica — it loads Helvetica Neue and
 * Helvetica Now Display via leftover @font-face rules but computes to Inter
 * almost everywhere. Inter is free and open-source, and next/font self-hosts it,
 * so the design is pixel-exact on every platform with no licensing exposure.
 * See CLAUDE.md → the 2026-07-16 pivot.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE_DESCRIPTION =
  "Real Estate Broker Match will match you with a real estate broker who will sell your property. Alan and Rhett Fruitman have helped clients buy and sell billions of dollars of real estate since 1993.";

/**
 * The link-preview card — what people see when the URL is texted, pasted into
 * Slack or LinkedIn, or saved as a bookmark. Brand-blue background, navy serif
 * headline; regenerate it with `node scripts/og-image.mjs`.
 *
 * The live WordPress site declares no og:image at all, so scrapers fall back to
 * whatever photo they find in the markup — which is why a shared link currently
 * previews as Rhett's headshot instead of anything branded.
 */
const OG_IMAGE = {
  url: "/og-image.png",
  width: 1200,
  height: 630,
  alt: "Real Estate Broker Match makes finding the right real estate broker simple.",
};

// PROVISIONAL — the live site has no meta description anywhere and no SEO
// plugin, so these are written fresh. See CLAUDE.md → Before launch.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Real Estate Broker Match",
  description: SITE_DESCRIPTION,
  // Every page that doesn't declare its own `openGraph` inherits this block, so
  // Blog, Contact and Privacy are covered. Blog POSTS do declare their own and
  // therefore fall back to OG_IMAGE explicitly — see app/blog/[slug]/page.tsx.
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Real Estate Broker Match",
    description: SITE_DESCRIPTION,
    locale: "en_US",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Real Estate Broker Match",
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  // REBM wordmark (white on brand navy). All icons live in /public and are
  // declared explicitly here — the old app/favicon.ico file-convention was
  // removed so this is the single source of truth. See public/site.webmanifest
  // for the Android/PWA install icons.
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/android-chrome-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/android-chrome-512x512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {/* Reload opens at the TOP of the page. The nav uses in-page anchors
            (About -> /#about, etc.), so after clicking one the URL carries a
            hash and a plain reload would re-jump to that section (this is why
            reload kept landing on "Meet Alan & Rhett"). We tell a RELOAD apart
            from a fresh deep-link via the Navigation Timing API: on a reload we
            strip the stale hash before the browser scrolls to it and force the
            top; on a genuine navigation to /#section we leave the hash alone so
            deep links still work. Runs at parse (before hydration and before the
            #target is even in the DOM), and again on `pageshow` to cover the
            Safari/Firefox back-forward cache. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if('scrollRestoration' in history){history.scrollRestoration='manual';}" +
              "function __navType(){try{var n=performance.getEntriesByType('navigation')[0];if(n)return n.type;}catch(e){}return(performance.navigation&&performance.navigation.type===1)?'reload':'navigate';}" +
              "function __toTop(){if(__navType()==='reload'&&location.hash){history.replaceState(null,'',location.pathname+location.search);}if(!location.hash){window.scrollTo(0,0);}}" +
              "__toTop();window.addEventListener('pageshow',__toTop);",
          }}
        />
        {/* Skip link — first focusable element, visually hidden until focused.
            Lets keyboard users jump past the fixed header/nav to the page body. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-[12px] focus:left-[12px] focus:z-[70] focus:rounded-[8px] focus:bg-rebm-navy focus:px-[16px] focus:py-[10px] focus:text-[15px] focus:font-medium focus:text-white focus:outline-none focus:ring-2 focus:ring-white"
        >
          Skip to main content
        </a>
        <ScrollToTopOnNavigate />
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
