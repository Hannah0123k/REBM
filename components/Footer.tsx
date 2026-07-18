import Image from "next/image";
import Link from "next/link";

import { Container } from "@/components/Container";
import { DisclaimerModal } from "@/components/DisclaimerModal";
import { Reveal } from "@/components/Reveal";
import { SOCIAL_ICONS } from "@/components/icons/SocialIcons";
import { COPYRIGHT, FOOTER_LINKS, PHONE_HREF, PHONE_NUMBER_INTL, SOCIAL_LINKS } from "@/lib/nav";
import logo from "@/public/assets/rebm-logo-footer@2x.png";

/**
 * Site footer — identical across homepage / Blog / Post / tags (Figma 95:135-144,
 * Group 60 elsewhere). Built once.
 *
 * Geometry, exact from Figma (footer top = y 9209.5 in frame 95:2):
 *   bg            0, 9209.5   1920 × 507        #05212F
 *   logo (image7) 188, 9305.5 538.667 × 78.667  → 96 below footer top
 *   COMPANY       840, 9305.5 · SERVICES 1100 · CONTACT US 1360  (260 apart)
 *   links         840, 9362.5 → 43.2px line pitch
 *   "Real Estate Foundation Inc."  188, 9404.5
 *   copyright                      188, 9597.5
 *
 * Type, exact from the Figma REST API:
 *   column headings  Helvetica Neue 400 · 24px/31.2 · #FFFFFF
 *   links            Helvetica Neue 400 · 24px/43.2 · #689ECF   ← blue, not white
 *   brand + copyright Helvetica Neue 400 · 18px/23.4 · #FFFFFF
 *
 * Columns are left-anchored at 840/1100/1360 and end at ~1557, leaving 363px of
 * dead space right vs 188 left. Asymmetric as authored; kept per decision #9.
 *
 * Content deviates from Figma where the live site governs (CLAUDE.md):
 *   - 8 links incl. Home, FAQ and Blog; Figma's single text node has 6
 *   - copyright "© 2026 Real Estate Foundation, Inc.", not "@ ... 2024"
 *   - Contact points at /contact-us, a real page, not an anchor
 *
 * Logo is image 7 (95:144) — the footer's own asset, exported at 2x via REST so
 * it is genuinely transparent. It is a different file from the header's image 5,
 * and neither is the A4 vector (a different mark entirely). See decision #5.
 *
 * Social icons are an ADDITION: they exist on the live site but nowhere in the
 * Figma design. Hannah confirmed they ship (2026-07-16). Placed under CONTACT US
 * and styled to the footer's existing language so they don't read as new design.
 */
export function Footer() {
  return (
    <footer className="w-full bg-rebm-footer text-white">
      <Container className="pt-[96px] pb-[96px]">
        <Reveal className="flex flex-col gap-[48px] lg:flex-row lg:gap-0" stagger={0.08}>
          {/* Brand column. Flexible, not a fixed 652: at 1920 the link columns
              land at 840/1100/1360 (i.e. 653/913/1173 inside the container), but
              a fixed 652 + 3×260 = 1432 overflows any container below ~1560 —
              it was pinning scrollWidth at 1496 and pushing the page sideways at
              1440 and below. Letting the brand column absorb the slack keeps the
              link columns at their design widths and kills the overflow. */}
          <div className="min-w-0 flex-1 lg:pr-[24px]">
            <Image
              src={logo}
              alt="Real Estate Broker Match"
              width={539}
              height={79}
              className="h-auto w-full max-w-[538.667px]"
            />
            <p className="mt-[21px] text-[18px] leading-[23.4px]">
              Real Estate Foundation Inc.
            </p>
            <p className="mt-[48px] text-[18px] leading-[23.4px] lg:mt-[170px]">{COPYRIGHT}</p>
            {/* Admin link — public URL is fine; security is enforced by auth, not
                by hiding this link. */}
            <Link
              href="/admin/login"
              className="mt-[10px] inline-block text-[13px] text-white/50 transition-colors hover:text-rebm-blue"
            >
              Admin
            </Link>
          </div>

          <FooterColumn heading="COMPANY">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={LINK_CLASS}>
                  {link.label}
                </Link>
              </li>
            ))}
          </FooterColumn>

          <FooterColumn heading="SERVICES">
            <li>
              {/* Terms of Service opens as a popup, not a page — matches the
                  live site's Disclaimer behavior. */}
              <DisclaimerModal triggerClassName={`${LINK_CLASS} text-left`} />
            </li>
          </FooterColumn>

          <FooterColumn heading="CONTACT US">
            <li>
              <a href={PHONE_HREF} className={LINK_CLASS}>
                {PHONE_NUMBER_INTL}
              </a>
            </li>
            {/* Not in Figma — the live site has these and Hannah asked to keep
                them. Sized to the 24px link text so the row sits on the same
                rhythm as the column above it. */}
            {/* 44px hit area for touch (glyph stays 24px). Negative margin keeps
                the visual spacing tight despite the larger tap targets. */}
            <li className="mt-[16px] -ml-[10px] flex items-center">
              {SOCIAL_LINKS.map(({ label, href }) => {
                const Icon = SOCIAL_ICONS[label];
                return (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={label}
                    className="inline-flex size-[44px] items-center justify-center rounded-full text-rebm-blue transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                  >
                    <Icon className="size-[24px]" />
                  </a>
                );
              })}
            </li>
          </FooterColumn>
        </Reveal>
      </Container>
    </footer>
  );
}

const LINK_CLASS =
  "inline-block rounded-[4px] text-[24px] leading-[43.2px] text-rebm-blue transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none";

function FooterColumn({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full shrink-0 lg:w-[260px]">
      <h2 className="text-[24px] leading-[31.2px]">{heading}</h2>
      <ul className="mt-[26px]">{children}</ul>
    </div>
  );
}
