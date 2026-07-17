import { faq } from "@/content/homepage";

/**
 * FAQ accordion — inside the blue testimonials section. Live section 8.3
 * (y 8227 → 8698).
 *
 * Live spec:
 *   heading   Inter 48/62.4 w700 #032C40
 *   accordion native <details>/<summary>, 5 items, 10px apart
 *   summary   bg #fff, radius 12px, padding 12px, plus/minus icon LEFT,
 *             question Inter 18/29.7 w600 rgb(31,33,36)
 *   open      answer below in white text (Inter 18/29.7 w500 #fff) on the blue
 *   showMore  transparent, 3px solid #fff, radius 42px, padding 12px 24px,
 *             label Inter 15/15 w400 #fff
 *
 * Live shows 5 items inline; "Show More" opens Elementor popup #602 with the
 * rest. The popup content is not on the homepage, so "Show More" links to the
 * blog/contact for now — flagged to Hannah (see report). The +/− marker is CSS
 * only (details[open]), no JS.
 */
export function Faq() {
  return (
    <div id="faq" className="mt-[96px]">
      <h2 className="text-[32px] leading-[40px] font-bold text-rebm-navy lg:text-[48px] lg:leading-[62.4px]">
        {faq.heading}
      </h2>

      <div className="mt-[32px] flex flex-col gap-[10px]">
        {faq.items.map((item) => (
          <details key={item.q} className="group">
            <summary className="flex cursor-pointer list-none items-start gap-[10px] rounded-[12px] bg-white p-[12px] text-[18px] leading-[29.7px] font-semibold text-[#1F2124] [&::-webkit-details-marker]:hidden">
              <span
                aria-hidden="true"
                className="mt-[4px] shrink-0 text-[#1F2124] before:content-['+'] group-open:before:content-['−']"
              />
              <span>{item.q}</span>
            </summary>
            <p className="px-[12px] pt-[16px] pb-[8px] text-[18px] leading-[29.7px] font-medium text-white">
              {item.a}
            </p>
          </details>
        ))}
      </div>

      <div className="mt-[32px] flex justify-center">
        {/* Live: opens Elementor popup #602 with the remaining FAQs. That
            content isn't on the homepage; wired to /faq once it exists. */}
        <a
          href="/faq"
          className="rounded-[42px] border-[3px] border-white px-[24px] py-[12px] text-[15px] leading-[15px] text-white transition-opacity hover:opacity-80"
        >
          {faq.showMore}
        </a>
      </div>
    </div>
  );
}
