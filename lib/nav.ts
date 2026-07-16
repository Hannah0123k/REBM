/**
 * Nav, footer and contact data — shared by the header, mobile drawer and footer.
 *
 * Hrefs come from the LIVE SITE (the content source of truth), not Figma:
 *   - Contact is a real page (/contact-us/), not a homepage anchor
 *   - Blog is a real page (/blog/)
 *   - everything else is a homepage anchor
 *
 * The live site's testimonials anchor is misspelled (#testamonials). We control
 * both ends of the link here, so it's spelled correctly — noted in case an
 * external link to the old anchor ever needs a redirect.
 *
 * Figma's homepage nav omits Blog and FAQ; the live site has both. Decisions #1
 * and #11 in CLAUDE.md: the frames are stale, both links ship.
 */

/** Header pill format (Figma 95:21). The footer uses the +1 form — see below. */
export const PHONE_NUMBER = "(800) 841-5033";

/** Footer format (Figma 95:139, confirmed against the live site). */
export const PHONE_NUMBER_INTL = "+1 (800) 841-5033";

export const PHONE_HREF = "tel:+18008415033";

export type NavLink = { label: string; href: string };

/** Header nav. Figma order (Blog between Testimonials and Contact). */
export const NAV_LINKS: NavLink[] = [
  { label: "Process", href: "/#process" },
  { label: "About", href: "/#about" },
  { label: "Property", href: "/#property" },
  { label: "Testimonials", href: "/#testimonials" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact-us" },
];

/** Footer COMPANY column — live site order, which adds Home and FAQ. */
export const FOOTER_LINKS: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Process", href: "/#process" },
  { label: "About", href: "/#about" },
  { label: "Property", href: "/#property" },
  { label: "Testimonials", href: "/#testimonials" },
  { label: "FAQ", href: "/#faq" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact-us" },
];

/**
 * Social links exist on the live site but appear nowhere in the Figma footer.
 * Design says omit, content says keep — flagged to Hannah, not yet resolved.
 * Defined here so they're ready the moment she decides; not yet rendered.
 */
export const SOCIAL_LINKS = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/realestatebrokermatch/" },
  { label: "Twitter", href: "https://x.com/REBrokerMatch" },
  { label: "YouTube", href: "https://www.youtube.com/@RealEstateBrokerMatch" },
] as const;

/** Live site wording wins over Figma's "Copyright @ Real Estate Foundation Inc., 2024". */
export const COPYRIGHT = "Copyright © 2026 Real Estate Foundation, Inc.";
