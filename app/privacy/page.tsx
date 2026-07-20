import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/Container";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy — Real Estate Broker Match",
  description:
    "How Real Estate Foundation, Inc. (Real Estate Broker Match) collects, uses, and shares personal information to refer you to independent real estate brokers.",
};

/**
 * Public Privacy Policy page. The header/footer come from the root layout. The
 * typographic treatment mirrors the Terms of Service modal (DisclaimerModal):
 * navy headings, Inter, the same section spacing and body color, inside the
 * shared Container. Substance is drawn from what the Terms already disclose.
 *
 * DRAFT — legal counsel must review before launch. Anything not confirmed by
 * the business is a clearly-labeled TODO rather than an invented value.
 */
export default function PrivacyPage() {
  return (
    <>
    <main className="bg-white pt-[calc(var(--header-h)+56px)] pb-[80px]">
      <Container className="max-w-[820px]">
        <div className="text-rebm-navy">
          <h1 className="text-[28px] font-bold sm:text-[32px]">Privacy Policy</h1>

          {/* Draft banner — clearly visible at the top. */}
          <p
            role="note"
            className="mt-[20px] rounded-[12px] border border-[#E5C36B] bg-[#FBF3D8] px-[18px] py-[14px] text-[14px] leading-[21px] font-medium text-[rgb(90,72,20)]"
          >
            This policy is a draft and should be reviewed by legal counsel before launch.
          </p>

          <p className="mt-[16px] text-[14px] leading-[21px] text-[rgb(90,100,110)]">
            <span className="font-semibold">Effective Date:</span>{" "}
            [TODO: insert effective date before launch]
          </p>

          <div className="mt-[24px] space-y-[16px] text-[15px] leading-[24px] text-[rgb(40,52,64)]">
            <p>
              This Privacy Policy explains how Real Estate Foundation, Inc. (“REBM,” “we,” “us,” or
              “our”) collects, uses, shares, and protects personal information when you use
              Realestatebrokermatch.com (the “Website”) or our real estate broker referral services.
              REBM operates exclusively as a real estate broker referral service: our purpose is to
              refer (introduce) you to independent, third-party real estate brokers or agents
              (“Referred Professionals”). By using the Website or our services, you agree to the
              practices described in this Privacy Policy.
            </p>

            <Section n="1" title="INFORMATION WE COLLECT">
              <p>
                We collect information you provide directly to us, primarily through our contact and
                referral forms. This may include:
              </p>
              <List
                items={[
                  "Your name (first and last)",
                  "Email address",
                  "Phone number",
                  "Property preferences (such as location, property type, and whether you are buying, selling, or leasing)",
                  "Transaction details and any information you include in your message to us",
                  "Whether you are a real estate agent or broker",
                ]}
              />
              <p>
                We also automatically collect certain technical information when you visit the
                Website, which may include your device and browser type, IP address, pages viewed,
                and interactions with the site, collected through cookies and similar technologies.
                See “Cookies and Analytics” below.
              </p>
            </Section>

            <Section n="2" title="HOW WE USE YOUR INFORMATION">
              <p>We use the personal information we collect to:</p>
              <List
                items={[
                  "Refer and introduce you to independent Referred Professionals who may assist with your real estate needs",
                  "Respond to your inquiries and communicate with you about our services",
                  "Match you with a Referred Professional based on criteria such as location, property type, and broker availability",
                  "Operate, maintain, and improve the Website and our referral services",
                  "Detect, prevent, and address fraud, abuse, security issues, and technical problems",
                  "Comply with applicable legal obligations",
                ]}
              />
            </Section>

            <Section n="3" title="HOW WE SHARE YOUR INFORMATION">
              <p className="font-semibold">
                To provide our referral service, we share your information with Referred
                Professionals.
              </p>
              <p>
                When you request a referral or submit your details, we share your contact
                information, property preferences, and transaction details with one or more Referred
                Professionals in our network so they can contact you and offer their services. Once
                your information is shared with a Referred Professional, that professional’s own use
                of your information is governed by their own privacy practices, not this Policy.
              </p>
              <p>We may also share information:</p>
              <List
                items={[
                  "With service providers who perform functions on our behalf (such as website hosting, form processing, and analytics), limited to what they need to perform those functions",
                  "When required to comply with applicable law, legal process, or a lawful government request",
                  "To protect the rights, property, or safety of REBM, our users, or others, and to enforce our Terms of Service",
                  "In connection with a merger, acquisition, financing, or sale of assets, in which case information may be transferred as part of that transaction",
                ]}
              />
              <p className="font-semibold">
                We do not sell your personal information.
              </p>
            </Section>

            <Section n="4" title="COOKIES AND ANALYTICS">
              <p>
                The Website uses cookies and similar technologies to operate the site, remember your
                preferences, and understand how visitors use the site. We may use analytics tools to
                collect aggregated, usage information that helps us improve the Website.
              </p>
              <p>
                [TODO: confirm and list the specific analytics/advertising providers in use (e.g.,
                Google Analytics, Google Tag Manager) and link to their privacy policies before
                launch. Do not list a vendor here until confirmed.]
              </p>
              <p>
                Most web browsers let you refuse or delete cookies through their settings. Disabling
                cookies may affect how parts of the Website function.
              </p>
            </Section>

            <Section n="5" title="DATA RETENTION">
              <p>
                We retain personal information for as long as necessary to provide our referral
                services, respond to your inquiries, comply with our legal obligations, resolve
                disputes, and enforce our agreements.
              </p>
              <p>
                [TODO: confirm specific retention periods for contact/referral submissions before
                launch.]
              </p>
            </Section>

            <Section n="6" title="YOUR CHOICES AND RIGHTS">
              <p>You may:</p>
              <List
                items={[
                  "Decline to provide certain information, though this may prevent us from referring you to a Referred Professional",
                  "Ask us to access, update, or correct the personal information you have provided",
                  "Ask us to delete the personal information you have provided, subject to legal and operational retention requirements",
                  "Opt out of non-essential communications from us",
                ]}
              />
              <p>
                Depending on where you live, you may have additional rights under applicable state
                privacy laws. To exercise any of these choices, contact us using the details in the
                “Contact Us” section below. Note that once your information has been shared with a
                Referred Professional, you may also need to contact that professional directly
                regarding information they hold.
              </p>
            </Section>

            <Section n="7" title="CHILDREN’S PRIVACY">
              <p>
                The Website and our services are intended for adults and are not directed to
                children under 18 years of age. We do not knowingly collect personal information
                from children under 18. If you believe a child has provided us with personal
                information, please contact us and we will take reasonable steps to delete it.
              </p>
            </Section>

            <Section n="8" title="DATA SECURITY">
              <p>
                We use reasonable administrative, technical, and physical safeguards designed to
                protect the personal information we collect. However, no method of transmission over
                the Internet or method of electronic storage is completely secure, and we cannot
                guarantee absolute security.
              </p>
            </Section>

            <Section n="9" title="CHANGES TO THIS PRIVACY POLICY">
              <p>
                We may update this Privacy Policy from time to time. When we do, we will revise the
                “Effective Date” at the top of this page and, where appropriate, provide additional
                notice. Your continued use of the Website or our services after any changes take
                effect constitutes your acceptance of the revised Policy.
              </p>
            </Section>

            <Section n="10" title="GOVERNING LAW">
              <p>
                This Privacy Policy is governed by and construed in accordance with the laws of the
                State of Colorado, without regard to its conflict of law provisions.
              </p>
            </Section>

            <Section n="11" title="CONTACT US">
              <p>
                If you have questions about this Privacy Policy or how we handle your personal
                information, please contact us at:
              </p>
              <p className="leading-[26px]">
                Real Estate Foundation, Inc.
                <br />
                Alan Fruitman
                <br />
                2451 S. Yosemite Street
                <br />
                Denver, CO 80231
                <br />
                (800) 841-5033
              </p>
              <p>[TODO: add a privacy contact email address once confirmed.]</p>
            </Section>

            <p className="pt-[8px] text-[14px] leading-[21px] text-[rgb(90,100,110)]">
              See also our{" "}
              <Link href="/contact" className="text-rebm-link underline">
                Contact page
              </Link>
              .
            </p>
          </div>
        </div>
      </Container>
    </main>
      <Footer />
    </>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mt-[8px] mb-[8px] text-[16px] font-bold text-rebm-navy">
        {n}. {title}
      </h2>
      <div className="space-y-[12px]">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-[6px] pl-[22px]">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}
