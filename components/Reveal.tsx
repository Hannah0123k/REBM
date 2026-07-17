"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Reusable scroll-entrance animation. Wraps a block of content and, when it
 * scrolls ~15% into view, fades its direct children in from slightly below,
 * once. Heading → paragraph → button/cards follow via `stagger`.
 *
 * Motion: opacity 0→1, y 25→0 (desktop) / ≤16 (mobile), ease power3.out,
 * ~0.7s. Optional small horizontal slide `x` (desktop only; disabled on mobile
 * to avoid overflow). Transform + opacity only.
 *
 * The initial hidden state is applied by GSAP (via `from`), never by CSS — so
 * if JS fails to run the content is simply visible, and under
 * prefers-reduced-motion the effect is skipped entirely (content shown, no
 * transforms). ScrollTrigger instances are reverted on unmount.
 *
 * Drop-in for a wrapper div: pass the same className the wrapped element had
 * (grid/flex/columns) so layout is unchanged — only its children animate.
 */
export function Reveal({
  children,
  className,
  id,
  y = 25,
  x = 0,
  stagger = 0.1,
  duration = 0.7,
  delay = 0,
  start = "top 85%",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  y?: number;
  x?: number;
  stagger?: number;
  duration?: number;
  delay?: number;
  start?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const mobile = window.matchMedia("(max-width: 640px)").matches;
    const yy = mobile ? Math.min(y, 16) : y;
    const xx = mobile ? 0 : x; // no side-slide on mobile (overflow-safe)
    const stg = mobile ? Math.min(stagger, 0.06) : stagger;

    let cleanup = () => {};
    let cancelled = false;

    Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(
      ([{ gsap }, { ScrollTrigger }]) => {
        if (cancelled) return;
        gsap.registerPlugin(ScrollTrigger);
        const ctx = gsap.context(() => {
          const targets = el.children.length ? Array.from(el.children) : [el];
          gsap.from(targets, {
            opacity: 0,
            y: yy,
            x: xx,
            duration,
            delay,
            ease: "power3.out",
            stagger: stg,
            scrollTrigger: { trigger: el, start, once: true },
          });
        }, el);
        cleanup = () => ctx.revert();
      },
    );

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [y, x, stagger, duration, delay, start]);

  return (
    <div ref={ref} id={id} className={className}>
      {children}
    </div>
  );
}
