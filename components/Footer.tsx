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
 * Figma design. Hannah confirmed they ship (2026-07-16). Now placed vertically
 * under "Real Estate Foundation Inc." in the brand column.
 *
 * Compact revision (Hannah): smaller logo, headings, links and spacing; columns
 * brought closer. Kept readable, hierarchy intact, footer reads as secondary.
 */
const SOCIAL_LABEL: Record<string, string> = { Twitter: "X" };

export function Footer() {
  return (
    <footer className="w-full bg-rebm-footer text-white">
      <Container className="pt-[56px] pb-[44px]">
        <Reveal className="flex flex-col gap-[36px] lg:flex-row lg:gap-[40px]" stagger={0.08}>
          {/* Brand column absorbs slack so the link columns keep their widths
              and never overflow the container (see prior overflow fix). */}
          <div className="min-w-0 flex-1 lg:pr-[24px]">
            <Image
              src={logo}
              alt="Real Estate Broker Match"
              width={539}
              height={79}
              className="h-auto w-full max-w-[300px]"
            />
            <p className="mt-[16px] text-[15px] leading-[20px]">Real Estate Foundation Inc.</p>

            {/* Social links — vertical row directly under the company name. */}
            <ul className="mt-[14px] flex flex-col gap-[8px]">
              {SOCIAL_LINKS.map(({ label, href }) => {
                const Icon = SOCIAL_ICONS[label];
                const name = SOCIAL_LABEL[label] ?? label;
                return (
                  <li key={label}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={name}
                      className="inline-flex items-center gap-[10px] rounded-[4px] text-[14px] text-rebm-blue transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
                    >
                      <Icon className="size-[17px]" />
                      <span>{name}</span>
                    </a>
                  </li>
                );
              })}
            </ul>

            <p className="mt-[26px] text-[14px] leading-[19px] text-white/85">{COPYRIGHT}</p>
            {/* Admin link — public URL is fine; security is enforced by auth. */}
            <Link
              href="/admin/login"
              className="mt-[8px] inline-block text-[12px] text-white/50 transition-colors hover:text-rebm-blue"
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
              <DisclaimerModal triggerClassName={`${LINK_CLASS} text-left`} />
            </li>
          </FooterColumn>

          <FooterColumn heading="CONTACT US">
            <li>
              <a href={PHONE_HREF} className={LINK_CLASS}>
                {PHONE_NUMBER_INTL}
              </a>
            </li>
          </FooterColumn>
        </Reveal>
      </Container>
    </footer>
  );
}

const LINK_CLASS =
  "inline-block rounded-[4px] text-[15px] leading-[30px] text-rebm-blue transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none";

function FooterColumn({
  heading,
  children,
}: {
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full shrink-0 lg:w-[180px]">
      <h2 className="text-[14px] leading-[19px] font-semibold tracking-[0.04em] text-white">{heading}</h2>
      <ul className="mt-[14px]">{children}</ul>
    </div>
  );
}
