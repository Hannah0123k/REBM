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
 */
export default function ContactPage() {
  return (
    <main id="main-content" className="min-h-screen w-full bg-rebm-blue">
      <section className="w-full pt-[calc(var(--header-h)+12px)] pb-[24px]">
        <Container>
          {/* Heading fades up on load; the form panel follows ~180ms later.
              Disabled under prefers-reduced-motion (globals.css). */}
          <div className="rebm-enter mx-auto max-w-[680px] text-center">
            <h1 className="text-[30px] leading-[36px] font-bold tracking-[-0.3px] text-rebm-navy sm:text-[38px] sm:leading-[44px]">
              Contact Us
            </h1>
            <p className="mx-auto mt-[12px] max-w-[560px] text-[15px] leading-[22px] text-rebm-navy/80">
              Reach out about broker matching, partnerships, or general questions.
            </p>
          </div>

          <div className="rebm-enter-delayed mx-auto mt-[24px] max-w-[680px]">
            <ContactForm />
          </div>
        </Container>
      </section>
    </main>
  );
}
