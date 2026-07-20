import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us — Real Estate Broker Match",
  description:
    "Contact Real Estate Broker Match about broker matching, partnerships, or general questions. We’ll connect you with a hand-selected, expert real estate broker.",
};

/**
 * Public Contact page — a single centered form panel on the brand-blue band
 * (the same #689ECF used across the homepage sections), navy heading, no side
 * column. Compact by design (Hannah) so the whole page fits a laptop viewport
 * without scrolling. Header comes from the root layout.
 *
 * The heading + form are centered BOTH ways: the section is a full-height flex
 * column that vertically centers its content in the space below the (overlaid)
 * header, so the empty blue space is balanced top and bottom. When the content
 * is taller than the viewport (mobile), min-height lets the page grow and
 * scroll top-anchored instead of clipping.
 */
export default function ContactPage() {
  return (
    <main id="main-content" className="flex min-h-screen w-full flex-col bg-rebm-blue">
      <section className="flex w-full flex-1 flex-col justify-center pt-[var(--header-h)] pb-[24px]">
        <Container>
          {/* Heading fades up on load; the form panel follows ~180ms later.
              Disabled under prefers-reduced-motion (globals.css). */}
          <div className="rebm-enter mx-auto max-w-[680px] text-center">
            <h1 className="text-[30px] leading-[36px] font-bold tracking-[-0.3px] text-rebm-navy sm:text-[38px] sm:leading-[44px]">
              Contact Us
            </h1>
          </div>

          <div className="rebm-enter-delayed mx-auto mt-[36px] max-w-[680px]">
            <ContactForm />
          </div>
        </Container>
      </section>
    </main>
  );
}
