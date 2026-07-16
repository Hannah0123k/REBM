/**
 * Nav and contact details, shared by the header, mobile drawer and footer.
 *
 * The Figma frames disagree on nav links: the desktop homepage nav has five
 * (no Blog) while Blog/Post/tags have six. Decision #1 in CLAUDE.md treats the
 * homepage frame as stale and adds Blog everywhere. Order matches the Blog
 * frame, where Blog sits between Testimonials and Contact.
 *
 * Hrefs are provisional — pending confirmation of which nav items are homepage
 * anchors vs standalone pages.
 */

/** Header pill format (Figma 95:21). The footer uses the +1 form — see below. */
export const PHONE_NUMBER = "(800) 841-5033";

/** Footer format (Figma). Authored with the +1; kept distinct, not normalized. */
export const PHONE_NUMBER_INTL = "+1 (800) 841-5033";

export const PHONE_HREF = "tel:+18008415033";

export type NavLink = { label: string; href: string };

export const NAV_LINKS: NavLink[] = [
  { label: "Process", href: "/#process" },
  { label: "About", href: "/#about" },
  { label: "Property", href: "/#property" },
  { label: "Testimonials", href: "/#testimonials" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/#contact" },
];
