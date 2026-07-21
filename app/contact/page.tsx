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
    <main id="main-content" className="flex min-h-screen w-full flex-col bg-rebm-blue">
      <section className="flex w-full flex-1 flex-col pt-[var(--header-h)] pb-[24px]">
        <Container className="flex flex-1 flex-col">
          {/* Heading fades up on load; the form panel follows ~180ms later.
              Disabled under prefers-reduced-motion (globals.css).

              "Contact Us" is VERTICALLY CENTERED in the open blue space between
              the header and the form: the heading lives in a flex-1 region that
              grows to fill that gap and centers the words within it (equal space
              above and below). The form then sits below at its natural position.
              On mobile the form is taller than the viewport, so the heading
              region collapses toward its content and the page scrolls top-anchored
              instead of clipping. */}
          <div className="rebm-enter flex flex-1 items-center justify-center text-center">
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
