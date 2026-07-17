"use client";

import { useState } from "react";

import { faq } from "@/content/homepage";

/**
 * FAQ accordion — inside the blue testimonials section. Live section 8.3.
 *
 * Live spec:
 *   heading   Inter 48/62.4 w700 #032C40
 *   items     5, 10px apart; summary bg #fff radius 12px padding 12px,
 *             plus/minus icon LEFT, question Inter 18/29.7 w600 rgb(31,33,36)
 *   open      answer below in white text (Inter 18/29.7 w500 #fff) on the blue
 *   showMore  transparent, 3px solid #fff, radius 42px, Inter 15/15 #fff
 *
 * Smooth expand/collapse via a grid-rows 0fr→1fr transition — animates the
 * MEASURED height (no hard-coded max-height), so it never jumps. React state
 * drives aria-expanded; the region is keyboard-operable via the <button>.
 * prefers-reduced-motion disables the transition (see globals.css motion query
 * is scroll-only, so the reduced class is applied here too).
 */
function Item({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-start gap-[10px] rounded-[12px] bg-white p-[12px] text-left text-[18px] leading-[29.7px] font-semibold text-[#1F2124]"
      >
        <span aria-hidden="true" className="mt-[2px] w-[16px] shrink-0 text-center">
          {open ? "−" : "+"}
        </span>
        <span>{q}</span>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p
            className={`px-[12px] pt-[16px] pb-[8px] text-[18px] leading-[29.7px] font-medium text-white transition-opacity duration-300 motion-reduce:transition-none ${
              open ? "opacity-100" : "opacity-0"
            }`}
          >
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Faq() {
  return (
    <div id="faq" className="mt-[96px]">
      <h2 className="text-[32px] leading-[40px] font-bold text-rebm-navy lg:text-[48px] lg:leading-[62.4px]">
        {faq.heading}
      </h2>

      <div className="mt-[32px] flex flex-col gap-[10px]">
        {faq.items.map((item) => (
          <Item key={item.q} q={item.q} a={item.a} />
        ))}
      </div>

      <div className="mt-[32px] flex justify-center">
        {/* Live: opens Elementor popup #602 with the remaining FAQs; wired to
            /faq once that page exists. */}
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
