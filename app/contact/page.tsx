import type { Metadata } from "next";

import { Container } from "@/components/Container";
import { ContactForm } from "@/components/contact/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us — Real Estate Broker Match",
  description:
    "Get in touch with Real Estate Broker Match. Tell us about your property and we’ll connect you with a hand-selected, expert real estate broker.",
};

/**
 * Public Contact page. Layout/vibe from the supplied reference, rebuilt entirely
 * in the REBM brand (navy/blue, Inter, the site's pill buttons and spacing).
 * The header/footer come from the root layout. Contact details are limited to
 * confirmed info (phone + address from the Terms of Service); email, hours and
 * response-time are TODO until confirmed.
 */
export default function ContactPage() {
  return (
    <main>
      {/* Hero band */}
      <section className="w-full bg-rebm-blue pt-[calc(var(--header-h)+56px)] pb-[64px]">
        <Container>
          <h1 className="text-[40px] leading-[46px] font-semibold text-white sm:text-[52px] sm:leading-[60px]">
            Contact Us
          </h1>
          <p className="mt-[14px] max-w-[620px] text-[18px] leading-[27px] text-white/90">
            Tell us about your property and what you’re looking to do. We’ll connect you with a
            hand-selected broker from our nationwide network — vetted through 30+ years of
            relationships built on trust and performance.
          </p>
        </Container>
      </section>

      {/* Form + info */}
      <section className="w-full bg-[#F5F5F5] py-[64px]">
        <Container className="grid gap-[32px] lg:grid-cols-[1.4fr_1fr]">
          <ContactForm />

          <aside className="flex flex-col gap-[16px]">
            <InfoCard title="Call us">
              <a href="tel:+18008415033" className="text-[20px] font-semibold text-rebm-navy hover:text-rebm-link">
                (800) 841-5033
              </a>
            </InfoCard>

            <InfoCard title="Office">
              <address className="text-[15px] leading-[24px] text-[rgb(60,70,80)] not-italic">
                Real Estate Foundation, Inc.
                <br />
                Alan Fruitman, Licensed Real Estate Broker
                <br />
                2451 S. Yosemite Street
                <br />
                Denver, CO 80231
              </address>
            </InfoCard>

            <InfoCard title="What happens next">
              <ol className="flex flex-col gap-[8px] text-[15px] leading-[22px] text-[rgb(60,70,80)]">
                <li>1. We review your message and property details.</li>
                <li>2. We hand-select a broker suited to your goals.</li>
                <li>3. We introduce you — no cost or obligation to you.</li>
              </ol>
              {/* TODO: confirm and add — email address, business hours, expected response time. */}
            </InfoCard>
          </aside>
        </Container>
      </section>
    </main>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[16px] border border-rebm-card-border bg-white p-[20px]">
      <h2 className="mb-[8px] text-[13px] font-semibold tracking-wide text-[rgb(120,130,140)] uppercase">
        {title}
      </h2>
      {children}
    </div>
  );
}
