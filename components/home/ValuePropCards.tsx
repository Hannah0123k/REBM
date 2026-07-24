"use client";

import { useEffect, useRef } from "react";

import { VALUE_PROP_ICONS, type ValuePropIconKey } from "@/components/icons/ValuePropIcons";

type Card = { icon: ValuePropIconKey; title: string; body: string };

/**
 * The three value-prop cards with a premium staggered entrance: each card drops
 * gently from ~24px above while fading in (opacity 0→1), 0.18s apart, ease-out.
 *
 * Replays ONLY when the section fully leaves the viewport and re-enters (either
 * direction) — never continuously while scrolling. Under prefers-reduced-motion
 * the cards are simply shown with no motion.
 */
export function ValuePropCards({ cards }: { cards: readonly Card[] }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cleanup = () => {};
    let cancelled = false;

    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        const ctx = gsap.context(() => {
          const items = Array.from(el.children);
          // Each card animates on its OWN scroll trigger, so on mobile (stacked)
          // they reveal ONE AT A TIME as you scroll to each — not all at once.
          // Slower on mobile for a calmer, more deliberate entrance. On desktop
          // (single row) the three triggers fire together, as before.
          const mobile = window.matchMedia("(max-width: 640px)").matches;
          items.forEach((item, i) => {
            gsap.from(item, {
              // A clean FADE-IN (with a gentle grow-in-place) — no vertical slide,
              // so the cards can't overlap each other or the previous card's
              // floating icon badge as they appear. Each card has its own trigger,
              // so on mobile they fade in one-by-one, top to bottom, as you scroll.
              opacity: 0,
              scale: 0.96,
              duration: mobile ? 1.5 : 1.7,
              ease: "power2.out",
              delay: mobile ? 0 : i * 0.28, // desktop row: a soft left→right cascade
              scrollTrigger: {
                trigger: item,
                start: "top 85%",
                end: "bottom 8%",
                // enter → play, leave (fully out) → reset, both directions.
                toggleActions: "restart reset restart reset",
              },
            });
          });
        }, el);
        cleanup = () => ctx.revert();
      },
    );

    return () => {
      cancelled = true;
      cleanup();
    };
  }, []);

  return (
    <div
      ref={ref}
      className="mt-[64px] grid grid-cols-1 items-stretch gap-[28px] lg:grid-cols-3 lg:gap-[32px]"
    >
      {cards.map((card) => {
        const Icon = VALUE_PROP_ICONS[card.icon];
        return (
          <div
            key={card.title}
            className="relative flex flex-col items-center rounded-[20px] bg-white px-[32px] pt-[62px] pb-[44px] text-center shadow-[0_16px_40px_-20px_rgba(3,44,64,0.30)]"
          >
            {/* Deep-navy icon badge (white icon) straddling the card's top edge. */}
            <div className="absolute -top-[38px] flex size-[76px] items-center justify-center rounded-full bg-rebm-navy text-white shadow-[0_10px_22px_-6px_rgba(3,44,64,0.45)]">
              <Icon className="size-[34px]" aria-hidden="true" />
            </div>

            <h3 className="text-[24px] leading-[30px] font-bold text-balance text-rebm-navy">
              {card.title}
            </h3>
            <span className="mt-[16px] block h-[3px] w-[46px] rounded-full bg-rebm-blue" />
            <p className="mt-[22px] text-[16px] leading-[26px] text-[rgb(51,63,74)]">{card.body}</p>
          </div>
        );
      })}
    </div>
  );
}
