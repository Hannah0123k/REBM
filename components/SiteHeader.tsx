import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/Container";
import { MobileNav } from "@/components/MobileNav";
import { PhonePill } from "@/components/PhonePill";
import { NAV_LINKS } from "@/lib/nav";
import logo from "@/public/assets/rebm-logo.svg";

/**
 * Site header — shared by every page.
 *
 * Built against the LIVE SITE, not Figma (CLAUDE.md → the 2026-07-16 pivot).
 * Live values:
 *   logo   rebm-logo.svg, 458×67 — sans-serif wordmark, no border, no ".com"
 *   nav    Inter 18px/30px, #FFFFFF
 *
 * Gutters come from <Container> — the shared rule, never a hard-coded padding.
 * The header sits over the hero photo, so it has no background of its own.
 *
 * The 7-link desktop nav fits from xl (1280) up; below that it overflows, so it
 * is swapped for the hamburger drawer (<MobileNav>). The logo scales down on
 * small screens so it never forces overflow.
 */
export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-50 pt-[31.5px]">
      <Container className="flex items-center justify-between">
        <Link href="/" className="shrink-0">
          {/* Live scales the logo: ~340px at 1280–1440, full 458 only at ≥1536.
              That downscale is what lets the full nav fit at 1280. */}
          <Image
            src={logo}
            alt="Real Estate Broker Match"
            width={458}
            height={67}
            priority
            className="h-auto w-[240px] sm:w-[300px] xl:w-[340px] 2xl:w-[458px]"
          />
        </Link>

        {/* Live nav: 24px between links, 40px between the link group and the
            phone pill (not a flat 40px gap — that overflows at 1280). */}
        <nav className="hidden items-center gap-[40px] xl:flex">
          <ul className="flex items-center gap-[24px]">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="whitespace-nowrap text-[18px] leading-[30px] text-white transition-opacity hover:opacity-80"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <PhonePill />
        </nav>

        <MobileNav />
      </Container>
    </header>
  );
}
