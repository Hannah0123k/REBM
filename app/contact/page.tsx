import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { Footer } from "@/components/Footer";
import { ScrollTopOnMount } from "@/components/ScrollTopOnMount";
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
    <>
    <ScrollTopOnMount />
    <main id="main-content" className="min-h-screen w-full bg-rebm-blue">
      <section className="w-full pt-[var(--header-h)] pb-[48px]">
        <Container>
          {/* Heading fades up on load; the form/success panel follows ~180ms
              later (disabled under prefers-reduced-motion). Content is TOP-ALIGNED
              (not vertically centered) with a modest gap under the header, so the
              short success card and the tall form both start high on the page —
              no large empty gap above "Contact Us", and nothing opens mid-page. */}
          <div className="rebm-enter pt-[24px] pb-[28px] text-center lg:pt-[36px]">
            <h1 className="text-[30px] leading-[36px] font-bold tracking-[-0.3px] text-rebm-navy sm:text-[38px] sm:leading-[44px]">
              Contact Us
            </h1>
          </div>

          <div className="rebm-enter-delayed mx-auto w-full max-w-[680px]">
            <ContactForm />
          </div>
        </Container>
      </section>
    </main>
      <Footer />
    </>
  );
}
