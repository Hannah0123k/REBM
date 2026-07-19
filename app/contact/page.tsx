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
      <section className="w-full pt-[calc(var(--header-h)+6px)] pb-[18px]">
        <Container>
          <div className="mx-auto max-w-[680px] text-center">
            <h1 className="text-[28px] leading-[32px] font-bold text-rebm-navy sm:text-[34px] sm:leading-[40px]">
              Contact Us
            </h1>
            <p className="mx-auto mt-[6px] max-w-[640px] text-[15px] leading-[21px] text-rebm-navy/80">
              Reach out about broker matching, partnerships, or general questions.
            </p>
          </div>

          <div className="mx-auto mt-[14px] max-w-[680px]">
            <ContactForm />
          </div>
        </Container>
      </section>
    </main>
  );
}
