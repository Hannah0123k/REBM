import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/Container";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy — Real Estate Broker Match",
  description:
    "How Real Estate Foundation, Inc. (Real Estate Broker Match) collects, uses, shares, and protects personal information through its real estate broker referral service.",
};

/**
 * Public Privacy Policy page. Header/footer come from the root layout; the
 * typographic treatment mirrors the Terms of Service modal (DisclaimerModal) —
 * navy headings, Inter, the same section spacing and body colour, inside the
 * shared Container.
 *
 * Structure and legal substance follow the sister policy for Inherited Property
 * Match (the other Real Estate Foundation, Inc. brand), rewritten for REBM's
 * entity details, service description and contact channels.
 *
 * VENDOR DISCLOSURES ARE DELIBERATELY NARROWER THAN THE SISTER POLICY. That
 * document discloses RB2B/Retention.com visitor identification, the Meta Pixel
 * and MailerLite. This site uses none of them — the only third parties in the
 * codebase are Resend (contact-form delivery and the newsletter audience),
 * Supabase (database and image storage) and Vercel (hosting). Stating that REBM
 * uses a tracking or advertising vendor it does not use would be a false
 * disclosure, so §1, §3 and §5 are written to what this site actually does.
 *
 * Monday.com IS named in §3(b), as adoption-in-progress rather than in use
 * (Hannah, 2026-08-18) — disclosing a processor just before it goes live is
 * safe, whereas data reaching an undisclosed processor is not. When it is live,
 * change that sentence from "in the process of adopting" to present tense.
 *
 * If the business adds analytics, an advertising pixel, or visitor
 * identification, this page must be updated BEFORE those tools go live, and the
 * "we do not use" statements in §1(b), §5 and §6 must be revisited — they are
 * affirmative representations, not boilerplate.
 *
 * The privacy contact is rhett@realestatebrokermatch.com (Hannah, 2026-08-18),
 * appearing in §10(b), §10(f) and §15. It is an individual's mailbox rather than
 * a role alias, which is legally sufficient but ties statutory response
 * deadlines to one person being available — if a privacy@ alias is ever created,
 * swap all three occurrences to it.
 */
export default function PrivacyPage() {
  return (
    <>
      <main className="bg-white pt-[calc(var(--header-h)+56px)] pb-[80px]">
        <Container className="max-w-[820px]">
          <div className="text-rebm-navy">
            <h1 className="text-[28px] font-bold sm:text-[32px]">Privacy Policy</h1>

            <p className="mt-[16px] text-[14px] leading-[21px] text-[rgb(90,100,110)]">
              <span className="font-semibold">Effective Date:</span> August 12, 2026
            </p>

            <div className="mt-[24px] space-y-[16px] text-[15px] leading-[24px] text-[rgb(40,52,64)]">
              <p>
                Real Estate Broker Match (“REBM”) is operated by Real Estate Foundation, Inc., a
                Colorado corporation (“we,” “us,” or “our”). We operate
                RealEstateBrokerMatch.com (the “Website”) and provide a real estate broker referral
                service designed to connect property owners and other parties with qualified,
                independent real estate brokers and agents. This Privacy Policy describes how we
                collect, use, share, and protect personal information collected through the Website
                and our referral services.
              </p>
              <p>
                By accessing or using the Website or our referral services, you acknowledge that you
                have read and understood this Privacy Policy and agree to the practices described
                herein. This Privacy Policy is incorporated into and forms a part of our Terms of
                Service and User Agreement, available through the “Disclaimer” link in the footer of
                this Website. If you do not agree with these practices, please do not use the
                Website or our services.
              </p>

              <Section n="1" title="INFORMATION WE COLLECT">
                <p>We collect information in the following ways:</p>
                <p className="font-semibold">(a) Information You Provide Directly.</p>
                <p>
                  When you submit a contact form, request a broker referral, subscribe to our
                  newsletter, or otherwise communicate with us, we may collect:
                </p>
                <List
                  items={[
                    "First and last name",
                    "Email address",
                    "Telephone number",
                    "Whether you are a real estate agent or broker",
                    "Property address, property type, and property details",
                    "Information about your relationship to the property and your objectives, such as whether you are buying, selling, or leasing",
                    "Any additional information you voluntarily include in your message or communications with us",
                  ]}
                />
                <p className="font-semibold">(b) Information Collected Automatically.</p>
                <p>
                  When you visit the Website, our hosting provider maintains standard server logs
                  that may record your IP address, general geographic location, browser and device
                  type, the pages you request, the referring website, and the date and time of your
                  visit.
                </p>
                <p>
                  To protect our contact form from automated abuse, we apply a submission rate limit
                  keyed to your IP address. The IP address is irreversibly hashed before it is
                  stored, so the stored value cannot be converted back into your IP address.
                </p>
                <p>
                  We do not use advertising pixels, visitor identification technology, or
                  third-party analytics services on this Website.
                </p>
                <p className="font-semibold">(c) Information from Third Parties.</p>
                <p>
                  We may receive information about you from Referred Professionals, referral
                  partners, or public records relevant to your inquiry.
                </p>
              </Section>

              <Section n="2" title="HOW WE USE YOUR INFORMATION">
                <p>We use the information we collect for the following purposes:</p>
                <List
                  items={[
                    "To operate, maintain, secure, and improve the Website and our referral services",
                    "To respond to your inquiries and communications",
                    "To match you with one or more independent real estate brokers or agents in our network (“Referred Professionals”)",
                    "To share your contact and property information with Referred Professionals so they may contact you regarding your real estate needs",
                    "To verify the qualifications and licensure of Referred Professionals",
                    "To send requested materials, respond to your inquiry, and provide follow-up communications",
                    "To analyze usage patterns and improve user experience",
                    "To detect, prevent, and address fraud, abuse, security issues, and technical problems",
                    "To comply with applicable laws, regulations, court orders, and legal processes",
                    "To enforce our Terms of Service, protect our rights, and investigate potential fraud or misconduct",
                  ]}
                />
                <p>
                  If you subscribe to our newsletter, we use your name and email address to send you
                  educational content, market commentary, service updates, and information about our
                  services. You may opt out at any time using the unsubscribe link included in every
                  such email, or by contacting us using the information in Section 15. Opting out of
                  marketing email will not prevent us from sending communications necessary to
                  respond to or administer an existing inquiry or referral request.
                </p>
              </Section>

              <Section n="3" title="HOW WE SHARE YOUR INFORMATION">
                <p className="font-semibold">(a) With Referred Professionals.</p>
                <p>
                  When you ask us to help match you with a broker or agent, we will first speak with
                  you directly to understand your property and your goals before sharing your
                  information with any Referred Professional. During that conversation, you may tell
                  us if there is specific information you do not want shared. Unless you explicitly
                  instruct us otherwise, we treat information you have provided as available to
                  share with the Referred Professional within the scope of your inquiry. Once
                  information is shared, the Referred Professional’s handling of your information is
                  governed by their own privacy notices and any agreements between you and that
                  professional. We encourage you to review those materials before engaging them.
                </p>
                <p className="font-semibold">(b) With Service Providers.</p>
                <p>
                  We may share information with third-party vendors that provide services on our
                  behalf. The providers we currently use are Resend (delivery of contact-form email
                  and management of our newsletter audience), Supabase (database and image storage
                  for this Website), and Vercel (website hosting). We are in the process of adopting
                  Monday.com for customer relationship management; once it is implemented, inquiry
                  and referral records will be stored and managed there. These service providers are
                  authorized to use your information only to perform services for us. If we adopt
                  additional tools, we will update this Privacy Policy to identify them.
                </p>
                <p className="font-semibold">(c) Categories of Third-Party Recipients.</p>
                <p>
                  We may disclose personal information to the following categories of recipients:
                  (i) independent real estate brokers and agents in our referral network; (ii)
                  hosting, database, email, and website support vendors; (iii) legal, tax,
                  compliance, and professional advisors; (iv) government authorities, courts,
                  regulators, and law enforcement where required by law; and (v) parties involved in
                  a merger, acquisition, financing, or asset transfer.
                </p>
                <p className="font-semibold">(d) For Legal Reasons.</p>
                <p>
                  We may disclose information when required by law, subpoena, court order, or other
                  legal process, or when we believe in good faith that disclosure is necessary to
                  protect our rights, protect your safety or the safety of others, investigate
                  fraud, or respond to a government request.
                </p>
                <p className="font-semibold">(e) In Business Transfers.</p>
                <p>
                  If Real Estate Foundation, Inc. is involved in a merger, acquisition, sale of
                  assets, reorganization, or similar transaction, your information may be
                  transferred as part of that transaction. We will take reasonable steps to ensure
                  any successor entity honors the commitments made in this Privacy Policy.
                </p>
                <p className="font-semibold">(f) With Your Consent.</p>
                <p>
                  We may share information with other parties when you provide consent or direct us
                  to do so.
                </p>
                <p className="font-semibold">
                  WE DO NOT SELL YOUR PERSONAL INFORMATION TO THIRD PARTIES FOR MONETARY
                  CONSIDERATION.
                </p>
              </Section>

              <Section n="4" title="REFERRAL FEE DISCLOSURE">
                <p>
                  As described in our Terms of Service, we may receive a referral fee from a
                  Referred Professional when you engage their services. The exchange of your
                  information with Referred Professionals is part of our standard referral
                  operations and is not considered a “sale” of personal information under applicable
                  privacy laws.
                </p>
              </Section>

              <Section n="5" title="COOKIES AND TRACKING TECHNOLOGIES">
                <p>
                  Cookies are small data files stored on your device. This Website uses only
                  essential cookies — those required for basic site functionality, such as
                  maintaining a signed-in session for authorized administrators and supporting form
                  submission and security.
                </p>
                <p>
                  We do not use advertising cookies, targeting cookies, retargeting pixels, social
                  media pixels, visitor identification technology, or third-party analytics cookies
                  on this Website.
                </p>
                <p className="font-semibold">(a) Managing Cookies.</p>
                <p>
                  You may control or delete cookies through your browser settings. Disabling
                  essential cookies may limit your ability to use some features of the Website.
                </p>
                <p className="font-semibold">
                  (b) Do Not Track and Global Privacy Control Signals.
                </p>
                <p>
                  The Website does not respond to general “Do Not Track” browser settings. Where
                  required by applicable law, we honor legally recognized opt-out preference
                  signals, including Global Privacy Control (“GPC”). Because we do not sell personal
                  information, share it for cross-context behavioral advertising, or process it for
                  targeted advertising, there are currently no such activities for these signals to
                  opt you out of.
                </p>
              </Section>

              <Section n="6" title="PRIVACY CHOICES: SALE, SHARING, AND TARGETED ADVERTISING">
                <p>
                  We do not sell your personal information, we do not share it for cross-context
                  behavioral advertising, and we do not process it for targeted advertising.
                </p>
                <p>
                  Sharing your information with a Referred Professional is done at your request in
                  order to provide the referral service you asked for. If you would prefer that we
                  not share your information with a Referred Professional, you may tell us so during
                  our conversation with you, or contact us using the information in Section 15.
                  Declining that sharing will prevent us from providing broker referral services to
                  you, but will not affect your ability to use the rest of the Website.
                </p>
                <p>
                  We will process any privacy request promptly and will not require you to create an
                  account or provide information beyond what is necessary to verify and fulfill the
                  request.
                </p>
              </Section>

              <Section n="7" title="SENSITIVE INFORMATION">
                <p>
                  Property inquiries can involve sensitive personal circumstances, including
                  financial details or family matters. We ask that you do not submit highly
                  sensitive personal information through our Website or contact form unless it is
                  reasonably necessary for your inquiry. Information you provide will not be shared
                  with any Referred Professional until we have first spoken with you directly and
                  you have had the opportunity to tell us what should or should not be shared (see
                  Section 3(a)). We do not intentionally use or disclose sensitive personal
                  information for purposes other than providing requested services, complying with
                  law, protecting rights and security, or other purposes permitted by applicable
                  law.
                </p>
              </Section>

              <Section n="8" title="DATA SECURITY">
                <p>
                  We implement reasonable administrative, technical, and physical safeguards
                  designed to protect personal information from unauthorized access, disclosure,
                  alteration, and destruction. However, no method of transmission over the internet
                  or electronic storage is completely secure. We cannot guarantee absolute security
                  of any information transmitted to or stored by us. You transmit information at
                  your own risk. In the event of a data breach that compromises your personal
                  information, we will notify you and applicable regulators as required by law.
                </p>
              </Section>

              <Section n="9" title="DATA RETENTION">
                <p>We retain personal information according to the following general schedule:</p>
                <List
                  items={[
                    "Inquiry and referral request data (name, email, phone, property details, form submissions): retained for as long as needed to respond to the request, manage referral relationships, maintain business records, and comply with legal obligations, generally a minimum of seven years consistent with real estate record retention standards.",
                    "Referral transaction and follow-up records: retained for the period needed for operational, contractual, tax, accounting, dispute-resolution, and compliance purposes.",
                    "Newsletter subscription and opt-out records: retained as long as needed to honor your preferences and comply with applicable law.",
                    "Hashed IP addresses used for contact-form rate limiting: retained only for the short period needed to enforce the limit, then discarded.",
                  ]}
                />
                <p>
                  When information is no longer needed for any of the purposes described above, we
                  will take reasonable steps to delete or anonymize it.
                </p>
              </Section>

              <Section n="10" title="YOUR CHOICES AND RIGHTS">
                <p className="font-semibold">(a) Available Rights.</p>
                <p>
                  Depending on where you reside and applicable law, you may have the right to:
                </p>
                <List
                  items={[
                    "Request access to the personal information we hold about you",
                    "Request correction of inaccurate personal information",
                    "Request deletion of your personal information, subject to legal exceptions",
                    "Request a portable copy of certain personal information",
                    "Opt out of marketing communications",
                  ]}
                />
                <p className="font-semibold">(b) How to Submit a Request.</p>
                <p>You may submit privacy requests by:</p>
                <List
                  items={[
                    "Emailing rhett@realestatebrokermatch.com with “Privacy Request” in the subject line",
                    "Calling 1.800.841.5033",
                    "Writing to us at the address listed in Section 15",
                  ]}
                />
                <p>
                  You may also reach us through our{" "}
                  <Link href="/contact" className="text-rebm-link underline">
                    Contact page
                  </Link>
                  . Please state that your message is a privacy request so we can route it
                  correctly.
                </p>
                <p className="font-semibold">(c) Verification.</p>
                <p>
                  We may need to verify your identity before completing a request. This may require
                  you to provide information sufficient to match your request to records we hold.
                </p>
                <p className="font-semibold">(d) Authorized Agents.</p>
                <p>
                  You may designate an authorized agent to submit a request on your behalf. We may
                  require verification of the agent’s authority and your identity before processing
                  the request.
                </p>
                <p className="font-semibold">(e) Response Timing.</p>
                <p>
                  We will acknowledge receipt of your request and respond within 45 days. If we need
                  additional time, we will notify you of the reason and the expected completion
                  date. Extensions will not exceed an additional 45 days.
                </p>
                <p className="font-semibold">(f) Appeals.</p>
                <p>
                  If we deny a request and applicable law gives you the right to appeal, you may
                  appeal by emailing rhett@realestatebrokermatch.com with “Privacy Appeal” in the
                  subject line, by calling 1.800.841.5033, or by writing to us at the address in
                  Section 15. We will respond to appeals within the time frame required by
                  applicable law.
                </p>
                <p className="font-semibold">(g) Non-Discrimination.</p>
                <p>We will not discriminate against you for exercising any privacy right.</p>
                <p>
                  Once your information has been shared with a Referred Professional, you may also
                  need to contact that professional directly regarding information they hold.
                </p>
              </Section>

              <Section n="11" title="STATE PRIVACY RIGHTS">
                <p>
                  Several U.S. states have enacted privacy laws that provide residents with specific
                  rights regarding personal information. Where those laws apply to our operations,
                  we honor the rights described in Section 10. If you are a resident of a state with
                  an applicable privacy law and believe you have rights not addressed in this
                  Privacy Policy, contact us using the information in Section 15.
                </p>
              </Section>

              <Section n="12" title="DEIDENTIFIED AND AGGREGATED INFORMATION">
                <p>
                  We may create deidentified or aggregated information from the personal information
                  we collect. Deidentified or aggregated information is not personal information,
                  and we may use and disclose it for any lawful purpose, including research,
                  analytics, and improving our services. We take reasonable measures to ensure that
                  deidentified information cannot be associated with any individual.
                </p>
              </Section>

              <Section n="13" title="VISITORS OUTSIDE THE UNITED STATES, CHILDREN, AND THIRD-PARTY LINKS">
                <p className="font-semibold">(a) Visitors Outside the United States.</p>
                <p>
                  The Website is operated in the United States and is intended for users located in
                  the United States. If you access the Website from outside the United States, your
                  information will be transferred to, stored, and processed in the United States,
                  which may have data protection laws different from those in your country. If you
                  are located in the European Economic Area, the United Kingdom, or another
                  jurisdiction with applicable data protection laws, you may have additional rights
                  under local law. Contact us to exercise any such rights.
                </p>
                <p className="font-semibold">(b) Children’s Privacy.</p>
                <p>
                  The Website and our referral services are not directed to individuals under the
                  age of 18. We do not knowingly collect personal information from children under
                  18. If we learn that we have collected personal information from a child under 18,
                  we will delete it promptly. If you believe a child has provided us with personal
                  information, contact us using the information in Section 15.
                </p>
                <p className="font-semibold">(c) Third-Party Websites and Links.</p>
                <p>
                  The Website may contain links to third-party websites, including websites operated
                  by Referred Professionals, referral partners, or other third parties. We are not
                  responsible for the privacy practices of any third-party website. This Privacy
                  Policy applies only to information collected through RealEstateBrokerMatch.com. We
                  encourage you to review the privacy policies of any third-party website you visit.
                </p>
              </Section>

              <Section n="14" title="GOVERNING LAW AND CHANGES TO THIS PRIVACY POLICY">
                <p>
                  This Privacy Policy is governed by and construed in accordance with the laws of
                  the State of Colorado, without regard to its conflict of law provisions.
                </p>
                <p>
                  We may modify or update this Privacy Policy from time to time. When we do, we will
                  update the “Effective Date” at the top of this document and post the revised
                  Privacy Policy on the Website. Material changes will be noted prominently. Your
                  continued use of the Website or our referral services after any modification
                  constitutes your acceptance of the revised Privacy Policy. You are responsible for
                  reviewing this Privacy Policy periodically.
                </p>
              </Section>

              <Section n="15" title="CONTACT INFORMATION">
                <p>
                  If you have questions, concerns, or requests regarding this Privacy Policy or our
                  privacy practices, contact us at:
                </p>
                <p className="leading-[26px]">
                  Real Estate Foundation, Inc.
                  <br />
                  Attn: Privacy Inquiries
                  <br />
                  2451 S. Yosemite Street
                  <br />
                  Denver, CO 80231
                  <br />
                  Email: rhett@realestatebrokermatch.com
                  <br />
                  Phone: 1.800.841.5033
                </p>
                <p>
                  You may also reach us through our{" "}
                  <Link href="/contact" className="text-rebm-link underline">
                    Contact page
                  </Link>
                  .
                </p>
              </Section>
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
