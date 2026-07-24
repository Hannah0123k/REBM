"use client";

import { useEffect, useState } from "react";

/**
 * Scrollspy for the active-nav highlight.
 *
 * An IntersectionObserver on every section is used only as an efficient trigger
 * (fires when any section crosses the viewport); the active section is then
 * computed from LIVE getBoundingClientRect reads, which avoids the stale-rect
 * and partial-update pitfalls of reasoning off the observer entries themselves.
 *
 * Active = the LAST section (in `ids` order) whose top has scrolled above the
 * trigger line (headerH + a small offset). That is the section currently under
 * the header — the one the visitor is reading. Consequences:
 *   - In the hero / first info band, no section top has passed the trigger, so
 *     nothing is active (About does NOT light up early).
 *   - `about` activates only when the Meet-Alan-and-Rhett section reaches the
 *     trigger.
 *   - FAQ is listed after Testimonials and nested inside it, so once FAQ's top
 *     passes the trigger it wins over its parent.
 *
 * Recomputed on the observer callback and on scroll (rAF-throttled). Returns the
 * active id, or null when above the first section.
 */
export function useActiveSection(ids: string[], headerH = 120): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const els = ids
      .map((id) => ({ id, el: document.getElementById(id) }))
      .filter((x): x is { id: string; el: HTMLElement } => x.el !== null);

    // Trigger line must sit BELOW where a clicked anchor lands, or that section
    // won't count as active. The deepest landing is #faq at its scroll-margin-top
    // (--header-h + 24 ≈ 146px on desktop); with headerH=120 a +24 trigger (144)
    // fell just short, so clicking FAQ left Testimonials highlighted. +52 clears
    // every section's landing spot with slack.
    const trigger = headerH + 52;

    // Active = the section whose top is the greatest that is still at/above the
    // trigger line — i.e. the one currently sitting under the header. Chosen by
    // live position, so it's independent of nav-vs-document ordering (About is
    // nav-item #2 but the first section in the DOM) and handles the FAQ-inside-
    // Testimonials nesting (FAQ's top passes the trigger later, so it wins).
    // With no sections (e.g. /contact) the loop leaves `current` null, so this
    // also clears any stale highlight carried over from the homepage — SiteHeader
    // persists across navigation, so without that reset About would stay lit.
    const compute = () => {
      let current: string | null = null;
      let bestTop = -Infinity;
      for (const { id, el } of els) {
        const top = el.getBoundingClientRect().top;
        if (top <= trigger && top > bestTop) {
          bestTop = top;
          current = id;
        }
      }
      setActive((prev) => (prev === current ? prev : current));
    };

    // No sections to observe — reset (via compute) and skip listener setup.
    if (els.length === 0) {
      compute();
      return;
    }

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        compute();
        ticking = false;
      });
    };

    // Observer purely as a cheap trigger; recompute from live positions.
    const observer = new IntersectionObserver(() => compute(), { threshold: [0, 1] });
    els.forEach(({ el }) => observer.observe(el));
    window.addEventListener("scroll", onScroll, { passive: true });
    compute();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [ids, headerH]);

  return active;
}
