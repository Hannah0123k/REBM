import Image from "next/image";
import Link from "next/link";

import { PhonePill } from "@/components/PhonePill";
import { NAV_LINKS } from "@/lib/nav";
import logo from "@/public/assets/rebm-logo.svg";

/**
 * Site header — shared by every page.
 *
 * Built against the LIVE SITE, not Figma (CLAUDE.md → the 2026-07-16 pivot).
 * Live values:
 *   logo   rebm-logo.svg, 458×67 — sans-serif wordmark, no border, no ".com".
 *          Figma's web frames carry an OLD serif bordered mark; ignore it.
 *   nav    Inter 18px/30px, #FFFFFF
 *   gutter container is 1547 wide at left=187 → 187px gutters at 1920
 *
 * The header sits over the hero photo, so it has no background of its own.
 */
export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-50 hidden items-center justify-between px-[187px] pt-[31.5px] lg:flex">
      <Link href="/" className="shrink-0">
        <Image src={logo} alt="Real Estate Broker Match" width={458} height={67} priority />
      </Link>

      <nav className="flex items-center gap-[40px]">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="shrink-0 text-[18px] leading-[30px] whitespace-nowrap text-white transition-opacity hover:opacity-80"
          >
            {link.label}
          </Link>
        ))}
        <PhonePill />
      </nav>
    </header>
  );
}
