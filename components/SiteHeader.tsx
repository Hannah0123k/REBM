import Image from "next/image";
import Link from "next/link";

import { PhonePill } from "@/components/PhonePill";
import { NAV_LINKS } from "@/lib/nav";
import logo from "@/public/assets/rebm-logo.png";

/**
 * Site header — shared by every page (Figma: homepage 95:11 + 95:12, and the
 * same lockup on Blog / Post / tags).
 *
 * Geometry read from Figma (desktop homepage, 1920 frame):
 *   logo   x=188  y=33.5   458 × 66.886
 *   nav    x=961  y=31.5   774 × 72.667   gap 40, padding 13.333
 *   link   18px / 29.333px, white
 *
 * The header sits over the hero photo, so it has no background of its own.
 *
 * Figma drift deliberately not reproduced (CLAUDE.md → Known drift): the Post
 * frame places this nav 3px off from Blog/tags, and the homepage frame omits
 * the Blog link. One component, one position.
 *
 * The logo is currently the raster export from the web frames. The vector
 * lives only in the A4 print frame (2206:115); swapping to it is decision #5,
 * pending an SVG export once the Figma REST token is available.
 */
export function SiteHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-50 hidden items-center justify-between px-[188px] pt-[31.5px] lg:flex">
      <Link href="/" className="shrink-0">
        <Image
          src={logo}
          alt="Real Estate Broker Match"
          width={458}
          height={67}
          priority
          className="h-[66.886px] w-[458px]"
        />
      </Link>

      <nav className="flex items-center justify-center gap-[40px] p-[13.333px]">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="shrink-0 text-[18px] leading-[29.333px] whitespace-nowrap text-white transition-opacity hover:opacity-80"
          >
            {link.label}
          </Link>
        ))}
        <PhonePill />
      </nav>
    </header>
  );
}
