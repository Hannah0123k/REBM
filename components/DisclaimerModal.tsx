"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Footer "Disclaimer" → opens the Terms of Service as a centered, scrollable
 * modal (matching the live site's popup behavior). The trigger is a button
 * styled like the other footer links; the content uses the site's typography.
 */
export function DisclaimerModal({ triggerClassName = "" }: { triggerClassName?: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // lock background scroll
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Portal to <body> so the fixed overlay isn't trapped by the footer's GSAP
  // transform (a transformed ancestor becomes the containing block for fixed).
  // `open` starts false, so the portal (and its document.body access) only runs
  // after a client click — no SSR/hydration guard needed.
  const overlay = open && (
    <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="disclaimer-title"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/50 px-[16px] py-[40px]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[820px] rounded-[16px] bg-white shadow-2xl"
          >
            <button
              type="button"
              aria-label="Close disclaimer"
              onClick={() => setOpen(false)}
              className="absolute top-[16px] right-[16px] flex size-[36px] items-center justify-center rounded-full text-[22px] text-rebm-navy transition-colors hover:bg-[#F0F2F4]"
            >
              ×
            </button>

            <div className="max-h-[80vh] overflow-y-auto px-[28px] py-[36px] sm:px-[48px]">
              <DisclaimerContent />
            </div>
          </div>
        </div>
  );

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={triggerClassName}>
        Disclaimer
      </button>
      {overlay ? createPortal(overlay, document.body) : null}
    </>
  );
}

/** The Terms of Service copy, formatted with the site's blog-style typography. */
function DisclaimerContent() {
  return (
    <div className="text-rebm-navy">
      <h2 id="disclaimer-title" className="text-[28px] font-bold">
        Disclaimer
      </h2>
      <h3 className="mt-[20px] text-[18px] font-bold tracking-wide">
        TERMS OF SERVICE AND USER AGREEMENT
      </h3>

      <div className="mt-[16px] space-y-[16px] text-[15px] leading-[24px] text-[rgb(40,52,64)]">
        <p>
          By accessing or using Realestatebrokermatch.com (the “Website”) or the referral services
          provided by Real Estate Foundation, Inc. (REF), you acknowledge that you have read,
          understood, and agree to be bound by these Terms of Service. If you do not agree to these
          terms, you may not use this Website or our services.
        </p>

        <Section n="1" title="NATURE OF SERVICES">
          <p>
            Real Estate Foundation, Inc. operates Realestatebrokermatch.com as a real estate broker
            referral service. Alan Fruitman is a licensed real estate broker in the State of
            Colorado, license number ER1322889.
          </p>
          <p className="font-semibold">
            REAL ESTATE FOUNDATION, INC. IS OPERATING EXCLUSIVELY AS A REFERRAL BROKER. We do not and
            will not:
          </p>
          <List
            items={[
              "Represent you as your listing broker or buyer’s broker",
              "Negotiate on your behalf",
              "Provide real estate brokerage services for your transaction",
              "Advise you regarding specific properties or transactions",
              "Manage or participate in your real estate transaction",
            ]}
          />
          <p>
            Our sole service is to refer (introduce) you to independent third-party real estate
            brokers or agents (“Referred Professionals”) who may represent you in the purchase, sale,
            lease, or other real estate transaction. The Referred Professional, not Real Estate
            Foundation, Inc., will serve as your agent or broker in any transaction.
          </p>
          <p>
            <span className="font-semibold">Referral Compensation Disclosure:</span> We may receive a
            referral fee from Referred Professionals when you engage their services. This fee is
            typically paid by the Referred Professional from their commission. Any referral fee
            arrangements are established through separate agreements between Real Estate Foundation,
            Inc. and the Referred Professional, not with you.
          </p>
        </Section>

        <Section n="2" title="NO BROKERAGE RELATIONSHIP WITH YOU">
          <p>You acknowledge and agree that:</p>
          <p>
            <span className="font-semibold">(a) No Agency Relationship:</span> Real Estate Foundation,
            Inc. does not represent you and is not your real estate broker or agent. We are not acting
            in a fiduciary capacity on your behalf. By providing a referral, we are not creating any
            brokerage, agency, or fiduciary relationship with you.
          </p>
          <p>
            <span className="font-semibold">(b) Independent Relationship:</span> Any contractual or
            agency relationship you form with a Referred Professional is exclusively between you and
            that professional. We are not a party to such relationships or agreements.
          </p>
          <p>
            <span className="font-semibold">(c) Referred Professional is Your Agent:</span> The
            Referred Professional, if you choose to engage them, will be YOUR agent or broker (subject
            to your agreement with them), not our agent or sub-agent.
          </p>
        </Section>

        <Section n="3" title="REFERRAL PROCESS AND LIMITATIONS">
          <p>
            Our referral matching is based on limited criteria such as location, property type, and
            broker availability. While we make reasonable efforts to refer competent professionals:
          </p>
          <p>
            <span className="font-semibold">(a)</span> We do not endorse, guarantee, or warrant the
            qualifications, credentials, performance, conduct, or suitability of any Referred
            Professional.
          </p>
          <p>
            <span className="font-semibold">(b)</span> We do not conduct comprehensive background
            checks beyond verification of active licensure.
          </p>
          <p>
            <span className="font-semibold">(c)</span> We cannot guarantee that any Referred
            Professional will: (i) accept you as a client, (ii) provide satisfactory services, (iii)
            successfully complete your transaction, or (iv) be the best or most suitable professional
            for your specific needs.
          </p>
        </Section>

        <Section n="4" title="USER RESPONSIBILITIES">
          <p>You acknowledge and agree that:</p>
          <p>
            <span className="font-semibold">(a) Independent Evaluation Required:</span> It is your
            sole responsibility to independently investigate, interview, and evaluate any Referred
            Professional before engaging their services. You should:
          </p>
          <List
            items={[
              "Verify current licensing status with your state’s real estate regulatory authority",
              "Check for disciplinary actions or complaints",
              "Interview multiple professionals and compare qualifications",
              "Request and check references from past clients",
              "Review and understand any representation agreement before signing",
              "Ensure the professional has expertise relevant to your specific needs",
            ]}
          />
          <p>
            <span className="font-semibold">(b) Your Transaction Decisions:</span> You are solely
            responsible for all decisions regarding the purchase, sale, lease, investment, or
            financing of any property. You should consult with your own independent legal, tax,
            financial, and other professional advisors.
          </p>
          <p>
            <span className="font-semibold">(c) Due Diligence:</span> You must conduct your own due
            diligence on any property, including inspections, appraisals, title review, and
            investigation of all material facts.
          </p>
        </Section>

        <Section n="5" title="DISCLAIMERS">
          <p className="font-semibold">
            TO THE FULLEST EXTENT PERMITTED BY LAW, REAL ESTATE FOUNDATION, INC.:
          </p>
          <p>
            <span className="font-semibold">(a)</span> PROVIDES THIS WEBSITE AND REFERRAL SERVICES ON
            AN “AS IS” AND “AS AVAILABLE” BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR
            IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
            PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
          </p>
          <p>
            <span className="font-semibold">(b)</span> MAKES NO REPRESENTATIONS OR WARRANTIES
            REGARDING: (i) the accuracy, reliability, completeness, or timeliness of any information on
            the Website, (ii) the qualifications or performance of Referred Professionals beyond basic
            license verification, or (iii) the outcome of any real estate transaction.
          </p>
          <p>
            <span className="font-semibold">(c)</span> IS NOT PROVIDING AND DOES NOT PROVIDE:
            transaction brokerage services, buyer or seller representation, property valuation,
            appraisal services, legal advice, tax advice, financial planning, accounting services,
            mortgage brokerage, title services, qualified intermediary services, escrow services,
            engineering services, inspection services, or any other professional services beyond
            broker referrals.
          </p>
          <p>
            <span className="font-semibold">(d)</span> DOES NOT GUARANTEE SUCCESSFUL MATCHES, CLIENT
            ACCEPTANCE, TRANSACTION COMPLETION, OR SATISFACTORY OUTCOMES.
          </p>
        </Section>

        <Section n="6" title="LIMITATION OF LIABILITY">
          <p className="font-semibold">TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW:</p>
          <p>
            <span className="font-semibold">(a)</span> IN NO EVENT SHALL REAL ESTATE FOUNDATION, INC.,
            ITS OWNERS, OFFICERS, DIRECTORS, EMPLOYEES, AFFILIATED BROKERS, OR AGENTS BE LIABLE FOR ANY
            INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING BUT
            NOT LIMITED TO LOST PROFITS, LOST OPPORTUNITIES, PROPERTY DAMAGE, ECONOMIC LOSSES, OR
            PERSONAL INJURY ARISING OUT OF OR RELATED TO:
          </p>
          <List
            items={[
              "Your use of this Website or our referral services",
              "Any referral to a Referred Professional",
              "Any act, omission, negligence, misconduct, or breach of duty by a Referred Professional",
              "Any real estate transaction or failed transaction",
              "Any dispute with a Referred Professional",
              "Any property condition, defect, or valuation issue EVEN IF WE HAVE BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.",
            ]}
          />
          <p>
            <span className="font-semibold">(b)</span> OUR TOTAL AGGREGATE LIABILITY TO YOU FOR ANY AND
            ALL CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR OUR REFERRAL SERVICES SHALL NOT
            EXCEED THE LESSER OF: (i) $500, OR (ii) ANY AMOUNT ACTUALLY PAID BY YOU DIRECTLY TO US FOR
            SERVICES (IF ANY).
          </p>
          <p>
            <span className="font-semibold">(c)</span> THE LIMITATIONS IN THIS SECTION APPLY TO ALL
            CLAIMS, WHETHER BASED IN CONTRACT, TORT (INCLUDING NEGLIGENCE), STRICT LIABILITY, BREACH OF
            WARRANTY, OR ANY OTHER LEGAL THEORY.
          </p>
          <p>
            <span className="font-semibold">(d)</span> SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR
            LIMITATION OF CERTAIN DAMAGES. IN SUCH JURISDICTIONS, OUR LIABILITY SHALL BE LIMITED TO THE
            FULLEST EXTENT PERMITTED BY LAW.
          </p>
        </Section>

        <Section n="7" title="INDEMNIFICATION">
          <p>
            You agree to indemnify, defend, and hold harmless Real Estate Foundation, Inc., its
            owners, officers, directors, employees, affiliated brokers, agents, and affiliates from
            and against any and all third-party claims, demands, damages, losses, liabilities, costs,
            and expenses (including reasonable attorneys’ fees and court costs) arising from or related
            to:
          </p>
          <p><span className="font-semibold">(a)</span> Your use of any Referred Professional and any resulting real estate transaction or failed transaction;</p>
          <p><span className="font-semibold">(b)</span> Any dispute, claim, or litigation between you and a Referred Professional;</p>
          <p><span className="font-semibold">(c)</span> Any acts, omissions, negligence, or misconduct by a Referred Professional;</p>
          <p><span className="font-semibold">(d)</span> Your breach of these Terms of Service;</p>
          <p><span className="font-semibold">(e)</span> Your breach of any agreement with a Referred Professional;</p>
          <p><span className="font-semibold">(f)</span> Your violation of any applicable law, regulation, or third-party right;</p>
          <p><span className="font-semibold">(g)</span> Any property you purchase, sell, lease, or invest in; or</p>
          <p><span className="font-semibold">(h)</span> Any misrepresentation or inaccuracy in information you provide to us or to a Referred Professional.</p>
          <p>
            This indemnification obligation shall survive termination of these Terms and your use of
            our services.
          </p>
        </Section>

        <Section n="8" title="COMPLIANCE WITH REAL ESTATE LAWS">
          <p>You acknowledge that:</p>
          <p><span className="font-semibold">(a)</span> Real estate brokerage is regulated by state law, and different states have different requirements and consumer protections.</p>
          <p><span className="font-semibold">(b)</span> If you are referred to a broker in a state other than Colorado, that state’s laws and regulations will govern the brokerage relationship between you and the Referred Professional.</p>
          <p><span className="font-semibold">(c)</span> You are responsible for understanding your rights and obligations under applicable state real estate laws.</p>
          <p><span className="font-semibold">(d)</span> We maintain required errors and omissions insurance as mandated by Colorado law for our referral activities.</p>
        </Section>

        <Section n="9" title="MODIFICATIONS TO TERMS">
          <p>
            We reserve the right to modify, amend, or update these Terms of Service at any time. We
            will indicate changes by updating the “Effective Date” at the top of this document and
            will make reasonable efforts to notify users of material changes. Your continued use of the
            Website or our services after any modifications constitutes your acceptance of the revised
            Terms. You are responsible for reviewing these Terms periodically.
          </p>
        </Section>

        <Section n="10" title="PRIVACY AND DATA">
          <p>
            We collect and use personal information as described in our{" "}
            <Link href="/privacy" className="text-rebm-link underline">
              Privacy Policy
            </Link>
            . By using our
            services, you consent to our collection, use, and sharing of information necessary to
            provide referral services, which includes sharing your contact information, property
            preferences, and transaction details with Referred Professionals in our network.
          </p>
        </Section>

        <Section n="11" title="GOVERNING LAW AND DISPUTE RESOLUTION">
          <p><span className="font-semibold">(a) Governing Law:</span> These Terms shall be governed by and construed in accordance with the laws of the State of Colorado, without regard to its conflict of law provisions.</p>
          <p><span className="font-semibold">(b) Jurisdiction and Venue:</span> You hereby irrevocably consent to the exclusive jurisdiction and venue of the state and federal courts located in Denver, Colorado for any disputes, claims, or controversies arising out of or related to these Terms, our services, or any referral.</p>
          <p><span className="font-semibold">(c) Waiver of Class Actions:</span> TO THE EXTENT PERMITTED BY LAW, ANY DISPUTE RESOLUTION PROCEEDINGS, WHETHER IN ARBITRATION OR COURT, WILL BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION.</p>
          <p><span className="font-semibold">(d) Waiver of Jury Trial:</span> TO THE EXTENT PERMITTED BY LAW, BOTH PARTIES WAIVE THEIR RIGHT TO A JURY TRIAL IN ANY PROCEEDING ARISING OUT OF OR RELATED TO THESE TERMS.</p>
        </Section>

        <Section n="12" title="GENERAL PROVISIONS">
          <p><span className="font-semibold">(a) Entire Agreement:</span> These Terms constitute the entire agreement between you and Real Estate Foundation, Inc. regarding the subject matter herein and supersede all prior or contemporaneous agreements, understandings, promises, and representations, whether written or oral.</p>
          <p><span className="font-semibold">(b) Amendment:</span> These Terms may not be amended except by a written document signed by both parties, or by our posting of revised Terms as described in Section 9.</p>
          <p><span className="font-semibold">(c) Severability:</span> If any provision of these Terms is found to be invalid, illegal, or unenforceable by a court of competent jurisdiction, the remaining provisions shall remain in full force and effect, and the invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable while preserving the parties’ intent.</p>
          <p><span className="font-semibold">(d) No Waiver:</span> Our failure to enforce any right or provision of these Terms shall not constitute a waiver of such right or provision or any other right or provision.</p>
          <p><span className="font-semibold">(e) Assignment:</span> You may not assign or transfer these Terms or any rights hereunder without our prior written consent. We may freely assign these Terms without restriction.</p>
          <p><span className="font-semibold">(f) Binding Effect:</span> These Terms shall be binding upon and inure to the benefit of the parties and their respective heirs, representatives, executors, administrators, successors, and permitted assigns.</p>
          <p><span className="font-semibold">(g) Headings:</span> Section headings are for convenience only and shall not affect the interpretation of these Terms.</p>
          <p><span className="font-semibold">(h) Survival:</span> Sections 5, 6, 7, 11, and 12 shall survive any termination of these Terms.</p>
        </Section>

        <Section n="13" title="CONTACT INFORMATION">
          <p>
            If you have questions about these Terms or our referral services, please contact us at:
          </p>
          <p className="leading-[26px]">
            Real Estate Foundation, Inc.
            <br />
            Alan Fruitman, Licensed Real Estate Broker
            <br />
            2451 S. Yosemite Street
            <br />
            Denver, CO 80231
            <br />
            1.800.841.5033
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="mt-[8px] mb-[8px] text-[16px] font-bold text-rebm-navy">
        {n}. {title}
      </h4>
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
