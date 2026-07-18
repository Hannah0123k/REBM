import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SiteHeader } from "@/components/SiteHeader";
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
        {/* Reload opens at the TOP of the page. Disable the browser's own scroll
            restoration and force the top on initial parse (before hydration, so
            there's no jump). ALSO handle `pageshow`: Safari/Firefox serve a
            reload or back-navigation from the back-forward cache, where this
            script never re-runs — pageshow fires on those restores, so we
            re-assert the top there too. A URL #hash is always honored. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "if('scrollRestoration' in history){history.scrollRestoration='manual';}" +
              "var toTop=function(){if(!location.hash){window.scrollTo(0,0);}};" +
              "toTop();window.addEventListener('pageshow',toTop);",
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
