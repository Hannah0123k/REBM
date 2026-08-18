"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * On every client-side route change, jump INSTANTLY to the top of the page.
 *
 * Scrolling is instant site-wide (no `scroll-behavior: smooth` in globals.css),
 * so the `auto` forced below is belt-and-braces rather than the load-bearing
 * part it used to be — it guards against anything setting smooth inline later.
 * What this component is actually for is the scroll-to-top itself, plus the
 * hash-target polling further down: a deep section such as the FAQ is not in the
 * DOM at the instant the route swaps, so the jump has to wait for it.
 * Mounted once in the root layout — covers every page.
 */
export function ScrollToTopOnNavigate() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    // Skip the very first render (initial load already lands at the top).
    if (first.current) {
      first.current = false;
      return;
    }
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = "auto";

    const hash = window.location.hash;
    const id = hash.length > 1 ? decodeURIComponent(hash.slice(1)) : null;
    let raf = 0;
    const timers: number[] = [];
    const restore = () => {
      html.style.scrollBehavior = prev;
    };

    // Plain navigation (no hash): jump to the top, with a second pass for late
    // layout shifts, then restore smooth scrolling.
    if (!id) {
      window.scrollTo(0, 0);
      raf = requestAnimationFrame(() => window.scrollTo(0, 0));
      timers.push(window.setTimeout(restore, 250));
      return () => {
        cancelAnimationFrame(raf);
        timers.forEach(clearTimeout);
      };
    }

    // Hash target (e.g. arriving at /#faq from /blog or /contact): the section
    // may not be in the DOM yet — the homepage's deep FAQ renders after the
    // route swap. POLL for it (up to ~1.2s) instead of giving up at a fixed
    // delay and dumping the visitor on the hero, then scroll again as
    // images/GSAP settle its position. scrollIntoView honors the section's CSS
    // scroll-margin-top, so it lands below the sticky header.
    const scrollTo = () => document.getElementById(id)?.scrollIntoView({ block: "start" });
    let attempts = 0;
    const MAX_ATTEMPTS = 80; // ~1.2s at rAF cadence
    const tick = () => {
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ block: "start" });
        // Settle passes: the deeper the section, the more it drifts as content loads.
        timers.push(window.setTimeout(scrollTo, 120));
        timers.push(window.setTimeout(scrollTo, 320));
        timers.push(window.setTimeout(restore, 420));
        return;
      }
      if (++attempts < MAX_ATTEMPTS) {
        raf = requestAnimationFrame(tick);
      } else {
        window.scrollTo(0, 0);
        restore();
      }
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [pathname]);

  return null;
}
