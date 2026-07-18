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
  const active = useActiveSection(SECTION_IDS);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // The public marketing header must not appear on the admin CMS routes.
  if (pathname?.startsWith("/admin")) return null;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 h-[var(--header-h)] transition-colors duration-300 ${
        scrolled
          ? "border-b border-white/25 shadow-md backdrop-blur-md [-webkit-backdrop-filter:blur(12px)]"
          : "bg-transparent"
      }`}
      // Scrolled = a lightly-tinted BLUE glass. The tint is the hero blue
      // (#689ECF) at 0.82 so it dominates and never darkens toward navy over
      // dark sections — the background stays faintly visible through the blur,
      // and the navy logo always keeps strong contrast on the light-blue.
      style={scrolled ? { backgroundColor: "rgba(104, 158, 207, 0.82)" } : undefined}
    >
      <Container className="flex h-full items-center justify-between">
        <Link href="/" className="shrink-0">
          {/* Logo SVG cropped to its ink bounds (viewBox 0 17 458 35) so the
              wordmark fills the box and reads larger than the untrimmed live
              asset at the same width. Bigger than live where the nav has room;
              1280 stays compact like live so the 7-link nav fits. */}
          <Image
            src={logo}
            alt="Real Estate Broker Match"
            width={458}
            height={35}
            priority
            className="h-auto w-[300px] sm:w-[360px] xl:w-[clamp(340px,calc(85.9vw-759.5px),560px)]"
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
                    className={`whitespace-nowrap text-[18px] leading-[30px] font-normal transition-colors duration-300 ${
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
