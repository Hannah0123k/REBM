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
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
