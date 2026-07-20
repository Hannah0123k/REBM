import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SiteHeader } from "@/components/SiteHeader";
import { SITE_URL } from "@/lib/site";
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

// PROVISIONAL — the live site has no meta description anywhere and no SEO
// plugin, so these are written fresh. See CLAUDE.md → Before launch.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Real Estate Broker Match",
  description:
    "Real Estate Broker Match will match you with a real estate broker who will sell your property. Alan and Rhett Fruitman have helped clients buy and sell billions of dollars of real estate since 1993.",
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
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
