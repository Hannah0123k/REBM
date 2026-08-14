"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { Container } from "@/components/Container";
import { MobileNav } from "@/components/MobileNav";
import { PhonePill } from "@/components/PhonePill";
import { NAV_LINKS } from "@/lib/nav";
import { useActiveSection } from "@/lib/useActiveSection";
import logo from "@/public/assets/rebm-logo.svg";

/** Section id a nav link points at (`/#process` → `process`), else null. */
function sectionId(href: string): string | null {
  return href.startsWith("/#") ? href.slice(2) : null;
}

const SECTION_IDS = NAV_LINKS.map((l) => sectionId(l.href)).filter(
  (id): id is string => id !== null,
);

/** Stable empty list for pages with no in-page sections (keeps the effect deps
    stable so the scrollspy resets exactly once when leaving the homepage). */
const NO_SECTIONS: string[] = [];

/**
 * Sticky site header — shared by every page. Live site is fixed + transparent;
 * we keep it fixed but fade in a solid brand-blue background after a little
 * scroll so the white nav text stays legible over the light sections below the
 * hero (the live site's transparent-always header has this legibility problem).
 *
 * Height is --header-h (globals.css); every [id] anchor uses it as
 * scroll-margin-top, so in-page jumps land below the header, not under it.
 *
 * Logo sizing measured from the live site: 458×67 at ≥1536, 340×50 at 1280–1440.
 * Nav shows from xl (1280) up; below that, the hamburger drawer.
 */
export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  // Scrollspy only applies on the homepage, where these sections exist. On other
  // pages we pass an empty list so the highlight clears (About no longer stays
  // dark on /contact etc.).
  const active = useActiveSection(pathname === "/" ? SECTION_IDS : NO_SECTIONS);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The public marketing header must not appear on the admin CMS routes.
  if (pathname?.startsWith("/admin")) return null;

  // Pages that render a DARK hero band at the very top (the homepage's blue hero
  // and the blog's photo hero) let the header stay transparent so the hero shows
  // through it — it goes solid only on scroll, like the live site. Every other
  // page (contact, privacy…) has a light top where white nav text on a
  // transparent header is illegible, so there the header is solid from the top.
  const hasHeroBackdrop = pathname === "/" || pathname === "/blog";
  const solid = scrolled || !hasHeroBackdrop;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 h-[var(--header-h)] transition-colors duration-300 ${
        solid
          ? "border-b border-white/25 shadow-md backdrop-blur-md [-webkit-backdrop-filter:blur(12px)]"
          : "bg-transparent"
      }`}
      // Solid = a lightly-tinted BLUE glass. The tint is the hero blue
      // (#689ECF) at 0.82 so it dominates and never darkens toward navy over
      // dark sections — the background stays faintly visible through the blur,
      // and the navy logo always keeps strong contrast on the light-blue.
      style={solid ? { backgroundColor: "rgba(104, 158, 207, 0.82)" } : undefined}
    >
      <Container className="flex h-full items-center justify-between">
        <Link
          href="/"
          className="shrink-0 rounded-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rebm-navy focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          {/* Logo SVG cropped to its ink bounds (viewBox "4.5 17 458 35") so the
              wordmark fills the box and reads larger than the untrimmed live
              asset at the same width. Bigger than live where the nav has room;
              1280 stays compact like live so the 7-link nav fits.

              The viewBox X ORIGIN (4.5, not 0) is what makes the wordmark align
              with the page's text. The asset was trimmed vertically but not
              horizontally, leaving ~8.5 units of transparent padding on its left
              — 1.86% of the box, i.e. 4.6px at 390 and 11px at 1920. The header
              and the hero both already sit on the same Container gutter, so the
              BOXES aligned perfectly; it was the ink inside this box that sat
              right of the headline. Shifting the viewBox origin (rather than the
              box width) cancels that padding while keeping the 458x35 aspect, so
              the rendered logo size, the layout, and every other usage's
              dimensions are all bit-for-bit unchanged. 4.5 leaves ~4 units of
              inset, which lands the wordmark on the headline's own glyph side
              bearing — measured residual is <=1px at every breakpoint, versus
              2-6.5px before. Do NOT "fix" this back to 0: that overcorrects and
              pushes the logo LEFT of the text. */}
          <Image
            src={logo}
            alt="Real Estate Broker Match"
            width={458}
            height={35}
            priority
            className="h-auto w-[clamp(210px,66vw,340px)] sm:w-[360px] xl:w-[clamp(340px,calc(85.9vw-759.5px),560px)]"
          />
        </Link>

        {/* Live nav: 24px between links, 40px before the phone pill. */}
        <nav className="hidden items-center gap-[40px] xl:flex">
          <ul className="flex items-center gap-[20px] 2xl:gap-[24px]">
            {NAV_LINKS.map((link) => {
              // Active when its section is in view (homepage scrollspy) OR when
              // the link is a standalone page and matches the current path.
              const isActive =
                (sectionId(link.href) !== null && sectionId(link.href) === active) ||
                (!link.href.startsWith("/#") && pathname === link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={isActive ? "true" : undefined}
                    // Every link is identical in family/size/weight/leading; the
                    // active state changes COLOUR ONLY (navy) — never weight or
                    // size. This also fixes "About looked bold/smaller".
                    className={`rounded-[4px] whitespace-nowrap text-[18px] leading-[30px] font-normal transition-colors duration-300 focus-visible:ring-2 focus-visible:ring-rebm-navy focus-visible:outline-none ${
                      isActive ? "text-rebm-navy" : "text-white hover:opacity-80"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
          <PhonePill />
        </nav>

        <MobileNav />
      </Container>
    </header>
  );
}
