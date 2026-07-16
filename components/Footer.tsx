import Image from "next/image";
import Link from "next/link";

import { NAV_LINKS, PHONE_HREF, PHONE_NUMBER_INTL } from "@/lib/nav";
import logo from "@/public/assets/rebm-logo.png";

/**
 * Site footer — identical across homepage / Blog / Post / tags (Figma 95:135-144,
 * and Group 60 on the other frames). Built once.
 *
 * Exact geometry from Figma (desktop homepage, footer top = y 9209.5):
 *   bg            0, 9209.5   1920 × 507        #05212F
 *   logo (image7) 188, 9305.5 538.667 × 78.667  → 96 from footer top
 *   COMPANY       840, 9305.5 119 × 31
 *   links         840, 9362.5 132 × 258         → 6 lines, 43px apart
 *   SERVICES     1100, 9305.5 115 × 31
 *   Disclaimer   1100, 9362.5 112 × 43
 *   CONTACT US   1360, 9305.5 151 × 31
 *   phone        1360, 9362.5 197 × 43
 *   "Real Estate Foundation Inc."  188, 9404.5  222 × 23
 *   copyright                      188, 9597.5  376 × 23
 *
 * The columns are left-anchored at 840/1100/1360 (fixed 260 apart), ending at
 * ~1557 — leaving 363px of dead space on the right against 188 on the left.
 * That asymmetry is as authored; kept per decision #9.
 *
 * ⚠️ FONT SIZES ARE NOT SET HERE. Figma's line boxes (31 / 43 / 23px) are exact
 * and applied as line-height, but the underlying fontSize was never read — the
 * MCP quota ran out first. Sizes come from the REST extract; until then this
 * inherits, deliberately, rather than guessing (CLAUDE.md: never guess a value).
 *
 * The Figma homepage footer lists 6 links (no Blog) as a single text node.
 * Split into real anchors, Blog included, per decisions #1 and Known drift.
 */

const FOOTER_LINKS = [{ label: "Home", href: "/" }, ...NAV_LINKS];

export function Footer() {
  return (
    <footer className="w-full bg-rebm-footer text-white">
      <div className="mx-auto h-[507px] w-full max-w-[1920px] px-[188px] pt-[96px]">
        <div className="flex">
          {/* Brand column — anchored at x=188 */}
          <div className="w-[652px] shrink-0">
            <Image
              src={logo}
              alt="Real Estate Broker Match"
              width={539}
              height={79}
              className="h-[78.667px] w-[538.667px]"
            />
            <p className="mt-[21px] leading-[23px]">Real Estate Foundation Inc.</p>
            <p className="mt-[170px] leading-[23px]">
              Copyright @ Real Estate Foundation Inc., 2024
            </p>
          </div>

          {/* Link columns — 840 / 1100 / 1360, i.e. 260 apart from x=188 */}
          <FooterColumn heading="COMPANY">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href} className="leading-[43px]">
                <Link href={link.href} className="transition-opacity hover:opacity-80">
                  {link.label}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn heading="SERVICES">
            <li className="leading-[43px]">
              {/* Terms of Service opens as a popup, not a page — decision #14.
                  Wired to the modal once that component exists. */}
              <Link href="/#disclaimer" className="transition-opacity hover:opacity-80">
                Disclaimer
              </Link>
            </li>
          </FooterColumn>

          <FooterColumn heading="CONTACT US">
            <li className="leading-[43px]">
              <a href={PHONE_HREF} className="transition-opacity hover:opacity-80">
                {PHONE_NUMBER_INTL}
              </a>
            </li>
          </FooterColumn>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-[260px] shrink-0">
      <h2 className="leading-[31px]">{heading}</h2>
      <ul className="mt-[26px]">{children}</ul>
    </div>
  );
}
