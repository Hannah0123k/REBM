"use client";

import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";

import { Reveal } from "@/components/Reveal";
import { faq } from "@/content/homepage";

/**
 * FAQ — inside the blue testimonials section. Live section 8.3.
 *
 * The first `faq.initialCount` questions show inline; "Show More Frequently Asked
 * Questions" opens a centered POPUP (same behaviour as the footer Disclaimer
 * modal — portal to body, Escape to close, background scroll lock, click-outside
 * to dismiss) containing all the OTHER questions. Each question is a keyboard-
 * operable accordion (real <button>, aria-expanded + aria-controls, region), and
 * the answer height animates via a grid-rows 0fr→1fr transition.
 */
function Item({ q, a, surface = "page" }: { q: string; a: string; surface?: "page" | "modal" }) {
  const [open, setOpen] = useState(false);
  const base = useId();
  const btnId = `${base}-btn`;
  const panelId = `${base}-panel`;
  const modal = surface === "modal";
  return (
    <div
      className={
        modal
          ? "rounded-[10px] bg-[#f4f6f8]"
          : "rounded-[12px] bg-white shadow-[0_6px_18px_-12px_rgba(3,44,64,0.25)]"
      }
    >
      <h3>
        <button
          type="button"
          id={btnId}
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
          className={`flex w-full cursor-pointer items-start gap-[12px] rounded-[10px] p-[16px] text-left text-[16px] leading-[24px] font-semibold focus-visible:ring-2 focus-visible:ring-rebm-navy focus-visible:outline-none sm:text-[17px] ${
            modal ? "text-rebm-navy" : "text-[#1F2124]"
          }`}
        >
          <span
            aria-hidden="true"
            className={`mt-[1px] grid size-[22px] shrink-0 place-items-center rounded-full text-[18px] leading-none font-bold text-white transition-colors duration-200 ${
              open ? "bg-rebm-navy" : "bg-rebm-blue"
            }`}
          >
            {open ? "−" : "+"}
          </span>
          <span className="flex-1">{q}</span>
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={btnId}
        className="grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p
            className={`px-[16px] pt-[4px] pb-[16px] pl-[50px] text-[15px] leading-[25px] text-[#334652] transition-opacity duration-300 motion-reduce:transition-none ${
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
  const [open, setOpen] = useState(false);
  const initial = faq.initialCount ?? faq.items.length;
  const firstItems = faq.items.slice(0, initial);
  const restItems = faq.items.slice(initial);
  const hasMore = restItems.length > 0;

  // Modal chrome: Escape closes, background scroll locked while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  // Portal to <body> so the fixed overlay isn't trapped by the section's GSAP
  // transform. `open` starts false, so document.body is only touched after a click.
  const overlay = open && (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="faq-modal-title"
      onClick={() => setOpen(false)}
      className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/50 px-[16px] py-[40px]"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[920px] rounded-[16px] bg-white shadow-2xl"
      >
        <button
          type="button"
          aria-label="Close frequently asked questions"
          onClick={() => setOpen(false)}
          className="absolute top-[16px] right-[16px] flex size-[36px] items-center justify-center rounded-full text-[22px] text-rebm-navy transition-colors hover:bg-[#F0F2F4]"
        >
          ×
        </button>
        <div className="max-h-[90vh] overflow-y-auto overscroll-contain">
          {/* Padding lives on this INNER wrapper, not the scroll container:
              Chromium drops a scroll container's padding-bottom, so the last
              question scrolled flush to the box edge while the top kept its
              padding. As content, the padding always renders — equal, generous
              breathing room top and bottom. */}
          <div className="px-[24px] py-[36px] sm:px-[40px] sm:py-[44px]">
            <h2 id="faq-modal-title" className="text-[26px] leading-[32px] font-bold text-rebm-navy sm:text-[30px]">
              Frequently Asked Questions
            </h2>
            <div className="mt-[24px] flex flex-col gap-[10px]">
              {restItems.map((item) => (
                <Item key={item.q} q={item.q} a={item.a} surface="modal" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div id="faq" className="mt-[56px] lg:mt-[96px]">
      <Reveal stagger={0.1}>
        <h2 className="text-[29px] leading-[36px] font-bold text-rebm-navy lg:text-[48px] lg:leading-[62.4px]">
          {faq.heading}
        </h2>

        <div className="mt-[32px] flex flex-col gap-[12px]">
          {firstItems.map((item) => (
            <Item key={item.q} q={item.q} a={item.a} />
          ))}
        </div>

        {hasMore && (
          <div className="mt-[24px] flex justify-center">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="cursor-pointer rounded-full border-2 border-white px-[24px] py-[10px] text-[15px] font-semibold text-white transition-colors duration-200 hover:bg-white hover:text-rebm-navy focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              {faq.showMore}
            </button>
          </div>
        )}
      </Reveal>

      {overlay ? createPortal(overlay, document.body) : null}
    </div>
  );
}
